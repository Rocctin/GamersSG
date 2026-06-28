import {
  Controller,
  Get,
  Post,
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
}
