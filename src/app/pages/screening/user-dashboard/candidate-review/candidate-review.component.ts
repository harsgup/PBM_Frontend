import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DialogModule } from "primeng/dialog";
import { AccordionModule } from "primeng/accordion";
import { ButtonModule } from "primeng/button";
import { DropdownModule } from "primeng/dropdown";
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ToastModule } from "primeng/toast";
import { MessageService } from "primeng/api";

import { CandidateDetails } from "../../../../core/models/candidate-details.model";
import { Candidate } from "../../../../core/models/candidate.model";
import { CandidateDetailService } from "../../../../core/services/candidate.service";
import { CandidateStatus, CandidateStatusLabel } from "../../../../core/models/candidate-status.enum";
import { AuthService } from "../../../../services/auth.service";

@Component({
  selector: "app-candidate-review",
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    AccordionModule,
    ButtonModule,
    DropdownModule,
    ReactiveFormsModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: "./candidate-review.component.html",
  styleUrl: "./candidate-review.component.css",
})

export class CandidateReviewComponent implements OnChanges, OnInit {
  @Input() visible: boolean = false;
  @Input() applicationNo!: string | null;
  @Input() candidates: Candidate[] = [];
  @Input() currentIndex: number = -1;

  @Output() navigate = new EventEmitter<number>();
  @Output() close = new EventEmitter<void>();
  @Output() reviewSubmitted = new EventEmitter<{ applicationNo: string; status: string; remarks: string }>();

  candidateDetails!: CandidateDetails;
  selectedDocument: string | null = null;
  reviewForm!: FormGroup;
  zoom = 1;
  
  statusOptions = Object.values(CandidateStatus).map(status => ({
    label: CandidateStatusLabel[status],
    value: status
  }));

  constructor(
    private service: CandidateDetailService,
    private fb: FormBuilder,
    private mS: MessageService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.reviewForm = this.fb.group({
      status: [null, Validators.required],
      remarks: ['']
    });

    this.reviewForm.get('status')!.valueChanges.subscribe(status => {
      if (status && status !== 'PENDING') {
        const currentRemarks = this.reviewForm.get('remarks')!.value;
        if (!currentRemarks || currentRemarks.trim() === '') {
          if (status === CandidateStatus.VERIFIED) {
            this.reviewForm.patchValue({ remarks: 'Verified by user' });
          } else if (status === CandidateStatus.REJECTED) {
            this.reviewForm.patchValue({ remarks: 'Rejected by user' });
          } else if (status === CandidateStatus.ON_HOLD) {
            this.reviewForm.patchValue({ remarks: 'Onhold by user' });
          }
        }
      }
    });

    const userRole = this.auth.getRole();
    const filteredStatuses = Object.values(CandidateStatus).filter(status => {
      if (userRole === 'approver' && status === CandidateStatus.ON_HOLD) {
        return false;
      }
      return true;
    });

    this.statusOptions = filteredStatuses.map(status => ({
      label: CandidateStatusLabel[status],
      value: status
    }));
  }

  ngOnChanges(){
    if(this.applicationNo) {
      this.loadCandidate();
    }
  }
  loadCandidate() {
    this.service.getCandidateDetails(this.applicationNo!).subscribe(details => {
      this.candidateDetails = details;
    });

    const candidateObj = this.candidates.find(c => c.application_no === this.applicationNo) as any;
    let currentStatus = candidateObj?.verifier_status;
    if (!currentStatus || currentStatus.trim() === '') {
      currentStatus = 'PENDING';
    } else {
      currentStatus = currentStatus.trim().toUpperCase();
    }
    let currentRemarks = candidateObj?.verifier_remarks || '';

    if (currentStatus !== 'PENDING' && currentRemarks.trim() === '') {
      if (currentStatus === 'VERIFIED') {
        currentRemarks = 'Verified by user';
      } else if (currentStatus === 'REJECTED') {
        currentRemarks = 'Rejected by user';
      } else if (currentStatus === 'ON_HOLD') {
        currentRemarks = 'Onhold by user';
      }
    }

    this.reviewForm.reset({
      status: currentStatus,
      remarks: currentRemarks
    }, { emitEvent: false });

    const normalizedStatus = String(currentStatus || '').toUpperCase();
    const isCompleted = 
      normalizedStatus === 'VERIFIED' || 
      normalizedStatus === 'REJECTED' || 
      normalizedStatus === 'ON_HOLD';

    if (isCompleted) {
      this.reviewForm.disable();
    } else {
      this.reviewForm.enable();
    }

    this.selectedDocument = null;
    this.zoom = 1;
  }
  // ------------------------------------------//
  // -----------Navigation methods-----------//
  // ------------------------------------------//
  hasPreviousPending(): boolean {
    if (!this.candidates || this.currentIndex === -1) return false;
    for (let i = this.currentIndex - 1; i >= 0; i--) {
      const status = String(this.candidates[i]?.verifier_status || '').toUpperCase();
      if (status === 'PENDING') {
        return true;
      }
    }
    return false;
  }

  hasNextPending(): boolean {
    if (!this.candidates || this.currentIndex === -1) return false;
    for (let i = this.currentIndex + 1; i < this.candidates.length; i++) {
      const status = String(this.candidates[i]?.verifier_status || '').toUpperCase();
      if (status === 'PENDING') {
        return true;
      }
    }
    return false;
  }

  nextCandidate() {
    if (!this.candidates || this.currentIndex === -1) return;
    for (let i = this.currentIndex + 1; i < this.candidates.length; i++) {
      const status = String(this.candidates[i]?.verifier_status || '').toUpperCase();
      if (status === 'PENDING') {
        this.navigate.emit(i);
        break;
      }
    }
  }

  previousCandidate() {
    if (!this.candidates || this.currentIndex === -1) return;
    for (let i = this.currentIndex - 1; i >= 0; i--) {
      const status = String(this.candidates[i]?.verifier_status || '').toUpperCase();
      if (status === 'PENDING') {
        this.navigate.emit(i);
        break;
      }
    }
  }

  selectDocument(url: string) {
    this.selectedDocument = url;
    this.zoom = 1;
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
  submitReview() {
    if(this.reviewForm.invalid || this.reviewForm.disabled || !this.applicationNo) 
      return;
      
    const status = this.reviewForm.value.status;
    let remarks = this.reviewForm.value.remarks || '';
    if (!remarks || remarks.trim() === '') {
      if (status === CandidateStatus.VERIFIED) {
        remarks = 'Verified by user';
      } else if (status === CandidateStatus.REJECTED) {
        remarks = 'Rejected by user';
      } else if (status === CandidateStatus.ON_HOLD) {
        remarks = 'Onhold by user';
      }
    }
    
    const candidateObj = this.candidates.find(c => c.application_no === this.applicationNo);
    const jobId = candidateObj?.id;
    
    this.service.submitReview(this.applicationNo, status, remarks, jobId).subscribe({
      next: (res) => {
        this.mS.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Review submitted successfully'
        });
        
        // Disable the form locally upon successful submit
        this.reviewForm.disable();

        // Emit event to notify parent to refresh list
        this.reviewSubmitted.emit({
          applicationNo: this.applicationNo!,
          status: status,
          remarks: remarks
        });
      },
      error: (err) => {
        this.mS.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.detail || 'Failed to submit review'
        });
      }
    });
  }


}

