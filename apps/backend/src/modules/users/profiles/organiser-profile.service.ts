import {
  Injectable,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import type {
  CreateOrganiserProfileDto,
  UpdateOrganiserProfileDto,
} from "@gamers-sg/shared/dto";
import { AccountStatus } from "@gamers-sg/database";

@Injectable()
export class OrganiserProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async createProfile(userId: string, dto: CreateOrganiserProfileDto) {
    // Check user exists and has ORGANISER role
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException("User not found");
    }

    if (user.role !== "ORGANISER") {
      throw new BadRequestException("Only organisers can create an organiser profile");
    }

    // Check if profile already exists
    const existing = await this.prisma.organiserProfile.findUnique({
      where: { user_id: userId },
    });

    if (existing) {
      throw new ConflictException("Organiser profile already exists");
    }

    const profile = await this.prisma.organiserProfile.create({
      data: {
        user_id: userId,
        organisation_name: dto.organisationName,
        organisation_type: dto.organisationType,
        website: dto.website,
        contact_person: dto.contactPerson,
        contact_number: dto.contactNumber,
        description: dto.description,
      },
    });

    // Set user to PENDING for admin review
    await this.prisma.user.update({
      where: { id: userId },
      data: { status: AccountStatus.PENDING },
    });

    return {
      id: profile.id,
      organisationName: profile.organisation_name,
      organisationType: profile.organisation_type,
      website: profile.website,
      contactPerson: profile.contact_person,
      contactNumber: profile.contact_number,
      description: profile.description,
    };
  }

  async updateProfile(userId: string, dto: UpdateOrganiserProfileDto) {
    const profile = await this.prisma.organiserProfile.findUnique({
      where: { user_id: userId },
    });

    if (!profile) {
      throw new BadRequestException("Organiser profile not found. Create one first.");
    }

    const updated = await this.prisma.organiserProfile.update({
      where: { user_id: userId },
      data: {
        ...(dto.organisationName !== undefined && {
          organisation_name: dto.organisationName,
        }),
        ...(dto.organisationType !== undefined && {
          organisation_type: dto.organisationType,
        }),
        ...(dto.website !== undefined && { website: dto.website }),
        ...(dto.contactPerson !== undefined && {
          contact_person: dto.contactPerson,
        }),
        ...(dto.contactNumber !== undefined && {
          contact_number: dto.contactNumber,
        }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });

    // If previously rejected, set back to PENDING for re-review
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.status === AccountStatus.REJECTED) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { status: AccountStatus.PENDING },
      });
    }

    return {
      id: updated.id,
      organisationName: updated.organisation_name,
      organisationType: updated.organisation_type,
      website: updated.website,
      contactPerson: updated.contact_person,
      contactNumber: updated.contact_number,
      description: updated.description,
    };
  }
}
