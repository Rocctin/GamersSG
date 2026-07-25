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

    const isApproved = dto.action === "APPROVE";
    const newStatus = isApproved ? AccountStatus.APPROVED : AccountStatus.REJECTED;
    const auditAction = isApproved
      ? AuditAction.ORGANISER_APPROVED
      : AuditAction.ORGANISER_REJECTED;

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: targetUserId },
        data: {
          status: newStatus,
          // Upgrade role to ORGANISER on approval; keep as GAMER on rejection
          ...(isApproved && { role: "ORGANISER" }),
        },
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
      metadata: {
        action: dto.action,
        reason: dto.rejectionReason,
        ...(isApproved && {
          previousRole: organiserProfile.user.role,
          newRole: "ORGANISER",
        }),
      },
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
      include: { organiser_profile: true },
    });

    if (!targetUser) {
      throw new NotFoundException("User not found");
    }

    if (targetUser.id === adminId) {
      throw new BadRequestException("Cannot change your own status");
    }
    if (targetUser.role === "ADMIN") {
      throw new BadRequestException("Cannot modify the status of another admin");
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

    // Map status change to the correct audit action
    let auditAction: AuditAction;
    if (dto.status === "SUSPENDED") {
      auditAction = AuditAction.USER_SUSPENDED;
    } else if (targetUser.organiser_profile) {
      // Use organiser-specific actions for users with an organiser profile
      if (dto.status === "APPROVED") {
        auditAction =
          targetUser.status === "SUSPENDED"
            ? AuditAction.ORGANISER_REINSTATED
            : AuditAction.ORGANISER_APPROVED;
      } else if (dto.status === "REJECTED") {
        auditAction = AuditAction.ORGANISER_REJECTED;
      } else {
        // PENDING or other — reset for re-review
        auditAction = AuditAction.USER_STATUS_CHANGED;
      }
    } else {
      // Non-organiser users: use generic status change action
      auditAction = AuditAction.USER_STATUS_CHANGED;
    }

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

  async updateUserRole(
    targetUserId: string,
    adminId: string,
    dto: { role: "GAMER" | "ORGANISER" },
    ipAddress?: string,
  ) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!targetUser) throw new NotFoundException("User not found");
    if (targetUser.id === adminId) {
      throw new BadRequestException("Cannot change your own role");
    }
    if (targetUser.role === "ADMIN") {
      throw new BadRequestException("Cannot change the role of another admin");
    }

    const previousRole = targetUser.role;

    await this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: dto.role },
    });

    await this.auditService.log({
      actorId: adminId,
      action: AuditAction.USER_ROLE_CHANGED,
      targetId: targetUserId,
      targetType: "user",
      metadata: {
        previousRole,
        newRole: dto.role,
        targetEmail: targetUser.email,
      },
      ipAddress,
    });

    return { message: `User role changed from ${previousRole} to ${dto.role}` };
  }

  async hardDeleteUser(
    targetUserId: string,
    adminId: string,
    reason: string,
    ipAddress?: string,
  ) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, email: true, role: true },
    });
    if (!targetUser) throw new NotFoundException("User not found");
    if (targetUser.id === adminId) {
      throw new BadRequestException("Cannot delete your own account");
    }
    if (targetUser.role === "ADMIN") {
      throw new BadRequestException("Cannot delete another admin account");
    }

    // Log before deletion (audit log references the user)
    await this.auditService.log({
      actorId: adminId,
      action: AuditAction.USER_DELETED,
      targetId: targetUserId,
      targetType: "user",
      metadata: { targetEmail: targetUser.email, reason },
      ipAddress,
    });

    // Cascade delete: Prisma handles profiles, tokens, connections,
    // team memberships, team invites, tournament/event registrations
    await this.prisma.user.delete({ where: { id: targetUserId } });

    return { message: "User permanently deleted" };
  }

  async adminUpdateUserProfile(
    targetUserId: string,
    adminId: string,
    dto: {
      username?: string;
      displayName?: string;
      bio?: string;
      visibility?: "PUBLIC" | "MEMBERS_ONLY" | "PRIVATE";
    },
    ipAddress?: string,
  ) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: { gamer_profile: true },
    });
    if (!targetUser) throw new NotFoundException("User not found");
    if (!targetUser.gamer_profile) {
      throw new BadRequestException("User does not have a gamer profile");
    }

    const updated = await this.prisma.gamerProfile.update({
      where: { user_id: targetUserId },
      data: {
        ...(dto.username !== undefined && { username: dto.username }),
        ...(dto.displayName !== undefined && { display_name: dto.displayName }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.visibility !== undefined && { visibility: dto.visibility }),
      },
    });

    await this.auditService.log({
      actorId: adminId,
      action: AuditAction.USER_STATUS_CHANGED, // Reuse status changed for profile edits
      targetId: targetUserId,
      targetType: "user",
      metadata: { fields: Object.keys(dto), targetEmail: targetUser.email },
      ipAddress,
    });

    return { success: true, message: "Profile updated successfully" };
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
      actorEmail: l.actor?.email ?? null,
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
