import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  FormGroup
} from '@angular/forms';

import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ButtonModule } from 'primeng/button';
import { AdminService } from '../../services/admin.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

export interface AssignJobResponse {
  assigned: number;
  role: string;
  user_id: number;
}

@Component({
  standalone: true,
  selector: 'app-assign-job',
  templateUrl: './assign-jobs.component.html',
  styleUrls: ['./assign-jobs.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    DropdownModule,
    InputNumberModule,
    RadioButtonModule,
    ButtonModule,
    ToastModule
  ],
  providers: [MessageService]
})
export class AssignJobComponent {

  cycles: any[] = [];
  posts: any[] = [];
  users: any[] = [];

  assignForm!: FormGroup;

  userTypes = [
    { label: 'Verifier', value: 'verifier' },
    { label: 'Approver', value: 'approver' }
  ];

  verifierLevels = [
    { label: 'Verifier 1', value: 'V1' },
    { label: 'Verifier 2', value: 'V2' }
  ];

 summary = {
  total: 0,
  available_verifier1: 0,
  available_verifier2: 0,
  available_approver: 0
};

  constructor(private fb: FormBuilder,
    private adminService:AdminService,
   private mS: MessageService) {

    this.assignForm = this.fb.nonNullable.group({
    cycle: ['', Validators.required],
    post: ['', Validators.required],
    userType: ['', Validators.required],        
    user: ['', Validators.required],
    verifierLevel: [''],                        
    jobCount: [null as number | null, Validators.required],
    assignType: ['random', Validators.required] 
  });

  
    this.assignForm.get('userType')!.valueChanges.subscribe(role => {
    this.assignForm.patchValue({ user: '' });
    this.users = [];

    if (role) {
      this.adminService.getUsersByRole(role).subscribe(res => {
        this.users = res;
      });
    }
  });
  }

  ngOnInit(){
    this.loadSummary();
    this.loadCycles();

    this.assignForm.get('cycle')!.valueChanges.subscribe(cycle => {
    this.reloadSummary();
    this.assignForm.patchValue({ post: '' });
    this.posts = [];

    if (cycle) {
      this.adminService.getPosts(cycle).subscribe(res => {
        this.posts = res.map(p => ({ label: p, value: p }));
      });
    }
  });

   this.assignForm.get('post')!.valueChanges.subscribe(() => {
    console.log(this.assignForm.getRawValue().post)
    this.reloadSummary();
  });
  }


  loadCycles() {
    this.adminService.getCycles().subscribe(res => {
      this.cycles = res.map(c => ({ label: c, value: c }));
    });
  }

  loadSummary(cycle?: string, post?: string) {
  this.adminService.getJobSummary(cycle, post).subscribe(res => {
    this.summary = res;
  });
}

reloadSummary() {
  const cycle = this.assignForm.value.cycle;
  const post = this.assignForm.getRawValue().post;

  if (cycle && post) {
    this.loadSummary(cycle, post);
  } else {
    this.loadSummary();
  }
}

 submit() {
  if (this.assignForm.invalid) return;

  const formValue = this.assignForm.getRawValue();

  const payload: any = {
    cycle: formValue.cycle,
    post_name: formValue.post,
    role: formValue.userType,
    user_id: formValue.user,
    count: formValue.jobCount,
    assign_type: formValue.assignType
  };

  // only for verifier
  if (formValue.userType === 'verifier') {
    payload.verifier_group = formValue.verifierLevel;
  }

  this.adminService.assignJobs(payload).subscribe({
    next: (res) => {
      this.mS.add({
        severity: 'success',
        summary: 'Success',
        detail: `${res.assigned} job(s) assigned successfully`
      });
      this.assignForm.reset();
    },
    error: (err) => {
      this.mS.add({
        severity: 'error',
        summary: 'Error',
        detail: err.error.detail
      });
    }
  });
}


}
