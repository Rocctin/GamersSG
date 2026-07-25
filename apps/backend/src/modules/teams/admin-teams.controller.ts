import {
  Controller,
  Get,
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
import { TeamsService } from "./teams.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "@gamers-sg/database";
import type { JwtPayload } from "@gamers-sg/shared/types";
import type { UpdateTeamDto, UpdateMemberRoleDto, HardDeleteTeamDto } from "@gamers-sg/shared/dto";

@Controller("admin")
@Roles(Role.ADMIN)
export class AdminTeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get("teams")
  @HttpCode(HttpStatus.OK)
  async listTeams(
    @Query("status") status?: string,
    @Query("search") search?: string,
    @Query("gameId") gameId?: string,
    @Query("isRecruiting") isRecruiting?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    return this.teamsService.adminListTeams({
      status,
      search,
      gameId,
      isRecruiting: isRecruiting !== undefined ? isRecruiting === "true" : undefined,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  @Get("teams/:id")
  @HttpCode(HttpStatus.OK)
  async getTeam(@Param("id") teamId: string) {
    return this.teamsService.adminGetTeam(teamId);
  }

  @Put("teams/:id")
  @HttpCode(HttpStatus.OK)
  async updateTeam(
    @CurrentUser() admin: JwtPayload,
    @Param("id") teamId: string,
    @Body() dto: UpdateTeamDto,
  ) {
    return this.teamsService.update(admin.sub, teamId, dto);
  }

  @Delete("teams/:id")
  @HttpCode(HttpStatus.OK)
  async hardDeleteTeam(
    @CurrentUser() admin: JwtPayload,
    @Param("id") teamId: string,
    @Body() dto: HardDeleteTeamDto,
    @Req() req: Request,
  ) {
    if (!dto.reason?.trim()) {
      throw new BadRequestException("Reason is required for hard deletion");
    }
    const ip = (req.ip || req.socket.remoteAddress) ?? undefined;
    return this.teamsService.adminHardDeleteTeam(teamId, admin.sub, dto.reason, ip);
  }

  @Delete("teams/:id/members/:userId")
  @HttpCode(HttpStatus.OK)
  async removeMember(
    @CurrentUser() admin: JwtPayload,
    @Param("id") teamId: string,
    @Param("userId") memberUserId: string,
  ) {
    return this.teamsService.removeMember(admin.sub, teamId, memberUserId);
  }

  @Put("teams/:id/members/:userId/role")
  @HttpCode(HttpStatus.OK)
  async updateMemberRole(
    @CurrentUser() admin: JwtPayload,
    @Param("id") teamId: string,
    @Param("userId") memberUserId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.teamsService.updateMemberRole(admin.sub, teamId, memberUserId, dto);
  }
}
