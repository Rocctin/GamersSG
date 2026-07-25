import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { AuditAction } from "@gamers-sg/database";
import type {
  CreateTeamDto,
  UpdateTeamDto,
  InviteUserDto,
  UpdateMemberRoleDto,
  TeamDto,
  TeamWithMembersDto,
  TeamMemberDto,
  TeamInviteDto,
} from "@gamers-sg/shared/dto";

@Injectable()
export class TeamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // ── Team CRUD ──

  async create(userId: string, dto: CreateTeamDto): Promise<TeamDto> {
    // Validate tag format (alphanum, 2-6 chars)
    if (!/^[A-Za-z0-9]{2,6}$/.test(dto.tag)) {
      throw new BadRequestException("Team tag must be 2-6 alphanumeric characters");
    }

    // Check tag uniqueness
    const existing = await this.prisma.team.findUnique({
      where: { tag: dto.tag.toUpperCase() },
    });
    if (existing) {
      throw new ConflictException("Team tag is already taken");
    }

    // Check user doesn't breach member limit on existing teams (max 5 active teams)
    const activeMemberCount = await this.prisma.teamMember.count({
      where: { user_id: userId, left_at: null },
    });
    if (activeMemberCount >= 5) {
      throw new BadRequestException(
        "You are already a member of 5 active teams. Leave a team before creating a new one.",
      );
    }

    const team = await this.prisma.team.create({
      data: {
        name: dto.name,
        tag: dto.tag.toUpperCase(),
        description: dto.description,
        logo_url: dto.logoUrl,
        banner_url: dto.bannerUrl,
        is_recruiting: dto.isRecruiting ?? true,
        created_by: userId,
        // Auto-add creator as CAPTAIN
        members: {
          create: {
            user_id: userId,
            role: "CAPTAIN",
          },
        },
        // Pre-select games
        ...(dto.gameIds?.length
          ? {
              games: {
                create: dto.gameIds.map((id) => ({ game_id: id })),
              },
            }
          : {}),
      },
      include: {
        members: { include: { user: { include: { gamer_profile: true } } } },
        games: { include: { game: true } },
      },
    });

    return this.mapTeam(team);
  }

  async getById(teamId: string): Promise<TeamWithMembersDto> {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          where: { left_at: null },
          include: { user: { include: { gamer_profile: true } } },
        },
        games: { include: { game: true } },
        creator: { include: { gamer_profile: true } },
      },
    });

    if (!team) {
      throw new NotFoundException("Team not found");
    }

    return {
      ...this.mapTeam(team),
      members: team.members.map((m) => this.mapMember(m)),
    };
  }

  async update(
    userId: string,
    teamId: string,
    dto: UpdateTeamDto,
  ): Promise<TeamDto> {
    const team = await this.requireCaptain(userId, teamId);

    if (dto.tag) {
      if (!/^[A-Za-z0-9]{2,6}$/.test(dto.tag)) {
        throw new BadRequestException("Team tag must be 2-6 alphanumeric characters");
      }
      const existing = await this.prisma.team.findUnique({
        where: { tag: dto.tag.toUpperCase() },
      });
      if (existing && existing.id !== teamId) {
        throw new ConflictException("Team tag is already taken");
      }
    }

    const updated = await this.prisma.team.update({
      where: { id: teamId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.tag !== undefined && { tag: dto.tag.toUpperCase() }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.logoUrl !== undefined && { logo_url: dto.logoUrl }),
        ...(dto.bannerUrl !== undefined && { banner_url: dto.bannerUrl }),
        ...(dto.isRecruiting !== undefined && { is_recruiting: dto.isRecruiting }),
      },
      include: {
        members: { include: { user: { include: { gamer_profile: true } } } },
        games: { include: { game: true } },
      },
    });

    return this.mapTeam(updated);
  }

  async disband(userId: string, teamId: string): Promise<TeamDto> {
    await this.requireCaptain(userId, teamId);

    // Set all active members' left_at to now (preserves history)
    await this.prisma.teamMember.updateMany({
      where: { team_id: teamId, left_at: null },
      data: { left_at: new Date() },
    });

    const disbanded = await this.prisma.team.update({
      where: { id: teamId },
      data: { status: "DISBANDED" },
      include: {
        members: { include: { user: { include: { gamer_profile: true } } } },
        games: { include: { game: true } },
      },
    });

    return this.mapTeam(disbanded);
  }

  async listTeams(options: {
    status?: string;
    search?: string;
    gameId?: string;
    isRecruiting?: boolean;
    page?: number;
    pageSize?: number;
  } = {}) {
    const { status, search, gameId, isRecruiting, page = 1, pageSize = 20 } = options;

    const where: any = {};
    if (status) where.status = status;
    else where.status = "ACTIVE";
    if (isRecruiting !== undefined) where.is_recruiting = isRecruiting;
    if (search) where.name = { contains: search, mode: "insensitive" };
    if (gameId) {
      where.games = { some: { game_id: gameId } };
    }

    const [teams, total] = await Promise.all([
      this.prisma.team.findMany({
        where,
        include: {
          members: { where: { left_at: null }, select: { team_id: true } },
          games: { include: { game: true } },
        },
        orderBy: { updated_at: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.team.count({ where }),
    ]);

    return {
      teams: teams.map((t) => ({
        ...this.mapTeam(t),
        memberCount: t.members.length,
      })),
      total,
      page,
      pageSize,
    };
  }

  async getMyTeams(userId: string) {
    const memberships = await this.prisma.teamMember.findMany({
      where: { user_id: userId },
      include: {
        team: {
          include: {
            members: { where: { left_at: null }, select: { team_id: true } },
            games: { include: { game: true } },
          },
        },
      },
      orderBy: { joined_at: "desc" },
    });

    const current = memberships
      .filter((m) => !m.left_at)
      .map((m) => ({
        ...this.mapTeam(m.team),
        memberCount: m.team.members.length,
        myRole: m.role,
      }));

    const past = memberships
      .filter((m) => m.left_at)
      .map((m) => ({
        ...this.mapTeam(m.team),
        memberCount: m.team.members.length,
        myRole: m.role,
        leftAt: m.left_at?.toISOString(),
      }));

    return { current, past };
  }

  // ── Invites ──

  async inviteUser(
    userId: string,
    teamId: string,
    dto: InviteUserDto,
  ): Promise<TeamInviteDto> {
    const membership = await this.prisma.teamMember.findUnique({
      where: { team_id_user_id: { team_id: teamId, user_id: userId } },
    });
    if (!membership || (membership.role !== "CAPTAIN" && membership.role !== "MEMBER")) {
      throw new ForbiddenException("Only team members can invite");
    }

    // Check if invitee is already a member
    const existingMember = await this.prisma.teamMember.findUnique({
      where: { team_id_user_id: { team_id: teamId, user_id: dto.inviteeId } },
    });
    if (existingMember && !existingMember.left_at) {
      throw new ConflictException("User is already a member of this team");
    }

    // Check existing pending invite
    const existingInvite = await this.prisma.teamInvite.findUnique({
      where: {
        team_id_invitee_id: {
          team_id: teamId,
          invitee_id: dto.inviteeId,
        },
      },
    });
    if (existingInvite && existingInvite.status === "PENDING") {
      throw new ConflictException("A pending invite already exists for this user");
    }

    // Check team member limit (max 10)
    const memberCount = await this.prisma.teamMember.count({
      where: { team_id: teamId, left_at: null },
    });
    if (memberCount >= 10) {
      throw new BadRequestException("Team is full (max 10 members)");
    }

    const invite = await this.prisma.teamInvite.create({
      data: {
        team_id: teamId,
        inviter_id: userId,
        invitee_id: dto.inviteeId,
        status: "PENDING",
      },
      include: {
        team: true,
        inviter: { include: { gamer_profile: true } },
        invitee: { include: { gamer_profile: true } },
      },
    });

    return this.mapInvite(invite);
  }

  async acceptInvite(userId: string, inviteId: string): Promise<TeamMemberDto> {
    const invite = await this.prisma.teamInvite.findUnique({
      where: { id: inviteId },
    });

    if (!invite) {
      throw new NotFoundException("Invite not found");
    }
    if (invite.invitee_id !== userId) {
      throw new ForbiddenException("This invite is not for you");
    }
    if (invite.status !== "PENDING") {
      throw new BadRequestException(`Cannot accept a ${invite.status.toLowerCase()} invite`);
    }

    // Check team not disbanded
    const team = await this.prisma.team.findUnique({ where: { id: invite.team_id } });
    if (!team || team.status !== "ACTIVE") {
      throw new BadRequestException("This team is no longer active");
    }

    // Check member limit
    const memberCount = await this.prisma.teamMember.count({
      where: { team_id: invite.team_id, left_at: null },
    });
    if (memberCount >= 10) {
      throw new BadRequestException("Team is full");
    }

    // Re-activate previous membership if exists, otherwise create
    const existingMembership = await this.prisma.teamMember.findUnique({
      where: {
        team_id_user_id: {
          team_id: invite.team_id,
          user_id: userId,
        },
      },
    });

    const member = existingMembership
      ? await this.prisma.teamMember.update({
          where: {
            team_id_user_id: {
              team_id: invite.team_id,
              user_id: userId,
            },
          },
          data: { left_at: null, joined_at: new Date() },
          include: { user: { include: { gamer_profile: true } } },
        })
      : await this.prisma.teamMember.create({
          data: {
            team_id: invite.team_id,
            user_id: userId,
            role: "MEMBER",
          },
          include: { user: { include: { gamer_profile: true } } },
        });

    // Mark invite accepted
    await this.prisma.teamInvite.update({
      where: { id: inviteId },
      data: { status: "ACCEPTED" },
    });

    return this.mapMember(member);
  }

  async rejectInvite(userId: string, inviteId: string): Promise<{ rejected: boolean }> {
    const invite = await this.prisma.teamInvite.findUnique({
      where: { id: inviteId },
    });
    if (!invite) throw new NotFoundException("Invite not found");
    if (invite.invitee_id !== userId) {
      throw new ForbiddenException("This invite is not for you");
    }
    if (invite.status !== "PENDING") {
      throw new BadRequestException("This invite cannot be rejected");
    }

    await this.prisma.teamInvite.update({
      where: { id: inviteId },
      data: { status: "REJECTED" },
    });

    return { rejected: true };
  }

  async getMyInvites(userId: string): Promise<TeamInviteDto[]> {
    const invites = await this.prisma.teamInvite.findMany({
      where: { invitee_id: userId, status: "PENDING" },
      include: {
        team: true,
        inviter: { include: { gamer_profile: true } },
        invitee: { include: { gamer_profile: true } },
      },
      orderBy: { created_at: "desc" },
    });

    return invites.map((i) => this.mapInvite(i));
  }

  // ── Roster management ──

  async removeMember(
    actorId: string,
    teamId: string,
    memberUserId: string,
  ): Promise<{ removed: boolean }> {
    const isSelfRemoval = actorId === memberUserId;

    // Check if actor is admin
    const actor = await this.prisma.user.findUnique({
      where: { id: actorId },
      select: { role: true },
    });
    const isAdmin = actor?.role === "ADMIN";

    if (!isSelfRemoval && !isAdmin) {
      // Only captains can remove others
      const actorMembership = await this.prisma.teamMember.findUnique({
        where: { team_id_user_id: { team_id: teamId, user_id: actorId } },
      });
      if (!actorMembership || actorMembership.role !== "CAPTAIN") {
        throw new ForbiddenException("Only the team captain can remove members");
      }
    }

    // Cannot remove the last captain (waived for admins)
    if (!isAdmin) {
      const member = await this.prisma.teamMember.findUnique({
        where: { team_id_user_id: { team_id: teamId, user_id: memberUserId } },
      });
      if (member?.role === "CAPTAIN") {
        const captainCount = await this.prisma.teamMember.count({
          where: { team_id: teamId, role: "CAPTAIN", left_at: null },
        });
        if (captainCount <= 1) {
          throw new BadRequestException(
            isSelfRemoval
              ? "You are the last captain. Promote another member before leaving, or disband the team."
              : "Cannot remove the last captain. Promote another member first.",
          );
        }
      }
    }

    await this.prisma.teamMember.update({
      where: { team_id_user_id: { team_id: teamId, user_id: memberUserId } },
      data: { left_at: new Date() },
    });

    return { removed: true };
  }

  async updateMemberRole(
    actorId: string,
    teamId: string,
    memberUserId: string,
    dto: UpdateMemberRoleDto,
  ): Promise<TeamMemberDto> {
    await this.requireCaptain(actorId, teamId);

    const member = await this.prisma.teamMember.findUnique({
      where: { team_id_user_id: { team_id: teamId, user_id: memberUserId } },
    });
    if (!member) throw new NotFoundException("Member not found");

    // If demoting the last captain, block
    if (member.role === "CAPTAIN" && dto.role !== "CAPTAIN") {
      const captainCount = await this.prisma.teamMember.count({
        where: { team_id: teamId, role: "CAPTAIN", left_at: null },
      });
      if (captainCount <= 1) {
        throw new BadRequestException(
          "Cannot demote the last captain. Promote another member first.",
        );
      }
    }

    const updated = await this.prisma.teamMember.update({
      where: { team_id_user_id: { team_id: teamId, user_id: memberUserId } },
      data: { role: dto.role },
      include: { user: { include: { gamer_profile: true } } },
    });

    return this.mapMember(updated);
  }

  // ── Admin methods ──

  async adminListTeams(options: {
    status?: string;
    search?: string;
    gameId?: string;
    isRecruiting?: boolean;
    page?: number;
    pageSize?: number;
  } = {}) {
    const { status, search, gameId, isRecruiting, page = 1, pageSize = 20 } = options;

    const where: any = {};
    if (status) where.status = status;
    // No default status filter — admin sees ALL teams including DISBANDED
    if (isRecruiting !== undefined) where.is_recruiting = isRecruiting;
    if (search) where.name = { contains: search, mode: "insensitive" };
    if (gameId) {
      where.games = { some: { game_id: gameId } };
    }

    const [teams, total] = await Promise.all([
      this.prisma.team.findMany({
        where,
        include: {
          members: {
            where: { left_at: null },
            include: { user: { include: { gamer_profile: true } } },
          },
          games: { include: { game: true } },
          creator: { include: { gamer_profile: true } },
        },
        orderBy: { updated_at: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.team.count({ where }),
    ]);

    return {
      success: true,
      data: teams.map((t) => ({
        ...this.mapTeam(t),
        memberCount: t.members.length,
        members: t.members.map((m) => this.mapMember(m)),
      })),
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async adminGetTeam(teamId: string): Promise<TeamWithMembersDto> {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: { user: { include: { gamer_profile: true } } },
        },
        games: { include: { game: true } },
        creator: { include: { gamer_profile: true } },
      },
    });

    if (!team) throw new NotFoundException("Team not found");

    return {
      ...this.mapTeam(team),
      members: team.members.map((m) => this.mapMember(m)),
    };
  }

  async adminHardDeleteTeam(
    teamId: string,
    adminId: string,
    reason: string,
    ip?: string,
  ): Promise<{ deleted: boolean }> {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException("Team not found");

    // Delete all related records in a transaction
    await this.prisma.$transaction([
      this.prisma.teamInvite.deleteMany({ where: { team_id: teamId } }),
      this.prisma.teamGame.deleteMany({ where: { team_id: teamId } }),
      this.prisma.teamMember.deleteMany({ where: { team_id: teamId } }),
      // Unlink tournament registrations that reference this team
      this.prisma.tournamentRegistration.updateMany({
        where: { team_id: teamId },
        data: { team_id: null },
      }),
      this.prisma.team.delete({ where: { id: teamId } }),
    ]);

    await this.auditService.log({
      actorId: adminId,
      action: AuditAction.TEAM_DELETED,
      targetId: teamId,
      targetType: "team",
      metadata: { teamName: team.name, teamTag: team.tag, reason },
      ipAddress: ip,
    });

    return { deleted: true };
  }

  // ── Helpers ──

  private async requireCaptain(userId: string, teamId: string) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException("Team not found");

    // Admin has universal access — bypasses captain requirement
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (user?.role === "ADMIN") return team;

    const membership = await this.prisma.teamMember.findUnique({
      where: { team_id_user_id: { team_id: teamId, user_id: userId } },
    });
    if (!membership || membership.role !== "CAPTAIN") {
      throw new ForbiddenException("Only the team captain can perform this action");
    }

    return team;
  }

  // ── Mappers ──

  private mapTeam(t: any, extra?: Record<string, any>): TeamDto {
    return {
      id: t.id,
      name: t.name,
      tag: t.tag,
      description: t.description ?? undefined,
      logoUrl: t.logo_url ?? undefined,
      bannerUrl: t.banner_url ?? undefined,
      isRecruiting: t.is_recruiting,
      status: t.status,
      createdBy: t.created_by,
      memberCount: t.members?.length ?? t._count?.members ?? 0,
      games: (t.games ?? []).map((g: any) => ({
        id: g.game?.id ?? g.game_id,
        name: g.game?.name,
        slug: g.game?.slug,
        coverImage: g.game?.cover_image ?? undefined,
        category: g.game?.category ?? undefined,
      })),
      createdAt: t.created_at.toISOString(),
      updatedAt: t.updated_at.toISOString(),
      ...extra,
    };
  }

  private mapMember(m: any): TeamMemberDto {
    return {
      userId: m.user_id,
      username: m.user?.gamer_profile?.username ?? undefined,
      displayName: m.user?.gamer_profile?.display_name ?? undefined,
      avatarUrl: m.user?.gamer_profile?.avatar_url ?? undefined,
      role: m.role,
      joinedAt: m.joined_at.toISOString(),
      leftAt: m.left_at?.toISOString() ?? undefined,
    };
  }

  private mapInvite(i: any): TeamInviteDto {
    return {
      id: i.id,
      teamId: i.team_id ?? i.team.id,
      teamName: i.team?.name,
      teamTag: i.team?.tag ?? undefined,
      teamLogoUrl: i.team?.logo_url ?? undefined,
      inviterId: i.inviter_id,
      inviterUsername: i.inviter?.gamer_profile?.username ?? undefined,
      inviteeId: i.invitee_id,
      inviteeUsername: i.invitee?.gamer_profile?.username ?? undefined,
      status: i.status,
      createdAt: i.created_at.toISOString(),
    };
  }
}
