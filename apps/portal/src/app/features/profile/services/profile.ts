import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from '../../../core/services/config.service';

export interface UpdateProfileDto {
  first_name?: string;
  last_name?: string;
}

export interface ChangePasswordDto {
  current_password: string;
  new_password: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);
  private get apiUrl(): string {
    return `${this.config.apiUrl}/users`;
  }

  updateProfile(data: UpdateProfileDto): Observable<unknown> {
    return this.http.put(`${this.apiUrl}/profile`, data);
  }

  changePassword(data: ChangePasswordDto): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/change-password`, data);
  }
}
