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
    const currentRemarks = candidateObj?.verifier_remarks;

    this.reviewForm.reset({
      status: currentStatus,
      remarks: currentRemarks || ''
    });

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
  }
  // ------------------------------------------//
  // -----------Navigation methods-----------//
  // ------------------------------------------//
  nextCandidate() {
    if (this.currentIndex < this.candidates.length -1){
      this.navigate.emit(this.currentIndex + 1);
    }
  }
  previousCandidate() {
    if (this.currentIndex > 0){
      this.navigate.emit(this.currentIndex -1);
    }
  }

  selectDocument(url: string) {
    this.selectedDocument = url;
  }
  submitReview() {
    if(this.reviewForm.invalid || this.reviewForm.disabled || !this.applicationNo) 
      return;
      
    const status = this.reviewForm.value.status;
    const remarks = this.reviewForm.value.remarks || '';
    
    this.service.submitReview(this.applicationNo, status, remarks).subscribe({
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

