import { Component } from '@angular/core';
import { TechnicalService } from '../../../services/technical.service';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Router } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from "primeng/dropdown";
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { AdminService } from '../../../services/admin.service';
import { TagModule } from 'primeng/tag';
import { env } from '../../../config/environment';
import { PdfService } from '../../../services/pdf.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LOGO_BASE64 } from '../../../core/constants/logo-base64';
export interface TechnicalJob {
  id: number;
  application_no: string;
  post_name: string;
  committee_name: string;
  cycle: string;
  approver_remarks: string;
  status: string;
  candidate_name?: string | null;
  marks?: number | null;
  remarks?: string | null;
}
@Component({
  selector: 'app-technical-screening',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    ToastModule,
    TableModule,
    ConfirmDialogModule,
    DialogModule,
    DropdownModule,
    ReactiveFormsModule,
    InputTextModule,
    TagModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './technical-screening.component.html',
  styleUrl: './technical-screening.component.css'
})
export class TechnicalScreeningComponent {

  private baseUrl = env.apiUrl;

  jobs: TechnicalJob[] = [];
  loading = false;
  dialogVisible = false;

  selectedApplication!: string;
  Form!: FormGroup;
  CyclePostForm!: FormGroup;
  candidate: any;
  education: any[] = [];
  experience: any[] = [];
  committees: any[] = [];
  cycles: any[] = [];
  posts: any[] = [];
  committeeDetails: any;
  submitting = false;

  docDialogVisible = false;
  docUrl: string = '';
  docType: string = '';
  docLoading = false;
  zoom = 1;

  constructor(
    private mS: MessageService,
    private technicalService: TechnicalService,
    private cS: ConfirmationService,
    private router: Router,
    private fb: FormBuilder,
    private adminService: AdminService,
    private pdfService: PdfService,

  ) {
    this.Form = this.fb.group({
      committees: ['', Validators.required],
      final_marks: ['', Validators.required],
      cycle: [''],
      post_name: [''],
      remarks: ['']
    });

    this.CyclePostForm = this.fb.group({
      cycle: ['', Validators.required],
      post: ['', Validators.required],
    });
  }

  ngOnInit() {

    this.loadCycles();

    this.CyclePostForm.get('cycle')!.valueChanges.subscribe(cycle => {
      this.CyclePostForm.patchValue({ post: '' });
      this.posts = [];

      if (cycle) {
        this.adminService.getPosts(cycle).subscribe(res => {
          this.posts = res.map(p => ({ label: p, value: p }));
        });
      }
    });

    this.CyclePostForm.get('post')!.valueChanges.subscribe(() => {
    });
  }


  loadCycles() {
    this.adminService.getCycles().subscribe(res => {
      this.cycles = res.map(c => ({ label: c, value: c }));
    });
  }

  getCommitteDetails(job: string) {
    this.technicalService.getCommitteeDetails(job).subscribe({
      next: (details) => {
        this.committeeDetails = details;
      }
    });
  }

  loadCandidate(job: TechnicalJob) {
    this.loading = true;
    this.Form.reset();
    this.dialogVisible = true;
    this.Form.get('cycle')?.patchValue(job.cycle)
    this.Form.get('post_name')?.patchValue(job.post_name)
    this.Form.get('committees')?.patchValue(job.committee_name);
    this.selectedApplication = job.application_no;
    this.getCommitteDetails(job.committee_name);
    this.technicalService.getCandidateDetails(job.application_no)
      .subscribe({
        next: (res) => {
          this.candidate = res.personal;
          this.education = res.education || [];
          this.experience = res.experience || [];
          this.loading = false;

        },

        error: (err) => {
          this.loading = false;
        }

      });
    this.loadExistingEvaluation(job.application_no);

  }

  viewDocument(url: string) {

    window.open(url, '_blank');

  }

  showCandidates() {

    if (this.CyclePostForm.invalid) return;

    const cycle = this.CyclePostForm.value.cycle!;
    const post = this.CyclePostForm.value.post!;

    this.loading = true;

    this.technicalService
      .getTechnicalScreeningJobs(cycle, post)
      .subscribe({

        next: (res) => {
          this.jobs = res;
          if (this.jobs && this.jobs.length > 0) {
            this.getCommitteDetails(this.jobs[0].committee_name);
          }
          this.loading = false;
        },

        error: () => {
          this.loading = false;
        }

      });

  }

  loadExistingEvaluation(applicationNo: string) {

    this.technicalService.getTechnicalEvaluation(applicationNo)
      .subscribe(res => {

        if (res) {

          this.Form.patchValue({
            final_marks: res.final_marks,
            remarks: res.remarks
          });

        }
      });

  }

  submit() {
    if (!this.Form.invalid) {
      const marks = this.Form.value.final_marks;
      this.cS.confirm({
        header: 'Confirm Submission',
        message: `Are you sure you want to submit this evaluation?<br><b>Marks:</b> ${marks}`,
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          this.submitEvaluation();
        }
      });
    }
  }

  submitEvaluation() {

    const payload = {
      application_no: this.selectedApplication,
      committee_id: this.committeeDetails.id,
      ...this.Form.value
    };
    this.submitting = true;
    this.technicalService.submitTechnicalEvaluation(payload)
      .subscribe({

        next: (res: any) => {
          this.mS.add({
            severity: 'success',
            summary: 'Success',
            detail: res.message
          });
          this.submitting = false;
          this.dialogVisible = false;
          this.showCandidates();

        },

        error: (err) => {
          this.mS.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error.detail || 'Something went wrong'
          });
          this.submitting = false;
        }

      });

  }


  openDocument(appno: string, doc_for: string, doc_type: string, doc_name: string) {

    const payload = {
      application_no: appno,
      doc_for: doc_for,
      doc_type: doc_type,
      doc_name: doc_name
    };
    this.docLoading = true;

    this.technicalService.getDocument(payload)
      .subscribe({

        next: (res) => {

          this.docUrl = `${this.baseUrl}${res.url}`;
          console.log(this.docUrl)
          this.docType = this.docUrl.endsWith('.pdf') ? 'pdf' : 'image';

          this.docDialogVisible = true;

          this.docLoading = false;
        },

        error: () => {

          this.mS.add({
            severity: 'warn',
            summary: 'Not Found',
            detail: 'Document not available'
          });

          this.docLoading = false;
        }

      });

  }

  zoomIn() {
    this.zoom += 0.2;
  }

  zoomOut() {
    if (this.zoom > 0.4) {
      this.zoom -= 0.2;
    }
  }

  resetZoom() {
    this.zoom = 1;
  }

  generatePdf() {
    if (!this.jobs || this.jobs.length === 0) {
      this.mS.add({
        severity: 'warn',
        summary: 'No Data',
        detail: 'No candidates available to export.'
      });
      return;
    }

    if (!this.committeeDetails) {
      this.mS.add({
        severity: 'info',
        summary: 'Loading',
        detail: 'Loading committee details, please click Export PDF again in a moment.'
      });
      this.getCommitteDetails(this.jobs[0].committee_name);
      return;
    }

    const cycle = this.CyclePostForm.value.cycle || '';
    const post = this.CyclePostForm.value.post || '';
    const committeeName = this.jobs[0].committee_name || 'N/A';

    // Landscape A4 size is 297mm x 210mm
    const doc = new jsPDF('landscape', 'mm', 'a4');

    const batchSize = 7;
    const totalJobs = this.jobs.length;
    const numPages = Math.ceil(totalJobs / batchSize) || 1;

    // Helper to format date as DD/MM/YYYY
    const formatReportDate = (date: Date) => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };
    const dateStr = formatReportDate(new Date());

    for (let pageIdx = 0; pageIdx < numPages; pageIdx++) {
      if (pageIdx > 0) {
        doc.addPage();
      }

      // Draw Header border (X: 14, width: 269, height: 28)
      doc.rect(14, 8, 269, 28);

      // Draw Logo
      try {
        doc.addImage(LOGO_BASE64, 'PNG', 16.5, 9, 23, 26);
      } catch (e) {
        console.warn("Failed to render logo:", e);
      }

      // Vertical line after logo
      doc.line(42, 8, 42, 36);

      // Center Header Text (center is X = 150.5)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`CEPTAM Advt.: ${cycle}`, 150.5, 15, { align: 'center' });
      doc.setFontSize(10);
      doc.text('TECHNICAL SCREENING COMMITTEE', 150.5, 21, { align: 'center' });
      doc.setFontSize(11);
      doc.text('CANDIDATE VERIFICATION SHEET', 150.5, 27, { align: 'center' });

      // Vertical line before doc number at X = 259
      doc.line(259, 8, 259, 36);

      // Doc Number (Right aligned, margins at X=283)
      doc.setFontSize(8);
      doc.text('No. RD/PBM/01', 281, 21, { align: 'right' });

      // Sub-header Row (Post Name, Committee Name, Date)
      doc.rect(14, 36, 269, 8);

      // Gray background for labels
      doc.setFillColor(240, 240, 240);
      doc.rect(14, 36, 20, 8, 'F');
      doc.rect(144, 36, 28, 8, 'F');
      doc.rect(237, 36, 12, 8, 'F');

      // Text inside sub-header
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text('Post Name', 24, 41, { align: 'center' });
      doc.text(post, 36, 41);
      doc.text('Committee Name', 158, 41, { align: 'center' });
      doc.text(committeeName, 174, 41);
      doc.text('Date', 243, 41, { align: 'center' });
      doc.text(dateStr, 266, 41, { align: 'center' });

      // Vertical lines in sub-header
      doc.line(34, 36, 34, 44);
      doc.line(144, 36, 144, 44);
      doc.line(172, 36, 172, 44);
      doc.line(237, 36, 237, 44);
      doc.line(249, 36, 249, 44);

      // Get candidates for this page
      const startIdx = pageIdx * batchSize;
      const endIdx = Math.min(startIdx + batchSize, totalJobs);
      const pageJobs = this.jobs.slice(startIdx, endIdx);

      const headers = [['SL. No.', 'Application No.', 'Candidate Name', 'Marks Obtained', 'Remarks']];
      const data = pageJobs.map((row, index) => [
        startIdx + index + 1,
        row.application_no,
        row.candidate_name || '',
        row.marks !== null && row.marks !== undefined ? row.marks : '',
        row.remarks || ''
      ]);

      autoTable(doc, {
        startY: 48,
        head: headers,
        body: data,
        theme: 'grid',
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', lineWidth: 0.1, lineColor: [0, 0, 0] },
        styles: { fontSize: 8, cellPadding: 2.5, overflow: 'linebreak', textColor: [0, 0, 0], lineColor: [0, 0, 0] },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' },
          1: { cellWidth: 40, halign: 'center' },
          2: { cellWidth: 70 },
          3: { cellWidth: 44, halign: 'center' },
          4: { cellWidth: 100 }
        },
        didDrawPage: (data) => {
          const str = `Page ${doc.getNumberOfPages()} of ${numPages}`;
          doc.setFontSize(8);
          doc.setTextColor(150);
          doc.text(str, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 8);
        }
      });

      // Draw signature block at bottom of current page
      const drawY = 160;
      // Mathematically symmetric column centers for 4 roles over 269mm printable width
      const sigX = [47.6, 114.9, 182.1, 249.4];

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);

      // Parentheses for signatures
      doc.text('(                             )', sigX[0], drawY, { align: 'center' });
      doc.text('(                             )', sigX[1], drawY, { align: 'center' });
      doc.text('(                             )', sigX[2], drawY, { align: 'center' });
      doc.text('(                             )', sigX[3], drawY, { align: 'center' });

      // Roles
      doc.text('Lab Representative', sigX[0], drawY + 5, { align: 'center' });
      doc.text('External Member', sigX[1], drawY + 5, { align: 'center' });
      doc.text('Subject Expert', sigX[2], drawY + 5, { align: 'center' });
      doc.text('Chairman', sigX[3], drawY + 5, { align: 'center' });

      // Names
      const labRepName = this.committeeDetails?.lab_rep || 'N/A';
      const extMemName = this.committeeDetails?.external_member || 'N/A';
      const subjExpName = this.committeeDetails?.subject_expert || 'N/A';
      const chairmanName = this.committeeDetails?.chairman || 'N/A';

      doc.setFont('helvetica', 'normal');
      doc.text(`Name: ${labRepName}`, sigX[0], drawY + 10, { align: 'center' });
      doc.text(`Name: ${extMemName}`, sigX[1], drawY + 10, { align: 'center' });
      doc.text(`Name: ${subjExpName}`, sigX[2], drawY + 10, { align: 'center' });
      doc.text(`Name: ${chairmanName}`, sigX[3], drawY + 10, { align: 'center' });
    }

    doc.save(`Technical_Screening_Sheet_${cycle}_${post}.pdf`.replace(/\s+/g, '_'));
  }

}
