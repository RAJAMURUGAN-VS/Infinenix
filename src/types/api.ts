export interface ApiError {
  message: string;
  status?: number;
  details?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  success: boolean;
}