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
import { AdminService } from "./admin.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import type { JwtPayload } from "@gamers-sg/shared/types";
import type { ReviewOrganiserDto, UpdateUserStatusDto } from "@gamers-sg/shared/dto";
import { Role } from "@gamers-sg/database";

@Controller("admin")
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("organisers")
  @HttpCode(HttpStatus.OK)
  async listPendingOrganisers(
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    return this.adminService.listPendingOrganisers(
      page ? parseInt(page) : 1,
      pageSize ? parseInt(pageSize) : undefined,
    );
  }

  @Post("organisers/:userId/review")
  @HttpCode(HttpStatus.OK)
  async reviewOrganiser(
    @Param("userId") userId: string,
    @CurrentUser() admin: JwtPayload,
    @Body() dto: ReviewOrganiserDto,
    @Req() req: Request,
  ) {
    if (dto.action === "REJECT" && !dto.rejectionReason) {
      throw new BadRequestException("Rejection reason is required when rejecting");
    }
    const ip = (req.ip || req.socket.remoteAddress) ?? undefined;
    return this.adminService.reviewOrganiser(userId, admin.sub, dto, ip);
  }

  @Get("users")
  @HttpCode(HttpStatus.OK)
  async listUsers(
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("search") search?: string,
    @Query("role") role?: string,
    @Query("status") status?: string,
  ) {
    return this.adminService.listUsers(
      page ? parseInt(page) : 1,
      pageSize ? parseInt(pageSize) : undefined,
      search,
      role,
      status,
    );
  }

  @Post("users/:userId/status")
  @HttpCode(HttpStatus.OK)
  async updateUserStatus(
    @Param("userId") userId: string,
    @CurrentUser() admin: JwtPayload,
    @Body() dto: UpdateUserStatusDto,
    @Req() req: Request,
  ) {
    const ip = (req.ip || req.socket.remoteAddress) ?? undefined;
    return this.adminService.updateUserStatus(userId, admin.sub, dto, ip);
  }

  @Get("audit-logs")
  @HttpCode(HttpStatus.OK)
  async getAuditLogs(
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    return this.adminService.getAuditLogs(
      page ? parseInt(page) : 1,
      pageSize ? parseInt(pageSize) : undefined,
    );
  }
}
