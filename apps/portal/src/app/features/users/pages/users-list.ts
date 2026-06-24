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
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { TooltipModule } from 'primeng/tooltip';
import { PasswordModule } from 'primeng/password';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ConfirmationService, MessageService } from 'primeng/api';
import { OrgContextService } from '../../../core/services/org-context.service';
import { UsersService } from '../services/users.service';
import { ApplicationsService } from '../../applications/services/applications.service';
import { UserResponse, CreateUserInput, UpdateUserInput } from '../../../core/models/api.model';
import { UserRoles, UserRoleLabels } from '../../../core/constants/roles';

interface RoleOption {
  label: string;
  value: number;
}

@Component({
  selector: 'app-users-list',
  imports: [
    FormsModule,
    DatePipe,
    TableModule,
    TagModule,
    ButtonModule,
    SkeletonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    MultiSelectModule,
    TooltipModule,
    PasswordModule,
    ConfirmDialogModule,
    ToolbarModule,
    IconFieldModule,
    InputIconModule,
  ],
  providers: [ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './users-list.html',
  styleUrl: './users-list.scss',
})
export class UsersListComponent implements OnInit {
  private readonly service = inject(UsersService);
  private readonly applicationsService = inject(ApplicationsService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  readonly orgContext = inject(OrgContextService);

  readonly dt = viewChild<Table>('dt');

  readonly users = signal<UserResponse[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);

  // Dialog state
  readonly dialogVisible = signal(false);
  readonly editingUser = signal<UserResponse | null>(null);
  readonly formEmail = signal('');
  readonly formFirstName = signal('');
  readonly formLastName = signal('');
  readonly formPassword = signal('');
  readonly formRole = signal<number>(UserRoles.ORG_USER);
  readonly formPermittedApplicationIds = signal<number[]>([]);

  readonly availableApplicationOptions = signal<{ label: string; value: number }[]>([]);

  readonly roleOptions: RoleOption[] = [
    { label: UserRoleLabels[UserRoles.ORG_USER], value: UserRoles.ORG_USER },
    { label: UserRoleLabels[UserRoles.ORG_ADMIN], value: UserRoles.ORG_ADMIN },
    { label: UserRoleLabels[UserRoles.NOTIFICATION_VIEWER], value: UserRoles.NOTIFICATION_VIEWER },
  ];

  ngOnInit(): void {
    this.loadUsers();
    this.applicationsService.list(1, 100).subscribe({
      next: (res) => {
        this.availableApplicationOptions.set(
          (res.items ?? []).map((a) => ({ label: a.name, value: a.application_id })),
        );
      },
    });
  }

  loadUsers(): void {
    this.loading.set(true);

    this.service.list().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load users',
        });
        this.loading.set(false);
      },
    });
  }

  onGlobalFilter(event: Event): void {
    this.dt()?.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  openCreate(): void {
    this.editingUser.set(null);
    this.formEmail.set('');
    this.formFirstName.set('');
    this.formLastName.set('');
    this.formPassword.set('');
    this.formRole.set(UserRoles.ORG_USER);
    this.formPermittedApplicationIds.set([]);
    this.dialogVisible.set(true);
  }

  onRoleChange(role: number): void {
    this.formRole.set(role);

    if (role === UserRoles.SUPER_ADMIN) {
      this.formPermittedApplicationIds.set(this.availableApplicationOptions().map((a) => a.value));
    } else {
      this.formPermittedApplicationIds.set([]);
    }
  }

  openEdit(user: UserResponse): void {
    this.editingUser.set(user);
    this.formEmail.set(user.email);
    this.formFirstName.set(user.first_name || '');
    this.formLastName.set(user.last_name || '');
    this.formPassword.set('');
    this.formRole.set(user.user_role);

    if (user.user_role === UserRoles.SUPER_ADMIN) {
      this.formPermittedApplicationIds.set(this.availableApplicationOptions().map((a) => a.value));
    } else {
      this.formPermittedApplicationIds.set(user.permitted_application_ids ?? []);
    }

    this.dialogVisible.set(true);
  }

  selectAllApplications(): void {
    this.formPermittedApplicationIds.set(
      this.availableApplicationOptions().map((a) => a.value),
    );
  }

  isFormValid(): boolean {
    const email = this.formEmail().trim();

    if (!email) {
      return false;
    }

    if (!this.editingUser() && !this.formPassword().trim()) {
      return false;
    }

    if (this.formPassword().trim() && this.formPassword().trim().length < 6) {
      return false;
    }

    return this.formRole() !== null && this.formRole() !== undefined;
  }

  save(): void {
    if (!this.isFormValid()) {
      return;
    }

    this.saving.set(true);
    const editing = this.editingUser();

    if (editing) {
      const updateData: UpdateUserInput = { user_id: editing.user_id };

      const email = this.formEmail().trim();

      if (email !== editing.email) {
        updateData.email = email;
      }

      const firstName = this.formFirstName().trim();

      if (firstName !== (editing.first_name || '')) {
        updateData.first_name = firstName;
      }

      const lastName = this.formLastName().trim();

      if (lastName !== (editing.last_name || '')) {
        updateData.last_name = lastName;
      }

      if (this.formRole() !== editing.user_role) {
        updateData.user_role = this.formRole() as UpdateUserInput['user_role'];
      }

      updateData.permitted_application_ids = this.formPermittedApplicationIds();

      const password = this.formPassword().trim();

      if (password) {
        updateData.password = password;
      }

      this.service.update(updateData).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Updated',
            detail: `User "${editing.email}" updated successfully`,
          });
          this.dialogVisible.set(false);
          this.saving.set(false);
          this.loadUsers();
        },
        error: () => this.saving.set(false),
      });
    } else {
      this.service
        .create({
          email: this.formEmail().trim(),
          password: this.formPassword().trim(),
          first_name: this.formFirstName().trim() || undefined,
          last_name: this.formLastName().trim() || undefined,
          user_role: this.formRole() as CreateUserInput['user_role'],
          permitted_application_ids: this.formPermittedApplicationIds(),
        })
        .subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Created',
              detail: `User "${this.formEmail().trim()}" created successfully`,
            });
            this.dialogVisible.set(false);
            this.saving.set(false);
            this.loadUsers();
          },
          error: () => this.saving.set(false),
        });
    }
  }

  getDisplayName(user: UserResponse): string {
    const parts = [user.first_name, user.last_name].filter(Boolean);

    return parts.length > 0 ? parts.join(' ') : '---';
  }

  getRoleLabel(role: number): string {
    return UserRoleLabels[role as keyof typeof UserRoleLabels] || 'Unknown';
  }

  confirmDelete(user: UserResponse): void {
    const displayName = this.getDisplayName(user);

    this.confirmationService.confirm({
      message: `Are you sure you want to deactivate "${displayName !== '---' ? displayName : user.email}"?`,
      header: 'Confirm Deactivate',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.service.delete(user.user_id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Deactivated',
              detail: `User "${displayName !== '---' ? displayName : user.email}" deactivated successfully`,
            });
            this.loadUsers();
          },
        });
      },
    });
  }
}
