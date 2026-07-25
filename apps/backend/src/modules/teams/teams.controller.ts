import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { TeamsService } from "./teams.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import type { JwtPayload } from "@gamers-sg/shared/types";
import type {
  CreateTeamDto,
  UpdateTeamDto,
  InviteUserDto,
  UpdateMemberRoleDto,
} from "@gamers-sg/shared/dto";
import { Role } from "@gamers-sg/database";

@Controller("teams")
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  // ── Create ──

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.GAMER)
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateTeamDto) {
    return this.teamsService.create(user.sub, dto);
  }

  // ── Literal routes (must precede :id) ──

  @Get("my/teams")
  @HttpCode(HttpStatus.OK)
  @Roles(Role.GAMER)
  async getMyTeams(@CurrentUser() user: JwtPayload) {
    return this.teamsService.getMyTeams(user.sub);
  }

  @Get("my/invites")
  @HttpCode(HttpStatus.OK)
  @Roles(Role.GAMER)
  async getMyInvites(@CurrentUser() user: JwtPayload) {
    return this.teamsService.getMyInvites(user.sub);
  }

  // ── Public list ──

  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  async list(
    @Query("status") status?: string,
    @Query("search") search?: string,
    @Query("gameId") gameId?: string,
    @Query("isRecruiting") isRecruiting?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    return this.teamsService.listTeams({
      status,
      search,
      gameId,
      isRecruiting: isRecruiting !== undefined ? isRecruiting === "true" : undefined,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  // ── Team detail (must be after literals) ──

  @Public()
  @Get(":id")
  @HttpCode(HttpStatus.OK)
  async getById(@Param("id") teamId: string) {
    return this.teamsService.getById(teamId);
  }

  @Put(":id")
  @HttpCode(HttpStatus.OK)
  @Roles(Role.GAMER)
  async update(
    @CurrentUser() user: JwtPayload,
    @Param("id") teamId: string,
    @Body() dto: UpdateTeamDto,
  ) {
    return this.teamsService.update(user.sub, teamId, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @Roles(Role.GAMER)
  async disband(@CurrentUser() user: JwtPayload, @Param("id") teamId: string) {
    return this.teamsService.disband(user.sub, teamId);
  }

  // ── Invites ──

  @Post(":id/invites")
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.GAMER)
  async inviteUser(
    @CurrentUser() user: JwtPayload,
    @Param("id") teamId: string,
    @Body() dto: InviteUserDto,
  ) {
    return this.teamsService.inviteUser(user.sub, teamId, dto);
  }

  @Put(":id/invites/:inviteId/accept")
  @HttpCode(HttpStatus.OK)
  @Roles(Role.GAMER)
  async acceptInvite(
    @CurrentUser() user: JwtPayload,
    @Param("inviteId") inviteId: string,
  ) {
    return this.teamsService.acceptInvite(user.sub, inviteId);
  }

  @Put(":id/invites/:inviteId/reject")
  @HttpCode(HttpStatus.OK)
  @Roles(Role.GAMER)
  async rejectInvite(
    @CurrentUser() user: JwtPayload,
    @Param("inviteId") inviteId: string,
  ) {
    return this.teamsService.rejectInvite(user.sub, inviteId);
  }

  // ── Roster management ──

  @Delete(":id/members/:userId")
  @HttpCode(HttpStatus.OK)
  @Roles(Role.GAMER)
  async removeMember(
    @CurrentUser() user: JwtPayload,
    @Param("id") teamId: string,
    @Param("userId") memberUserId: string,
  ) {
    return this.teamsService.removeMember(user.sub, teamId, memberUserId);
  }

  @Put(":id/members/:userId/role")
  @HttpCode(HttpStatus.OK)
  @Roles(Role.GAMER)
  async updateMemberRole(
    @CurrentUser() user: JwtPayload,
    @Param("id") teamId: string,
    @Param("userId") memberUserId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.teamsService.updateMemberRole(user.sub, teamId, memberUserId, dto);
  }
}
