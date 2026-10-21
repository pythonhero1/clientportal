import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

export interface InvoicePdfData {
  invoiceNumber: string;
  status: string;
  currency: string;
  subtotal: string | number;
  taxRate: string | number;
  taxAmount: string | number;
  totalAmount: string | number;
  amountPaid: string | number;
  balanceDue: string | number;
  dueDate: Date | string;
  issuedAt?: Date | string | null;
  paidAt?: Date | string | null;
  notes?: string | null;
  projectName: string;
  clientName: string;
  clientEmail: string;
  items: Array<{
    description: string;
    quantity: string | number;
    unitPrice: string | number;
    amount: string | number;
  }>;
}

@Injectable()
export class PdfService {
  private readonly sellerName = process.env.SELLER_LEGAL_NAME || 'Oderinde Stephen Studio / Consulting';
  private readonly sellerAddress = process.env.SELLER_ADDRESS || 'Lagos, Nigeria';
  private readonly sellerTaxId = process.env.SELLER_TAX_ID || 'TIN-98765432-001';
  private readonly bankName = process.env.SELLER_BANK_NAME || 'Access Bank Plc';
  private readonly accountName = process.env.SELLER_ACCOUNT_NAME || 'Oderinde Stephen';
  private readonly accountNumber = process.env.SELLER_ACCOUNT_NUMBER || '0123456789';
  private readonly swiftCode = process.env.SELLER_SWIFT_CODE || 'ACCNGLLA';

  async generateInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 48, size: 'A4' });
        const buffers: Buffer[] = [];

        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err) => reject(err));

        const currencySymbol = data.currency === 'NGN' ? 'NGN ' : '$';
        const formatMoney = (val: string | number) => {
          const num = typeof val === 'number' ? val : parseFloat(val.toString());
          return `${currencySymbol}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        };

        // Header
        doc.fontSize(22).font('Helvetica-Bold').text(this.sellerName, 48, 48);
        doc.fontSize(9).font('Helvetica').fillColor('#666666')
          .text(this.sellerAddress, 48, 74)
          .text(`Tax ID: ${this.sellerTaxId}`, 48, 88)
          .text('portal.oderindestephen.com', 48, 102);

        // Invoice Meta Block (Right aligned)
        doc.fontSize(18).font('Helvetica-Bold').fillColor('#111827')
          .text('INVOICE', 350, 48, { align: 'right' });
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#2563EB')
          .text(data.invoiceNumber || 'UNISSUED DRAFT', 350, 72, { align: 'right' });
        doc.fontSize(9).font('Helvetica').fillColor('#4B5563')
          .text(`Status: ${data.status}`, 350, 88, { align: 'right' })
          .text(`Issue Date: ${data.issuedAt ? new Date(data.issuedAt).toLocaleDateString('en-US', { dateStyle: 'medium' }) : 'Draft'}`, 350, 102, { align: 'right' })
          .text(`Due Date: ${new Date(data.dueDate).toLocaleDateString('en-US', { dateStyle: 'medium' })}`, 350, 116, { align: 'right' });

        doc.moveTo(48, 140).lineTo(547, 140).strokeColor('#E5E7EB').lineWidth(1).stroke();

        // Bill To & Project Info
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#111827').text('BILL TO:', 48, 155);
        doc.fontSize(10).font('Helvetica').fillColor('#374151')
          .text(data.clientName || 'Valued Client', 48, 170)
          .text(data.clientEmail || '', 48, 184)
          .text(`Project: ${data.projectName}`, 48, 198);

        // Table Header
        let tableTop = 230;
        doc.rect(48, tableTop, 499, 24).fill('#F3F4F6');
        doc.fillColor('#374151').fontSize(9).font('Helvetica-Bold')
          .text('ITEM DESCRIPTION', 58, tableTop + 7)
          .text('QTY', 330, tableTop + 7, { width: 40, align: 'right' })
          .text('UNIT PRICE', 380, tableTop + 7, { width: 70, align: 'right' })
          .text('TOTAL', 460, tableTop + 7, { width: 77, align: 'right' });

        // Items Rows
        let currentY = tableTop + 24;
        doc.font('Helvetica').fontSize(9);

        data.items.forEach((item, index) => {
          const rowBg = index % 2 === 1 ? '#FAFAFA' : '#FFFFFF';
          doc.rect(48, currentY, 499, 22).fill(rowBg);

          doc.fillColor('#1F2937')
            .text(item.description, 58, currentY + 6, { width: 260, lineBreak: false })
            .text(Number(item.quantity).toFixed(0), 330, currentY + 6, { width: 40, align: 'right' })
            .text(formatMoney(item.unitPrice), 380, currentY + 6, { width: 70, align: 'right' })
            .text(formatMoney(item.amount), 460, currentY + 6, { width: 77, align: 'right' });

          currentY += 22;
        });

        doc.moveTo(48, currentY).lineTo(547, currentY).strokeColor('#E5E7EB').stroke();
        currentY += 15;

        // Totals Block (Right aligned)
        const totalsLeft = 350;
        doc.fontSize(9).font('Helvetica').fillColor('#4B5563');
        
        doc.text('Subtotal:', totalsLeft, currentY, { width: 100, align: 'left' });
        doc.text(formatMoney(data.subtotal), totalsLeft + 100, currentY, { width: 97, align: 'right' });
        currentY += 16;

        if (Number(data.taxRate) > 0) {
          doc.text(`Tax (${data.taxRate}%):`, totalsLeft, currentY, { width: 100, align: 'left' });
          doc.text(formatMoney(data.taxAmount), totalsLeft + 100, currentY, { width: 97, align: 'right' });
          currentY += 16;
        }

        doc.moveTo(totalsLeft, currentY).lineTo(547, currentY).strokeColor('#E5E7EB').stroke();
        currentY += 6;

        doc.fontSize(11).font('Helvetica-Bold').fillColor('#111827');
        doc.text('Total Amount:', totalsLeft, currentY, { width: 100, align: 'left' });
        doc.text(formatMoney(data.totalAmount), totalsLeft + 100, currentY, { width: 97, align: 'right' });
        currentY += 18;

        doc.fontSize(9).font('Helvetica').fillColor('#059669');
        doc.text('Amount Paid:', totalsLeft, currentY, { width: 100, align: 'left' });
        doc.text(formatMoney(data.amountPaid), totalsLeft + 100, currentY, { width: 97, align: 'right' });
        currentY += 16;

        doc.fontSize(10).font('Helvetica-Bold').fillColor(Number(data.balanceDue) > 0 ? '#DC2626' : '#059669');
        doc.text('Balance Due:', totalsLeft, currentY, { width: 100, align: 'left' });
        doc.text(formatMoney(data.balanceDue), totalsLeft + 100, currentY, { width: 97, align: 'right' });

        // Remittance / Payment Instructions Block (Bottom Left)
        const bankTop = currentY + 30;
        doc.rect(48, bankTop, 270, 95).fill('#F9FAFB').strokeColor('#E5E7EB').stroke();
        doc.fillColor('#111827').fontSize(9).font('Helvetica-Bold').text('BANK TRANSFER REMITTANCE', 58, bankTop + 8);
        doc.fontSize(8.5).font('Helvetica').fillColor('#4B5563')
          .text(`Bank Name: ${this.bankName}`, 58, bankTop + 24)
          .text(`Account Name: ${this.accountName}`, 58, bankTop + 37)
          .text(`Account Number: ${this.accountNumber}`, 58, bankTop + 50)
          .text(`SWIFT / BIC: ${this.swiftCode}`, 58, bankTop + 63)
          .text(`Payment Ref: ${data.invoiceNumber || 'Invoice ID'}`, 58, bankTop + 76);

        // Notes / Footer
        if (data.notes) {
          doc.fontSize(8).font('Helvetica-Oblique').fillColor('#6B7280')
            .text(`Notes: ${data.notes}`, 48, bankTop + 110, { width: 499 });
        }

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
