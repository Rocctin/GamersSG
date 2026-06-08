import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { AuditAction, AccountStatus } from "@gamers-sg/database";
import { PAGINATION } from "@gamers-sg/shared/constants";
import type { ReviewOrganiserDto, UpdateUserStatusDto } from "@gamers-sg/shared/dto";

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async listPendingOrganisers(page: number = 1, pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE) {
    const skip = (page - 1) * pageSize;

    const [organisers, total] = await Promise.all([
      this.prisma.organiserProfile.findMany({
        where: {
          user: { status: AccountStatus.PENDING },
        },
        include: {
          user: { select: { id: true, email: true, created_at: true } },
        },
        skip,
        take: pageSize,
        orderBy: { created_at: "desc" },
      }),
      this.prisma.organiserProfile.count({
        where: {
          user: { status: AccountStatus.PENDING },
        },
      }),
    ]);

    const data = organisers.map((o) => ({
      id: o.id,
      userId: o.user_id,
      email: o.user.email,
      organisationName: o.organisation_name,
      organisationType: o.organisation_type,
      website: o.website,
      contactPerson: o.contact_person,
      contactNumber: o.contact_number,
      description: o.description,
      submittedAt: o.created_at.toISOString(),
    }));

    return {
      success: true,
      data,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async reviewOrganiser(
    targetUserId: string,
    adminId: string,
    dto: ReviewOrganiserDto,
    ipAddress?: string,
  ) {
    const organiserProfile = await this.prisma.organiserProfile.findUnique({
      where: { user_id: targetUserId },
      include: { user: true },
    });

    if (!organiserProfile) {
      throw new NotFoundException("Organiser profile not found");
    }

    if (organiserProfile.user.status !== AccountStatus.PENDING) {
      throw new BadRequestException(
        `Organiser is not pending review. Current status: ${organiserProfile.user.status}`,
      );
    }

    const newStatus =
      dto.action === "APPROVE" ? AccountStatus.APPROVED : AccountStatus.REJECTED;
    const auditAction =
      dto.action === "APPROVE"
        ? AuditAction.ORGANISER_APPROVED
        : AuditAction.ORGANISER_REJECTED;

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: targetUserId },
        data: { status: newStatus },
      }),
      this.prisma.organiserProfile.update({
        where: { user_id: targetUserId },
        data: {
          reviewed_by: adminId,
          reviewed_at: new Date(),
          ...(dto.rejectionReason && { rejection_reason: dto.rejectionReason }),
        },
      }),
    ]);

    await this.auditService.log({
      actorId: adminId,
      action: auditAction,
      targetId: targetUserId,
      targetType: "organiser",
      metadata: { action: dto.action, reason: dto.rejectionReason },
      ipAddress,
    });

    return {
      message: `Organiser ${dto.action === "APPROVE" ? "approved" : "rejected"} successfully`,
    };
  }

  async listUsers(
    page: number = 1,
    pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE,
    search?: string,
    role?: string,
    status?: string,
  ) {
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (search) {
      where.email = { contains: search, mode: "insensitive" };
    }
    if (role) {
      where.role = role;
    }
    if (status) {
      where.status = status;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          gamer_profile: { select: { username: true } },
          organiser_profile: { select: { organisation_name: true } },
        },
        skip,
        take: pageSize,
        orderBy: { created_at: "desc" },
      }),
      this.prisma.user.count({ where }),
    ]);

    const data = users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      status: u.status,
      username: u.gamer_profile?.username,
      organisationName: u.organiser_profile?.organisation_name,
      createdAt: u.created_at.toISOString(),
    }));

    return {
      success: true,
      data,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async updateUserStatus(
    targetUserId: string,
    adminId: string,
    dto: UpdateUserStatusDto,
    ipAddress?: string,
  ) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException("User not found");
    }

    if (targetUser.id === adminId) {
      throw new BadRequestException("Cannot change your own status");
    }

    await this.prisma.user.update({
      where: { id: targetUserId },
      data: { status: dto.status as AccountStatus },
    });

    // If suspending, revoke all refresh tokens
    if (dto.status === "SUSPENDED") {
      await this.prisma.refreshToken.updateMany({
        where: { user_id: targetUserId, revoked_at: null },
        data: { revoked_at: new Date() },
      });
    }

    const auditAction =
      dto.status === "SUSPENDED"
        ? AuditAction.USER_SUSPENDED
        : AuditAction.ORGANISER_REINSTATED;

    await this.auditService.log({
      actorId: adminId,
      action: auditAction,
      targetId: targetUserId,
      targetType: "user",
      metadata: { newStatus: dto.status, reason: dto.reason },
      ipAddress,
    });

    return {
      message: `User status updated to ${dto.status}`,
    };
  }

  async getAuditLogs(
    page: number = 1,
    pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE,
  ) {
    const skip = (page - 1) * pageSize;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        include: {
          actor: { select: { email: true } },
          target: { select: { email: true } },
        },
        skip,
        take: pageSize,
        orderBy: { created_at: "desc" },
      }),
      this.prisma.auditLog.count(),
    ]);

    const data = logs.map((l) => ({
      id: l.id,
      actorEmail: l.actor.email,
      targetEmail: l.target?.email ?? null,
      action: l.action,
      targetType: l.target_type,
      metadata: l.metadata,
      ipAddress: l.ip_address,
      createdAt: l.created_at.toISOString(),
    }));

    return {
      success: true,
      data,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }
}
