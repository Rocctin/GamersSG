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
import { TournamentsService } from "./tournaments.service";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { JwtPayload } from "@gamers-sg/shared/types";
import type {
  CreateTournamentDto,
  UpdateTournamentDto,
} from "@gamers-sg/shared/dto";
import { Role } from "@gamers-sg/database";

@Controller("tournaments")
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  // ── Public ──

  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  async listTournaments(
    @Query("search") search?: string,
    @Query("gameId") gameId?: string,
    @Query("format") format?: string,
    @Query("isTeamBased") isTeamBased?: string,
    @Query("isOnline") isOnline?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    return this.tournamentsService.listTournaments({
      search,
      gameId,
      format: format as any,
      isTeamBased: isTeamBased !== undefined ? isTeamBased === "true" : undefined,
      isOnline: isOnline !== undefined ? isOnline === "true" : undefined,
      page: page ? parseInt(page) : undefined,
      pageSize: pageSize ? parseInt(pageSize) : undefined,
    });
  }

  // ── Organiser: My Tournaments (must be before :id) ──

  @Get("mine")
  @Roles(Role.ORGANISER)
  @HttpCode(HttpStatus.OK)
  async listMyTournaments(
    @CurrentUser() user: JwtPayload,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    return this.tournamentsService.listMyTournaments(
      user.sub,
      page ? parseInt(page) : undefined,
      pageSize ? parseInt(pageSize) : undefined,
    );
  }

  // ── Public detail (after literal routes) ──

  @Public()
  @Get(":id")
  @HttpCode(HttpStatus.OK)
  async getTournament(
    @Param("id") id: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.tournamentsService.getTournamentById(id, user?.sub);
  }

  // ── Organiser CRUD ──

  @Roles(Role.ORGANISER)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTournament(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateTournamentDto,
    @Req() req: Request,
  ) {
    const ip = (req.ip || req.socket.remoteAddress) ?? undefined;
    return this.tournamentsService.createTournament(dto, user.sub, ip);
  }

  @Roles(Role.ORGANISER)
  @Put(":id")
  @HttpCode(HttpStatus.OK)
  async updateTournament(
    @Param("id") id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateTournamentDto,
  ) {
    return this.tournamentsService.updateTournament(id, dto, user.sub);
  }

  @Roles(Role.ORGANISER)
  @Post(":id/submit")
  @HttpCode(HttpStatus.OK)
  async submitTournament(
    @Param("id") id: string,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const ip = (req.ip || req.socket.remoteAddress) ?? undefined;
    return this.tournamentsService.submitTournament(id, user.sub, ip);
  }

  @Roles(Role.ORGANISER)
  @Post(":id/cancel")
  @HttpCode(HttpStatus.OK)
  async cancelTournament(
    @Param("id") id: string,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const ip = (req.ip || req.socket.remoteAddress) ?? undefined;
    return this.tournamentsService.cancelTournament(id, user.sub, ip);
  }

  // ── Registration ──

  @Post(":id/register")
  @HttpCode(HttpStatus.CREATED)
  async registerForTournament(
    @Param("id") id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tournamentsService.registerForTournament(id, user.sub, { tournamentId: id });
  }

  @Delete(":id/registrations/me")
  @HttpCode(HttpStatus.OK)
  async cancelMyRegistration(
    @Param("id") id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tournamentsService.cancelMyRegistration(id, user.sub);
  }

  @Get(":id/registrations")
  @HttpCode(HttpStatus.OK)
  async listRegistrations(
    @Param("id") id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tournamentsService.listTournamentRegistrations(id, user.sub);
  }
}
