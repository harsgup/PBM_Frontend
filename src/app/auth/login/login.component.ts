import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    ToastModule
  ],
  providers: [MessageService]
})
export class LoginComponent {

  loginForm = new FormGroup({
    pis: new FormControl('', Validators.required),
    password:  new FormControl('', Validators.required)
  });

  constructor(
    private authService: AuthService,
    private router :Router,
    private mS : MessageService
  ) {}

  onSubmit() {
if (this.loginForm.invalid) return;
  const pis = this.loginForm.value.pis!;
  const pass = this.loginForm.value.password!;
  this.authService.login(pis,pass).subscribe({
    next: (res) => {
      console.log('Login successful', res);
      localStorage.setItem('access_token', res.access_token);
      localStorage.setItem
      this.router.navigate(['/dashboard']);
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
