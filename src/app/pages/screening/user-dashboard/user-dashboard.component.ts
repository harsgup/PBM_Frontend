import { Component } from '@angular/core';
import { CandidatesListComponent } from './candidates-list/candidates-list.component';
import { RouterOutlet } from '@angular/router';

@Component({
  standalone: true,
  imports: [ CandidatesListComponent, RouterOutlet],
  selector: 'app-user-dashboard',
  templateUrl: './user-dashboard.component.html',
  styleUrl: './user-dashboard.component.css'
})
export class UserDashboardComponent {
  user: string = "PBM"

}
