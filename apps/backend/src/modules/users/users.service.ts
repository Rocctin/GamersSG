import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AUTH } from "@gamers-sg/shared/constants";
import type {
  UserSearchResultDto,
  PeopleYouMayKnowDto,
  GamePlayerDto,
} from "@gamers-sg/shared/dto";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserWithProfiles(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        gamer_profile: {
          include: {
            games: {
              include: { game: true },
            },
          },
        },
        organiser_profile: true,
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return this.mapUserToProfile(user);
  }

  async getPublicProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        gamer_profile: {
          include: {
            games: {
              include: { game: true },
            },
          },
        },
        organiser_profile: true,
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const profile = this.mapUserToProfile(user);

    // Respect visibility settings for gamer profiles
    if (profile.gamerProfile) {
      if (profile.gamerProfile.visibility === "PRIVATE") {
        delete (profile as any).gamerProfile;
      }
    }

    return profile;
  }

  private mapUserToProfile(user: any) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      phone: user.phone,
      createdAt: user.created_at.toISOString(),
      gamerProfile: user.gamer_profile
        ? {
            id: user.gamer_profile.id,
            username: user.gamer_profile.username,
            displayName: user.gamer_profile.display_name,
            bio: user.gamer_profile.bio,
            avatarUrl: user.gamer_profile.avatar_url,
            bannerUrl: user.gamer_profile.banner_url,
            visibility: user.gamer_profile.visibility,
            isMember: user.gamer_profile.is_member,
            pointsBalance: user.gamer_profile.points_balance,
            games: user.gamer_profile.games?.map((g: any) => ({
              id: g.game.id,
              name: g.game.name,
              slug: g.game.slug,
              coverImage: g.game.cover_image,
              category: g.game.category,
              isActive: g.game.is_active,
              createdAt: g.game.created_at.toISOString(),
              inGameRole: g.in_game_role,
            })),
          }
        : undefined,
      organiserProfile: user.organiser_profile
        ? {
            id: user.organiser_profile.id,
            organisationName: user.organiser_profile.organisation_name,
            organisationType: user.organiser_profile.organisation_type,
            website: user.organiser_profile.website,
            contactPerson: user.organiser_profile.contact_person,
            contactNumber: user.organiser_profile.contact_number,
            description: user.organiser_profile.description,
          }
        : undefined,
    };
  }

  // ── Discovery: Search ──

  async searchUsers(
    query: string,
    viewerId?: string,
    gameId?: string,
    page = 1,
    pageSize = 20,
  ) {
    const skip = (page - 1) * pageSize;

    const where: any = {
      gamer_profile: {
        visibility: { not: "PRIVATE" },
        username: { contains: query, mode: "insensitive" },
      },
      status: { not: "SUSPENDED" },
    };

    // Optionally filter by game
    if (gameId) {
      where.gamer_profile.games = { some: { game_id: gameId } };
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          gamer_profile: {
            include: { games: { include: { game: true } } },
          },
        },
        skip,
        take: Math.min(pageSize, 50),
        orderBy: { created_at: "desc" },
      }),
      this.prisma.user.count({ where }),
    ]);

    // If viewer is authenticated, enrich with connection status
    let connectionIds = new Set<string>();
    if (viewerId) {
      const connections = await this.prisma.connection.findMany({
        where: {
          status: "ACCEPTED",
          OR: [
            { requester_id: viewerId, addressee_id: { in: users.map((u) => u.id) } },
            { addressee_id: viewerId, requester_id: { in: users.map((u) => u.id) } },
          ],
        },
      });
      connections.forEach((c) => {
        connectionIds.add(c.requester_id === viewerId ? c.addressee_id : c.requester_id);
      });
    }

    const results: UserSearchResultDto[] = users
      .filter((u) => u.gamer_profile)
      .map((u) => ({
        userId: u.id,
        username: u.gamer_profile!.username,
        displayName: u.gamer_profile!.display_name ?? undefined,
        avatarUrl: u.gamer_profile!.avatar_url ?? undefined,
        bio: u.gamer_profile!.bio ?? undefined,
        games: u.gamer_profile!.games.map((g: any) => ({
          id: g.game.id,
          name: g.game.name,
          slug: g.game.slug,
          coverImage: g.game.cover_image ?? undefined,
          category: g.game.category ?? undefined,
          isActive: g.game.is_active,
          createdAt: g.game.created_at.toISOString(),
          inGameRole: g.in_game_role ?? undefined,
        })),
        isConnected: connectionIds.has(u.id),
      }));

    return { results, total, page, pageSize };
  }

  // ── Discovery: People You May Know ──

  async peopleYouMayKnow(userId: string): Promise<PeopleYouMayKnowDto[]> {
    // Gather the viewer's data to compare
    const myProfile = await this.prisma.gamerProfile.findUnique({
      where: { user_id: userId },
      include: { games: true },
    });

    if (!myProfile) return [];

    const myGameIds = myProfile.games.map((g) => g.game_id);

    // Get existing connections and pending requests (both directions)
    const allConnections = await this.prisma.connection.findMany({
      where: {
        OR: [{ requester_id: userId }, { addressee_id: userId }],
      },
    });

    const excludedUserIds = new Set<string>();
    excludedUserIds.add(userId);
    allConnections.forEach((c) => {
      excludedUserIds.add(c.requester_id === userId ? c.addressee_id : c.requester_id);
    });

    // Get all other users
    const candidates = await this.prisma.user.findMany({
      where: {
        id: { notIn: Array.from(excludedUserIds) },
        status: { not: "SUSPENDED" },
        gamer_profile: {
          visibility: { not: "PRIVATE" },
        },
      },
      include: {
        gamer_profile: {
          include: { games: { include: { game: true } } },
          },
      },
      take: 200,
    });

    // Get my connections (for mutual count)
    const myConnectionIds = allConnections
      .filter((c) => c.status === "ACCEPTED")
      .map((c) => (c.requester_id === userId ? c.addressee_id : c.requester_id));

    // Score each candidate
    const scored = await Promise.all(
      candidates
        .filter((c) => c.gamer_profile)
        .map(async (candidate) => {
          const profile = candidate.gamer_profile!;
          const candidateGameIds = profile.games.map((g) => g.game_id);

          // Shared games count
          const sharedGameIds = myGameIds.filter((id) => candidateGameIds.includes(id));
          const sharedGamesCount = sharedGameIds.length;

          // Mutual connections
          const candidateConnections = await this.prisma.connection.findMany({
            where: {
              status: "ACCEPTED",
              OR: [{ requester_id: candidate.id }, { addressee_id: candidate.id }],
            },
          });

          const candidateConnectionIds = candidateConnections.map((c) =>
            c.requester_id === candidate.id ? c.addressee_id : c.requester_id,
          );
          const mutualConnectionCount = myConnectionIds.filter((id) =>
            candidateConnectionIds.includes(id),
          ).length;

          // Determine reason
          let reason = "";
          if (sharedGamesCount >= 3) {
            reason = `${sharedGamesCount} shared games`;
          } else if (mutualConnectionCount >= 2) {
            reason = `Connected to ${mutualConnectionCount} of your connections`;
          } else if (sharedGamesCount > 0) {
            reason = `${sharedGamesCount} shared game${sharedGamesCount > 1 ? "s" : ""}`;
          } else if (mutualConnectionCount > 0) {
            reason = "Mutual connection";
          } else {
            reason = "Fellow gamer in Singapore";
          }

          // Score: shared games (weight 3) + mutual connections (weight 5)
          const score = sharedGamesCount * 3 + mutualConnectionCount * 5;

          return {
            userId: candidate.id,
            username: profile.username,
            displayName: profile.display_name ?? undefined,
            avatarUrl: profile.avatar_url ?? undefined,
            mutualConnectionCount,
            sharedGamesCount,
            reason,
            score,
          };
        }),
    );

    // Sort by score descending and take top 20
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map(({ score, ...rest }) => rest);
  }

  // ── Discovery: Players by Game ──

  async getPlayersByGameSlug(
    slug: string,
    viewerId?: string,
    page = 1,
    pageSize = 20,
  ): Promise<{ players: GamePlayerDto[]; total: number; page: number; pageSize: number }> {
    const game = await this.prisma.game.findUnique({ where: { slug } });
    if (!game) throw new NotFoundException("Game not found");

    const skip = (page - 1) * pageSize;

    const where: any = {
      game_id: game.id,
      gamer_profile: {
        visibility: { not: "PRIVATE" },
        user: { status: { not: "SUSPENDED" } },
      },
    };

    const [profileGames, total] = await Promise.all([
      this.prisma.gamerProfileGame.findMany({
        where,
        include: {
          profile: {
            include: { user: true },
          },
        },
        skip,
        take: Math.min(pageSize, 50),
      }),
      this.prisma.gamerProfileGame.count({ where }),
    ]);

    // If viewer, get connection statuses
    let connectionIds = new Set<string>();
    if (viewerId) {
      const userIds = profileGames.map((pg) => pg.profile.user_id);
      const connections = await this.prisma.connection.findMany({
        where: {
          status: "ACCEPTED",
          OR: [
            { requester_id: viewerId, addressee_id: { in: userIds } },
            { addressee_id: viewerId, requester_id: { in: userIds } },
          ],
        },
      });
      connections.forEach((c) => {
        connectionIds.add(c.requester_id === viewerId ? c.addressee_id : c.requester_id);
      });
    }

    const players: GamePlayerDto[] = profileGames.map((pg) => ({
      userId: pg.profile.user_id,
      username: pg.profile.username,
      displayName: pg.profile.display_name ?? undefined,
      avatarUrl: pg.profile.avatar_url ?? undefined,
      inGameRole: pg.in_game_role ?? undefined,
      isConnected: connectionIds.has(pg.profile.user_id),
    }));

    return { players, total, page, pageSize };
  }
}
