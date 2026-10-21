import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard.js';
import { AccountStatusGuard } from '../auth/guards/account-status.guard.js';
import { ProjectAccessGuard } from '../auth/guards/project-access.guard.js';
import { DesignatedBillingContactGuard } from './guards/designated-billing-contact.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';
import { InvoicesService } from './services/invoices.service.js';
import { PdfService } from './services/pdf.service.js';
import { SubmitPaymentEvidenceDto } from './dto/submit-payment-evidence.dto.js';

@Controller('projects/:projectId/invoices')
@UseGuards(ClerkAuthGuard, AccountStatusGuard, ProjectAccessGuard, DesignatedBillingContactGuard)
export class InvoicesController {
  constructor(
    private invoicesService: InvoicesService,
    private pdfService: PdfService,
  ) {}

  /**
   * List issued/paid invoices for designated billing contact
   */
  @Get()
  async listProjectInvoices(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const isClient = user.role !== 'Owner';
    return this.invoicesService.getInvoicesForProject(projectId, isClient);
  }

  /**
   * Get single invoice detail
   */
  @Get(':invoiceId')
  async getInvoiceDetail(
    @Param('projectId') projectId: string,
    @Param('invoiceId') invoiceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const isClient = user.role !== 'Owner';
    return this.invoicesService.getInvoiceById(invoiceId, projectId, isClient);
  }

  /**
   * Download official PDF statement
   */
  @Get(':invoiceId/pdf')
  async downloadInvoicePdf(
    @Param('projectId') projectId: string,
    @Param('invoiceId') invoiceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const isClient = user.role !== 'Owner';
    const invoice = await this.invoicesService.getInvoiceById(invoiceId, projectId, isClient);

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
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);
  }

  /**
   * Submit payment evidence (bank transfer reference)
   */
  @Post(':invoiceId/payment-evidence')
  async submitPaymentEvidence(
    @Param('invoiceId') invoiceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SubmitPaymentEvidenceDto,
  ) {
    return this.invoicesService.submitPaymentEvidence(invoiceId, user.id, dto);
  }
}
