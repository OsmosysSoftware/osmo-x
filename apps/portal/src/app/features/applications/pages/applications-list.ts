import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { CardModule } from 'primeng/card';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { ApplicationsService } from '../services/applications.service';
import { Application, PageInfo } from '../../../core/models/api.model';

@Component({
  selector: 'app-applications-list',
  imports: [
    FormsModule,
    DatePipe,
    TableModule,
    TagModule,
    ButtonModule,
    SkeletonModule,
    DialogModule,
    InputTextModule,
    ToggleSwitchModule,
    ConfirmDialogModule,
    TooltipModule,
    ToolbarModule,
    IconFieldModule,
    InputIconModule,
    CardModule,
    PaginationComponent,
  ],
  providers: [ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './applications-list.html',
  styleUrl: './applications-list.scss',
})
export class ApplicationsListComponent implements OnInit {
  private readonly applicationsService = inject(ApplicationsService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  readonly dt = viewChild<Table>('dt');

  readonly applications = signal<Application[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly pageInfo = signal<PageInfo | null>(null);
  private currentPage = 1;

  // Dialog state
  readonly dialogVisible = signal(false);
  readonly editingApp = signal<Application | null>(null);
  readonly formName = signal('');
  readonly formTestMode = signal(false);

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(): void {
    this.loading.set(true);
    this.applicationsService.list(this.currentPage, 20).subscribe({
      next: (res) => {
        this.applications.set(res.items ?? []);
        this.pageInfo.set(res.page_info ?? null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadApplications();
  }

  onGlobalFilter(event: Event): void {
    this.dt()?.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  openCreate(): void {
    this.editingApp.set(null);
    this.formName.set('');
    this.formTestMode.set(false);
    this.dialogVisible.set(true);
  }

  openEdit(app: Application): void {
    this.editingApp.set(app);
    this.formName.set(app.name);
    this.formTestMode.set(app.test_mode_enabled);
    this.dialogVisible.set(true);
  }

  save(): void {
    const name = this.formName().trim();

    if (!name) {
      return;
    }

    this.saving.set(true);
    const editing = this.editingApp();

    if (editing) {
      this.applicationsService
        .update({
          application_id: editing.application_id,
          name,
          test_mode_enabled: this.formTestMode(),
        })
        .subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Updated',
              detail: `Application "${name}" updated successfully`,
            });
            this.dialogVisible.set(false);
            this.saving.set(false);
            this.loadApplications();
          },
          error: () => this.saving.set(false),
        });
    } else {
      this.applicationsService.create({ name, test_mode_enabled: this.formTestMode() }).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Created',
            detail: `Application "${name}" created successfully`,
          });
          this.dialogVisible.set(false);
          this.saving.set(false);
          this.loadApplications();
        },
        error: () => this.saving.set(false),
      });
    }
  }

  confirmDelete(app: Application): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${app.name}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.applicationsService.delete(app.application_id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Deleted',
              detail: `Application "${app.name}" deleted successfully`,
            });
            this.loadApplications();
          },
        });
      },
    });
  }
}
