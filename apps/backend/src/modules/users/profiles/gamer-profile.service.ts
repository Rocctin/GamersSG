import { Injectable, ConflictException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { AUTH } from "@gamers-sg/shared/constants";
import type { UpdateGamerProfileDto } from "@gamers-sg/shared/dto";

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
      visibility: updated.visibility,
      isMember: updated.is_member,
      pointsBalance: updated.points_balance,
      games: gameEntries.map((g) => ({
        id: g.game.id,
        name: g.game.name,
        slug: g.game.slug,
        coverImage: g.game.cover_image,
        category: g.game.category,
        inGameRole: g.in_game_role,
      })),
    };
  }
}
