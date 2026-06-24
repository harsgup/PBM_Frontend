import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AdminService } from '../../services/admin.service';
import { InterviewService, InterviewMember, InterviewCommittee } from '../../services/interview.service';

@Component({
  standalone: true,
  selector: 'app-board-formation',
  templateUrl: './board-formation.component.html',
  styleUrls: ['./board-formation.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    DropdownModule,
    TableModule,
    DialogModule,
    InputTextModule,
    ButtonModule,
    ToastModule
  ],
  providers: [MessageService]
})
export class BoardFormationComponent implements OnInit {
  selectionForm!: FormGroup;
  chairpersonForm!: FormGroup;
  memberForm!: FormGroup;

  cycles: any[] = [];
  posts: any[] = [];

  chairperson: InterviewMember | null = null;
  membersList: InterviewMember[] = [];

  // Dialog visibilities
  showChairpersonDialog = false;
  showMemberDialog = false;

  // Editing state for members
  editingMemberIndex: number | null = null;

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private adminService: AdminService,
    private interviewService: InterviewService
  ) {
    this.selectionForm = this.fb.group({
      cycle: ['', Validators.required],
      post_name: ['', Validators.required]
    });

    this.chairpersonForm = this.fb.group({
      name: ['', Validators.required],
      designation: ['', Validators.required],
      lab_estt: ['', Validators.required],
      member_type: [{ value: 'Chairperson', disabled: true }]
    });

    this.memberForm = this.fb.group({
      member_type: ['', Validators.required],
      name: ['', Validators.required],
      designation: ['', Validators.required],
      lab_estt: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.loadCycles();

    // Reset post and load posts when cycle changes
    this.selectionForm.get('cycle')!.valueChanges.subscribe(cycle => {
      this.selectionForm.patchValue({ post_name: '' }, { emitEvent: false });
      this.posts = [];
      this.clearBoardData();

      if (cycle) {
        this.adminService.getPosts(cycle).subscribe({
          next: (res) => {
            this.posts = res.map(p => ({ label: p, value: p }));
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to load posts.'
            });
          }
        });
      }
    });

    // Load existing board details when cycle and post_name are selected
    this.selectionForm.valueChanges.subscribe(values => {
      const { cycle, post_name } = values;
      if (cycle && post_name) {
        this.loadBoard(cycle, post_name);
      } else {
        this.clearBoardData();
      }
    });
  }

  loadCycles() {
    this.adminService.getCycles().subscribe({
      next: (res) => {
        this.cycles = res.map(c => ({ label: c, value: c }));
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load cycles.'
        });
      }
    });
  }

  clearBoardData() {
    this.chairperson = null;
    this.membersList = [];
  }

  loadBoard(cycle: string, postName: string) {
    this.interviewService.getInterviewCommittee(cycle, postName).subscribe({
      next: (committee) => {
        this.clearBoardData();
        if (committee && committee.members) {
          // Separate chairperson and other members
          const chair = committee.members.find(m => m.member_type.toLowerCase() === 'chairperson');
          if (chair) {
            this.chairperson = chair;
          }
          this.membersList = committee.members.filter(m => m.member_type.toLowerCase() !== 'chairperson');
        }
      },
      error: (err) => {
        // If 404, it means no board formation exists yet, which is normal.
        this.clearBoardData();
        if (err.status !== 404) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load existing board details.'
          });
        }
      }
    });
  }

  // --- Chairperson Logic ---
  openChairpersonForm() {
    if (this.chairperson) {
      this.chairpersonForm.patchValue({
        name: this.chairperson.name,
        designation: this.chairperson.designation,
        lab_estt: this.chairperson.lab_estt
      });
    } else {
      this.chairpersonForm.reset({ member_type: 'Chairperson' });
    }
    this.showChairpersonDialog = true;
  }

  saveChairperson() {
    if (this.chairpersonForm.invalid) return;

    const val = this.chairpersonForm.getRawValue();
    this.chairperson = {
      member_type: 'Chairperson',
      name: val.name,
      designation: val.designation,
      lab_estt: val.lab_estt
    };

    this.showChairpersonDialog = false;
    this.messageService.add({
      severity: 'info',
      summary: 'Success',
      detail: 'Chairperson details entered successfully.'
    });
  }

  // --- Member Logic ---
  openMemberForm() {
    this.editingMemberIndex = null;
    this.memberForm.reset();
    this.showMemberDialog = true;
  }

  editMember(index: number) {
    this.editingMemberIndex = index;
    const m = this.membersList[index];
    this.memberForm.patchValue({
      member_type: m.member_type,
      name: m.name,
      designation: m.designation,
      lab_estt: m.lab_estt
    });
    this.showMemberDialog = true;
  }

  saveMember() {
    if (this.memberForm.invalid) return;

    const val = this.memberForm.value;
    const member: InterviewMember = {
      member_type: val.member_type,
      name: val.name,
      designation: val.designation,
      lab_estt: val.lab_estt
    };

    if (this.editingMemberIndex !== null) {
      this.membersList[this.editingMemberIndex] = member;
      this.messageService.add({
        severity: 'info',
        summary: 'Updated',
        detail: 'Member details updated.'
      });
    } else {
      this.membersList.push(member);
      this.messageService.add({
        severity: 'info',
        summary: 'Added',
        detail: 'Member added to committee.'
      });
    }

    this.showMemberDialog = false;
  }

  deleteMember(index: number) {
    this.membersList.splice(index, 1);
    this.messageService.add({
      severity: 'warn',
      summary: 'Removed',
      detail: 'Member removed from committee.'
    });
  }

  // --- Save Entire Board ---
  get totalMembersCount(): number {
    return (this.chairperson ? 1 : 0) + this.membersList.length;
  }

  isBoardValid(): boolean {
    return (
      this.selectionForm.valid &&
      this.chairperson !== null &&
      this.totalMembersCount >= 3
    );
  }

  saveBoard() {
    if (!this.isBoardValid()) return;

    const { cycle, post_name } = this.selectionForm.value;
    const allMembers: InterviewMember[] = [];

    if (this.chairperson) {
      allMembers.push(this.chairperson);
    }
    allMembers.push(...this.membersList);

    const payload: InterviewCommittee = {
      cycle,
      post_name,
      members: allMembers
    };

    this.interviewService.saveInterviewCommittee(payload).subscribe({
      next: (res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Board Saved',
          detail: 'Interview Committee saved successfully!'
        });
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.detail || 'Failed to save Interview Committee.'
        });
      }
    });
  }
}
