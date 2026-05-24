import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CandidateStatus } from '../../../core/models/candidate-status.enum';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'status-badge',
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.css'
})
export class StatusBadgeComponent {

  @Input() status!: CandidateStatus;
  CandidateStatus = CandidateStatus;

  get statusClass(){
    return {
      'bg-green-100 text-green-700': this.status === CandidateStatus.VERIFIED,
      'bg-yellow-100 text-yellow-700': this.status === CandidateStatus.ON_HOLD,
      'bg-red-100 text-red-700': this.status === CandidateStatus.REJECTED,
      'bg-gray-100 text-gray-700': this.status === CandidateStatus.PENDING
    };
  }

  get statusLabel(): string{
    switch (this.status){
      case CandidateStatus.VERIFIED:
        return 'Verified';
      case CandidateStatus.ON_HOLD:
        return 'On Hold';
      case CandidateStatus.REJECTED:
        return 'Rejected';
      case CandidateStatus.PENDING:
        return 'Pending'
      default:
        return '-'
      
    }
  }
}
