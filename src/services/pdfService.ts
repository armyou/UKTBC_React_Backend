import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

// Type for PDFDocument instance
type PDFDoc = InstanceType<typeof PDFDocument>;

export interface ReceiptData {
  firstName: string;
  lastName: string;
  amount: number;
  currency: string;
  paymentReference: string;
  donationType: string;
  giftAid: boolean;
  paymentDate: Date;
  transactionId: string;
  addressLine1?: string;
  addressLine2?: string;
  addressLine3?: string;
  townCity?: string;
  postCode?: string;
  paymentMethod?: string;
}

export class PDFService {
  private outputDir: string;

  constructor() {
    this.outputDir = path.join(process.cwd(), 'temp', 'receipts');
    this.ensureOutputDir();
  }

  private ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async generateReceipt(data: ReceiptData): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          info: {
            Title: 'Donation Receipt',
            Author: 'UK Telugu Brahmin Community',
            Subject: `Receipt for ${data.paymentReference}`,
            Creator: 'UKTBC Donation System'
          }
        });

        const filename = `receipt_${data.paymentReference}_${Date.now()}.pdf`;
        const filepath = path.join(this.outputDir, filename);
        const stream = fs.createWriteStream(filepath);
        
        doc.pipe(stream);

        // Header Section
        this.addHeader(doc);
        
        // Organization Title
        this.addOrganizationTitle(doc);
        
        // Receipt Title
        this.addReceiptTitle(doc);
        
        // Address and Receipt Info
        this.addAddressSection(doc, data);
        
        // Salutation
        this.addSalutation(doc, data.firstName);
        
        // Gratitude Message
        this.addGratitudeMessage(doc);
        
        // Donation Details
        this.addDonationDetails(doc, data);
        
        // Purpose Note
        this.addPurposeNote(doc);
        
        // Closing
        this.addClosing(doc);
        
        // Gift Aid Declaration (if applicable)
        if (data.giftAid) {
          this.addGiftAidDeclaration(doc);
        }
        
        // Footer
        this.addFooter(doc);

        doc.end();

        stream.on('finish', () => {
          resolve(filepath);
        });

        stream.on('error', (error) => {
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  private addHeader(doc: PDFDoc) {
    const centerX = 300;
    const logoY = 50;
    const logoWidth = 150; // Reduced width to maintain aspect ratio
    const logoHeight = 100; // Reduced height proportionally

    try {
      // Add the actual UKTBC logo image
      const logoPath = path.join(process.cwd(), 'assets', 'UKTBC Logo PNG.png');
      
      if (fs.existsSync(logoPath)) {
        // Add the logo image with proper aspect ratio
        doc.image(logoPath, centerX - logoWidth/2, logoY, {
          width: logoWidth,
          height: logoHeight,
          align: 'center',
          fit: [logoWidth, logoHeight] // This maintains aspect ratio
        });
      } else {
        // Fallback to text if image not found
        console.warn('UKTBC logo image not found, using text fallback');
        this.addHeaderFallback(doc, centerX, logoY);
      }
    } catch (error) {
      console.error('Error adding logo image:', error);
      // Fallback to text if image loading fails
      this.addHeaderFallback(doc, centerX, logoY);
    }
  }

  private addHeaderFallback(doc: PDFDoc, centerX: number, logoY: number) {
    // Fallback text-based header if image is not available
    doc.fontSize(16)
       .fillColor('#000000')
       .text('UK TELUGU BRAHMIN COMMUNITY', centerX - 100, logoY + 20, { width: 200, align: 'center' });
    
    doc.fontSize(12)
       .text('UKTBC', centerX - 30, logoY + 50, { width: 60, align: 'center' });
  }

  private addOrganizationTitle(doc: PDFDoc) {
    // Organization title is now part of the logo, so we just add the charity registration
    doc.fontSize(12)
       .fillColor('#000000')
       .text('Charity registered in England & Wales No. 1205566', 50, 190, { align: 'center' });
  }

  private addReceiptTitle(doc: PDFDoc) {
    // Add horizontal line
    doc.moveTo(50, 210)
       .lineTo(550, 210)
       .lineWidth(2)
       .stroke();

    doc.fontSize(18)
       .fillColor('#000000')
       .text('Donation Receipt', 50, 230, { align: 'center' });
  }

  private addAddressSection(doc: PDFDoc, data: ReceiptData) {
    const startY = 270;
    
    // Left side - Donor address (just the actual data, no labels)
    doc.fontSize(12)
       .fillColor('#000000')
       .text(`${data.firstName} ${data.lastName}`, 50, startY);
    
    if (data.addressLine1) {
      doc.fontSize(10)
         .text(data.addressLine1, 50, startY + 20);
    }
    
    if (data.addressLine2) {
      doc.text(data.addressLine2, 50, startY + 35);
    }
    
    if (data.addressLine3) {
      doc.text(data.addressLine3, 50, startY + 50);
    }
    
    if (data.townCity) {
      doc.text(data.townCity, 50, startY + 65);
    }
    
    if (data.postCode) {
      doc.text(data.postCode, 50, startY + 80);
    }

    // Right side - Receipt info (just the actual data, no labels)
    // Add a subtle background for better visibility
    doc.rect(340, startY - 5, 200, 40)
       .fillColor('#f8f9fa')
       .fill()
       .stroke('#e9ecef');

    doc.fontSize(12)
       .fillColor('#000000')
       .text(`Date:${data.paymentDate.toLocaleDateString('en-GB')}`, 350, startY);
    
    doc.fontSize(12)
       .text(`Receipt No: ${data.paymentReference}`, 350, startY + 25);
  }

  private addSalutation(doc: PDFDoc, firstName: string) {
    doc.fontSize(12)
       .fillColor('#000000')
       .text(`Namaste ${firstName},`, 50, 490);
  }

  private addGratitudeMessage(doc: PDFDoc) {
    doc.fontSize(11)
       .fillColor('#000000')
       .text('We are grateful for your generous donation in support of our work.', 50, 510);
  }

  private addDonationDetails(doc: PDFDoc, data: ReceiptData) {
    const startY = 540;
    
    // Donation Date
    doc.fontSize(10)
       .fillColor('#000000')
       .text('Donation Date:', 50, startY);
    doc.text(data.paymentDate.toLocaleDateString('en-GB'), 200, startY);
    
    // Donation for
    doc.text('Donation for:', 50, startY + 20);
    doc.text(data.paymentReference, 200, startY + 20);
    
    // Mode of transfer
    doc.text('Mode of transfer:', 50, startY + 40);
    doc.text(data.paymentMethod || 'Bank transfer / Paypal / Stripe', 200, startY + 40);
    
    // Donation amount
    doc.text('Donation amount', 50, startY + 60);
    doc.fontSize(14)
       .fillColor('#27ae60')
       .text(`${data.currency.toUpperCase()} ${data.amount.toFixed(2)}`, 200, startY + 60);
    
    // Gift Aid (if applicable)
    if (data.giftAid) {
      doc.fontSize(10)
         .fillColor('#000000')
         .text('Gift Aid (UK Tax Payer):', 50, startY + 80);
      doc.fillColor('#27ae60')
         .text('Yes - 25% of donation amount', 200, startY + 80);
    }
  }

  private addPurposeNote(doc: PDFDoc) {
    doc.fontSize(11)
       .fillColor('#000000')
       .text('Please note that all of your donation will be used for the causes we support.', 50, 670);
  }

  private addClosing(doc: PDFDoc) {
    doc.fontSize(11)
       .fillColor('#000000')
       .text('Kind Regards,', 50, 700);
    doc.fontSize(12)
       .text('UK Telugu Brahmin Community', 50, 720);
    doc.fontSize(11)
       .text('Finance Team', 50, 740);
    doc.text('www.uktbc.org', 50, 760);
  }

  private addGiftAidDeclaration(doc: PDFDoc) {
    doc.fontSize(12)
       .fillColor('#000000')
       .text('Gift Aid Declaration', 50, 790);
    
    doc.fontSize(10)
       .text('I confirm I am a UK taxpayer and understand that if I pay less Income Tax and/or Capital Gains Tax than the amount of Gift Aid claimed on all my donations in that tax year, it is my responsibility to pay the difference.', 50, 810, { width: 500 });
    
    doc.text('If I pay Income Tax at the higher or additional rate, I can claim the difference between my rate and the basic rate on my Self Assessment tax return.', 50, 850, { width: 500 });
  }

  private addFooter(doc: PDFDoc) {
    // Add horizontal line
    doc.moveTo(50, 890)
       .lineTo(550, 890)
       .lineWidth(1)
       .stroke();

    doc.fontSize(12)
       .fillColor('#000000')
       .text('UK Telugu Brahmin Community', 50, 910, { align: 'center' });
    
    doc.fontSize(10)
       .text('donate@uktbc.org | www.uktbc.org', 50, 930, { align: 'center' });
  }

  // Clean up old PDF files (optional)
  async cleanupOldFiles(maxAgeHours: number = 24) {
    try {
      const files = fs.readdirSync(this.outputDir);
      const now = Date.now();
      const maxAge = maxAgeHours * 60 * 60 * 1000;

      for (const file of files) {
        const filepath = path.join(this.outputDir, file);
        const stats = fs.statSync(filepath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filepath);
        }
      }
    } catch (error) {
      console.error('Error cleaning up old PDF files:', error);
    }
  }
}

// Export singleton instance
export const pdfService = new PDFService();
export default pdfService;
