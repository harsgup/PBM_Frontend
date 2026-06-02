import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { map, Observable } from 'rxjs';

import { CandidateDetailService } from '../../core/services/candidate.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LOGO_BASE64 } from '../../core/constants/logo-base64';

interface DropdownOption {
  label: string;
  value: string | number;
}

@Component({
  selector: 'app-administrative-screening-report',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ReactiveFormsModule,
    FormsModule,
    DropdownModule,
    ButtonModule,
    TableModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './administrative-screening-report.component.html',
  styleUrl: './administrative-screening-report.component.css'
})
export class AdministrativeScreeningReportComponent implements OnInit {

  searchForm!: FormGroup;
  loading = false;
  
  cycles$: Observable<DropdownOption[]> | null = null;
  posts$: Observable<DropdownOption[]> | null = null;

  reportData: any[] = [];
  reportStatus: string = ''; // 'ready', 'incomplete', 'empty', 'error' or ''
  statusMessage: string = '';
  totalCandidates = 0;
  completedCandidates = 0;
  postCode = 'N/A';
  postName = '';
  cycle = '';
  userName = '';
  userDesignation = '';
  userRole = '';

  // Pagination and rows
  rowsPerPage = 10;
  rowsOptions = [
    { label: '10 Rows', value: 10 },
    { label: '20 Rows', value: 20 },
    { label: '100 Rows', value: 100 },
    { label: 'Show All', value: 999999 }
  ];

  constructor(
    private fb: FormBuilder,
    private candidateService: CandidateDetailService,
    private mS: MessageService
  ) {}

  ngOnInit(): void {
    this.searchForm = this.fb.group({
      cycle: [null, Validators.required],
      post: [null, Validators.required]
    });

    this.cycles$ = this.candidateService.getCycles().pipe(
      map(cycles => cycles.map(c => ({ label: c.name, value: c.name })))
    );

    this.posts$ = this.candidateService.getPost().pipe(
      map(posts => posts.map(p => ({ label: p.name, value: p.name })))
    );
  }

  get cycleControl() {
    return this.searchForm.controls['cycle'];
  }

  get postControl() {
    return this.searchForm.controls['post'];
  }

  showReport(): void {
    if (this.searchForm.invalid) return;

    this.loading = true;
    const { cycle, post } = this.searchForm.value;

    this.candidateService.getAdministrativeScreeningReport(cycle, post).subscribe({
      next: (res) => {
        this.reportStatus = res.status;
        this.statusMessage = res.message;
        this.totalCandidates = res.total || 0;
        this.completedCandidates = res.completed || 0;
        
        if (res.status === 'ready') {
          this.reportData = res.data;
          this.postCode = res.post_code || 'N/A';
          this.postName = res.post_name || '';
          this.cycle = res.cycle || '';
          this.userName = res.user_name || '';
          this.userDesignation = res.user_designation || '';
          this.userRole = res.user_role || '';
          this.mS.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Report generated successfully.'
          });
        } else if (res.status === 'incomplete') {
          this.reportData = [];
          this.mS.add({
            severity: 'warn',
            summary: 'Report Incomplete',
            detail: res.message
          });
        } else {
          this.reportData = [];
          this.mS.add({
            severity: 'info',
            summary: 'No Data',
            detail: res.message
          });
        }
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.reportStatus = 'error';
        this.statusMessage = err?.error?.detail || 'Failed to fetch report.';
        this.reportData = [];
        this.mS.add({
          severity: 'error',
          summary: 'Error',
          detail: this.statusMessage
        });
      }
    });
  }

  exportCSV(): void {
    if (!this.reportData || this.reportData.length === 0) return;

    const { cycle, post } = this.searchForm.value;
    const headers = ['S.No', 'Application No', 'Candidate Name', 'Category and Sub-Category', 'Verification Status', 'Remarks'];
    
    const rows = this.reportData.map((row, index) => [
      index + 1,
      row.application_no,
      row.candidate_name,
      row.category_and_subcategory,
      row.status,
      row.remarks
    ]);

    const csvContent = "\ufeff" + [headers.join(','), ...rows.map(e => e.map(val => {
      const strVal = String(val ?? '');
      return `"${strVal.replace(/"/g, '""')}"`;
    }).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Candidate_Verification_Sheet_${cycle}_${post}.csv`.replace(/\s+/g, '_'));
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  exportPDF(): void {
    if (!this.reportData || this.reportData.length === 0) return;

    const { cycle, post } = this.searchForm.value;
    const doc = new jsPDF('portrait', 'mm', 'a4');
    
    // Draw Header border
    doc.rect(14, 8, 182, 28);
    
    // Draw Logo
    try {
      doc.addImage(LOGO_BASE64, 'PNG', 16.5, 9, 23, 26);
    } catch (e) {
      console.warn("Failed to render logo:", e);
    }
    
    // Vertical line after logo
    doc.line(42, 8, 42, 36);
    
    // Center Header Text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('CEPTAM Advt. (PROJECT BASED MANPOWER)', 107, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text('ADMINISTRATIVE SCREENING COMMITTEE', 107, 21, { align: 'center' });
    doc.setFontSize(11);
    doc.text('CANDIDATE VERIFICATION SHEET', 107, 27, { align: 'center' });
    
    // Vertical line before doc number
    doc.line(172, 8, 172, 36);
    
    // Doc Number (Right aligned)
    doc.setFontSize(8);
    doc.text('No. RD/PBM/01', 194, 21, { align: 'right' });
    
    // Sub-header Row (Post Code, Post Name, Date)
    doc.rect(14, 36, 182, 8);
    
    // Gray background for labels
    doc.setFillColor(240, 240, 240);
    doc.rect(14, 36, 20, 8, 'F');
    doc.rect(60, 36, 22, 8, 'F');
    doc.rect(145, 36, 12, 8, 'F');
    
    // Text inside sub-header
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text('Post Code', 24, 41, { align: 'center' });
    doc.text(this.postCode, 47, 41, { align: 'center' });
    doc.text('Post Name', 71, 41, { align: 'center' });
    doc.text(this.postName, 84, 41);
    doc.text('Date', 151, 41, { align: 'center' });
    doc.text(new Date().toLocaleDateString(), 176, 41, { align: 'center' });
    
    // Vertical lines in sub-header
    doc.line(34, 36, 34, 44);
    doc.line(60, 36, 60, 44);
    doc.line(82, 36, 82, 44);
    doc.line(145, 36, 145, 44);
    doc.line(157, 36, 157, 44);
    
    const headers = [['SL. No.', 'Application No.', 'Candidate Name', 'Category and Sub-Category', 'Verification Status', 'Remarks']];
    const data = this.reportData.map((row, index) => [
      index + 1,
      row.application_no,
      row.candidate_name,
      row.category_and_subcategory,
      row.status,
      row.remarks
    ]);

    autoTable(doc, {
      startY: 48,
      head: headers,
      body: data,
      theme: 'grid',
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', lineWidth: 0.1, lineColor: [0, 0, 0] },
      styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak', textColor: [0, 0, 0], lineColor: [0, 0, 0] },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 32, halign: 'center' },
        2: { cellWidth: 40 },
        3: { cellWidth: 35 },
        4: { cellWidth: 30, halign: 'center' },
        5: { cellWidth: 33 }
      },
      didDrawPage: (data) => {
        const str = `Page ${doc.getNumberOfPages()}`;
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(str, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10);
      }
    });

    // Draw signature block at bottom
    const finalY = (doc as any).lastAutoTable.finalY + 12;
    const pageHeight = doc.internal.pageSize.height;
    
    let drawY = finalY;
    if (finalY + 20 > pageHeight) {
      doc.addPage();
      drawY = 20;
    }
    
    const isApproverRole = this.userRole === 'approver';
    const footerTitle = isApproverRole ? 'Approved By:' : 'Verified By:';
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(footerTitle, 14, drawY);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${this.userName || '________________'}`, 14, drawY + 6);
    doc.text(`Designation: ${this.userDesignation || '________________'}`, 14, drawY + 12);

    doc.save(`Candidate_Verification_Sheet_${cycle}_${post}.pdf`.replace(/\s+/g, '_'));
  }
}
