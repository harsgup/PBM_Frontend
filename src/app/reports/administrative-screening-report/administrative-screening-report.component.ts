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
import { PdfService } from '../../services/pdf.service';

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
    private mS: MessageService,
    private pdfService: PdfService
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
    
    // 1. Initialize Document (Portrait)
    const doc = this.pdfService.createDocument('portrait');
    
    // 2. Draw Header
    this.pdfService.drawHeader(
      doc,
      `CEPTAM Advt.: ${cycle}`,
      'ADMINISTRATIVE SCREENING COMMITTEE',
      'CANDIDATE VERIFICATION SHEET',
      'No. RD/PBM/01',
      'portrait'
    );
    
    // 3. Draw Sub-Header
    const fields = [
      { label: 'Post Code', value: '', width: 18 },
      { label: '', value: this.postCode, width: 22 },
      { label: 'Post Name', value: '', width: 18 },
      { label: '', value: this.postName, width: 50 },
      { label: 'Cycle', value: '', width: 14 },
      { label: '', value: cycle, width: 28 },
      { label: 'Date', value: '', width: 12 },
      { label: '', value: '', width: 20 }
    ];
    this.pdfService.drawSubHeader(doc, fields, 'portrait');
    
    // 4. Draw Table
    const headers = [['SL. No.', 'Application No.', 'Candidate Name', 'Category and Sub-Category', 'Verification Status', 'Remarks']];
    const data = this.reportData.map((row, index) => [
      index + 1,
      row.application_no,
      row.candidate_name,
      row.category_and_subcategory,
      row.status,
      row.remarks
    ]);

    const columnStyles = {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 32, halign: 'center' },
      2: { cellWidth: 40 },
      3: { cellWidth: 35 },
      4: { cellWidth: 30, halign: 'center' },
      5: { cellWidth: 33 }
    };
    
    this.pdfService.drawTable(doc, headers, data, 48, columnStyles);

    // 5. Draw Page Numbers
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      this.pdfService.drawPageNumber(doc, i, totalPages);
    }
    
    // 6. Draw Signature Block at the bottom of the last page
    const isApproverRole = this.userRole === 'approver';
    const footerTitle = isApproverRole ? 'Approved By:' : 'Verified By:';

    const signers = [
      { role: footerTitle, name: this.userName || '________________', designation: this.userDesignation || '________________' }
    ];

    doc.setPage(totalPages);
    const finalY = (doc as any).lastAutoTable.finalY + 12;
    this.pdfService.drawSignatureBlock(doc, signers, 'portrait', finalY);

    // 7. Save Document
    doc.save(`Candidate_Verification_Sheet_${cycle}_${post}.pdf`.replace(/\s+/g, '_'));
  }
}
