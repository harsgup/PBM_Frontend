import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: true,
  template: '',
  selector: 'app-dashboard-redirect'
})
export class DashboardRedirectComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const role = this.authService.getRole();
    if (role === 'admin') {
      this.router.navigate(['/dashboard/admin/dashboard']);
    } else {
      this.router.navigate(['/dashboard/screening']);
    }
  }
}
