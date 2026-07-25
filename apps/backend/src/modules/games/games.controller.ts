import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { Request } from "express";
import { GamesService } from "./games.service";
import { UsersService } from "../users/users.service";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { JwtPayload } from "@gamers-sg/shared/types";
import type { CreateGameDto, UpdateGameDto } from "@gamers-sg/shared/dto";
import { Role } from "@gamers-sg/database";

@Controller("games")
export class GamesController {
  constructor(
    private readonly gamesService: GamesService,
    private readonly usersService: UsersService,
  ) {}

  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query("search") search?: string,
    @Query("category") category?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    return this.gamesService.findAll(
      search,
      category,
      page ? parseInt(page) : 1,
      pageSize ? parseInt(pageSize) : undefined,
    );
  }

  // Must be before :id to avoid route conflict
  @Public()
  @Get(":slug/players")
  @HttpCode(HttpStatus.OK)
  async getPlayers(
    @Param("slug") slug: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.usersService.getPlayersByGameSlug(
      slug,
      user?.sub,
      page ? parseInt(page) : 1,
      pageSize ? parseInt(pageSize) : 20,
    );
  }

  @Public()
  @Get(":id")
  @HttpCode(HttpStatus.OK)
  async findOne(@Param("id") id: string) {
    return this.gamesService.findById(id);
  }

  @Roles(Role.ADMIN)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() admin: JwtPayload,
    @Body() dto: CreateGameDto,
    @Req() req: Request,
  ) {
    const ip = (req.ip || req.socket.remoteAddress) ?? undefined;
    return this.gamesService.create(dto, admin.sub, ip);
  }

  @Roles(Role.ADMIN)
  @Put(":id")
  @HttpCode(HttpStatus.OK)
  async update(
    @CurrentUser() admin: JwtPayload,
    @Param("id") id: string,
    @Body() dto: UpdateGameDto,
    @Req() req: Request,
  ) {
    const ip = (req.ip || req.socket.remoteAddress) ?? undefined;
    return this.gamesService.update(id, dto, admin.sub, ip);
  }

  @Roles(Role.ADMIN)
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  async remove(
    @CurrentUser() admin: JwtPayload,
    @Param("id") id: string,
    @Req() req: Request,
  ) {
    const ip = (req.ip || req.socket.remoteAddress) ?? undefined;
    return this.gamesService.softDelete(id, admin.sub, ip);
  }

  @Roles(Role.ADMIN)
  @Delete(":id/hard")
  @HttpCode(HttpStatus.OK)
  async hardRemove(
    @CurrentUser() admin: JwtPayload,
    @Param("id") id: string,
    @Body("reason") reason?: string,
    @Req() req?: Request,
  ) {
    const ip = (req?.ip || req?.socket?.remoteAddress) ?? undefined;
    return this.gamesService.hardDelete(id, admin.sub, reason ?? "No reason provided", ip);
  }
}
