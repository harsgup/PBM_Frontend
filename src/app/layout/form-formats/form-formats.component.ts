import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AdminService } from '../../services/admin.service';
import { InterviewService, ShortlistedCandidate } from '../../services/interview.service';
import { PdfService } from '../../services/pdf.service';

@Component({
  standalone: true,
  selector: 'app-form-formats',
  templateUrl: './form-formats.component.html',
  styleUrls: ['./form-formats.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    DropdownModule,
    ButtonModule,
    ToastModule
  ],
  providers: [MessageService]
})
export class FormFormatsComponent implements OnInit {
  selectionForm!: FormGroup;
  cycles: any[] = [];
  posts: any[] = [];
  loading = false;

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private adminService: AdminService,
    private interviewService: InterviewService,
    private pdfService: PdfService
  ) {
    this.selectionForm = this.fb.group({
      cycle: ['', Validators.required],
      post_name: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.loadCycles();

    // Reset post and load posts when cycle changes
    this.selectionForm.get('cycle')!.valueChanges.subscribe(cycle => {
      this.selectionForm.patchValue({ post_name: '' }, { emitEvent: false });
      this.posts = [];

      if (cycle) {
        this.adminService.getPosts(cycle).subscribe({
          next: (res) => {
            this.posts = res.map(p => ({ label: p, value: p }));
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to load posts.'
            });
          }
        });
      }
    });
  }

  loadCycles() {
    this.adminService.getCycles().subscribe({
      next: (res) => {
        this.cycles = res.map(c => ({ label: c, value: c }));
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load cycles.'
        });
      }
    });
  }

  generateAttendanceSheet() {
    if (this.selectionForm.invalid) return;

    this.loading = true;
    const { cycle, post_name } = this.selectionForm.value;

    this.interviewService.getShortlistedCandidates(cycle, post_name).subscribe({
      next: (candidates) => {
        this.loading = false;
        if (candidates.length === 0) {
          this.messageService.add({
            severity: 'warn',
            summary: 'No Candidates',
            detail: 'No shortlisted candidates found for the selected cycle and post.'
          });
          return;
        }

        this.buildAttendancePdf(cycle, post_name, candidates);
      },
      error: (err) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to fetch shortlisted candidates.'
        });
      }
    });
  }

  buildAttendancePdf(cycle: string, postName: string, candidates: ShortlistedCandidate[]) {
    // 1. Initialize Portrait document
    const doc = this.pdfService.createDocument('portrait');
    const dateStr = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY

    // 2. Draw Header block
    this.pdfService.drawHeader(
      doc,
      `CEPTAM Advt.: ${cycle}`,
      'INTERVIEW ATTENDANCE SHEET',
      '',
      'No. RD/PBM/02',
      'portrait'
    );

    // 3. Draw Sub-Header
    const fields = [
      { label: 'Post Name', value: '', width: 22 },
      { label: '', value: postName, width: 75 },
      { label: 'Cycle', value: '', width: 15 },
      { label: '', value: cycle, width: 35 },
      { label: 'Date', value: '', width: 12 },
      { label: '', value: '', width: 23 }
    ];
    this.pdfService.drawSubHeader(doc, fields, 'portrait');

    // 4. Draw Table
    const headers = [['SL. No.', 'Application No.', 'Candidate Name', "Father's Name", 'Category', 'Signature of Candidate']];
    const data = candidates.map((c, index) => [
      index + 1,
      c.application_no,
      c.candidate_name || '',
      c.father_name || '',
      c.category || '',
      '' // Blank for candidate signature
    ]);

    const columnStyles = {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 32, halign: 'center' },
      2: { cellWidth: 45 },
      3: { cellWidth: 45 },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 28 } // Signature column
    };

    this.pdfService.drawTable(doc, headers, data, 48, columnStyles);

    // 5. Draw Page Numbers
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      this.pdfService.drawPageNumber(doc, i, totalPages);
    }

    // 6. Draw Chairperson Signature space (no name) at the bottom of the last page
    doc.setPage(totalPages);
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    const pageHeight = doc.internal.pageSize.height;
    
    let drawY = finalY;
    if (finalY + 20 > pageHeight) {
      doc.addPage();
      drawY = 25;
    }

    const rightCenterX = 14 + 182 - 30; // 30mm from the right margin
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('(                             )', rightCenterX, drawY, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text('Chairperson', rightCenterX, drawY + 5, { align: 'center' });

    // 7. Save document
    const filename = `Attendance_Sheet_${cycle}_${postName}.pdf`.replace(/\s+/g, '_');
    doc.save(filename);

    this.messageService.add({
      severity: 'success',
      summary: 'PDF Generated',
      detail: 'Interview Attendance Sheet generated successfully.'
    });
  }
}
