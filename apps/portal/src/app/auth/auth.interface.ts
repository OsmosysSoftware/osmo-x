export interface LoginRequestBody {
  username: string;
  password: string;
}

export interface ErrorResponse {
  extensions?: {
    originalError?: {
      message?: string;
    };
  };
  message?: string;
}
