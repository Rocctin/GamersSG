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
import { AdminService } from "./admin.service";
import { ConnectionsService } from "../connections/connections.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import type { JwtPayload } from "@gamers-sg/shared/types";
import type {
  ReviewOrganiserDto,
  UpdateUserStatusDto,
  UpdateUserRoleDto,
  HardDeleteUserDto,
  AdminUpdateUserProfileDto,
} from "@gamers-sg/shared/dto";
import { Role } from "@gamers-sg/database";

@Controller("admin")
@Roles(Role.ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly connectionsService: ConnectionsService,
  ) {}

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

  @Put("users/:userId/role")
  @HttpCode(HttpStatus.OK)
  async updateUserRole(
    @Param("userId") userId: string,
    @CurrentUser() admin: JwtPayload,
    @Body() dto: UpdateUserRoleDto,
    @Req() req: Request,
  ) {
    const ip = (req.ip || req.socket.remoteAddress) ?? undefined;
    return this.adminService.updateUserRole(userId, admin.sub, dto, ip);
  }

  @Delete("users/:userId")
  @HttpCode(HttpStatus.OK)
  async deleteUser(
    @Param("userId") userId: string,
    @CurrentUser() admin: JwtPayload,
    @Body() dto: HardDeleteUserDto,
    @Req() req: Request,
  ) {
    if (!dto.reason?.trim()) {
      throw new BadRequestException("Reason is required for user deletion");
    }
    const ip = (req.ip || req.socket.remoteAddress) ?? undefined;
    return this.adminService.hardDeleteUser(userId, admin.sub, dto.reason, ip);
  }

  @Put("users/:userId/profile")
  @HttpCode(HttpStatus.OK)
  async updateUserProfile(
    @Param("userId") userId: string,
    @CurrentUser() admin: JwtPayload,
    @Body() dto: AdminUpdateUserProfileDto,
    @Req() req: Request,
  ) {
    const ip = (req.ip || req.socket.remoteAddress) ?? undefined;
    return this.adminService.adminUpdateUserProfile(userId, admin.sub, dto, ip);
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

  // ── Connections Oversight ──

  @Get("connections")
  @HttpCode(HttpStatus.OK)
  async listConnections(
    @Query("status") status?: string,
    @Query("search") search?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    return this.connectionsService.adminListConnections({
      status: status as any,
      search,
      page: page ? parseInt(page) : undefined,
      pageSize: pageSize ? parseInt(pageSize) : undefined,
    });
  }

  @Delete("connections/:id")
  @HttpCode(HttpStatus.OK)
  async removeConnection(
    @CurrentUser() admin: JwtPayload,
    @Param("id") connectionId: string,
  ) {
    return this.connectionsService.removeConnection(admin.sub, connectionId);
  }
}
