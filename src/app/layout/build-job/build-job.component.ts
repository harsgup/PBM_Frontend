import { Component } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { AdminService } from '../../services/admin.service';

@Component({
  standalone: true,
  selector: 'app-build-job',
  templateUrl: './build-job.component.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    ToastModule
  ],
  providers: [MessageService]
})
export class BuildJobComponent {

  loading = false;
  form!: FormGroup;
  

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private mS: MessageService
  ) {
    this.form = this.fb.group({
    cycle: ['', Validators.required]
  });
  }

  submit() {
    if (this.form.invalid) return;

    const cycle = this.form.value.cycle!;

    this.loading = true;

    this.adminService.buildJobs(cycle).subscribe({
      next: (res) => {
        this.loading = false;

        this.mS.add({
          severity: 'success',
          summary: 'Build Complete',
          detail: `${res.inserted} jobs created for cycle ${res.cycle}`
        });

        this.form.reset();
      },
      error: (err) => {
        this.loading = false;

        this.mS.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.detail || 'Build failed'
        });
      }
    });
  }
}
