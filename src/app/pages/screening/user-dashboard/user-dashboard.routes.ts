import { Routes } from '@angular/router'

export const UserDashboardRoutes: Routes = [
    {
        path:'',
        loadComponent:() =>
            import('./user-dashboard.component').then(m=>m.UserDashboardComponent),
            children: [
                {
                    path:'',
                    redirectTo:'set_cycle_post',
                    pathMatch: 'full'
                },
                {
                    path:'set_cycle_post',
                    loadComponent:() =>
                        import('./user-stats/user-stats.component').then(m=>m.UserStatsComponent)
                },
                {
                    path:'candidates',
                    loadComponent:() =>
                        import('./candidates-list/candidates-list.component').then(m=>m.CandidatesListComponent)
                    
                },
                {
                    path:'candidate-review/:id',
                    loadComponent:() =>
                        import('./candidate-review/candidate-review.component').then(m=>m.CandidateReviewComponent)
                }
            ]
    }
];