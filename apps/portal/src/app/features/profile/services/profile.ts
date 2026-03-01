import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface UpdateProfileDto {
  email?: string;
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
  private readonly apiUrl = `${environment.apiUrl}/users`;

  updateProfile(data: UpdateProfileDto): Observable<unknown> {
    return this.http.put(`${this.apiUrl}/profile`, data);
  }

  changePassword(data: ChangePasswordDto): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/change-password`, data);
  }
}
