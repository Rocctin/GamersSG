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
  BadRequestException,
} from "@nestjs/common";
import { Request } from "express";
import { TournamentsService } from "./tournaments.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import type { JwtPayload } from "@gamers-sg/shared/types";
import { Role } from "@gamers-sg/database";

@Controller("admin")
@Roles(Role.ADMIN)
export class AdminTournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  // ── Tournament Moderation ──

  @Get("tournaments/pending")
  @HttpCode(HttpStatus.OK)
  async listPendingTournaments(
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    return this.tournamentsService.listPendingTournaments(
      page ? parseInt(page) : undefined,
      pageSize ? parseInt(pageSize) : undefined,
    );
  }

  @Post("tournaments/:id/review")
  @HttpCode(HttpStatus.OK)
  async reviewTournament(
    @Param("id") id: string,
    @CurrentUser() admin: JwtPayload,
    @Body("action") action: "APPROVE" | "REJECT",
    @Body("rejectionReason") rejectionReason?: string,
    @Req() req?: Request,
  ) {
    if (action === "REJECT" && !rejectionReason) {
      throw new BadRequestException(
        "Rejection reason is required when rejecting",
      );
    }
    const ip = (req?.ip || req?.socket?.remoteAddress) ?? undefined;
    return this.tournamentsService.reviewTournament(
      id,
      admin.sub,
      action,
      rejectionReason,
      ip,
    );
  }

  // ── Event Moderation ──

  @Get("events/pending")
  @HttpCode(HttpStatus.OK)
  async listPendingEvents(
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    return this.tournamentsService.listPendingEvents(
      page ? parseInt(page) : undefined,
      pageSize ? parseInt(pageSize) : undefined,
    );
  }

  @Post("events/:id/review")
  @HttpCode(HttpStatus.OK)
  async reviewEvent(
    @Param("id") id: string,
    @CurrentUser() admin: JwtPayload,
    @Body("action") action: "APPROVE" | "REJECT",
    @Body("rejectionReason") rejectionReason?: string,
    @Req() req?: Request,
  ) {
    if (action === "REJECT" && !rejectionReason) {
      throw new BadRequestException(
        "Rejection reason is required when rejecting",
      );
    }
    const ip = (req?.ip || req?.socket?.remoteAddress) ?? undefined;
    return this.tournamentsService.reviewEvent(
      id,
      admin.sub,
      action,
      rejectionReason,
      ip,
    );
  }

  // ── Tournament Management ──

  @Get("tournaments")
  @HttpCode(HttpStatus.OK)
  async listAllTournaments(
    @Query("status") status?: string,
    @Query("search") search?: string,
    @Query("gameId") gameId?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    return this.tournamentsService.adminListAllTournaments({
      status,
      search,
      gameId,
      page: page ? parseInt(page) : undefined,
      pageSize: pageSize ? parseInt(pageSize) : undefined,
    });
  }

  @Put("tournaments/:id")
  @HttpCode(HttpStatus.OK)
  async updateTournament(
    @CurrentUser() admin: JwtPayload,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.tournamentsService.updateTournament(id, body, admin.sub);
  }

  @Post("tournaments/:id/status")
  @HttpCode(HttpStatus.OK)
  async updateTournamentStatus(
    @CurrentUser() admin: JwtPayload,
    @Param("id") id: string,
    @Body("status") status?: string,
    @Body("reason") reason?: string,
    @Req() req?: Request,
  ) {
    if (!status) {
      throw new BadRequestException("Status is required");
    }
    const ip = (req?.ip || req?.socket?.remoteAddress) ?? undefined;
    return this.tournamentsService.adminUpdateTournamentStatus(id, admin.sub, status, reason, ip);
  }

  @Delete("tournaments/:id")
  @HttpCode(HttpStatus.OK)
  async deleteTournament(
    @CurrentUser() admin: JwtPayload,
    @Param("id") id: string,
    @Body("reason") reason?: string,
    @Req() req?: Request,
  ) {
    if (!reason?.trim()) {
      throw new BadRequestException("Reason is required for hard deletion");
    }
    const ip = (req?.ip || req?.socket?.remoteAddress) ?? undefined;
    return this.tournamentsService.adminDeleteTournament(id, admin.sub, reason, ip);
  }

  // ── Event Management ──

  @Get("events")
  @HttpCode(HttpStatus.OK)
  async listAllEvents(
    @Query("status") status?: string,
    @Query("search") search?: string,
    @Query("eventType") eventType?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    return this.tournamentsService.adminListAllEvents({
      status,
      search,
      eventType,
      page: page ? parseInt(page) : undefined,
      pageSize: pageSize ? parseInt(pageSize) : undefined,
    });
  }

  @Put("events/:id")
  @HttpCode(HttpStatus.OK)
  async updateEvent(
    @CurrentUser() admin: JwtPayload,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.tournamentsService.updateEvent(id, body, admin.sub);
  }

  @Post("events/:id/status")
  @HttpCode(HttpStatus.OK)
  async updateEventStatus(
    @CurrentUser() admin: JwtPayload,
    @Param("id") id: string,
    @Body("status") status?: string,
    @Body("reason") reason?: string,
    @Req() req?: Request,
  ) {
    if (!status) {
      throw new BadRequestException("Status is required");
    }
    const ip = (req?.ip || req?.socket?.remoteAddress) ?? undefined;
    return this.tournamentsService.adminUpdateEventStatus(id, admin.sub, status, reason, ip);
  }

  @Delete("events/:id")
  @HttpCode(HttpStatus.OK)
  async deleteEvent(
    @CurrentUser() admin: JwtPayload,
    @Param("id") id: string,
    @Body("reason") reason?: string,
    @Req() req?: Request,
  ) {
    if (!reason?.trim()) {
      throw new BadRequestException("Reason is required for hard deletion");
    }
    const ip = (req?.ip || req?.socket?.remoteAddress) ?? undefined;
    return this.tournamentsService.adminDeleteEvent(id, admin.sub, reason, ip);
  }
}
