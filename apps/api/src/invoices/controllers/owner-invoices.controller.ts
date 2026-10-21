import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ClerkAuthGuard } from '../../auth/guards/clerk-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { OwnerMfaGuard } from '../../auth/guards/owner-mfa.guard.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator.js';
import { InvoicesService } from '../services/invoices.service.js';
import { PdfService } from '../services/pdf.service.js';
import { CreateInvoiceDto } from '../dto/create-invoice.dto.js';
import { IssueInvoiceDto } from '../dto/issue-invoice.dto.js';
import { RecordPaymentDto } from '../dto/record-payment.dto.js';
import { CancelInvoiceDto } from '../dto/cancel-invoice.dto.js';
import { InvoiceStatus } from '@prisma/client';

@Controller('admin/invoices')
@UseGuards(ClerkAuthGuard, RolesGuard, OwnerMfaGuard)
@Roles('Owner')
export class OwnerInvoicesController {
  constructor(
    private invoicesService: InvoicesService,
    private pdfService: PdfService,
  ) {}

  /**
   * Owner: Query global ledger
   */
  @Get()
  async getLedger(
    @Query('status') status?: InvoiceStatus,
    @Query('projectId') projectId?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.invoicesService.getAllInvoicesForOwner({
      status,
      projectId,
      clientId,
    });
  }

  /**
   * Owner: Create draft invoice with itemized line items
   */
  @Post()
  async createDraft(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateInvoiceDto,
  ) {
    return this.invoicesService.createDraft(user.id, dto);
  }

  /**
   * Owner: Issue invoice (allocate atomic sequential invoice number)
   */
  @Post(':invoiceId/issue')
  async issueInvoice(
    @Param('invoiceId') invoiceId: string,
    @Body() dto: IssueInvoiceDto,
  ) {
    return this.invoicesService.issueInvoice(invoiceId, dto);
  }

  /**
   * Owner: Record confirmed payment / settlement
   */
  @Post(':invoiceId/payments')
  async recordPayment(
    @Param('invoiceId') invoiceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RecordPaymentDto,
  ) {
    return this.invoicesService.recordPayment(invoiceId, user.id, dto);
  }

  /**
   * Owner: Void / cancel invoice
   */
  @Post(':invoiceId/cancel')
  async cancelInvoice(
    @Param('invoiceId') invoiceId: string,
    @Body() dto: CancelInvoiceDto,
  ) {
    return this.invoicesService.cancelInvoice(invoiceId, dto.reason);
  }

  /**
   * Owner: Get invoice detail
   */
  @Get(':invoiceId')
  async getInvoiceDetail(@Param('invoiceId') invoiceId: string) {
    return this.invoicesService.getInvoiceById(invoiceId, undefined, false);
  }

  /**
   * Owner: Stream invoice PDF
   */
  @Get(':invoiceId/pdf')
  async previewInvoicePdf(
    @Param('invoiceId') invoiceId: string,
    @Res() res: Response,
  ) {
    const invoice = await this.invoicesService.getInvoiceById(invoiceId, undefined, false);

    const pdfBuffer = await this.pdfService.generateInvoicePdf({
      invoiceNumber: invoice.invoiceNumber || 'DRAFT',
      status: invoice.status,
      currency: invoice.currency,
      subtotal: invoice.subtotal,
      taxRate: invoice.taxRate,
      taxAmount: invoice.taxAmount,
      totalAmount: invoice.totalAmount,
      amountPaid: invoice.amountPaid,
      balanceDue: (Number(invoice.totalAmount) - Number(invoice.amountPaid)).toFixed(2),
      dueDate: invoice.dueDate,
      issuedAt: invoice.issuedAt,
      paidAt: invoice.paidAt,
      notes: invoice.notes,
      projectName: invoice.project?.name || 'Client Project',
      clientName: invoice.client?.name || 'Designated Billing Contact',
      clientEmail: invoice.client?.email || '',
      items: invoice.items || [],
    });

    const filename = `${invoice.invoiceNumber || 'INVOICE'}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);
  }
}
