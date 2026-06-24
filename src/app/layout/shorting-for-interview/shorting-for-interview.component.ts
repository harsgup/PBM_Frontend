import { Component } from '@angular/core';
import { TechnicalService } from '../../services/technical.service';
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
import { AdminService } from '../../services/admin.service';
import { TagModule } from 'primeng/tag';
import { env } from '../../config/environment';
import { PdfService } from '../../services/pdf.service';
import { ShortlistService } from '../../services/shortlist.service';

export interface TechnicalJob {
  id: number;
  application_no: string;
  cycle: string;
  post_name: string;
  approver_remarks: string | null;
  committee_name: string;
  status: string;
  candidate_name: string | null;
  category: string | null;
  pwd: string | null;
  marks: number | null;
  remarks: string | null;
  shortlisted: boolean;
}
@Component({
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
  providers: [MessageService,ConfirmationService],
  selector: 'app-shorting-for-interview',
  templateUrl: './shorting-for-interview.component.html',
  styleUrl: './shorting-for-interview.component.css'
})
export class ShortingForInterviewComponent {

  private baseUrl = env.apiUrl;
  
  jobs: TechnicalJob[] = [];
  loading = false;
  dialogVisible = false;
  
  selectedApplication!: string;
  Form! : FormGroup;
  CyclePostForm! : FormGroup;
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
  selectedJobs: any[] = [];
  
   constructor(
      private mS: MessageService,
      private technicalService: TechnicalService,
      private cS :ConfirmationService,
      private router : Router,
      private fb: FormBuilder,
      private adminService: AdminService,
      private pdfService : PdfService,
      private sL:ShortlistService,
  
    ) { 
       this.Form = this.fb.group({
        committees: ['', Validators.required],
        final_marks: ['', Validators.required],
        remarks: ['']
      });
  
      this.CyclePostForm = this.fb.group({
        cycle: ['', Validators.required],
        post: ['', Validators.required]
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
  
    getCommitteDetails(job:string){
      this.technicalService.getCommitteeDetails(job).subscribe({
              next: (details) => {
                this.committeeDetails = details;
              }
            });
    }
  
  loadCandidate(job:TechnicalJob) {
  
    this.loading = true;
    this.Form.reset();
    this.dialogVisible = true;
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
  
    this.sL
      .getShortlistingJobs(cycle, post)
      .subscribe({
  
        next: (res) => {
  
          this.jobs = res;
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
  
  submit(){
    console.log('clicked')
    if(!this.Form.invalid){
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
  
  submitEvaluation(){
  
      const payload = {
        application_no: this.selectedApplication,
        committee_id : this.committeeDetails.id,
        ...this.Form.value
      };
      this.submitting = true;
      this.technicalService.submitTechnicalEvaluation(payload)
      .subscribe({
  
        next: (res: any) => {
          console.log(res)
          this.mS.add({
            severity: 'success',
            summary: 'Success',
            detail: res.message
          });
          this.submitting = false;
          this.dialogVisible = false;
  
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
  
  
  openDocument(appno:string,doc_for:string,doc_type:string,doc_name:string) {
  
    const payload = {
      application_no: appno,
      doc_for:doc_for,
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
  
    const columns = ['Application No', 'Recruitment Cycle', 'Post Name','Committee'];
  
    const rows = this.jobs.map(j => [
      j.application_no,
      j.cycle,
      j.post_name,
      j.committee_name
    ]);
  
    this.pdfService.generatePdf(
      'Technical Screening Report',
      columns,
      rows,
      'technical_screening'
    );
  }
  
  isAllSelectedShortlisted(): boolean {
  return this.selectedJobs.every(j => j.shortlisted);
}

confirmShortlist() {

  const action = this.isAllSelectedShortlisted() ? 'revert' : 'shortlist';

  this.cS.confirm({

    header: 'Confirm',
    message: `Are you sure you want to ${action} selected candidates?`,
    icon: 'pi pi-exclamation-triangle',

    accept: () => {
      this.performShortlist(action);
    }

  });

}

performShortlist(action: string) {

  const ids = this.selectedJobs.map(j => j.application_no);

  this.sL.shortlistCandidates({
    application_nos: ids,
    action: action   // shortlist / revert
  }).subscribe({

    next: (res: any) => {

      this.mS.add({
        severity: 'success',
        summary: 'Success',
        detail: res.message
      });

      this.selectedJobs = [];

      this.showCandidates(); // refresh table

    }

  });

}

}
