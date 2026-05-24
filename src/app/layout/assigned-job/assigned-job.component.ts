import { Component } from '@angular/core';
import { AdminService } from '../../services/admin.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PdfService } from '../../services/pdf.service';
@Component({
  standalone: true,
  selector: 'app-assigned-job',
  templateUrl: './assigned-job.component.html',
  styleUrl: './assigned-job.component.css',
  imports: [
    ButtonModule,
    ToastModule,
    ConfirmDialogModule,
    TableModule,
    CardModule
],
    providers: [MessageService,ConfirmationService]
})
export class AssignedJobComponent {

  constructor(
    private adminService:AdminService,
    private mS: MessageService,
    private cS:ConfirmationService,
    private pdfService: PdfService){}

jobs: any[] = [];
loading = false;

ngOnInit() {
  this.loadJobs();
}

loadJobs() {
  this.loading = true;
  this.adminService.getAssignedJobs().subscribe(res => {
    this.jobs = res;
    this.loading = false;
  });
}

confirmReset(job: any) {
  this.cS.confirm({
    header: 'Reset Job',
    message: `Reset job ${job.application_no}?`,
    icon: 'pi pi-exclamation-triangle',
    accept: () => this.reset(job.id)
  });
}

reset(id: number) {
  this.adminService.resetJob(id).subscribe(() => {
    this.mS.add({
      severity: 'success',
      summary: 'Reset',
      detail: 'Job reset successfully'
    });
    this.loadJobs();
  });
}

generatePdf() {

  const columns = ['Cycle', 'Post', 'Application No', 'Status'];

  const rows = this.jobs.map(j => [
    j.cycle,
    j.post_name,
    j.application_no,
    j.status
  ]);

  this.pdfService.generatePdf(
    'Assigned Jobs Report',
    columns,
    rows,
    'assigned_jobs'
  );
}

}
