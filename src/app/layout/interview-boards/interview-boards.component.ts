import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { InterviewService, InterviewCommittee, InterviewMember } from '../../services/interview.service';
import { PdfService } from '../../services/pdf.service';

@Component({
  standalone: true,
  selector: 'app-interview-boards',
  templateUrl: './interview-boards.component.html',
  styleUrls: ['./interview-boards.component.css'],
  imports: [
    CommonModule,
    CardModule,
    TableModule,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService]
})
export class InterviewBoardsComponent implements OnInit {
  committees: InterviewCommittee[] = [];
  loading = true;

  constructor(
    private interviewService: InterviewService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private pdfService: PdfService
  ) {}

  ngOnInit() {
    this.loadCommittees();
  }

  loadCommittees() {
    this.loading = true;
    this.interviewService.getInterviewCommittees().subscribe({
      next: (res) => {
        this.committees = res;
        this.loading = false;
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load interview boards.'
        });
        this.loading = false;
      }
    });
  }

  getChairperson(committee: InterviewCommittee): InterviewMember | null {
    if (!committee.members) return null;
    return committee.members.find(m => m.member_type.toLowerCase() === 'chairperson') || null;
  }

  getMemberCount(committee: InterviewCommittee): number {
    return committee.members ? committee.members.length : 0;
  }

  getAdditionalMembers(committee: InterviewCommittee): InterviewMember[] {
    if (!committee.members) return [];
    // Sort so Chairperson is at the top of the nested expansion table, followed by other members
    const chair = committee.members.filter(m => m.member_type.toLowerCase() === 'chairperson');
    const others = committee.members.filter(m => m.member_type.toLowerCase() !== 'chairperson');
    return [...chair, ...others];
  }

  confirmDelete(committee: InterviewCommittee) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete the Interview Board for Cycle: "${committee.cycle}" and Post: "${committee.post_name}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.deleteBoard(committee);
      }
    });
  }

  deleteBoard(committee: InterviewCommittee) {
    if (!committee.id) return;
    this.interviewService.deleteInterviewCommittee(committee.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Interview Board deleted successfully.'
        });
        this.loadCommittees();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.detail || 'Failed to delete Interview Board.'
        });
      }
    });
  }

  exportPdf() {
    if (this.committees.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'No interview boards to export.'
      });
      return;
    }

    const columns = [
      'Recruitment Cycle',
      'Post Name',
      'Chairperson Name',
      'Chairperson Lab/Estt',
      'Total Members'
    ];

    const rows = this.committees.map(c => {
      const chair = this.getChairperson(c);
      return [
        c.cycle,
        c.post_name,
        chair ? chair.name : 'N/A',
        chair ? chair.lab_estt : 'N/A',
        this.getMemberCount(c)
      ];
    });

    this.pdfService.generatePdf('Interview Committees Summary', columns, rows, 'interview_committees_summary');
  }
}
