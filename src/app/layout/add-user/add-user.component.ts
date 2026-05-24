import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  FormGroup
} from '@angular/forms';

import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { UserService } from '../../services/user.service';

@Component({
  standalone: true,
  selector: 'app-add-user',
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    DropdownModule,
    ToastModule
  ],
  providers: [MessageService]
})
export class AddUserComponent {

  addUserForm!: FormGroup;
  loading = false;

  
  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private mS: MessageService
  ) {
    this.addUserForm = this.fb.nonNullable.group({
    pis: ['', Validators.required],
    name: ['', Validators.required],
    rank: ['', Validators.required],
    role: ['user', Validators.required],
    password: ['', [
      Validators.required,
      Validators.minLength(6)
    ]]
  });
  }


  roles = [
    { label: 'User', value: 'user' },
    { label: 'Verifier', value: 'verifier' },
    { label: 'Approver', value: 'approver' }
  ];


  submit() {
    if (this.addUserForm.invalid) return;

    this.loading = true;

    this.userService.addUser(this.addUserForm.getRawValue()).subscribe({ 
      next: () => {
        this.mS.add({
        severity: 'success',
        summary: 'Success',
        detail: 'User Added successfully'
      });
        this.addUserForm.reset({ role: 'user' });
        this.loading = false;
      },
      error: (err) => {
        this.mS.add({
        severity: 'error',
        summary: 'Error',
        detail: err.error.detail
      });
        this.loading = false;
      }
    });
  }
}
