import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ErrorResponse, LoginRequestBody } from '../auth.interface';
import { AuthService } from '../auth.service';
import { JSEncryptService } from 'src/app/jsencrypt/jsencrypt.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;

  loading = false;

  private fb: FormBuilder = new FormBuilder();

  constructor(
    private router: Router,
    private authService: AuthService,
    private messageService: MessageService,
    private jsEncryptService: JSEncryptService,
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      selectedUsername: ['', [Validators.required]],
      selectedPassword: ['', [Validators.required]],
    });
  }

  get selectedUsername() {
    return this.loginForm.get('selectedUsername');
  }

  get selectedPassword() {
    return this.loginForm.get('selectedPassword');
  }

  loginWithUsername() {
    this.loading = true;
    const body: LoginRequestBody = {
      username: this.selectedUsername.value,
      password: this.selectedPassword.value,
    };
    this.authService.loginUser(body).subscribe({
      next: (resp) => {
        if (resp.errors) {
          let errorMessage: string;

          if (resp.errors && resp.errors.length > 0) {
            const error = resp.errors[0] as ErrorResponse;
            errorMessage =
              error.extensions?.originalError?.message ||
              error.message ||
              'An error occurred while logging in';
          } else {
            errorMessage = 'An error occurred while logging in';
          }

          if (Array.isArray(errorMessage)) {
            [errorMessage] = errorMessage;
          }

          this.messageService.add({
            key: 'tst',
            severity: 'error',
            summary: 'Error',
            detail: errorMessage,
          });
        } else {
          console.log(
            'osmoxuserdata',
            JSON.stringify(resp.data.login),
            this.jsEncryptService.encrypt(JSON.stringify(resp.data.login)),
          );
          localStorage.setItem(
            'osmoXUserData',
            this.jsEncryptService.encrypt(JSON.stringify(resp.data.login)).toString(),
          );
          localStorage.setItem(
            'osmoXLoggedAt',
            this.jsEncryptService.encrypt(new Date().toISOString()).toString(),
          );

          if (this.router.url !== '/notifications') {
            this.router.navigate(['notifications']);
          }
        }

        this.loading = false;
      },
      error: (error) => {
        this.messageService.add({
          key: 'tst',
          severity: 'error',
          summary: 'Error',
          detail: error,
        });
        this.loading = false;
      },
    });
  }
}
