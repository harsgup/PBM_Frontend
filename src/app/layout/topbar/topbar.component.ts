import { Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
@Component({
  standalone: true,
  imports : [ButtonModule, CommonModule],
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css'
})

export class TopbarComponent {

  userName = '';
  sessionTime = '00:00';
  showExtendPrompt = false;
  private intervalId: any;

  constructor(private authService: AuthService) {}


   ngOnInit() {
    const decoded = this.authService.decodeToken();
    this.userName = decoded?.name || 'User';

    const expiry = this.authService.getTokenExpiry();
    if (!expiry) return;

    this.startTimer(expiry);
  }

   startTimer(expiryTime: number) {
    const maxExpiry = Date.now() + 119 * 60 * 1000;
    const targetTime = Math.min(expiryTime, maxExpiry);

    this.intervalId = setInterval(() => {
      const now = Date.now();
      const diff = targetTime - now;

      if (diff <= 0) {
        this.sessionTime = '00:00';
        this.showExtendPrompt = false;
        this.logout();
        return;
      }

      if (diff <= 120000 && !this.showExtendPrompt) {
        this.showExtendPrompt = true;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      this.sessionTime =
        `${this.pad(minutes)}:${this.pad(seconds)}`;
    }, 1000);
  }

   pad(value: number): string {
    return value < 10 ? '0' + value : value.toString();
  }

  logout() {
    clearInterval(this.intervalId);
    this.authService.logout();
  }

  extendSession() {
    this.authService.refreshToken().subscribe({
      next: (res) => {
        localStorage.setItem('access_token', res.access_token);
        this.showExtendPrompt = false;
        clearInterval(this.intervalId);
        const newExpiry = this.authService.getTokenExpiry();
        if (newExpiry) {
          this.startTimer(newExpiry);
        }
      },
      error: (err) => {
        console.error('Failed to extend session', err);
        this.logout();
      }
    });
  }

  ngOnDestroy() {
    clearInterval(this.intervalId);
  }

}