export const DEFAULT_BASE_URL = 'https://hostelfinderbe.onrender.com';

export function getBaseUrl(): string {
  return localStorage.getItem('ochf_base_url') || DEFAULT_BASE_URL;
}

export function setBaseUrl(url: string): void {
  if (url) {
    localStorage.setItem('ochf_base_url', url.trim());
  } else {
    localStorage.removeItem('ochf_base_url');
  }
}

export function getAuthToken(): string | null {
  return localStorage.getItem('ochf_admin_token');
}

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem('ochf_admin_token', token);
  } else {
    localStorage.removeItem('ochf_admin_token');
  }
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
}

export async function apiFetch<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const baseUrl = getBaseUrl().replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  let urlString = `${baseUrl}${cleanEndpoint}`;

  if (options.params) {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, String(val));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      urlString += (urlString.includes('?') ? '&' : '?') + queryString;
    }
  }

  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(urlString, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMsg =
      (isJson && (data.message || data.error)) ||
      `Request failed with status ${response.status} (${response.statusText})`;
    throw new ApiError(errorMsg, response.status, data);
  }

  return data as T;
}
