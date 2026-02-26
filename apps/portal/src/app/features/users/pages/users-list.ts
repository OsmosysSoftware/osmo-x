import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { DatePipe } from '@angular/common';
import { MessageService } from 'primeng/api';
import { UsersService } from '../services/users.service';
import { User } from '../../../core/models/auth.model';
import { UserRoleLabels } from '../../../core/constants/roles';

@Component({
  selector: 'app-users-list',
  imports: [TableModule, CardModule, TagModule, SkeletonModule, DatePipe],
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
              </tr>
            </ng-template>
            <ng-template #body let-u>
              <tr>
                <td>{{ u.user_id }}</td>
                <td>{{ u.username }}</td>
                <td>{{ u.email || '---' }}</td>
                <td>
                  <p-tag [value]="getRoleLabel(u.role)" severity="info" />
                </td>
                <td>
                  <p-tag
                    [value]="u.status === 1 ? 'Active' : 'Inactive'"
                    [severity]="u.status === 1 ? 'success' : 'danger'"
                  />
                </td>
                <td>{{ u.created_on | date: 'short' }}</td>
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
    </div>
  `,
})
export class UsersListComponent implements OnInit {
  private readonly service = inject(UsersService);
  private readonly messageService = inject(MessageService);

  readonly users = signal<User[]>([]);
  readonly loading = signal(true);

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

  getRoleLabel(role: number): string {
    return UserRoleLabels[role as keyof typeof UserRoleLabels] || 'Unknown';
  }
}
