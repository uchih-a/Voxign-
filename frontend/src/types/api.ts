export interface ApiError {
  error: boolean;
  status_code: number;
  message: string;
  detail: string | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
