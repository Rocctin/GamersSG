import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { PAGINATION } from "@gamers-sg/shared/constants";
import type { CreateGameDto, UpdateGameDto } from "@gamers-sg/shared/dto";

@Injectable()
export class GamesService {
  constructor(private readonly prisma: PrismaService) {}

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

  async create(dto: CreateGameDto) {
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

    return { success: true, data: this.mapGame(game) };
  }

  async update(id: string, dto: UpdateGameDto) {
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

    return { success: true, data: this.mapGame(game) };
  }

  async softDelete(id: string) {
    const existing = await this.prisma.game.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException("Game not found");
    }

    await this.prisma.game.update({
      where: { id },
      data: { is_active: false },
    });

    return { success: true, message: "Game has been deactivated" };
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
