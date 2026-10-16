export type UserRole = 'admin' | 'student' | 'provider';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';
export type UserStatus = 'active' | 'suspended';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  name: string | null;
  verificationStatus: VerificationStatus | null;
  createdAt: string;
  updatedAt?: string;
}

export interface StudentProfile {
  _id: string;
  userId: {
    _id: string;
    email: string;
    role: string;
    isActive: boolean;
  } | null;
  schoolId?: string | {
    _id: string;
    name: string;
  };
  fullName: string;
  phone?: string;
  verificationStatus: VerificationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderProfile {
  _id: string;
  userId: {
    _id: string;
    email: string;
    role: string;
    isActive: boolean;
  } | null;
  businessName: string;
  fullName?: string;
  phone?: string;
  meansOfIdentification?: string;
  idNumber?: string;
  accountNumber?: string;
  bankName?: string;
  verificationDocUrl?: string;
  verificationStatus: VerificationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AdditionalCharge {
  name: string;
  amount: number;
}

export interface PropertyPhoto {
  url: string;
  order?: number;
}

export interface InspectionAvailabilityDay {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday' | string;
  isAvailable: boolean;
  from?: string;
  to?: string;
}

export interface Property {
  _id: string;
  title: string;
  description: string;
  price: number;
  additionalCharges?: AdditionalCharge[];
  photos?: PropertyPhoto[];
  address: string;
  location?: {
    type: string;
    coordinates: [number, number]; // [lng, lat]
  };
  amenities?: string[];
  schoolId?: string | {
    _id: string;
    name: string;
  };
  distanceFromSchoolKm?: number;
  drivingTimeMinutes?: number;
  propertyType?: string[] | string;
  availabilityStatus?: string;
  proofOfOwnershipUrl?: string;
  inspectionAvailability?: InspectionAvailabilityDay[];
  verificationStatus: VerificationStatus;
  providerId?: {
    _id: string;
    userId?: string;
    businessName?: string;
    fullName?: string;
    phone?: string;
    verificationStatus?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type InspectionStatus =
  | 'requested'
  | 'confirmed'
  | 'rescheduled'
  | 'completed'
  | 'missed'
  | 'cancelled'
  | 'declined'
  | 'rejected';

export interface Inspection {
  _id: string;
  propertyId?: Property | {
    _id: string;
    title?: string;
    price?: number;
    address?: string;
  };
  studentId?: {
    _id: string;
    fullName?: string;
    phone?: string;
    userId?: {
      _id: string;
      email: string;
    };
  } | string;
  providerId?: {
    _id: string;
    businessName?: string;
    phone?: string;
  } | string;
  slotId?: string;
  status: InspectionStatus;
  scheduledAt?: string;
  decision?: 'accepted' | 'rejected' | null;
  reason?: string;
  createdAt: string;
  updatedAt?: string;
}

export type ReportStatus = 'open' | 'investigating' | 'reviewed' | 'resolved' | 'dismissed';

export interface Report {
  _id: string;
  propertyId?: Property | {
    _id: string;
    title?: string;
    address?: string;
  };
  transactionId?: string;
  userId?: {
    _id: string;
    email?: string;
    fullName?: string;
  } | string;
  targetUserId?: {
    _id: string;
    email?: string;
    fullName?: string;
    role?: string;
  } | string;
  reason: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
}

export type TransactionStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'failed';

export interface Transaction {
  _id: string;
  inspectionId?: string | Inspection;
  propertyId?: string | Property;
  studentId?: string | StudentProfile | {
    _id: string;
    fullName?: string;
    userId?: { _id: string; email: string };
  };
  providerId?: string | ProviderProfile | {
    _id: string;
    businessName?: string;
  };
  amount?: number;
  totalAmount?: number;
  status: TransactionStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface UploadSingleResponse {
  url: string;
  message?: string;
}

export interface UploadMultipleResponse {
  urls: string[];
  count: number;
  message?: string;
}

export interface School {
  _id: string;
  name: string;
  location: {
    type: string;
    coordinates: [number, number]; // [lng, lat]
  };
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  _id: string;
  propertyId: string;
  studentId?: {
    _id: string;
    fullName?: string;
  } | string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Slot {
  _id: string;
  propertyId: string;
  date?: string;
  start?: string;
  end?: string;
  startTime?: string;
  endTime?: string;
  status: 'open' | 'booked';
  createdAt?: string;
}

export interface GroupedDateSlots {
  date: string;
  slots: Slot[];
}

export interface PropertySlotsResponse {
  count: number;
  slots: Slot[];
  groupedByDate: GroupedDateSlots[];
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  emailVerified: boolean;
  isActive?: boolean;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
  verificationStatus: string | null;
}

export interface CurrentAccountResponse {
  user: {
    _id: string;
    email: string;
    role: string;
    isActive: boolean;
    emailVerified: boolean;
    emailVerifiedAt?: string;
    createdAt?: string;
    updatedAt?: string;
  };
  profile: unknown;
  verificationStatus: string | null;
}
