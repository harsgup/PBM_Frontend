import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PdfService } from '../../services/pdf.service';
import { DropdownModule } from 'primeng/dropdown';
@Component({
  standalone: true,
  selector: 'app-technical-committee',
  templateUrl: './technical-committee.component.html',
  styleUrls: ['./technical-committee.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    ButtonModule,
    ToastModule,
    TableModule,
    ConfirmDialogModule,
    DropdownModule
  ],
  providers: [MessageService,ConfirmationService]
})
export class TechnicalCommitteeComponent {

  committeeForm!: FormGroup;
  showForm = false;

  committees: any[] = [];
  loading = true;
  editingId: number | null = null;
  cycles: any[] = [];
  posts: any[] = [];

  constructor(
    private fb: FormBuilder,
    private mS: MessageService,
    private adminService: AdminService,
    private cS :ConfirmationService,
    private pdfService: PdfService,

  ) {
    this.committeeForm = this.fb.group({
    committee_name: ['', Validators.required],
    lab_rep: ['', Validators.required],
    external_member: ['', Validators.required],
    subject_expert: ['', Validators.required],
    chairman: ['', Validators.required],
    cycle: ['', Validators.required],
    post: ['', Validators.required],
  });
  }

  cancelForm() {
  this.showForm = false;
  this.committeeForm.reset();
}

ngOnInit() {
  this.loadCommittees();
  this.loadCycles();

    this.committeeForm.get('cycle')!.valueChanges.subscribe(cycle => {
    this.committeeForm.patchValue({ post: '' });
    this.posts = [];

    if (cycle) {
      this.adminService.getPosts(cycle).subscribe(res => {
        this.posts = res.map(p => ({ label: p, value: p }));
      });
    }
  });

   this.committeeForm.get('post')!.valueChanges.subscribe(() => {
    console.log(this.committeeForm.getRawValue().post)
  });
}

openForm() {
  this.showForm = true;
}

 loadCycles() {
    this.adminService.getCycles().subscribe(res => {
      this.cycles = res.map(c => ({ label: c, value: c }));
    });
  }

loadCommittees() {
  this.loading = true;

  this.adminService.getCommittees().subscribe(res => {
    this.committees = res;
    this.loading = false;
  });
}

editCommittee(c: any) {

  this.showForm = true;

  this.editingId = c.id;

  this.committeeForm.patchValue({
    committee_name: c.committee_name,
    lab_rep: c.lab_rep,
    external_member: c.external_member,
    subject_expert: c.subject_expert,
    chairman: c.chairman,
    cycle: c.cycle,
    post: c.post
  });

}

 submit() {
   if (this.committeeForm.invalid) return;
   
   const payload = this.committeeForm.value;
   console.log(payload)

  if (this.editingId) {

    this.adminService.updateCommittee(this.editingId, payload)
      .subscribe(() => {

        this.mS.add({
          severity: 'success',
          summary: 'Updated',
          detail: 'Committee updated successfully'
        });

        this.afterSave();

      });

  } else {

    this.adminService.createTechnicalCommittee(payload)
      .subscribe(() => {

        this.mS.add({
          severity: 'success',
          summary: 'Created',
          detail: 'Committee created successfully'
        });

        this.afterSave();

      });

  }

}

confirmDelete(c: any) {

  this.cS.confirm({

    message: `Delete committee "${c.committee_name}"?`,
    header: 'Confirm Delete',
    icon: 'pi pi-exclamation-triangle',

    accept: () => {
      this.deleteCommittee(c.id);
    }

  });

}

deleteCommittee(id: number) {

  this.adminService.deleteCommittee(id).subscribe(() => {

    this.mS.add({
      severity: 'success',
      summary: 'Deleted',
      detail: 'Committee deleted successfully'
    });

    this.loadCommittees();

  });

}

afterSave() {

  this.showForm = false;
  this.committeeForm.reset();
  this.editingId = null;

  this.loadCommittees();
}

exportPdf() {

  const columns = [
    'Recruitment Cycle',
    'Post Name',
    'Committee Name',
    'Chairman',
    'Lab Rep',
    'External Member',
    'Subject Expert'
  ];

  const rows = this.committees.map(c => [
    c.cycle,
    c.post,
    c.committee_name,
    c.chairman,
    c.lab_rep,
    c.external_member,
    c.subject_expert    
  ]);

  this.pdfService.generatePdf('Technical Committees',columns,rows,'technical_committees');

}

}