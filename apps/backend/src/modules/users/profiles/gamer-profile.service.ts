import {
  Injectable,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { AUTH } from "@gamers-sg/shared/constants";
import type { UpdateGamerProfileDto } from "@gamers-sg/shared/dto";
import type {
  EnhancedGamerProfileDto,
  TournamentHistoryEntryDto,
  EventHistoryEntryDto,
  ProfileCompletenessDto,
  ConnectionStatusInfo,
} from "@gamers-sg/shared/dto";

@Injectable()
export class GamerProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProfile(userId: string, dto: UpdateGamerProfileDto) {
    // Ensure gamer profile exists
    let profile = await this.prisma.gamerProfile.findUnique({
      where: { user_id: userId },
    });

    if (!profile) {
      // Auto-create gamer profile if user is GAMER role
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new BadRequestException("User not found");

      // Generate a default username if needed
      const defaultUsername = `gamer_${userId.substring(0, 8)}`;
      profile = await this.prisma.gamerProfile.create({
        data: {
          user_id: userId,
          username: dto.username || defaultUsername,
        },
      });
    }

    // Username change validation
    if (dto.username && dto.username !== profile.username) {
      // Check 90-day cooldown
      if (profile.username_changed_at) {
        const cooldownEnd = new Date(
          profile.username_changed_at.getTime() +
            AUTH.USERNAME_CHANGE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000,
        );
        if (new Date() < cooldownEnd) {
          throw new BadRequestException(
            `Username can only be changed once every ${AUTH.USERNAME_CHANGE_COOLDOWN_DAYS} days. Next change available after ${cooldownEnd.toISOString()}`,
          );
        }
      }

      // Check uniqueness
      const existing = await this.prisma.gamerProfile.findUnique({
        where: { username: dto.username },
      });
      if (existing && existing.user_id !== userId) {
        throw new ConflictException("Username is already taken");
      }
    }

    // Update
    const updated = await this.prisma.gamerProfile.update({
      where: { user_id: userId },
      data: {
        ...(dto.username && { username: dto.username }),
        ...(dto.username && dto.username !== profile.username
          ? { username_changed_at: new Date() }
          : {}),
        ...(dto.displayName !== undefined && { display_name: dto.displayName }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.avatarUrl !== undefined && { avatar_url: dto.avatarUrl }),
        ...(dto.bannerUrl !== undefined && { banner_url: dto.bannerUrl }),
        ...(dto.visibility !== undefined && { visibility: dto.visibility }),
      },
    });

    // Handle game selections
    if (dto.gameIds !== undefined) {
      // Clear existing game associations
      await this.prisma.gamerProfileGame.deleteMany({
        where: { profile_id: profile.id },
      });

      // Insert new game associations
      if (dto.gameIds.length > 0) {
        await this.prisma.gamerProfileGame.createMany({
          data: dto.gameIds.map((g) => ({
            profile_id: profile.id,
            game_id: g.gameId,
            in_game_role: g.inGameRole || null,
          })),
        });
      }
    }

    // Fetch games for response
    const gameEntries = await this.prisma.gamerProfileGame.findMany({
      where: { profile_id: profile.id },
      include: { game: true },
    });

    return {
      id: updated.id,
      username: updated.username,
      displayName: updated.display_name,
      bio: updated.bio,
      avatarUrl: updated.avatar_url,
      bannerUrl: updated.banner_url,
      visibility: updated.visibility,
      isMember: updated.is_member,
      pointsBalance: updated.points_balance,
      games: gameEntries.map((g) => ({
        id: g.game.id,
        name: g.game.name,
        slug: g.game.slug,
        coverImage: g.game.cover_image,
        category: g.game.category,
        isActive: g.game.is_active,
        createdAt: g.game.created_at.toISOString(),
        inGameRole: g.in_game_role,
      })),
    };
  }

  /**
   * Fetch a public gamer profile by username, with tournament/event history
   * and profile completeness. Respects visibility settings.
   */
  async getPublicProfileByUsername(
    username: string,
    viewerId?: string,
  ): Promise<EnhancedGamerProfileDto | null> {
    const profile = await this.prisma.gamerProfile.findUnique({
      where: { username },
      include: {
        user: true,
        games: {
          include: { game: true },
        },
      },
    });

    if (!profile) return null;

    // Respect visibility
    if (profile.visibility === "PRIVATE" && profile.user_id !== viewerId) {
      return null;
    }

    const userId = profile.user_id;
    const isOwnProfile = viewerId === userId;

    // Fetch tournament history
    const tournamentRegistrations =
      await this.prisma.tournamentRegistration.findMany({
        where: { user_id: userId, status: { not: "CANCELLED" } },
        include: {
          tournament: {
            include: {
              game: { select: { id: true, name: true, slug: true, cover_image: true } },
            },
          },
        },
        orderBy: { registered_at: "desc" },
        take: 50,
      });

    const tournamentHistory: TournamentHistoryEntryDto[] =
      tournamentRegistrations.map((r) => ({
        tournamentId: r.tournament.id,
        tournamentName: r.tournament.name,
        gameId: r.tournament.game.id,
        gameName: r.tournament.game.name,
        gameSlug: r.tournament.game.slug,
        gameCoverImage: r.tournament.game.cover_image ?? undefined,
        status: r.tournament.status,
        placement: undefined, // achievements not yet implemented
        registeredAt: r.registered_at.toISOString(),
      }));

    // Fetch event history
    const eventRegistrations = await this.prisma.eventRegistration.findMany({
      where: { user_id: userId, status: { not: "CANCELLED" } },
      include: { event: true },
      orderBy: { registered_at: "desc" },
      take: 50,
    });

    const eventHistory: EventHistoryEntryDto[] = eventRegistrations.map((r) => ({
      eventId: r.event.id,
      eventName: r.event.name,
      eventType: r.event.event_type,
      status: r.event.status,
      registeredAt: r.registered_at.toISOString(),
    }));

    // Team memberships
    const teamMemberships = await this.prisma.teamMember.findMany({
      where: { user_id: userId },
      include: { team: true },
      orderBy: { joined_at: "desc" },
    });

    const currentTeams = teamMemberships
      .filter((m) => !m.left_at && m.team.status === "ACTIVE")
      .map((m) => ({
        teamId: m.team.id,
        teamName: m.team.name,
        teamTag: m.team.tag,
        teamLogoUrl: m.team.logo_url ?? undefined,
        role: m.role,
        joinedAt: m.joined_at.toISOString(),
      }));

    const pastTeams = teamMemberships
      .filter((m) => m.left_at || m.team.status !== "ACTIVE")
      .map((m) => ({
        teamId: m.team.id,
        teamName: m.team.name,
        teamTag: m.team.tag,
        teamLogoUrl: m.team.logo_url ?? undefined,
        role: m.role,
        joinedAt: m.joined_at.toISOString(),
        leftAt: m.left_at?.toISOString() ?? undefined,
      }));

    // Connection count
    const connectionsCount = await this.prisma.connection.count({
      where: {
        status: "ACCEPTED",
        OR: [{ requester_id: userId }, { addressee_id: userId }],
      },
    });

    // Connection status with viewer
    let connectionStatus: ConnectionStatusInfo | undefined;
    let mutualConnectionsCount: number | undefined;

    if (viewerId && !isOwnProfile) {
      const connection = await this.prisma.connection.findFirst({
        where: {
          OR: [
            { requester_id: viewerId, addressee_id: userId },
            { requester_id: userId, addressee_id: viewerId },
          ],
        },
      });

      if (connection) {
        if (connection.status === "ACCEPTED") {
          connectionStatus = {
            state: "ACCEPTED",
            connectionId: connection.id,
          };
        } else if (connection.status === "PENDING") {
          connectionStatus = {
            state:
              connection.requester_id === viewerId
                ? "PENDING_SENT"
                : "PENDING_RECEIVED",
            connectionId: connection.id,
          };
        }
      }
    }

    // Profile completeness
    const profileCompleteness = this.computeProfileCompleteness({
      avatarUrl: profile.avatar_url ?? undefined,
      bannerUrl: profile.banner_url ?? undefined,
      displayName: profile.display_name ?? undefined,
      bio: profile.bio ?? undefined,
      gamesCount: profile.games.length,
      connectionsCount,
    });

    const games = profile.games.map((g) => ({
      id: g.game.id,
      name: g.game.name,
      slug: g.game.slug,
      coverImage: g.game.cover_image ?? undefined,
      category: g.game.category ?? undefined,
      isActive: g.game.is_active,
      createdAt: g.game.created_at.toISOString(),
      inGameRole: g.in_game_role ?? undefined,
    }));

    return {
      id: profile.id,
      userId: profile.user_id,
      username: profile.username,
      displayName: profile.display_name ?? undefined,
      bio: profile.bio ?? undefined,
      avatarUrl: profile.avatar_url ?? undefined,
      bannerUrl: profile.banner_url ?? undefined,
      visibility: profile.visibility,
      isMember: profile.is_member,
      pointsBalance: profile.points_balance,
      connectionsCount,
      mutualConnectionsCount,
      connectionStatus,
      games,
      tournamentHistory,
      eventHistory,
      currentTeams,
      pastTeams,
      profileCompleteness,
    };
  }

  /**
   * Compute profile completeness score and label.
   * Scoring:
   *   avatar set: 20, displayName set: 15, bio set: 15,
   *   ≥1 game: 20, banner set: 10, ≥3 games: 10, ≥1 connection: 10
   * Labels: Beginner (0-39), Intermediate (40-69), All-Star (70-100)
   */
  computeProfileCompleteness(input: {
    avatarUrl?: string;
    bannerUrl?: string;
    displayName?: string;
    bio?: string;
    gamesCount: number;
    connectionsCount: number;
  }): ProfileCompletenessDto {
    const missingFields: string[] = [];
    let score = 0;
    const maxScore = 100;

    if (input.avatarUrl) score += 20;
    else missingFields.push("avatar");

    if (input.displayName) score += 15;
    else missingFields.push("displayName");

    if (input.bio) score += 15;
    else missingFields.push("bio");

    if (input.gamesCount >= 1) score += 20;
    else missingFields.push("games");

    if (input.bannerUrl) score += 10;
    else missingFields.push("banner");

    if (input.gamesCount >= 3) score += 10;
    else if (input.gamesCount >= 1) missingFields.push("moreGames");

    if (input.connectionsCount >= 1) score += 10;
    else missingFields.push("connections");

    let label: string;
    if (score >= 70) label = "All-Star";
    else if (score >= 40) label = "Intermediate";
    else label = "Beginner";

    return { score, maxScore, missingFields, label };
  }
}
