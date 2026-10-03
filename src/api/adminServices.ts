import { apiFetch } from './client';
import type {
  User,
  StudentProfile,
  ProviderProfile,
  Property,
  Inspection,
  Report,
  School,
  Review,
  PropertySlotsResponse,
  LoginResponse,
  CurrentAccountResponse,
} from '../types';

// Authentication
export async function loginAdmin(credentials: { email: string; password: string }): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export async function getCurrentAccount(): Promise<CurrentAccountResponse> {
  return apiFetch<CurrentAccountResponse>('/auth/me', {
    method: 'GET',
  });
}

// 1. DELETE /auth/me - Delete caller's own user account and linked profile
export async function deleteAccount(password: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/auth/me', {
    method: 'DELETE',
    body: JSON.stringify({ password }),
  });
}

// Users
export interface GetUsersParams {
  role?: string;
  status?: string;
  q?: string;
}

export async function getUsers(params?: GetUsersParams): Promise<{ users: User[]; count?: number }> {
  return apiFetch<{ users: User[]; count?: number }>('/admin/users', {
    method: 'GET',
    params: {
      role: params?.role || undefined,
      status: params?.status || undefined,
      q: params?.q || undefined,
    },
  });
}

export async function updateUserAccountStatus(
  userId: string,
  data: { status: 'active' | 'suspended'; reason?: string }
): Promise<{ message?: string; user?: User }> {
  return apiFetch<{ message?: string; user?: User }>(`/admin/users/${userId}/status`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Students Verifications Queue
export async function getStudentsQueue(status?: string): Promise<{ students: StudentProfile[]; count?: number }> {
  return apiFetch<{ students: StudentProfile[]; count?: number }>('/admin/students', {
    method: 'GET',
    params: { status: status || undefined },
  });
}

export async function reviewStudentVerification(
  studentProfileId: string,
  data: { status: 'verified' | 'rejected'; reason?: string }
): Promise<{ message?: string; student?: StudentProfile }> {
  return apiFetch<{ message?: string; student?: StudentProfile }>(`/admin/students/${studentProfileId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Providers Verifications Queue
export async function getProvidersQueue(status?: string): Promise<{ providers: ProviderProfile[]; count?: number }> {
  return apiFetch<{ providers: ProviderProfile[]; count?: number }>('/admin/providers', {
    method: 'GET',
    params: { status: status || undefined },
  });
}

export async function reviewProviderVerification(
  providerProfileId: string,
  data: { status: 'verified' | 'rejected'; reason?: string }
): Promise<{ message?: string; provider?: ProviderProfile }> {
  return apiFetch<{ message?: string; provider?: ProviderProfile }>(`/admin/providers/${providerProfileId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Property Moderation Queue
export async function getPropertiesQueue(status?: string): Promise<{ properties: Property[]; count?: number }> {
  return apiFetch<{ properties: Property[]; count?: number }>('/admin/properties', {
    method: 'GET',
    params: { status: status || undefined },
  });
}

export async function reviewPropertyListing(
  propertyId: string,
  data: { status: 'verified' | 'rejected'; reason?: string }
): Promise<{ message?: string; property?: Property }> {
  return apiFetch<{ message?: string; property?: Property }>(`/admin/properties/${propertyId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Inspections
export async function getPlatformInspections(status?: string): Promise<{ inspections: Inspection[]; count?: number }> {
  return apiFetch<{ inspections: Inspection[]; count?: number }>('/admin/inspections', {
    method: 'GET',
    params: { status: status || undefined },
  });
}

export async function reviewInspectionBooking(
  inspectionId: string,
  data: { status: 'confirmed' | 'rejected'; reason?: string }
): Promise<{ message?: string; inspection?: Inspection }> {
  return apiFetch<{ message?: string; inspection?: Inspection }>(`/admin/inspections/${inspectionId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Reports & Moderation Flags
export async function getReportsQueue(status?: string): Promise<{ reports: Report[]; count?: number }> {
  return apiFetch<{ reports: Report[]; count?: number }>('/admin/reports', {
    method: 'GET',
    params: { status: status || undefined },
  });
}

export async function updateReportStatus(
  reportId: string,
  data: { status: 'reviewed' | 'resolved' }
): Promise<{ message?: string; report?: Report }> {
  return apiFetch<{ message?: string; report?: Report }>(`/admin/reports/${reportId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Schools & Campuses
export async function getAllSchools(q?: string): Promise<{ schools: School[]; count?: number }> {
  return apiFetch<{ schools: School[]; count?: number }>('/schools', {
    method: 'GET',
    params: { q: q || undefined },
  });
}

export async function getSchoolById(schoolId: string): Promise<{ school: School }> {
  return apiFetch<{ school: School }>(`/schools/${schoolId}`, {
    method: 'GET',
  });
}

export async function createSchool(data: {
  name: string;
  latitude: number;
  longitude: number;
}): Promise<{ message?: string; school: School }> {
  return apiFetch<{ message?: string; school: School }>('/schools', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Notifications & Diagnostics
export async function sendSmtpTestEmail(to: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/notifications/test', {
    method: 'POST',
    body: JSON.stringify({ to }),
  });
}

export async function sendSystemAnnouncement(data: {
  userId: string;
  title: string;
  body: string;
}): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/notifications/announce', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// 2. DELETE /properties/:id - Delete an owned property listing
export async function deleteProperty(propertyId: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/properties/${propertyId}`, {
    method: 'DELETE',
  });
}

// 3. DELETE /inspections/:id - Cancel an inspection and release the booked slot
export async function cancelInspection(
  inspectionId: string
): Promise<{ inspection?: Inspection; message?: string }> {
  return apiFetch<{ inspection?: Inspection; message?: string }>(`/inspections/${inspectionId}`, {
    method: 'DELETE',
  });
}

// 4. DELETE /slots/:id - Remove an open (unbooked) inspection time slot
export async function deleteSlot(slotId: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/slots/${slotId}`, {
    method: 'DELETE',
  });
}

// Inspection Slots: GET /slots/property/:propertyId (Student / Provider / Admin)
export async function getPropertySlots(propertyId: string): Promise<PropertySlotsResponse> {
  return apiFetch<PropertySlotsResponse>(`/slots/property/${propertyId}`, {
    method: 'GET',
  });
}

// 5. DELETE /reviews/:id - Delete an authored property review
export async function deleteReview(reviewId: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/reviews/${reviewId}`, {
    method: 'DELETE',
  });
}

// Reviews queries
export async function getPropertyReviews(
  propertyId: string
): Promise<{ reviews: Review[]; avgRating: number | null; count: number }> {
  return apiFetch<{ reviews: Review[]; avgRating: number | null; count: number }>(
    `/reviews/property/${propertyId}`,
    {
      method: 'GET',
    }
  );
}
