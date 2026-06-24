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
    const doc = this.pdfService.createDocument('landscape');

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

      // Draw Header
      this.pdfService.drawHeader(
        doc,
        `CEPTAM Advt.: ${cycle}`,
        'TECHNICAL SCREENING COMMITTEE',
        'CANDIDATE VERIFICATION SHEET',
        'No. RD/PBM/01',
        'landscape'
      );

      // Draw Sub-Header
      const fields = [
        { label: 'Post Name', value: '', width: 20 },
        { label: '', value: post, width: 75 },
        { label: 'Cycle', value: '', width: 14 },
        { label: '', value: cycle, width: 35 },
        { label: 'Committee Name', value: '', width: 28 },
        { label: '', value: committeeName, width: 55 },
        { label: 'Date', value: '', width: 12 },
        { label: '', value: '', width: 30 }
      ];
      this.pdfService.drawSubHeader(doc, fields, 'landscape');

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

      const columnStyles = {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 40, halign: 'center' },
        2: { cellWidth: 70 },
        3: { cellWidth: 44, halign: 'center' },
        4: { cellWidth: 100 }
      };

      this.pdfService.drawTable(doc, headers, data, 48, columnStyles);

      // Draw Page Numbers
      this.pdfService.drawPageNumber(doc, pageIdx + 1, numPages);

      // Draw signature block at bottom of current page
      const labRepName = this.committeeDetails?.lab_rep || 'N/A';
      const extMemName = this.committeeDetails?.external_member || 'N/A';
      const subjExpName = this.committeeDetails?.subject_expert || 'N/A';
      const chairmanName = this.committeeDetails?.chairman || 'N/A';

      const signers = [
        { role: 'Lab Representative', name: labRepName, designation: '' },
        { role: 'External Member', name: extMemName, designation: '' },
        { role: 'Subject Expert', name: subjExpName, designation: '' },
        { role: 'Chairman', name: chairmanName, designation: '' }
      ];

      this.pdfService.drawSignatureBlock(doc, signers, 'landscape', 160);
    }

    doc.save(`Technical_Screening_Sheet_${cycle}_${post}.pdf`.replace(/\s+/g, '_'));
  }

}
