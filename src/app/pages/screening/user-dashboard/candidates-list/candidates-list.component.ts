import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table'
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { AccordionModule } from 'primeng/accordion';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'
import { ActivatedRoute } from '@angular/router';

import { CandidateReviewComponent } from '../candidate-review/candidate-review.component';

import { Candidate } from '../../../../core/models/candidate.model';
import { CandidateStatus, CandidateStatusLabel } from '../../../../core/models/candidate-status.enum';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { CandidateDetailService } from '../../../../core/services/candidate.service';

import { CandidateDetails } from '../../../../core/models/candidate-details.model';
import { AuthService } from '../../../../services/auth.service';


@Component({
  selector: 'app-candidates-list',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, StatusBadgeComponent, DropdownModule, FormsModule, DialogModule, AccordionModule, CandidateReviewComponent],
  templateUrl: './candidates-list.component.html',
  styleUrl: './candidates-list.component.css'
})
export class CandidatesListComponent implements OnInit {
  candidates: Candidate[] = [];
  loading = false;
  filteredCandidates: Candidate[] = [];
  verifiedCandidtate: Candidate[] = [];
  candidateDetails!: CandidateDetails;

  selectedStatus: CandidateStatus | null = null;

  // Query parameters state
  cycle = '';
  postName = '';
  userId = 0;
  userRole = '';

  // Dialog State Variables
  reviewDialogVisible = false;
  selectedCandidateIndex: number = -1;
  selectedCandidateApplicationNo: string | null = null;


  statusOptions: any[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private candidateService: CandidateDetailService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.cycle = params['cycle'] || '';
      this.postName = params['post_name'] || '';
      this.userId = Number(params['user_id']) || 0;
      console.log("Query params received:", { cycle: this.cycle, postName: this.postName, userId: this.userId });

      if (this.cycle && this.postName && this.userId) {
        this.fetchCandidates(this.cycle, this.postName, this.userId);
      }
    });

    this.userRole = this.authService.getRole() || '';
    const filteredStatuses = Object.values(CandidateStatus).filter(status => {
      if (this.userRole === 'approver' && status === CandidateStatus.ON_HOLD) {
        return false;
      }
      return true;
    });

    this.statusOptions = [
      { label: 'All', value: null },
      ...filteredStatuses.map((status): { label: string; value: CandidateStatus } => ({
        label: CandidateStatusLabel[status],
        value: status
      }))
    ];

    this.candidates = [];
    this.filteredCandidates = [...this.candidates];
  }

  onReviewSubmitted(event: any) {
    if (!event) return;
    const candidate = this.candidates.find(c => c.application_no === event.applicationNo);
    if (candidate) {
      candidate.verifier_status = event.status;
      candidate.verifier_remarks = event.remarks;
    }
    const filteredCand = this.filteredCandidates.find(c => c.application_no === event.applicationNo);
    if (filteredCand) {
      filteredCand.verifier_status = event.status;
      filteredCand.verifier_remarks = event.remarks;
    }
  }

  onReviewDialogClosed() {
    this.reviewDialogVisible = false;
    if (this.cycle && this.postName && this.userId) {
      this.fetchCandidates(this.cycle, this.postName, this.userId);
    }
  }

  fetchCandidates(cycle: string, postName: string, userId: number): void {
    this.loading = true;
    this.candidateService.getCandidates(cycle, postName, userId)
      .subscribe({
        next: (res) => {
          this.candidates = res.map((c: any) => {
            let status = c.verifier_status;
            if (!status || status.trim() === '') {
              status = 'PENDING';
            } else {
              status = status.trim().toUpperCase();
            }
            return {
              ...c,
              verifier_status: status
            };
          });
          this.filteredCandidates = [...this.candidates];
          this.onStatusChange(); // Re-apply the active filter
          console.log("Candidates fetched successfully:", this.filteredCandidates);
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }
  onStatusChange() {
    if (!this.selectedStatus) {
      this.filteredCandidates = [...this.candidates];
      return;
    }

    this.filteredCandidates = this.candidates.filter(
      c => c.verifier_status === this.selectedStatus
    );
  }

  // Dialog Methods
  openCandidateReview(candidateApplicationNo: string): void {
    this.selectedCandidateApplicationNo = candidateApplicationNo;
    this.selectedCandidateIndex = this.filteredCandidates.findIndex(
      c => c.application_no === candidateApplicationNo
    );
    this.reviewDialogVisible = true;
  }
  //   fetchCandidateDetails(applicationNo: string) {
  //   this.candidateService
  //     .getCandidateDetails(applicationNo)
  //     .subscribe({
  //       next: (data) => {
  //         this.candidateDetails = data;
  //         console.log(this.candidateDetails);
  //       },
  //       error: (err) => {
  //         console.error('Error fetching candidate details', err);
  //       }
  //     });
  // }
  // openDocument(url: string) {

  //   this.selectedDocument = url;

  // }

  // closeDocument() {

  //   this.selectedDocument = null;

  // }

  onCandidateNavigate(index: number) {
    this.selectedCandidateIndex = index;
    this.selectedCandidateApplicationNo = this.filteredCandidates[index].application_no;
  }
}


