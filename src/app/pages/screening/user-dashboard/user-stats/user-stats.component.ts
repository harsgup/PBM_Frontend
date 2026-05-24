import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import {
  FormBuilder,
  Validators,
  FormGroup
} from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { map, Observable } from 'rxjs';
import { Router } from '@angular/router';

import { CandidateDetailService } from '../../../../core/services/candidate.service';
import { AuthService } from '../../../../services/auth.service';

interface DropdownOption {
  label: string;
  value: string | number;
}

@Component({
  selector: 'app-user-stats',
  standalone: true,
  imports: [ CommonModule,
    CardModule,
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    DropdownModule,
    ToastModule],
  providers: [],
  templateUrl: './user-stats.component.html',
  styleUrl: './user-stats.component.css'
})
export class UserStatsComponent implements OnInit{

  setCyclePostForm!: FormGroup;
  loading = false;
  userName: string = "";

  cycle$!: Observable<DropdownOption[]>;
  post$!: Observable<DropdownOption[]>;

  constructor(
    private fb: FormBuilder,
    private cyclePostService: CandidateDetailService,
    private router: Router,
    private authService: AuthService
  ) {}
  
  ngOnInit(): void {
    const decoded = this.authService.decodeToken();
    this.userName = decoded?.sub || 'User';
    this.setCyclePostForm = this.fb.group(
      {
        cycle: [null, Validators.required],
        post: [null, Validators.required]
      }
    )

      this.cycle$ = this.cyclePostService.getCycles().pipe(map(
    cycles => cycles.map(cycle => (
      {
        label: cycle.name,
        value: cycle.name
      }
    )) 
  ))

  this.post$ = this.cyclePostService.getPost().pipe(map(
    posts => posts.map(post =>
    ({
      label: post.name,
      value: post.name
    })
    )))

  }

  get cycleControl(){
    return this.setCyclePostForm.controls['cycle'];
  }
  get postControl(){
    return this.setCyclePostForm.controls['post'];
  }

  submit(): void {
    if(this.setCyclePostForm.invalid) return;

    const {cycle, post} = this.setCyclePostForm.value;
    
   this.router.navigate(["dashboard/screening/candidates"], {
    queryParams:{
      cycle: cycle,
      post_name: post,
      user_id: this.userName
    }
   });
  }

}
