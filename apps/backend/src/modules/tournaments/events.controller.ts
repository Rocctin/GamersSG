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
  CreateEventDto,
  UpdateEventDto,
} from "@gamers-sg/shared/dto";
import { Role } from "@gamers-sg/database";

@Controller("events")
export class EventsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  // ── Public ──

  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  async listEvents(
    @Query("search") search?: string,
    @Query("eventType") eventType?: string,
    @Query("isOnline") isOnline?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    return this.tournamentsService.listEvents({
      search,
      eventType: eventType as any,
      isOnline: isOnline !== undefined ? isOnline === "true" : undefined,
      page: page ? parseInt(page) : undefined,
      pageSize: pageSize ? parseInt(pageSize) : undefined,
    });
  }

  // ── Organiser: My Events (must be before :id) ──

  @Get("mine")
  @Roles(Role.ORGANISER)
  @HttpCode(HttpStatus.OK)
  async listMyEvents(
    @CurrentUser() user: JwtPayload,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    return this.tournamentsService.listMyEvents(
      user.sub,
      page ? parseInt(page) : undefined,
      pageSize ? parseInt(pageSize) : undefined,
    );
  }

  // ── Public detail (after literal routes) ──

  @Public()
  @Get(":id")
  @HttpCode(HttpStatus.OK)
  async getEvent(
    @Param("id") id: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.tournamentsService.getEventById(id, user?.sub);
  }

  // ── Organiser CRUD ──

  @Roles(Role.ORGANISER)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createEvent(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateEventDto,
    @Req() req: Request,
  ) {
    const ip = (req.ip || req.socket.remoteAddress) ?? undefined;
    return this.tournamentsService.createEvent(dto, user.sub, ip);
  }

  @Roles(Role.ORGANISER)
  @Put(":id")
  @HttpCode(HttpStatus.OK)
  async updateEvent(
    @Param("id") id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateEventDto,
  ) {
    return this.tournamentsService.updateEvent(id, dto, user.sub);
  }

  @Roles(Role.ORGANISER)
  @Post(":id/submit")
  @HttpCode(HttpStatus.OK)
  async submitEvent(
    @Param("id") id: string,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const ip = (req.ip || req.socket.remoteAddress) ?? undefined;
    return this.tournamentsService.submitEvent(id, user.sub, ip);
  }

  @Roles(Role.ORGANISER)
  @Post(":id/cancel")
  @HttpCode(HttpStatus.OK)
  async cancelEvent(
    @Param("id") id: string,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const ip = (req.ip || req.socket.remoteAddress) ?? undefined;
    return this.tournamentsService.cancelEvent(id, user.sub, ip);
  }

  // ── Registration ──

  @Post(":id/register")
  @HttpCode(HttpStatus.CREATED)
  async registerForEvent(
    @Param("id") id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tournamentsService.registerForEvent(id, user.sub);
  }

  @Delete(":id/registrations/me")
  @HttpCode(HttpStatus.OK)
  async cancelMyRegistration(
    @Param("id") id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tournamentsService.cancelMyEventRegistration(id, user.sub);
  }

  @Get(":id/registrations")
  @HttpCode(HttpStatus.OK)
  async listRegistrations(
    @Param("id") id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tournamentsService.listEventRegistrations(id, user.sub);
  }
}
