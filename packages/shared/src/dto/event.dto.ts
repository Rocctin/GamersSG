import type { EventType, TournamentStatus, RegistrationStatus } from "../enums";

// ── Event ──

export interface EventDto {
  id: string;
  name: string;
  description: string;
  eventType: EventType;
  accessType: string;
  capacity?: number;
  registrationStart: string;
  registrationEnd: string;
  eventStart: string;
  eventEnd: string;
  venue?: string;
  isOnline: boolean;
  ageRestrictions?: string;
  registrationFee?: number;
  pointsAwarded: number;
  organiserId: string;
  organiser?: {
    id: string;
    email: string;
    organiserProfile?: { organisationName: string };
  };
  status: TournamentStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;

  // Computed / joined
  _count?: {
    registrations: number;
  };
  userRegistration?: EventRegistrationDto;
}

export interface CreateEventDto {
  name: string;
  description: string;
  eventType?: EventType;
  accessType?: string;
  capacity?: number;
  registrationStart: string; // ISO 8601
  registrationEnd: string; // ISO 8601
  eventStart: string; // ISO 8601
  eventEnd: string; // ISO 8601
  venue?: string;
  isOnline?: boolean;
  ageRestrictions?: string;
  registrationFee?: number;
  pointsAwarded?: number;
}

export interface UpdateEventDto {
  name?: string;
  description?: string;
  eventType?: EventType;
  accessType?: string;
  capacity?: number;
  registrationStart?: string;
  registrationEnd?: string;
  eventStart?: string;
  eventEnd?: string;
  venue?: string;
  isOnline?: boolean;
  ageRestrictions?: string;
  registrationFee?: number;
  pointsAwarded?: number;
}

// ── Event Registration ──

export interface EventRegistrationDto {
  id: string;
  eventId: string;
  userId: string;
  status: RegistrationStatus;
  registeredAt: string;
  checkedInAt?: string;
  user?: {
    id: string;
    email: string;
    gamerProfile?: {
      username: string;
      displayName?: string;
    };
  };
}

export interface CreateEventRegistrationDto {
  eventId: string;
}

// ── Filters ──

export interface EventFilterDto {
  search?: string;
  eventType?: EventType;
  status?: TournamentStatus;
  isOnline?: boolean;
  page?: number;
  pageSize?: number;
}
