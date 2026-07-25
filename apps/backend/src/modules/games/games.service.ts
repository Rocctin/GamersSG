import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { AuditAction } from "@gamers-sg/database";
import { PAGINATION } from "@gamers-sg/shared/constants";
import type { CreateGameDto, UpdateGameDto } from "@gamers-sg/shared/dto";

@Injectable()
export class GamesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findBySlug(slug: string) {
    const game = await this.prisma.game.findUnique({ where: { slug } });
    if (!game) throw new NotFoundException("Game not found");
    return game;
  }

  async findAll(
    search?: string,
    category?: string,
    page: number = 1,
    pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE,
  ) {
    const skip = (page - 1) * pageSize;

    const where: any = { is_active: true };

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    if (category) {
      where.category = category;
    }

    const [games, total] = await Promise.all([
      this.prisma.game.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { name: "asc" },
      }),
      this.prisma.game.count({ where }),
    ]);

    const data = games.map((g) => this.mapGame(g));

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

  async findById(id: string) {
    const game = await this.prisma.game.findUnique({
      where: { id },
    });

    if (!game) {
      throw new NotFoundException("Game not found");
    }

    return { success: true, data: this.mapGame(game) };
  }

  async create(dto: CreateGameDto, adminId?: string, ip?: string) {
    const slug = dto.slug || this.generateSlug(dto.name);

    // Check slug uniqueness
    const existing = await this.prisma.game.findUnique({
      where: { slug },
    });
    if (existing) {
      throw new ConflictException("A game with this slug already exists");
    }

    const game = await this.prisma.game.create({
      data: {
        name: dto.name,
        slug,
        cover_image: dto.coverImage,
        category: dto.category,
      },
    });

    if (adminId) {
      await this.auditService.log({
        actorId: adminId,
        action: AuditAction.GAME_CREATED,
        targetId: game.id,
        targetType: "game",
        metadata: { name: game.name, slug: game.slug, category: game.category },
        ipAddress: ip,
      });
    }

    return { success: true, data: this.mapGame(game) };
  }

  async update(id: string, dto: UpdateGameDto, adminId?: string, ip?: string) {
    const existing = await this.prisma.game.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException("Game not found");
    }

    // If slug is being changed, check uniqueness
    if (dto.slug && dto.slug !== existing.slug) {
      const slugTaken = await this.prisma.game.findUnique({
        where: { slug: dto.slug },
      });
      if (slugTaken) {
        throw new ConflictException("A game with this slug already exists");
      }
    }

    const game = await this.prisma.game.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.coverImage !== undefined && { cover_image: dto.coverImage }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.isActive !== undefined && { is_active: dto.isActive }),
      },
    });

    if (adminId) {
      const changedFields = Object.keys(dto);
      await this.auditService.log({
        actorId: adminId,
        action: AuditAction.GAME_UPDATED,
        targetId: game.id,
        targetType: "game",
        metadata: { name: game.name, changedFields },
        ipAddress: ip,
      });
    }

    return { success: true, data: this.mapGame(game) };
  }

  async softDelete(id: string, adminId?: string, ip?: string) {
    const existing = await this.prisma.game.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException("Game not found");
    }

    await this.prisma.game.update({
      where: { id },
      data: { is_active: false },
    });

    if (adminId) {
      await this.auditService.log({
        actorId: adminId,
        action: AuditAction.GAME_UPDATED,
        targetId: existing.id,
        targetType: "game",
        metadata: { name: existing.name, deactivated: true },
        ipAddress: ip,
      });
    }

    return { success: true, message: "Game has been deactivated" };
  }

  async hardDelete(id: string, adminId: string, reason: string, ip?: string) {
    const game = await this.prisma.game.findUnique({ where: { id } });
    if (!game) throw new NotFoundException("Game not found");

    // Check if any tournaments reference this game (has required game_id)
    const tournamentCount = await this.prisma.tournament.count({
      where: { game_id: id },
    });
    if (tournamentCount > 0) {
      throw new BadRequestException(
        `Cannot delete game "${game.name}": ${tournamentCount} tournament(s) reference it. Remove or reassign those tournaments first.`,
      );
    }

    // Delete profile-game associations first, then the game
    await this.prisma.$transaction([
      this.prisma.gamerProfileGame.deleteMany({ where: { game_id: id } }),
      this.prisma.teamGame.deleteMany({ where: { game_id: id } }),
      this.prisma.game.delete({ where: { id } }),
    ]);

    await this.auditService.log({
      actorId: adminId,
      action: AuditAction.GAME_DELETED,
      targetId: id,
      targetType: "game",
      metadata: { name: game.name, slug: game.slug, reason },
      ipAddress: ip,
    });

    return { success: true, message: `Game "${game.name}" permanently deleted` };
  }

  // ── Helpers ──

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[\s]+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  private mapGame(game: any) {
    return {
      id: game.id,
      name: game.name,
      slug: game.slug,
      coverImage: game.cover_image,
      category: game.category,
      isActive: game.is_active,
      createdAt: game.created_at.toISOString(),
    };
  }
}
