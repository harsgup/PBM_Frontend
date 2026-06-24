import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminGuard } from './guards/admin.guard';
import { LoginComponent } from './auth/login/login.component';
import { AuthGuard } from './guards/auth.guard';
import {DashboardLayoutComponent} from './layout/dashboard-layout/dashboard-layout.component'
import {ReportComponent} from './reports/report/report.component'
import { AdministrativeScreeningReportComponent } from './reports/administrative-screening-report/administrative-screening-report.component';
import { UsersComponent } from './layout/users/users.component';
import { AddUserComponent } from './layout/add-user/add-user.component';
import { AssignJobComponent } from './layout/assign-jobs/assign-jobs.component';
import { UnauthorizedComponent } from './layout/unauthorized/unauthorized.component';
import { UserDashboardComponent } from './pages/screening/user-dashboard/user-dashboard.component';
import { AssignedJobComponent } from './layout/assigned-job/assigned-job.component';
import { BuildJobComponent } from './layout/build-job/build-job.component';
import { TechnicalCommitteeComponent } from './layout/technical-committee/technical-committee.component';
import { BoardFormationComponent } from './layout/board-formation/board-formation.component';
import { TechnicalScreeningComponent } from './layout/technical/technical-screening/technical-screening.component';
import { ShortingForInterviewComponent } from './layout/shorting-for-interview/shorting-for-interview.component';
import { DashboardRedirectComponent } from './layout/dashboard-redirect/dashboard-redirect.component';
import { AdminDashboardComponent } from './layout/admin-dashboard/admin-dashboard.component';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'unauthorized', component:UnauthorizedComponent},
  { path: 'dashboard',component: DashboardLayoutComponent,canActivate:[AuthGuard],
 
  children: [
    { path: '', component: DashboardRedirectComponent },
    { path: 'admin/dashboard', component: AdminDashboardComponent, canActivate: [AdminGuard] },
    { path: 'admin/users', component: UsersComponent,canActivate:[AdminGuard] },
    { path: 'admin/users/add', component: AddUserComponent,canActivate:[AdminGuard] },
    { path: 'admin/assign-jobs', component: AssignJobComponent,canActivate:[AdminGuard] },
    { path: 'admin/assigned-jobs', component: AssignedJobComponent,canActivate:[AdminGuard] },
    { path: 'admin/build-jobs', component: BuildJobComponent,canActivate:[AdminGuard] },
    { path: 'admin/technical-committee', component: TechnicalCommitteeComponent,canActivate:[AdminGuard] },
    { path: 'admin/board-formation', component: BoardFormationComponent, canActivate: [AdminGuard] },
    { path: 'screening/technical', component: TechnicalScreeningComponent,canActivate:[AuthGuard] },
    { path: 'screening/shortlisting', component:ShortingForInterviewComponent,canActivate:[AuthGuard]},

    { path: 'screening', loadChildren:() => 
      import("./pages/screening/user-dashboard/user-dashboard.routes")
      .then(m=>m.UserDashboardRoutes)
     },
     
    

    { path: 'reports', component: ReportComponent, canActivate: [AdminGuard] },
    { path: 'reports/administrative-screening', component: AdministrativeScreeningReportComponent, canActivate: [AuthGuard] }
  ]
},
  { path: 'user_dashboard', component: UserDashboardComponent},
//   {
//   path: 'dashboard',
//   loadComponent: () => import('./dashboard/dashboard.component')
//     .then(c => c.DashboardComponent),
//   canActivate: [AuthGuard]
// }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
