import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  generatePdf(
    title: string,
    columns: string[],
    rows: any[],
    filename: string
  ) {

    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(16);
    doc.text(title, pageWidth / 2, 15, { align: 'center' });

    // Table
    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 25,
      theme: 'grid'
    });

    // Save
    doc.save(`${filename}.pdf`);
  }

}