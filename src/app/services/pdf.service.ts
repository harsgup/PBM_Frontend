import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LOGO_BASE64 } from '../core/constants/logo-base64';

export interface PdfField {
  label: string;
  value: string;
  width: number; // width in mm
}

export interface PdfSigner {
  role: string;
  name: string;
  designation: string;
}

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  // Initialize a new Document with standard defaults
  createDocument(orientation: 'portrait' | 'landscape' = 'portrait'): jsPDF {
    const doc = new jsPDF(orientation, 'mm', 'a4');
    doc.setFont('helvetica', 'normal');
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.1);
    return doc;
  }

  // Draw official header box with Logo, Title, and Doc Number
  drawHeader(
    doc: jsPDF,
    titleLine1: string,
    titleLine2: string,
    titleLine3: string,
    docNo: string,
    orientation: 'portrait' | 'landscape' = 'portrait'
  ) {
    const pageWidth = doc.internal.pageSize.width;
    const printableWidth = pageWidth - 28; // 14mm margins
    const rightMarginX = pageWidth - 14;

    // Draw main outer header rectangle (from Y=8 to Y=36, height=28mm)
    doc.setLineWidth(0.2);
    doc.setDrawColor(0, 0, 0);
    doc.rect(14, 8, printableWidth, 28);

    // Draw Logo (positioned left inside margin 14-42)
    try {
      doc.addImage(LOGO_BASE64, 'PNG', 16.5, 9, 23, 26);
    } catch (e) {
      console.warn("Failed to render logo:", e);
    }

    // Vertical line after logo (X = 42)
    doc.line(42, 8, 42, 36);

    // Vertical line before doc number
    const docNoSeparatorX = orientation === 'landscape' ? 259 : 172;
    doc.line(docNoSeparatorX, 8, docNoSeparatorX, 36);

    // Title text centering (center is midpoint between X=42 and docNoSeparatorX)
    const titleCenterX = 42 + (docNoSeparatorX - 42) / 2;
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);

    if (titleLine3 && titleLine3.trim()) {
      // Line 1
      doc.setFontSize(11);
      doc.text(titleLine1, titleCenterX, 14.5, { align: 'center' });

      // Line 2
      doc.setFontSize(10);
      doc.text(titleLine2, titleCenterX, 21.0, { align: 'center' });

      // Line 3
      doc.setFontSize(11);
      doc.text(titleLine3, titleCenterX, 27.5, { align: 'center' });
    } else {
      // 2 lines spacing (vertically centered)
      // Line 1
      doc.setFontSize(11);
      doc.text(titleLine1, titleCenterX, 18.5, { align: 'center' });

      // Line 2
      doc.setFontSize(10);
      doc.text(titleLine2, titleCenterX, 25.5, { align: 'center' });
    }

    // Doc number (Right aligned)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(docNo, rightMarginX - 2, 21.0, { align: 'right' });
  }

  // Draw subheader (X=14 to rightMarginX, Y=36, Height=8)
  drawSubHeader(
    doc: jsPDF,
    fields: PdfField[],
    orientation: 'portrait' | 'landscape' = 'portrait'
  ) {
    const pageWidth = doc.internal.pageSize.width;
    const printableWidth = pageWidth - 28;

    // Draw subheader box
    doc.setLineWidth(0.2);
    doc.rect(14, 36, printableWidth, 8);

    let currentX = 14;
    fields.forEach((field, index) => {
      const nextX = currentX + field.width;

      // Draw vertical separator line (except for the last field)
      if (index < fields.length - 1) {
        doc.line(nextX, 36, nextX, 44);
      }

      // Draw label background (if color provided or defaults to light grey)
      // Even index fields (0, 2, 4...) are labels in label-value pairs
      const isLabel = index % 2 === 0;
      if (isLabel) {
        doc.setFillColor(240, 240, 240);
        doc.rect(currentX, 36, field.width, 8, 'F');
      }

      // Draw Text (Centered inside the sub-box)
      doc.setFont('helvetica', isLabel ? 'bold' : 'normal');
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);

      // Truncate value if it exceeds available width minus padding
      let textToDraw = isLabel ? (field.label || '') : (field.value || '');
      const maxTextWidth = field.width - 3; // padding
      const actualTextWidth = doc.getTextWidth(textToDraw);

      if (!isLabel && actualTextWidth > maxTextWidth) {
        while (textToDraw.length > 0 && doc.getTextWidth(textToDraw + '...') > maxTextWidth) {
          textToDraw = textToDraw.substring(0, textToDraw.length - 1);
        }
        textToDraw += '...';
      }

      const textCenterX = currentX + (field.width / 2);
      doc.text(textToDraw, textCenterX, 41.2, { align: 'center' });

      currentX = nextX;
    });
  }

  // Draw Table with jsPDF-AutoTable
  drawTable(
    doc: jsPDF,
    headers: string[][],
    data: any[][],
    startY: number,
    columnStyles: { [key: number]: any }
  ) {
    autoTable(doc, {
      startY: startY,
      head: headers,
      body: data,
      theme: 'grid',
      headStyles: { 
        fillColor: [240, 240, 240], 
        textColor: [0, 0, 0], 
        fontStyle: 'bold', 
        halign: 'center', 
        valign: 'middle',
        lineWidth: 0.1, 
        lineColor: [0, 0, 0] 
      },
      styles: { 
        font: 'helvetica',
        fontSize: 8, 
        cellPadding: 2.5, 
        overflow: 'linebreak', 
        textColor: [0, 0, 0], 
        lineColor: [0, 0, 0] 
      },
      columnStyles: columnStyles,
      didDrawPage: () => {
        doc.setTextColor(0, 0, 0);
      }
    });
  }

  // Draw Footer Page Number
  drawPageNumber(doc: jsPDF, pageIndex: number, totalPages: number) {
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    const str = `Page ${pageIndex} of ${totalPages}`;
    doc.text(str, pageWidth - 14, pageHeight - 8, { align: 'right' });
  }

  // Draw Signature Block (handles multi-signers, auto-splits page if it overflows)
  drawSignatureBlock(
    doc: jsPDF,
    signers: PdfSigner[],
    orientation: 'portrait' | 'landscape' = 'portrait',
    startY?: number
  ) {
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const printableWidth = pageWidth - 28;

    let drawY = startY !== undefined ? startY : (doc as any).lastAutoTable.finalY + 12;

    // Check if signature block overflows the page height
    if (drawY + 20 > pageHeight) {
      doc.addPage();
      drawY = 20;
    }

    const numSigners = signers.length;
    const sectionWidth = printableWidth / numSigners;

    signers.forEach((signer, index) => {
      const sigCenterX = 14 + (sectionWidth * index) + (sectionWidth / 2);

      // Signature line (parentheses)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text('(                             )', sigCenterX, drawY, { align: 'center' });

      // Role
      doc.setFont('helvetica', 'bold');
      doc.text(signer.role, sigCenterX, drawY + 5, { align: 'center' });

      // Name
      doc.setFont('helvetica', 'normal');
      doc.text(`Name: ${signer.name || 'N/A'}`, sigCenterX, drawY + 10, { align: 'center' });

      // Designation
      if (signer.designation) {
        doc.text(`Designation: ${signer.designation}`, sigCenterX, drawY + 14, { align: 'center' });
      }
    });
  }

  // Simple PDF generation wrapper (backward compatibility / quick tables)
  generatePdf(
    title: string,
    columns: string[],
    rows: any[],
    filename: string
  ) {
    const doc = this.createDocument('portrait');
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(title, pageWidth / 2, 15, { align: 'center' });

    // Table
    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 25,
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 9 }
    });

    // Save
    doc.save(`${filename}.pdf`);
  }
}