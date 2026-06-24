import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { PanelMenuModule } from 'primeng/panelmenu';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  imports: [
    CommonModule,
    PanelMenuModule   
  ]
})
export class SidebarComponent implements OnInit {

  menuItems: MenuItem[] = [];
  role = '';

    constructor(
      private authService: AuthService
    ) {}

  ngOnInit() {
    this.buildMenu();
   
  }

  buildMenu() {
    this.role = this.authService.getRole()
    const isAdmin = this.role === 'admin';
    const isVerifier = this.role === 'verifier' || this.role === 'user';
    const isApprover = this.role === 'approver' || this.role === 'user';
    const isUser = this.role === 'user';

    // const isAdmin = true;
    // const isVerifier = true;
    // const isApprover = true;
    this.menuItems = [

      ...(isAdmin ? [{
        label: 'Dashboard',
        icon: 'pi pi-home',
        routerLink: 'admin/dashboard'
      }] : []),

      ...(isAdmin ? [{
        label: 'Admin',
        icon: 'pi pi-user',
        items: [
          { label: 'Add User', icon:'pi pi-user-plus', routerLink: 'admin/users/add' },
          { label: 'Users', icon: 'pi pi-user-edit', routerLink: 'admin/users' },
          { label: 'Build Jobs', icon:'pi pi-database', routerLink: 'admin/build-jobs' },
          { label: 'Assign Jobs', icon:'pi pi-clipboard', routerLink: 'admin/assign-jobs' },
          { label: 'Assigned Jobs', icon:'pi pi-file-check', routerLink: 'admin/assigned-jobs' },
          { label: 'Technical Committee', icon: 'pi pi-users', routerLink: 'admin/technical-committee'}
        ]
      }] : []),

      ...(isAdmin || isVerifier || isApprover ? [{
        label: 'Screening - Administrative',
        icon: 'pi pi-check-square',
        items: [
          { label: 'Pending Verification', routerLink: 'screening' }
        ]
      }] : []),

      ...(isAdmin || isVerifier || isApprover ? [{
        label: 'Screening - Technical',
        icon: 'pi pi-desktop',
        items: [
          { label: 'Technical Review', icon:'pi pi-lightbulb', routerLink: 'screening/technical' }
        ]
      }] : []),

      ...(isAdmin || isVerifier || isApprover ? [{
        label: 'Shortlisting',
        icon: 'pi pi-desktop',
        items: [
          { label: 'Shortlist-for-Interview', icon:'pi pi-lightbulb', routerLink: 'screening/shortlisting' }
        ]
      }] : []),

      ...(isAdmin ? [{
        label: 'Interview Section',
        icon: 'pi pi-comments',
        items: [
          { label: 'Board Formation', icon: 'pi pi-users', routerLink: 'admin/board-formation' },
          { label: 'Interview Boards', icon: 'pi pi-table', routerLink: 'admin/interview-boards' },
          { label: 'Form and Formats', icon: 'pi pi-file', routerLink: 'admin/form-formats' }
        ]
      }] : []),

      ...(isAdmin || isVerifier || isApprover ? [{
        label: 'Reports',
        icon: 'pi pi-chart-bar',
        items: [
          ...(isAdmin ? [{ label: 'Summary Reports', routerLink: 'reports' }] : []),
          ...(isVerifier || isApprover ? [{ label: 'Administrative Screening Report', routerLink: 'reports/administrative-screening' }] : [])
        ]
      }] : [])
    ];
  }
}
