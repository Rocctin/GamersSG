import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AUTH } from "@gamers-sg/shared/constants";

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
      createdAt: user.created_at.toISOString(),
      gamerProfile: user.gamer_profile
        ? {
            id: user.gamer_profile.id,
            username: user.gamer_profile.username,
            displayName: user.gamer_profile.display_name,
            bio: user.gamer_profile.bio,
            avatarUrl: user.gamer_profile.avatar_url,
            visibility: user.gamer_profile.visibility,
            isMember: user.gamer_profile.is_member,
            pointsBalance: user.gamer_profile.points_balance,
            games: user.gamer_profile.games?.map((g: any) => ({
              id: g.game.id,
              name: g.game.name,
              slug: g.game.slug,
              coverImage: g.game.cover_image,
              category: g.game.category,
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
}
