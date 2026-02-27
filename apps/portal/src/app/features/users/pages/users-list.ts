import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { PasswordModule } from 'primeng/password';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePipe } from '@angular/common';
import { ConfirmationService, MessageService } from 'primeng/api';
import { UsersService } from '../services/users.service';
import { User } from '../../../core/models/auth.model';
import { UserRoles, UserRoleLabels } from '../../../core/constants/roles';

interface RoleOption {
  label: string;
  value: number;
}

@Component({
  selector: 'app-users-list',
  imports: [
    FormsModule,
    TableModule,
    CardModule,
    TagModule,
    ButtonModule,
    SkeletonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    TooltipModule,
    PasswordModule,
    ConfirmDialogModule,
    DatePipe,
  ],
  providers: [ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1
            class="text-3xl font-semibold text-surface-900 dark:text-surface-0 m-0 flex items-center gap-3"
          >
            <i class="pi pi-users text-primary"></i>
            Users
          </h1>
          <p class="text-muted-color mt-2">Manage organization users</p>
        </div>
        <p-button label="New User" icon="pi pi-plus" (onClick)="openCreate()" />
      </div>

      @if (loading()) {
        <p-card>
          <p-skeleton height="300px" />
        </p-card>
      } @else {
        <p-card>
          <p-table [value]="users()" [tableStyle]="{ 'min-width': '50rem' }">
            <ng-template #header>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th class="text-center">Actions</th>
              </tr>
            </ng-template>
            <ng-template #body let-u>
              <tr>
                <td>{{ getDisplayName(u) }}</td>
                <td>{{ u.email }}</td>
                <td>
                  <p-tag [value]="getRoleLabel(u.user_role ?? u.role)" severity="info" />
                </td>
                <td>
                  <p-tag
                    [value]="u.status === 1 ? 'Active' : 'Inactive'"
                    [severity]="u.status === 1 ? 'success' : 'danger'"
                  />
                </td>
                <td>{{ u.created_on | date: 'short' }}</td>
                <td class="text-center">
                  <p-button
                    icon="pi pi-pencil"
                    [rounded]="true"
                    [text]="true"
                    severity="info"
                    pTooltip="Edit"
                    tooltipPosition="top"
                    (onClick)="openEdit(u)"
                  />
                  <p-button
                    icon="pi pi-trash"
                    [rounded]="true"
                    [text]="true"
                    severity="danger"
                    pTooltip="Deactivate"
                    tooltipPosition="top"
                    (onClick)="confirmDelete(u)"
                  />
                </td>
              </tr>
            </ng-template>
            <ng-template #emptymessage>
              <tr>
                <td colspan="6" class="text-center py-8 text-muted-color">No users found</td>
              </tr>
            </ng-template>
          </p-table>
        </p-card>
      }

      <!-- Create/Edit Dialog -->
      <p-dialog
        [visible]="dialogVisible()"
        (visibleChange)="dialogVisible.set($event)"
        [header]="editingUser() ? 'Edit User' : 'New User'"
        [modal]="true"
        [style]="{ width: '28rem' }"
      >
        <div class="flex flex-col gap-4 mt-2">
          <div class="flex flex-col gap-2">
            <label for="email" class="font-medium">Email</label>
            <input
              pInputText
              id="email"
              type="email"
              [ngModel]="formEmail()"
              (ngModelChange)="formEmail.set($event)"
              placeholder="user&#64;example.com"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label for="firstName" class="font-medium">First Name</label>
            <input
              pInputText
              id="firstName"
              [ngModel]="formFirstName()"
              (ngModelChange)="formFirstName.set($event)"
              placeholder="Enter first name"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label for="lastName" class="font-medium">Last Name</label>
            <input
              pInputText
              id="lastName"
              [ngModel]="formLastName()"
              (ngModelChange)="formLastName.set($event)"
              placeholder="Enter last name"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label for="password" class="font-medium">{{
              editingUser() ? 'Password (leave blank to keep current)' : 'Password'
            }}</label>
            <p-password
              id="password"
              [ngModel]="formPassword()"
              (ngModelChange)="formPassword.set($event)"
              [placeholder]="editingUser() ? 'Enter new password' : 'Enter password'"
              [toggleMask]="true"
              [feedback]="false"
              styleClass="w-full"
              inputStyleClass="w-full"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label for="role" class="font-medium">Role</label>
            <p-select
              id="role"
              [options]="roleOptions"
              [ngModel]="formRole()"
              (ngModelChange)="formRole.set($event)"
              optionLabel="label"
              optionValue="value"
              placeholder="Select a role"
              appendTo="body"
            />
          </div>
        </div>
        <ng-template #footer>
          <p-button
            label="Cancel"
            severity="secondary"
            [text]="true"
            (onClick)="dialogVisible.set(false)"
          />
          <p-button
            label="Save"
            icon="pi pi-check"
            [disabled]="!isFormValid()"
            [loading]="saving()"
            (onClick)="save()"
          />
        </ng-template>
      </p-dialog>

      <p-confirmDialog />
    </div>
  `,
})
export class UsersListComponent implements OnInit {
  private readonly service = inject(UsersService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  readonly users = signal<User[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);

  // Dialog state
  readonly dialogVisible = signal(false);
  readonly editingUser = signal<User | null>(null);
  readonly formEmail = signal('');
  readonly formFirstName = signal('');
  readonly formLastName = signal('');
  readonly formPassword = signal('');
  readonly formRole = signal<number>(UserRoles.ORG_USER);

  readonly roleOptions: RoleOption[] = [
    { label: 'User', value: UserRoles.ORG_USER },
    { label: 'Organization Admin', value: UserRoles.ORG_ADMIN },
  ];

  ngOnInit(): void {
    this.loadUsers();
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

  openCreate(): void {
    this.editingUser.set(null);
    this.formEmail.set('');
    this.formFirstName.set('');
    this.formLastName.set('');
    this.formPassword.set('');
    this.formRole.set(UserRoles.ORG_USER);
    this.dialogVisible.set(true);
  }

  openEdit(user: User): void {
    this.editingUser.set(user);
    this.formEmail.set(user.email);
    this.formFirstName.set(user.first_name || '');
    this.formLastName.set(user.last_name || '');
    this.formPassword.set('');
    this.formRole.set(user.user_role ?? user.role);
    this.dialogVisible.set(true);
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
      const updateData: {
        user_id: number;
        email?: string;
        first_name?: string;
        last_name?: string;
        password?: string;
        user_role?: number;
      } = { user_id: editing.user_id };

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

      if (this.formRole() !== (editing.user_role ?? editing.role)) {
        updateData.user_role = this.formRole();
      }

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
          user_role: this.formRole(),
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

  getDisplayName(user: User): string {
    const parts = [user.first_name, user.last_name].filter(Boolean);

    return parts.length > 0 ? parts.join(' ') : '---';
  }

  getRoleLabel(role: number): string {
    return UserRoleLabels[role as keyof typeof UserRoleLabels] || 'Unknown';
  }

  confirmDelete(user: User): void {
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
