import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { PasswordModule } from 'primeng/password';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';
import { ProfileService } from '../services/profile';

@Component({
  selector: 'app-profile',
  imports: [
    FormsModule,
    ButtonModule,
    InputTextModule,
    DialogModule,
    PasswordModule,
    SkeletonModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class ProfileComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly profileService = inject(ProfileService);
  private readonly messageService = inject(MessageService);

  readonly loading = signal(true);
  readonly saving = signal(false);

  // Profile form
  readonly email = signal('');
  readonly firstName = signal('');
  readonly lastName = signal('');

  // Original values for change detection
  private originalEmail = '';
  private originalFirstName = '';
  private originalLastName = '';

  readonly hasChanges = computed(
    () =>
      this.email().trim() !== this.originalEmail ||
      this.firstName().trim() !== this.originalFirstName ||
      this.lastName().trim() !== this.originalLastName,
  );

  // Change password dialog
  readonly passwordDialogVisible = signal(false);
  readonly changingPassword = signal(false);
  readonly currentPassword = signal('');
  readonly newPassword = signal('');
  readonly confirmPassword = signal('');

  readonly isPasswordFormValid = computed(() => {
    const current = this.currentPassword().trim();
    const newPwd = this.newPassword().trim();
    const confirm = this.confirmPassword().trim();

    return current.length > 0 && newPwd.length >= 6 && newPwd === confirm;
  });

  readonly passwordMismatch = computed(() => {
    const newPwd = this.newPassword().trim();
    const confirm = this.confirmPassword().trim();

    return confirm.length > 0 && newPwd !== confirm;
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading.set(true);

    this.authService.getProfile().subscribe({
      next: (user) => {
        this.email.set(user.email);
        this.firstName.set(user.first_name || '');
        this.lastName.set(user.last_name || '');
        this.originalEmail = user.email;
        this.originalFirstName = user.first_name || '';
        this.originalLastName = user.last_name || '';
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  saveProfile(): void {
    if (!this.hasChanges()) {
      return;
    }

    this.saving.set(true);

    this.profileService
      .updateProfile({
        email: this.email().trim(),
        first_name: this.firstName().trim(),
        last_name: this.lastName().trim(),
      })
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Updated',
            detail: 'Profile updated successfully',
          });
          this.originalEmail = this.email().trim();
          this.originalFirstName = this.firstName().trim();
          this.originalLastName = this.lastName().trim();
          this.saving.set(false);

          // Refresh auth cache
          this.authService.getProfile().subscribe();
        },
        error: () => this.saving.set(false),
      });
  }

  cancelChanges(): void {
    this.email.set(this.originalEmail);
    this.firstName.set(this.originalFirstName);
    this.lastName.set(this.originalLastName);
  }

  openChangePassword(): void {
    this.currentPassword.set('');
    this.newPassword.set('');
    this.confirmPassword.set('');
    this.passwordDialogVisible.set(true);
  }

  changePassword(): void {
    if (!this.isPasswordFormValid()) {
      return;
    }

    this.changingPassword.set(true);

    this.profileService
      .changePassword({
        current_password: this.currentPassword().trim(),
        new_password: this.newPassword().trim(),
      })
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Password changed successfully',
          });
          this.passwordDialogVisible.set(false);
          this.changingPassword.set(false);
        },
        error: () => this.changingPassword.set(false),
      });
  }
}
