import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller.js';
import { OwnerInvoicesController } from './controllers/owner-invoices.controller.js';
import { InvoicesService } from './services/invoices.service.js';
import { PdfService } from './services/pdf.service.js';
import { DesignatedBillingContactGuard } from './guards/designated-billing-contact.guard.js';

@Module({
  controllers: [InvoicesController, OwnerInvoicesController],
  providers: [InvoicesService, PdfService, DesignatedBillingContactGuard],
  exports: [InvoicesService, PdfService],
})
export class InvoicesModule {}
