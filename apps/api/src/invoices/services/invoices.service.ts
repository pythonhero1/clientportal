import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuthenticatedUser } from '../../auth/decorators/current-user.decorator.js';
import { CreateInvoiceDto } from '../dto/create-invoice.dto.js';
import { IssueInvoiceDto } from '../dto/issue-invoice.dto.js';
import { RecordPaymentDto } from '../dto/record-payment.dto.js';
import { SubmitPaymentEvidenceDto } from '../dto/submit-payment-evidence.dto.js';
import { InvoiceStatus, PaymentMethod, PaymentRecordStatus, Prisma } from '@prisma/client';

export interface InvoicesFilter {
  status?: InvoiceStatus;
  projectId?: string;
  clientId?: string;
}

@Injectable()
export class InvoicesService {
  // In-memory fallback ledger for offline/test environments without live PostgreSQL
  private mockInvoices: Map<string, any> = new Map();
  private mockPayments: Map<string, any> = new Map();
  private sequenceCounter = 1;

  constructor(private prisma: PrismaService) {
    this.seedMockData();
  }

  private seedMockData() {
    // Empty by default so zero placeholder invoices leak
  }

  /**
   * Decimal-safe calculation helper
   */
  private computeInvoiceTotals(items: Array<{ description: string; quantity: number; unitPrice: number }>, taxRatePercent: number = 0) {
    let subtotal = new Prisma.Decimal(0);
    const calculatedItems = items.map((item, index) => {
      const qty = new Prisma.Decimal(item.quantity);
      const unit = new Prisma.Decimal(item.unitPrice);
      const amount = qty.mul(unit).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
      subtotal = subtotal.add(amount);
      return {
        ...item,
        quantity: qty,
        unitPrice: unit,
        amount,
        orderIndex: index,
      };
    });

    const taxRate = new Prisma.Decimal(taxRatePercent);
    const taxAmount = subtotal.mul(taxRate).div(100).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const totalAmount = subtotal.add(taxAmount).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

    return {
      items: calculatedItems,
      subtotal,
      taxRate,
      taxAmount,
      totalAmount,
    };
  }

  /**
   * Generate sequential invoice number atomically: INV-YYYY-XXXX
   */
  private generateInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const seq = this.sequenceCounter++;
    return `INV-${year}-${seq.toString().padStart(4, '0')}`;
  }

  /**
   * Owner: Create draft invoice with itemized line items
   */
  async createDraft(createdById: string, dto: CreateInvoiceDto) {
    const { items, subtotal, taxRate, taxAmount, totalAmount } = this.computeInvoiceTotals(
      dto.items,
      dto.taxRate ?? 0,
    );

    if (!process.env.DATABASE_URL) {
      const id = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const draftInvoice = {
        id,
        invoiceNumber: null,
        projectId: dto.projectId,
        clientId: dto.clientId,
        createdById,
        status: InvoiceStatus.DRAFT,
        currency: dto.currency || 'USD',
        subtotal: subtotal.toFixed(2),
        taxRate: taxRate.toFixed(2),
        taxAmount: taxAmount.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        amountPaid: '0.00',
        dueDate: new Date(dto.dueDate).toISOString(),
        issuedAt: null,
        paidAt: null,
        notes: dto.notes || null,
        pdfStorageKey: null,
        items: items.map((i, idx) => ({
          id: `item_${id}_${idx}`,
          invoiceId: id,
          description: i.description,
          quantity: i.quantity.toFixed(2),
          unitPrice: i.unitPrice.toFixed(2),
          amount: i.amount.toFixed(2),
          orderIndex: i.orderIndex,
        })),
        payments: [],
        project: { id: dto.projectId, name: 'Sample Project' },
        client: { id: dto.clientId, name: 'Client Contact', email: 'client@example.com' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.mockInvoices.set(id, draftInvoice);
      return draftInvoice;
    }

    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          projectId: dto.projectId,
          clientId: dto.clientId,
          createdById,
          status: InvoiceStatus.DRAFT,
          currency: dto.currency || 'USD',
          subtotal,
          taxRate,
          taxAmount,
          totalAmount,
          amountPaid: new Prisma.Decimal(0),
          dueDate: new Date(dto.dueDate),
          notes: dto.notes,
          items: {
            create: items.map((i) => ({
              description: i.description,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              amount: i.amount,
              orderIndex: i.orderIndex,
            })),
          },
        },
        include: {
          items: { orderBy: { orderIndex: 'asc' } },
          project: { select: { id: true, name: true } },
          client: { select: { id: true, name: true, email: true } },
        },
      });
      return invoice;
    });
  }

  /**
   * Owner: Formally issue a draft invoice, allocating atomic sequential serial number
   */
  async issueInvoice(invoiceId: string, issueDto?: IssueInvoiceDto) {
    if (!process.env.DATABASE_URL) {
      const invoice = this.mockInvoices.get(invoiceId);
      if (!invoice) {
        throw new NotFoundException('Invoice not found.');
      }
      if (invoice.status !== InvoiceStatus.DRAFT) {
        throw new BadRequestException('Only DRAFT invoices can be issued.');
      }
      invoice.invoiceNumber = this.generateInvoiceNumber();
      invoice.status = InvoiceStatus.ISSUED;
      invoice.issuedAt = new Date().toISOString();
      if (issueDto?.notes) {
        invoice.notes = issueDto.notes;
      }
      invoice.updatedAt = new Date().toISOString();
      return invoice;
    }

    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
      });
      if (!invoice) {
        throw new NotFoundException('Invoice not found.');
      }
      if (invoice.status !== InvoiceStatus.DRAFT) {
        throw new BadRequestException('Only DRAFT invoices can be issued.');
      }

      const year = new Date().getFullYear();
      const prefix = `INV-${year}-`;
      const count = await tx.invoice.count({
        where: { invoiceNumber: { startsWith: prefix } },
      });
      const invoiceNumber = `${prefix}${(count + 1).toString().padStart(4, '0')}`;

      return tx.invoice.update({
        where: { id: invoiceId },
        data: {
          invoiceNumber,
          status: InvoiceStatus.ISSUED,
          issuedAt: new Date(),
          notes: issueDto?.notes ?? invoice.notes,
        },
        include: {
          items: { orderBy: { orderIndex: 'asc' } },
          project: { select: { id: true, name: true } },
          client: { select: { id: true, name: true, email: true } },
          payments: true,
        },
      });
    });
  }

  /**
   * Owner: Record confirmed payment / settlement
   */
  async recordPayment(invoiceId: string, recordedById: string, dto: RecordPaymentDto) {
    const paymentAmount = new Prisma.Decimal(dto.amount);

    if (!process.env.DATABASE_URL) {
      const invoice = this.mockInvoices.get(invoiceId);
      if (!invoice) {
        throw new NotFoundException('Invoice not found.');
      }
      if (invoice.status === InvoiceStatus.DRAFT || invoice.status === InvoiceStatus.CANCELLED) {
        throw new BadRequestException('Cannot record payment on a draft or cancelled invoice.');
      }

      const currentPaid = new Prisma.Decimal(invoice.amountPaid);
      const total = new Prisma.Decimal(invoice.totalAmount);
      const newPaid = currentPaid.add(paymentAmount);

      const paymentRecord = {
        id: `pay_${Date.now()}`,
        invoiceId,
        amount: paymentAmount.toFixed(2),
        currency: dto.currency || invoice.currency,
        method: dto.method || PaymentMethod.BANK_TRANSFER,
        status: PaymentRecordStatus.CONFIRMED,
        reference: dto.reference || null,
        evidenceNote: dto.evidenceNote || null,
        proofStorageKey: null,
        recordedById,
        confirmedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      invoice.amountPaid = newPaid.toFixed(2);
      invoice.payments.push(paymentRecord);

      if (newPaid.greaterThanOrEqualTo(total)) {
        invoice.status = InvoiceStatus.PAID;
        invoice.paidAt = new Date().toISOString();
      } else if (newPaid.greaterThan(0)) {
        invoice.status = InvoiceStatus.PARTIALLY_PAID;
      }

      invoice.updatedAt = new Date().toISOString();
      return invoice;
    }

    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
      });
      if (!invoice) {
        throw new NotFoundException('Invoice not found.');
      }
      if (invoice.status === InvoiceStatus.DRAFT || invoice.status === InvoiceStatus.CANCELLED) {
        throw new BadRequestException('Cannot record payment on a draft or cancelled invoice.');
      }

      const newPaid = invoice.amountPaid.add(paymentAmount);
      const isFull = newPaid.greaterThanOrEqualTo(invoice.totalAmount);
      const newStatus = isFull
        ? InvoiceStatus.PAID
        : newPaid.greaterThan(0)
          ? InvoiceStatus.PARTIALLY_PAID
          : invoice.status;

      await tx.paymentRecord.create({
        data: {
          invoiceId,
          amount: paymentAmount,
          currency: dto.currency || invoice.currency,
          method: dto.method || PaymentMethod.BANK_TRANSFER,
          status: PaymentRecordStatus.CONFIRMED,
          reference: dto.reference,
          evidenceNote: dto.evidenceNote,
          recordedById,
          confirmedAt: new Date(),
        },
      });

      return tx.invoice.update({
        where: { id: invoiceId },
        data: {
          amountPaid: newPaid,
          status: newStatus,
          paidAt: isFull ? new Date() : invoice.paidAt,
        },
        include: {
          items: { orderBy: { orderIndex: 'asc' } },
          project: { select: { id: true, name: true } },
          client: { select: { id: true, name: true, email: true } },
          payments: { orderBy: { createdAt: 'desc' } },
        },
      });
    });
  }

  /**
   * Client: Submit bank transfer reference / payment memo
   */
  async submitPaymentEvidence(invoiceId: string, clientId: string, dto: SubmitPaymentEvidenceDto) {
    if (!process.env.DATABASE_URL) {
      const invoice = this.mockInvoices.get(invoiceId);
      if (!invoice) {
        throw new NotFoundException('Invoice not found.');
      }
      if (
        invoice.status !== InvoiceStatus.ISSUED &&
        invoice.status !== InvoiceStatus.PARTIALLY_PAID &&
        invoice.status !== InvoiceStatus.OVERDUE
      ) {
        throw new BadRequestException('Cannot submit payment evidence for this invoice status.');
      }

      const balanceDue = new Prisma.Decimal(invoice.totalAmount).sub(new Prisma.Decimal(invoice.amountPaid));
      const pendingPayment = {
        id: `pay_evidence_${Date.now()}`,
        invoiceId,
        amount: balanceDue.toString(),
        currency: invoice.currency,
        method: PaymentMethod.BANK_TRANSFER,
        status: PaymentRecordStatus.PENDING,
        reference: dto.reference,
        evidenceNote: dto.evidenceNote || null,
        proofStorageKey: null,
        recordedById: clientId,
        confirmedAt: null,
        createdAt: new Date().toISOString(),
      };
      invoice.payments.push(pendingPayment);
      return pendingPayment;
    }

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });
    if (!invoice) {
      throw new NotFoundException('Invoice not found.');
    }
    if (
      invoice.status !== InvoiceStatus.ISSUED &&
      invoice.status !== InvoiceStatus.PARTIALLY_PAID &&
      invoice.status !== InvoiceStatus.OVERDUE
    ) {
      throw new BadRequestException('Cannot submit payment evidence for this invoice status.');
    }

    const balanceDue = invoice.totalAmount.sub(invoice.amountPaid);

    return this.prisma.paymentRecord.create({
      data: {
        invoiceId,
        amount: balanceDue,
        currency: invoice.currency,
        method: PaymentMethod.BANK_TRANSFER,
        status: PaymentRecordStatus.PENDING,
        reference: dto.reference,
        evidenceNote: dto.evidenceNote,
        recordedById: clientId,
      },
    });
  }

  /**
   * Owner: Cancel / void an invoice
   */
  async cancelInvoice(invoiceId: string, reason: string) {
    if (!process.env.DATABASE_URL) {
      const invoice = this.mockInvoices.get(invoiceId);
      if (!invoice) {
        throw new NotFoundException('Invoice not found.');
      }
      if (invoice.status === InvoiceStatus.PAID) {
        throw new BadRequestException('Cannot cancel an already paid invoice.');
      }
      invoice.status = InvoiceStatus.CANCELLED;
      invoice.notes = invoice.notes ? `${invoice.notes}\n[CANCELLED]: ${reason}` : `[CANCELLED]: ${reason}`;
      invoice.updatedAt = new Date().toISOString();
      return invoice;
    }

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });
    if (!invoice) {
      throw new NotFoundException('Invoice not found.');
    }
    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Cannot cancel an already paid invoice.');
    }

    const updatedNotes = invoice.notes ? `${invoice.notes}\n[CANCELLED]: ${reason}` : `[CANCELLED]: ${reason}`;

    return this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: InvoiceStatus.CANCELLED,
        notes: updatedNotes,
      },
      include: {
        items: true,
        project: { select: { id: true, name: true } },
        client: { select: { id: true, name: true, email: true } },
        payments: true,
      },
    });
  }

  /**
   * Client & Owner: List invoices for a project
   * Clients cannot view DRAFT invoices
   */
  async getInvoicesForProject(projectId: string, isClient: boolean = false) {
    if (!process.env.DATABASE_URL) {
      const results: any[] = [];
      for (const inv of this.mockInvoices.values()) {
        if (inv.projectId === projectId) {
          if (isClient && inv.status === InvoiceStatus.DRAFT) {
            continue;
          }
          results.push(inv);
        }
      }
      return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const where: Prisma.InvoiceWhereInput = {
      projectId,
      ...(isClient
        ? {
            status: {
              in: [
                InvoiceStatus.ISSUED,
                InvoiceStatus.PAID,
                InvoiceStatus.PARTIALLY_PAID,
                InvoiceStatus.OVERDUE,
                InvoiceStatus.CANCELLED,
              ],
            },
          }
        : {}),
    };

    return this.prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        items: { orderBy: { orderIndex: 'asc' } },
        payments: { orderBy: { createdAt: 'desc' } },
        client: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Client & Owner: Get single invoice detail with items and payments
   * Strict anti-enumeration: non-owners cannot see DRAFT or foreign invoices
   */
  async getInvoiceById(invoiceId: string, projectId?: string, isClient: boolean = false) {
    if (!process.env.DATABASE_URL) {
      const invoice = this.mockInvoices.get(invoiceId);
      if (!invoice) {
        throw new NotFoundException('Invoice not found.');
      }
      if (projectId && invoice.projectId !== projectId) {
        throw new NotFoundException('Invoice not found.');
      }
      if (isClient && invoice.status === InvoiceStatus.DRAFT) {
        throw new NotFoundException('Invoice not found.');
      }
      return invoice;
    }

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: { orderBy: { orderIndex: 'asc' } },
        payments: { orderBy: { createdAt: 'desc' } },
        client: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found.');
    }
    if (projectId && invoice.projectId !== projectId) {
      throw new NotFoundException('Invoice not found.');
    }
    if (isClient && invoice.status === InvoiceStatus.DRAFT) {
      throw new NotFoundException('Invoice not found.');
    }

    return invoice;
  }

  /**
   * Owner: Query global ledger across all projects with filters
   */
  async getAllInvoicesForOwner(filters?: InvoicesFilter) {
    if (!process.env.DATABASE_URL) {
      let list = Array.from(this.mockInvoices.values());
      if (filters?.status) {
        list = list.filter((i) => i.status === filters.status);
      }
      if (filters?.projectId) {
        list = list.filter((i) => i.projectId === filters.projectId);
      }
      if (filters?.clientId) {
        list = list.filter((i) => i.clientId === filters.clientId);
      }
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const where: Prisma.InvoiceWhereInput = {
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.projectId ? { projectId: filters.projectId } : {}),
      ...(filters?.clientId ? { clientId: filters.clientId } : {}),
    };

    return this.prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        items: { orderBy: { orderIndex: 'asc' } },
        payments: { orderBy: { createdAt: 'desc' } },
        client: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    });
  }
}
