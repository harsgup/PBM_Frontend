import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormArray,FormBuilder,FormGroup,ReactiveFormsModule,Validators} from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { User } from '../../services/user.service';
import { UserService } from '../../services/user.service';
import { FormsModule } from '@angular/forms';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';



@Component({
  standalone: true,
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    DropdownModule,
    ButtonModule,
    CardModule,
    FormsModule,
    ConfirmDialogModule,
    ToastModule
  ],
  providers: [ConfirmationService,MessageService]
})
export class UsersComponent implements OnInit {

  form!: FormGroup;
  users: User[] = [];
  loading = false;

  roles = [
    { label: 'Admin', value: 'admin' },
    { label: 'User', value: 'user'},
    { label: 'Verifier', value: 'verifier' },
    { label: 'Approver', value: 'approver' }
  ];

  constructor(
    private fb: FormBuilder,
    private userService:UserService,
    private cS: ConfirmationService,
    private mS: MessageService
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      users: this.fb.array([])
    });

    this.loadUsers();
  }


loadUsers() {
    this.loading = true;
    this.userService.getUsers().subscribe({
      next: res => {
        this.users = res;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  confirmSave(user: any) {
  this.cS.confirm({
    header: 'Confirm Role Change',
    message: `Are you sure you want to change role to "${user.role.toUpperCase()}"?`,
    icon: 'pi pi-exclamation-triangle',
    accept: () => {
      this.saveRole(user.id, user.role);
    }
  });
}

saveRole(userId: number, role: string) {
  this.userService.updateUserRole(userId, role).subscribe({
    next: () => {
      this.mS.add({
        severity: 'success',
        summary: 'Success',
        detail: 'User role updated successfully'
      });
    },
    error: () => {
      this.mS.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to update user role'
      });
    }
  });
}

confirmDelete(user: any) {
  this.cS.confirm({
    header: 'Delete User',
    message: `Are you sure you want to delete user "${user.name}"?`,
    icon: 'pi pi-exclamation-triangle',
    acceptButtonStyleClass: 'p-button-danger',
    accept: () => {
      this.deleteUser(user.id);
    }
  });
}

deleteUser(userId: number) {
  this.userService.deleteUser(userId).subscribe({
    next: () => {
      this.users = this.users.filter(u => u.id !== userId);

      this.mS.add({
        severity: 'success',
        summary: 'Deleted',
        detail: 'User deleted successfully'
      });
    },
    error: () => {
      this.mS.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to delete user'
      });
    }
  });
}

}

