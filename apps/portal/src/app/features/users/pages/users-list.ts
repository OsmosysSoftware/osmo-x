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
import { DatePipe } from '@angular/common';
import { MessageService } from 'primeng/api';
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
    DatePipe,
  ],
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
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th class="text-center">Actions</th>
              </tr>
            </ng-template>
            <ng-template #body let-u>
              <tr>
                <td>{{ u.user_id }}</td>
                <td>{{ u.username }}</td>
                <td>{{ u.email || '---' }}</td>
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
                </td>
              </tr>
            </ng-template>
            <ng-template #emptymessage>
              <tr>
                <td colspan="7" class="text-center py-8 text-muted-color">No users found</td>
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
            <label for="username" class="font-medium">Username</label>
            <input
              pInputText
              id="username"
              [ngModel]="formUsername()"
              (ngModelChange)="formUsername.set($event)"
              placeholder="Enter username"
              [disabled]="!!editingUser()"
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
            <label for="email" class="font-medium">Email</label>
            <input
              pInputText
              id="email"
              [ngModel]="formEmail()"
              (ngModelChange)="formEmail.set($event)"
              placeholder="user&#64;example.com"
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
    </div>
  `,
})
export class UsersListComponent implements OnInit {
  private readonly service = inject(UsersService);
  private readonly messageService = inject(MessageService);

  readonly users = signal<User[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);

  // Dialog state
  readonly dialogVisible = signal(false);
  readonly editingUser = signal<User | null>(null);
  readonly formUsername = signal('');
  readonly formPassword = signal('');
  readonly formEmail = signal('');
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
    this.formUsername.set('');
    this.formPassword.set('');
    this.formEmail.set('');
    this.formRole.set(UserRoles.ORG_USER);
    this.dialogVisible.set(true);
  }

  openEdit(user: User): void {
    this.editingUser.set(user);
    this.formUsername.set(user.username);
    this.formPassword.set('');
    this.formEmail.set(user.email || '');
    this.formRole.set(user.user_role ?? user.role);
    this.dialogVisible.set(true);
  }

  isFormValid(): boolean {
    const username = this.formUsername().trim();

    if (!username) {
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
        username?: string;
        password?: string;
        email?: string;
        user_role?: number;
      } = { user_id: editing.user_id };

      const email = this.formEmail().trim();

      if (email !== (editing.email || '')) {
        updateData.email = email;
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
            detail: `User "${editing.username}" updated successfully`,
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
          username: this.formUsername().trim(),
          password: this.formPassword().trim(),
          email: this.formEmail().trim() || undefined,
          user_role: this.formRole(),
        })
        .subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Created',
              detail: `User "${this.formUsername().trim()}" created successfully`,
            });
            this.dialogVisible.set(false);
            this.saving.set(false);
            this.loadUsers();
          },
          error: () => this.saving.set(false),
        });
    }
  }

  getRoleLabel(role: number): string {
    return UserRoleLabels[role as keyof typeof UserRoleLabels] || 'Unknown';
  }
}
