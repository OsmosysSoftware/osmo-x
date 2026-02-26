// OsmoX Auth Types
// These are temporary manual types until OpenAPI types are generated from the backend.
// Once the v1 auth endpoints are live, replace these with generated types from api.types.ts.

export interface User {
  user_id: number;
  username: string;
  email?: string;
  role: number; // 0 = ORG_USER, 1 = ORG_ADMIN, 2 = SUPER_ADMIN
  organization_id?: number;
  status: number;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
  expires_in: number;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface RefreshTokenDto {
  refresh_token: string;
}
