import { Component } from '@angular/core';
import {TopbarComponent} from '../topbar/topbar.component'
import {SidebarComponent} from '../sidebar/sidebar.component'
import { RouterOutlet } from '@angular/router';


@Component({
  standalone: true,
  imports: [TopbarComponent,SidebarComponent,RouterOutlet],
  selector: 'app-dashboard-layout',
  templateUrl: './dashboard-layout.component.html',
  styleUrl: './dashboard-layout.component.css'
})
export class DashboardLayoutComponent {

}
