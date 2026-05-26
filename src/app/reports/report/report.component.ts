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

interface DropdownOption {
  label: string;
  value: string | number;
}

@Component({
  selector: 'app-report',
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
  templateUrl: './report.component.html',
  styleUrl: './report.component.css'
})
export class ReportComponent implements OnInit {

  searchForm!: FormGroup;
  loading = false;
  
  cycles$: Observable<DropdownOption[]> | null = null;
  posts$: Observable<DropdownOption[]> | null = null;

  reportData: any[] = [];
  reportStatus: string = ''; // 'ready', 'incomplete', 'empty', 'error' or ''
  statusMessage: string = '';
  totalCandidates = 0;
  completedCandidates = 0;

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

    this.candidateService.getSummaryReport(cycle, post).subscribe({
      next: (res) => {
        this.reportStatus = res.status;
        this.statusMessage = res.message;
        this.totalCandidates = res.total || 0;
        this.completedCandidates = res.completed || 0;
        
        if (res.status === 'ready') {
          this.reportData = res.data;
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
    const headers = ['S.No', 'Application No', 'Candidate Name', 'Father Name', 'Verifier 1 Status', 'Verifier 1 Remarks', 'Verifier 2 Status', 'Verifier 2 Remarks', 'Approver Status', 'Approver Remarks'];
    
    const rows = this.reportData.map((row, index) => [
      index + 1,
      row.application_no,
      row.candidate_name,
      row.father_name,
      row.verifier1_status,
      row.verifier1_remarks,
      row.verifier2_status,
      row.verifier2_remarks,
      row.approver_status,
      row.approver_remarks
    ]);

    const csvContent = "\ufeff" + [headers.join(','), ...rows.map(e => e.map(val => {
      const strVal = String(val ?? '');
      return `"${strVal.replace(/"/g, '""')}"`;
    }).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Summary_Report_${cycle}_${post}.csv`.replace(/\s+/g, '_'));
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  exportPDF(): void {
    if (!this.reportData || this.reportData.length === 0) return;

    const { cycle, post } = this.searchForm.value;
    const doc = new jsPDF('landscape', 'mm', 'a4');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(41, 128, 185);
    doc.text('Summary Screening Report', 14, 15);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Recruitment Cycle: ${cycle} | Post: ${post}`, 14, 21);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 26);
    
    const headers = [['S.No', 'Application No', 'Name', 'Father Name', 'Verifier 1', 'Verifier 1 Remarks', 'Verifier 2', 'Verifier 2 Remarks', 'Approver', 'Approver Remarks']];
    const data = this.reportData.map((row, index) => [
      index + 1,
      row.application_no,
      row.candidate_name,
      row.father_name,
      row.verifier1_status,
      row.verifier1_remarks,
      row.verifier2_status,
      row.verifier2_remarks,
      row.approver_status,
      row.approver_remarks
    ]);

    autoTable(doc, {
      startY: 30,
      head: headers,
      body: data,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold', halign: 'center' },
      styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 28, halign: 'center' },
        2: { cellWidth: 28 },
        3: { cellWidth: 28 },
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 32 },
        6: { cellWidth: 20, halign: 'center' },
        7: { cellWidth: 32 },
        8: { cellWidth: 20, halign: 'center' },
        9: { cellWidth: 32 }
      },
      didDrawPage: (data) => {
        const str = `Page ${doc.getNumberOfPages()}`;
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(str, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10);
      }
    });

    doc.save(`Summary_Report_${cycle}_${post}.pdf`.replace(/\s+/g, '_'));
  }
}
