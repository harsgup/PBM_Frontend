import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { AdminService } from '../../services/admin.service';

import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    DropdownModule,
    TableModule,
    CardModule,
    ButtonModule,
    RouterLink
  ]
})
export class AdminDashboardComponent implements OnInit {
  loading = false;
  
  // Filter state
  selectedCycle: string | null = null;
  selectedPost: string | null = null;
  
  cycles: { label: string; value: string }[] = [];
  posts: { label: string; value: string }[] = [];
  
  // Stats data
  overview = {
    total_candidates: 0,
    v1_assigned: 0,
    v1_completed: 0,
    v2_assigned: 0,
    v2_completed: 0,
    approver_assigned: 0,
    approver_completed: 0
  };
  
  userStats: any[] = [];
  
  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadCycles();
    this.fetchStats();
  }

  loadCycles(): void {
    this.adminService.getCycles().subscribe({
      next: (data) => {
        this.cycles = data.map(c => ({ label: c, value: c }));
      },
      error: (err) => console.error('Failed to load cycles', err)
    });
  }

  onCycleChange(): void {
    this.selectedPost = null;
    this.posts = [];
    if (this.selectedCycle) {
      this.adminService.getPosts(this.selectedCycle).subscribe({
        next: (data) => {
          this.posts = data.map(p => ({ label: p, value: p }));
        },
        error: (err) => console.error('Failed to load posts', err)
      });
    }
    this.fetchStats();
  }

  onPostChange(): void {
    this.fetchStats();
  }

  clearFilters(): void {
    this.selectedCycle = null;
    this.selectedPost = null;
    this.posts = [];
    this.fetchStats();
  }

  fetchStats(): void {
    this.loading = true;
    this.adminService.getDashboardStats(
      this.selectedCycle || undefined,
      this.selectedPost || undefined
    ).subscribe({
      next: (res) => {
        this.overview = res.overview;
        this.userStats = res.user_stats;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to fetch dashboard stats', err);
        this.loading = false;
      }
    });
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }
}
