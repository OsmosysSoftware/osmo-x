import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../../core/services/auth.service';
import { LoginDto } from '../../../core/models/auth.model';
import { MessageService } from 'primeng/api';
import { AppFloatingConfigurator } from '../../../layout/component/app.floatingconfigurator';
import { AppLogo } from '../../../shared/components/logo/logo';

@Component({
  selector: 'app-login',
  imports: [
    ButtonModule,
    CheckboxModule,
    InputTextModule,
    PasswordModule,
    FormsModule,
    RouterModule,
    MessageModule,
    AppFloatingConfigurator,
    AppLogo,
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly messageService = inject(MessageService);

  readonly username = signal('');
  readonly password = signal('');
  readonly rememberMe = signal(false);
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  onSubmit(): void {
    const usernameValue = this.username();
    const passwordValue = this.password();

    if (!usernameValue || !passwordValue) {
      this.errorMessage.set('Please enter both username and password');

      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    const loginDto: LoginDto = {
      username: usernameValue,
      password: passwordValue,
    };

    this.authService.login(loginDto).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Login successful!',
        });

        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';

        this.router.navigate([returnUrl]);
      },
      error: (error) => {
        this.loading.set(false);
        const message = error.error?.message || 'Login failed. Please check your credentials.';

        this.errorMessage.set(message);
        this.messageService.add({
          severity: 'error',
          summary: 'Login Failed',
          detail: message,
        });
      },
    });
  }
}
