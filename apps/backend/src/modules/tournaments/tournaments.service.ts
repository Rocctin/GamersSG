import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { PAGINATION } from "@gamers-sg/shared/constants";
import {
  AuditAction,
  TournamentStatus,
  RegistrationStatus,
  Prisma,
} from "@gamers-sg/database";
import type {
  CreateTournamentDto,
  UpdateTournamentDto,
  TournamentDto,
  TournamentRegistrationDto,
  CreateTournamentRegistrationDto,
  TournamentFilterDto,
  CreateEventDto,
  UpdateEventDto,
  EventDto,
  EventRegistrationDto,
  CreateEventRegistrationDto,
  EventFilterDto,
} from "@gamers-sg/shared/dto";

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const STATUS_TRANSITIONS: Record<TournamentStatus, TournamentStatus[]> = {
  DRAFT: ["PENDING_REVIEW", "CANCELLED"],
  PENDING_REVIEW: ["APPROVED", "REJECTED", "CANCELLED"],
  APPROVED: ["ONGOING", "CANCELLED"],
  REJECTED: ["DRAFT"],
  ONGOING: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

function canTransition(from: TournamentStatus, to: TournamentStatus): boolean {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

// ──────────────────────────────────────────────
// Service
// ──────────────────────────────────────────────

@Injectable()
export class TournamentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // ════════════════════════════════════════════
  // TOURNAMENTS — Public / Browse
  // ════════════════════════════════════════════

  async listTournaments(
    filters: TournamentFilterDto,
  ) {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? PAGINATION.DEFAULT_PAGE_SIZE;
    const skip = (page - 1) * pageSize;

    const where: Prisma.TournamentWhereInput = {
      status: { in: [TournamentStatus.APPROVED, TournamentStatus.ONGOING] },
    };

    if (filters.search) {
      where.name = { contains: filters.search, mode: "insensitive" };
    }
    if (filters.gameId) {
      where.game_id = filters.gameId;
    }
    if (filters.format) {
      where.format = filters.format;
    }
    if (filters.isTeamBased !== undefined) {
      where.is_team_based = filters.isTeamBased;
    }
    if (filters.isOnline !== undefined) {
      where.is_online = filters.isOnline;
    }

    const [tournaments, total] = await Promise.all([
      this.prisma.tournament.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { tournament_start: "asc" },
        include: {
          game: { select: { id: true, name: true, slug: true, cover_image: true } },
          organiser: {
            select: {
              id: true,
              email: true,
              organiser_profile: { select: { organisation_name: true } },
            },
          },
          _count: { select: { registrations: true } },
        },
      }),
      this.prisma.tournament.count({ where }),
    ]);

    return {
      success: true,
      data: tournaments.map((t) => this.mapTournament(t)),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getTournamentById(id: string, userId?: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id },
      include: {
        game: { select: { id: true, name: true, slug: true, cover_image: true } },
        organiser: {
          select: {
            id: true,
            email: true,
            organiser_profile: { select: { organisation_name: true } },
          },
        },
        _count: { select: { registrations: true } },
      },
    });

    if (!tournament) {
      throw new NotFoundException("Tournament not found");
    }

    const result: TournamentDto = this.mapTournament(tournament);

    // If user is authenticated, include their registration
    if (userId) {
      const registration = await this.prisma.tournamentRegistration.findUnique({
        where: {
          tournament_id_user_id: {
            tournament_id: id,
            user_id: userId,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              gamer_profile: {
                select: { username: true, display_name: true },
              },
            },
          },
        },
      });
      if (registration) {
        result.userRegistration = this.mapTournamentRegistration(registration);
      }
    }

    return { success: true, data: result };
  }

  // ════════════════════════════════════════════
  // TOURNAMENTS — Organiser CRUD
  // ════════════════════════════════════════════

  async createTournament(dto: CreateTournamentDto, userId: string, ip?: string) {
    // Verify user is an approved organiser
    await this.ensureApprovedOrganiser(userId);

    // Verify game exists
    const game = await this.prisma.game.findUnique({ where: { id: dto.gameId } });
    if (!game) {
      throw new NotFoundException("Game not found");
    }

    const tournament = await this.prisma.tournament.create({
      data: {
        name: dto.name,
        description: dto.description,
        game_id: dto.gameId,
        format: dto.format ?? "OTHER",
        platform: dto.platform,
        registration_start: new Date(dto.registrationStart),
        registration_end: new Date(dto.registrationEnd),
        tournament_start: new Date(dto.tournamentStart),
        tournament_end: new Date(dto.tournamentEnd),
        is_online: dto.isOnline ?? false,
        venue: dto.venue,
        is_team_based: dto.isTeamBased ?? false,
        max_participants: dto.maxParticipants,
        prize_pool: dto.prizePool,
        registration_fee: dto.registrationFee,
        ruleset_url: dto.rulesetUrl,
        organiser_id: userId,
        status: "DRAFT",
      },
    });

    await this.auditService.log({
      actorId: userId,
      action: AuditAction.TOURNAMENT_CREATED,
      targetId: tournament.id,
      targetType: "tournament",
      metadata: { name: tournament.name, gameId: dto.gameId },
      ipAddress: ip,
    });

    return { success: true, data: this.mapTournament(tournament) };
  }

  async updateTournament(
    tournamentId: string,
    dto: UpdateTournamentDto,
    userId: string,
  ) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
    });
    if (!tournament) throw new NotFoundException("Tournament not found");

    // Only the creator can update
    if (tournament.organiser_id !== userId) {
      throw new ForbiddenException("You can only update your own tournaments");
    }

    // Only DRAFT or REJECTED tournaments can be edited
    if (
      tournament.status !== "DRAFT" &&
      tournament.status !== "REJECTED"
    ) {
      throw new BadRequestException(
        "Only draft or rejected tournaments can be edited",
      );
    }

    // If gameId changes, verify the game exists
    if (dto.gameId) {
      const game = await this.prisma.game.findUnique({
        where: { id: dto.gameId },
      });
      if (!game) throw new NotFoundException("Game not found");
    }

    const updated = await this.prisma.tournament.update({
      where: { id: tournamentId },
      data: this.buildTournamentUpdateData(dto),
    });

    return { success: true, data: this.mapTournament(updated) };
  }

  async submitTournament(tournamentId: string, userId: string, ip?: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
    });
    if (!tournament) throw new NotFoundException("Tournament not found");
    if (tournament.organiser_id !== userId) {
      throw new ForbiddenException("You can only submit your own tournaments");
    }
    if (!canTransition(tournament.status, "PENDING_REVIEW")) {
      throw new BadRequestException(
        `Cannot submit a tournament with status ${tournament.status}`,
      );
    }

    const updated = await this.prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: "PENDING_REVIEW" },
    });

    await this.auditService.log({
      actorId: userId,
      action: AuditAction.TOURNAMENT_CREATED,
      targetId: tournamentId,
      targetType: "tournament",
      metadata: { transition: `${tournament.status} → PENDING_REVIEW` },
      ipAddress: ip,
    });

    return { success: true, data: this.mapTournament(updated) };
  }

  async cancelTournament(tournamentId: string, userId: string, ip?: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
    });
    if (!tournament) throw new NotFoundException("Tournament not found");

    // Organiser who owns it OR admin can cancel
    const isAdmin = await this.isAdminUser(userId);
    if (tournament.organiser_id !== userId && !isAdmin) {
      throw new ForbiddenException(
        "You can only cancel your own tournaments",
      );
    }

    if (!canTransition(tournament.status, "CANCELLED")) {
      throw new BadRequestException("This tournament cannot be cancelled");
    }

    const updated = await this.prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: "CANCELLED" },
    });

    await this.auditService.log({
      actorId: userId,
      action: AuditAction.TOURNAMENT_CANCELLED,
      targetId: tournamentId,
      targetType: "tournament",
      metadata: { transition: `${tournament.status} → CANCELLED` },
      ipAddress: ip,
    });

    return { success: true, data: this.mapTournament(updated) };
  }

  // ════════════════════════════════════════════
  // TOURNAMENTS — Organiser's own listings
  // ════════════════════════════════════════════

  async listMyTournaments(userId: string, page = 1, pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE) {
    const skip = (page - 1) * pageSize;

    const [tournaments, total] = await Promise.all([
      this.prisma.tournament.findMany({
        where: { organiser_id: userId },
        skip,
        take: pageSize,
        orderBy: { created_at: "desc" },
        include: {
          game: { select: { id: true, name: true, slug: true, cover_image: true } },
          _count: { select: { registrations: true } },
        },
      }),
      this.prisma.tournament.count({ where: { organiser_id: userId } }),
    ]);

    return {
      success: true,
      data: tournaments.map((t) => this.mapTournament(t)),
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  // ════════════════════════════════════════════
  // TOURNAMENTS — Registration
  // ════════════════════════════════════════════

  async registerForTournament(
    tournamentId: string,
    userId: string,
    dto: CreateTournamentRegistrationDto,
  ) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
    });
    if (!tournament) throw new NotFoundException("Tournament not found");

    if (tournament.status !== "APPROVED" && tournament.status !== "ONGOING") {
      throw new BadRequestException(
        "This tournament is not open for registration",
      );
    }

    // Check registration window
    const now = new Date();
    if (now < tournament.registration_start) {
      throw new BadRequestException("Registration has not opened yet");
    }
    if (now > tournament.registration_end) {
      throw new BadRequestException("Registration has closed");
    }

    // Check capacity
    if (tournament.max_participants) {
      const count = await this.prisma.tournamentRegistration.count({
        where: { tournament_id: tournamentId, status: { not: "CANCELLED" } },
      });
      if (count >= tournament.max_participants) {
        throw new BadRequestException("Tournament is at full capacity");
      }
    }

    // Check not already registered
    const existing = await this.prisma.tournamentRegistration.findUnique({
      where: {
        tournament_id_user_id: { tournament_id: tournamentId, user_id: userId },
      },
    });
    if (existing && existing.status !== "CANCELLED") {
      throw new ConflictException("You are already registered for this tournament");
    }

    const registration = existing
      ? await this.prisma.tournamentRegistration.update({
          where: { id: existing.id },
          data: { status: "PENDING", registered_at: new Date() },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                gamer_profile: { select: { username: true, display_name: true } },
              },
            },
          },
        })
      : await this.prisma.tournamentRegistration.create({
          data: {
            tournament_id: tournamentId,
            user_id: userId,
            status: "PENDING",
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                gamer_profile: { select: { username: true, display_name: true } },
              },
            },
          },
        });

    return { success: true, data: this.mapTournamentRegistration(registration) };
  }

  async cancelMyRegistration(tournamentId: string, userId: string) {
    const registration = await this.prisma.tournamentRegistration.findUnique({
      where: {
        tournament_id_user_id: { tournament_id: tournamentId, user_id: userId },
      },
    });
    if (!registration) {
      throw new NotFoundException("Registration not found");
    }
    if (registration.user_id !== userId) {
      throw new ForbiddenException("You can only cancel your own registration");
    }

    const updated = await this.prisma.tournamentRegistration.update({
      where: { id: registration.id },
      data: { status: "CANCELLED" },
    });

    return { success: true, data: this.mapTournamentRegistration(updated) };
  }

  async listTournamentRegistrations(
    tournamentId: string,
    userId: string,
  ) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
    });
    if (!tournament) throw new NotFoundException("Tournament not found");

    const isAdmin = await this.isAdminUser(userId);
    if (tournament.organiser_id !== userId && !isAdmin) {
      throw new ForbiddenException(
        "Only the tournament organiser can view registrations",
      );
    }

    const registrations = await this.prisma.tournamentRegistration.findMany({
      where: { tournament_id: tournamentId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            gamer_profile: { select: { username: true, display_name: true } },
          },
        },
      },
      orderBy: { registered_at: "asc" },
    });

    return {
      success: true,
      data: registrations.map((r) => this.mapTournamentRegistration(r)),
    };
  }

  // ════════════════════════════════════════════
  // TOURNAMENTS — Admin
  // ════════════════════════════════════════════

  async listPendingTournaments(page = 1, pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE) {
    const skip = (page - 1) * pageSize;
    const where = { status: "PENDING_REVIEW" as TournamentStatus };

    const [tournaments, total] = await Promise.all([
      this.prisma.tournament.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { created_at: "asc" },
        include: {
          game: { select: { id: true, name: true, slug: true } },
          organiser: {
            select: {
              id: true,
              email: true,
              organiser_profile: { select: { organisation_name: true } },
            },
          },
        },
      }),
      this.prisma.tournament.count({ where }),
    ]);

    return {
      success: true,
      data: tournaments.map((t) => this.mapTournament(t)),
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async reviewTournament(
    tournamentId: string,
    adminId: string,
    action: "APPROVE" | "REJECT",
    rejectionReason?: string,
    ip?: string,
  ) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
    });
    if (!tournament) throw new NotFoundException("Tournament not found");
    if (tournament.status !== "PENDING_REVIEW") {
      throw new BadRequestException(
        "Only tournaments pending review can be approved or rejected",
      );
    }

    const newStatus: TournamentStatus =
      action === "APPROVE" ? "APPROVED" : "REJECTED";

    const updated = await this.prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        status: newStatus,
        reviewed_by: adminId,
        reviewed_at: new Date(),
        ...(rejectionReason && { rejection_reason: rejectionReason }),
      },
    });

    await this.auditService.log({
      actorId: adminId,
      action:
        action === "APPROVE"
          ? AuditAction.TOURNAMENT_APPROVED
          : AuditAction.TOURNAMENT_REJECTED,
      targetId: tournamentId,
      targetType: "tournament",
      metadata: { tournamentName: tournament.name, rejectionReason },
      ipAddress: ip,
    });

    return { success: true, data: this.mapTournament(updated) };
  }

  // ════════════════════════════════════════════
  // EVENTS — Public / Browse
  // ════════════════════════════════════════════

  async listEvents(filters: EventFilterDto) {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? PAGINATION.DEFAULT_PAGE_SIZE;
    const skip = (page - 1) * pageSize;

    const where: Prisma.EventWhereInput = {
      status: { in: ["APPROVED", "ONGOING"] },
    };

    if (filters.search) {
      where.name = { contains: filters.search, mode: "insensitive" };
    }
    if (filters.eventType) {
      where.event_type = filters.eventType;
    }
    if (filters.isOnline !== undefined) {
      where.is_online = filters.isOnline;
    }

    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { event_start: "asc" },
        include: {
          organiser: {
            select: {
              id: true,
              email: true,
              organiser_profile: { select: { organisation_name: true } },
            },
          },
          _count: { select: { registrations: true } },
        },
      }),
      this.prisma.event.count({ where }),
    ]);

    return {
      success: true,
      data: events.map((e) => this.mapEvent(e)),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getEventById(id: string, userId?: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        organiser: {
          select: {
            id: true,
            email: true,
            organiser_profile: { select: { organisation_name: true } },
          },
        },
        _count: { select: { registrations: true } },
      },
    });

    if (!event) throw new NotFoundException("Event not found");

    const result: EventDto = this.mapEvent(event);

    if (userId) {
      const registration = await this.prisma.eventRegistration.findUnique({
        where: {
          event_id_user_id: { event_id: id, user_id: userId },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              gamer_profile: {
                select: { username: true, display_name: true },
              },
            },
          },
        },
      });
      if (registration) {
        result.userRegistration = this.mapEventRegistration(registration);
      }
    }

    return { success: true, data: result };
  }

  // ════════════════════════════════════════════
  // EVENTS — Organiser CRUD
  // ════════════════════════════════════════════

  async createEvent(dto: CreateEventDto, userId: string, ip?: string) {
    await this.ensureApprovedOrganiser(userId);

    const event = await this.prisma.event.create({
      data: {
        name: dto.name,
        description: dto.description,
        event_type: dto.eventType ?? "DIGITAL",
        access_type: dto.accessType ?? "PUBLIC",
        capacity: dto.capacity,
        registration_start: new Date(dto.registrationStart),
        registration_end: new Date(dto.registrationEnd),
        event_start: new Date(dto.eventStart),
        event_end: new Date(dto.eventEnd),
        venue: dto.venue,
        is_online: dto.isOnline ?? false,
        age_restrictions: dto.ageRestrictions,
        registration_fee: dto.registrationFee,
        points_awarded: dto.pointsAwarded ?? 0,
        organiser_id: userId,
        status: "DRAFT",
      },
    });

    await this.auditService.log({
      actorId: userId,
      action: AuditAction.EVENT_CREATED,
      targetId: event.id,
      targetType: "event",
      metadata: { name: event.name },
      ipAddress: ip,
    });

    return { success: true, data: this.mapEvent(event) };
  }

  async updateEvent(eventId: string, dto: UpdateEventDto, userId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException("Event not found");
    if (event.organiser_id !== userId) {
      throw new ForbiddenException("You can only update your own events");
    }
    if (event.status !== "DRAFT" && event.status !== "REJECTED") {
      throw new BadRequestException("Only draft or rejected events can be edited");
    }

    const updated = await this.prisma.event.update({
      where: { id: eventId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.eventType !== undefined && { event_type: dto.eventType }),
        ...(dto.accessType !== undefined && { access_type: dto.accessType }),
        ...(dto.capacity !== undefined && { capacity: dto.capacity }),
        ...(dto.registrationStart !== undefined && { registration_start: new Date(dto.registrationStart) }),
        ...(dto.registrationEnd !== undefined && { registration_end: new Date(dto.registrationEnd) }),
        ...(dto.eventStart !== undefined && { event_start: new Date(dto.eventStart) }),
        ...(dto.eventEnd !== undefined && { event_end: new Date(dto.eventEnd) }),
        ...(dto.venue !== undefined && { venue: dto.venue }),
        ...(dto.isOnline !== undefined && { is_online: dto.isOnline }),
        ...(dto.ageRestrictions !== undefined && { age_restrictions: dto.ageRestrictions }),
        ...(dto.registrationFee !== undefined && { registration_fee: dto.registrationFee }),
        ...(dto.pointsAwarded !== undefined && { points_awarded: dto.pointsAwarded }),
      },
    });

    return { success: true, data: this.mapEvent(updated) };
  }

  async submitEvent(eventId: string, userId: string, ip?: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException("Event not found");
    if (event.organiser_id !== userId) {
      throw new ForbiddenException("You can only submit your own events");
    }
    if (!canTransition(event.status, "PENDING_REVIEW")) {
      throw new BadRequestException(
        `Cannot submit an event with status ${event.status}`,
      );
    }

    const updated = await this.prisma.event.update({
      where: { id: eventId },
      data: { status: "PENDING_REVIEW" },
    });

    await this.auditService.log({
      actorId: userId,
      action: AuditAction.EVENT_CREATED,
      targetId: eventId,
      targetType: "event",
      metadata: { transition: `${event.status} → PENDING_REVIEW` },
      ipAddress: ip,
    });

    return { success: true, data: this.mapEvent(updated) };
  }

  async cancelEvent(eventId: string, userId: string, ip?: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException("Event not found");

    const isAdmin = await this.isAdminUser(userId);
    if (event.organiser_id !== userId && !isAdmin) {
      throw new ForbiddenException("You can only cancel your own events");
    }
    if (!canTransition(event.status, "CANCELLED")) {
      throw new BadRequestException("This event cannot be cancelled");
    }

    const updated = await this.prisma.event.update({
      where: { id: eventId },
      data: { status: "CANCELLED" },
    });

    await this.auditService.log({
      actorId: userId,
      action: AuditAction.EVENT_CANCELLED,
      targetId: eventId,
      targetType: "event",
      metadata: { transition: `${event.status} → CANCELLED` },
      ipAddress: ip,
    });

    return { success: true, data: this.mapEvent(updated) };
  }

  async listMyEvents(userId: string, page = 1, pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE) {
    const skip = (page - 1) * pageSize;

    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where: { organiser_id: userId },
        skip,
        take: pageSize,
        orderBy: { created_at: "desc" },
        include: { _count: { select: { registrations: true } } },
      }),
      this.prisma.event.count({ where: { organiser_id: userId } }),
    ]);

    return {
      success: true,
      data: events.map((e) => this.mapEvent(e)),
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  // ════════════════════════════════════════════
  // EVENTS — Registration
  // ════════════════════════════════════════════

  async registerForEvent(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException("Event not found");

    if (event.status !== "APPROVED" && event.status !== "ONGOING") {
      throw new BadRequestException("This event is not open for registration");
    }

    const now = new Date();
    if (now < event.registration_start) {
      throw new BadRequestException("Registration has not opened yet");
    }
    if (now > event.registration_end) {
      throw new BadRequestException("Registration has closed");
    }

    if (event.capacity) {
      const count = await this.prisma.eventRegistration.count({
        where: { event_id: eventId, status: { not: "CANCELLED" } },
      });
      if (count >= event.capacity) {
        throw new BadRequestException("Event is at full capacity");
      }
    }

    const existing = await this.prisma.eventRegistration.findUnique({
      where: { event_id_user_id: { event_id: eventId, user_id: userId } },
    });
    if (existing && existing.status !== "CANCELLED") {
      throw new ConflictException("You are already registered for this event");
    }

    const registration = existing
      ? await this.prisma.eventRegistration.update({
          where: { id: existing.id },
          data: { status: "PENDING", registered_at: new Date() },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                gamer_profile: { select: { username: true, display_name: true } },
              },
            },
          },
        })
      : await this.prisma.eventRegistration.create({
          data: {
            event_id: eventId,
            user_id: userId,
            status: "PENDING",
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                gamer_profile: { select: { username: true, display_name: true } },
              },
            },
          },
        });

    return { success: true, data: this.mapEventRegistration(registration) };
  }

  async cancelMyEventRegistration(eventId: string, userId: string) {
    const registration = await this.prisma.eventRegistration.findUnique({
      where: { event_id_user_id: { event_id: eventId, user_id: userId } },
    });
    if (!registration) throw new NotFoundException("Registration not found");
    if (registration.user_id !== userId) {
      throw new ForbiddenException("You can only cancel your own registration");
    }

    const updated = await this.prisma.eventRegistration.update({
      where: { id: registration.id },
      data: { status: "CANCELLED" },
    });

    return { success: true, data: this.mapEventRegistration(updated) };
  }

  async listEventRegistrations(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException("Event not found");

    const isAdmin = await this.isAdminUser(userId);
    if (event.organiser_id !== userId && !isAdmin) {
      throw new ForbiddenException("Only the event organiser can view registrations");
    }

    const registrations = await this.prisma.eventRegistration.findMany({
      where: { event_id: eventId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            gamer_profile: { select: { username: true, display_name: true } },
          },
        },
      },
      orderBy: { registered_at: "asc" },
    });

    return {
      success: true,
      data: registrations.map((r) => this.mapEventRegistration(r)),
    };
  }

  // ════════════════════════════════════════════
  // EVENTS — Admin
  // ════════════════════════════════════════════

  async listPendingEvents(page = 1, pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE) {
    const skip = (page - 1) * pageSize;
    const where: Prisma.EventWhereInput = { status: "PENDING_REVIEW" };

    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { created_at: "asc" },
        include: {
          organiser: {
            select: {
              id: true,
              email: true,
              organiser_profile: { select: { organisation_name: true } },
            },
          },
        },
      }),
      this.prisma.event.count({ where }),
    ]);

    return {
      success: true,
      data: events.map((e) => this.mapEvent(e)),
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async reviewEvent(
    eventId: string,
    adminId: string,
    action: "APPROVE" | "REJECT",
    rejectionReason?: string,
    ip?: string,
  ) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException("Event not found");
    if (event.status !== "PENDING_REVIEW") {
      throw new BadRequestException("Only events pending review can be approved or rejected");
    }

    const newStatus: TournamentStatus =
      action === "APPROVE" ? "APPROVED" : "REJECTED";

    const updated = await this.prisma.event.update({
      where: { id: eventId },
      data: {
        status: newStatus,
        reviewed_by: adminId,
        reviewed_at: new Date(),
        ...(rejectionReason && { rejection_reason: rejectionReason }),
      },
    });

    await this.auditService.log({
      actorId: adminId,
      action:
        action === "APPROVE"
          ? AuditAction.EVENT_APPROVED
          : AuditAction.EVENT_REJECTED,
      targetId: eventId,
      targetType: "event",
      metadata: { eventName: event.name, rejectionReason },
      ipAddress: ip,
    });

    return { success: true, data: this.mapEvent(updated) };
  }

  // ════════════════════════════════════════════
  // HELPERS
  // ════════════════════════════════════════════

  private async ensureApprovedOrganiser(userId: string) {
    const organiser = await this.prisma.organiserProfile.findUnique({
      where: { user_id: userId },
    });
    if (!organiser) {
      throw new ForbiddenException("Organiser profile required");
    }
    // PENDING organisers can still create drafts — they just can't submit for review
  }

  private async isAdminUser(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return user?.role === "ADMIN";
  }

  private buildTournamentUpdateData(dto: UpdateTournamentDto) {
    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.gameId !== undefined) data.game_id = dto.gameId;
    if (dto.format !== undefined) data.format = dto.format;
    if (dto.platform !== undefined) data.platform = dto.platform;
    if (dto.registrationStart !== undefined) data.registration_start = new Date(dto.registrationStart);
    if (dto.registrationEnd !== undefined) data.registration_end = new Date(dto.registrationEnd);
    if (dto.tournamentStart !== undefined) data.tournament_start = new Date(dto.tournamentStart);
    if (dto.tournamentEnd !== undefined) data.tournament_end = new Date(dto.tournamentEnd);
    if (dto.isOnline !== undefined) data.is_online = dto.isOnline;
    if (dto.venue !== undefined) data.venue = dto.venue;
    if (dto.isTeamBased !== undefined) data.is_team_based = dto.isTeamBased;
    if (dto.maxParticipants !== undefined) data.max_participants = dto.maxParticipants;
    if (dto.prizePool !== undefined) data.prize_pool = dto.prizePool;
    if (dto.registrationFee !== undefined) data.registration_fee = dto.registrationFee;
    if (dto.rulesetUrl !== undefined) data.ruleset_url = dto.rulesetUrl;
    return data;
  }

  private mapTournament(t: any): TournamentDto {
    return {
      id: t.id,
      name: t.name,
      description: t.description,
      gameId: t.game_id,
      game: t.game
        ? {
            id: t.game.id,
            name: t.game.name,
            slug: t.game.slug,
            coverImage: t.game.cover_image,
          }
        : undefined,
      format: t.format,
      platform: t.platform,
      registrationStart: t.registration_start?.toISOString?.() ?? t.registration_start,
      registrationEnd: t.registration_end?.toISOString?.() ?? t.registration_end,
      tournamentStart: t.tournament_start?.toISOString?.() ?? t.tournament_start,
      tournamentEnd: t.tournament_end?.toISOString?.() ?? t.tournament_end,
      isOnline: t.is_online,
      venue: t.venue,
      isTeamBased: t.is_team_based,
      maxParticipants: t.max_participants,
      prizePool: t.prize_pool,
      registrationFee: t.registration_fee,
      rulesetUrl: t.ruleset_url,
      organiserId: t.organiser_id,
      organiser: t.organiser
        ? {
            id: t.organiser.id,
            email: t.organiser.email,
            organiserProfile: t.organiser.organiser_profile
              ? { organisationName: t.organiser.organiser_profile.organisation_name }
              : undefined,
          }
        : undefined,
      status: t.status,
      reviewedBy: t.reviewed_by,
      reviewedAt: t.reviewed_at?.toISOString?.() ?? t.reviewed_at,
      rejectionReason: t.rejection_reason,
      createdAt: t.created_at?.toISOString?.() ?? t.created_at,
      updatedAt: t.updated_at?.toISOString?.() ?? t.updated_at,
      _count: t._count,
    };
  }

  private mapTournamentRegistration(r: any): TournamentRegistrationDto {
    return {
      id: r.id,
      tournamentId: r.tournament_id,
      userId: r.user_id,
      teamId: r.team_id,
      status: r.status,
      registeredAt: r.registered_at?.toISOString?.() ?? r.registered_at,
      checkedInAt: r.checked_in_at?.toISOString?.() ?? r.checked_in_at,
      user: r.user
        ? {
            id: r.user.id,
            email: r.user.email,
            gamerProfile: r.user.gamer_profile
              ? {
                  username: r.user.gamer_profile.username,
                  displayName: r.user.gamer_profile.display_name,
                }
              : undefined,
          }
        : undefined,
    };
  }

  private mapEvent(e: any): EventDto {
    return {
      id: e.id,
      name: e.name,
      description: e.description,
      eventType: e.event_type,
      accessType: e.access_type,
      capacity: e.capacity,
      registrationStart: e.registration_start?.toISOString?.() ?? e.registration_start,
      registrationEnd: e.registration_end?.toISOString?.() ?? e.registration_end,
      eventStart: e.event_start?.toISOString?.() ?? e.event_start,
      eventEnd: e.event_end?.toISOString?.() ?? e.event_end,
      venue: e.venue,
      isOnline: e.is_online,
      ageRestrictions: e.age_restrictions,
      registrationFee: e.registration_fee,
      pointsAwarded: e.points_awarded,
      organiserId: e.organiser_id,
      organiser: e.organiser
        ? {
            id: e.organiser.id,
            email: e.organiser.email,
            organiserProfile: e.organiser.organiser_profile
              ? { organisationName: e.organiser.organiser_profile.organisation_name }
              : undefined,
          }
        : undefined,
      status: e.status,
      reviewedBy: e.reviewed_by,
      reviewedAt: e.reviewed_at?.toISOString?.() ?? e.reviewed_at,
      rejectionReason: e.rejection_reason,
      createdAt: e.created_at?.toISOString?.() ?? e.created_at,
      updatedAt: e.updated_at?.toISOString?.() ?? e.updated_at,
      _count: e._count,
    };
  }

  private mapEventRegistration(r: any): EventRegistrationDto {
    return {
      id: r.id,
      eventId: r.event_id,
      userId: r.user_id,
      status: r.status,
      registeredAt: r.registered_at?.toISOString?.() ?? r.registered_at,
      checkedInAt: r.checked_in_at?.toISOString?.() ?? r.checked_in_at,
      user: r.user
        ? {
            id: r.user.id,
            email: r.user.email,
            gamerProfile: r.user.gamer_profile
              ? {
                  username: r.user.gamer_profile.username,
                  displayName: r.user.gamer_profile.display_name,
                }
              : undefined,
          }
        : undefined,
    };
  }
}
