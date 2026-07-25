import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  NotFoundException,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { UsersService } from "./users.service";
import { GamerProfileService } from "./profiles/gamer-profile.service";
import { OrganiserProfileService } from "./profiles/organiser-profile.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RateLimit } from "../../common/decorators/rate-limit.decorator";
import { RateLimitGuard } from "../../common/guards/rate-limit.guard";
import type { JwtPayload } from "@gamers-sg/shared/types";
import type {
  UpdateGamerProfileDto,
  CreateOrganiserProfileDto,
  UpdateOrganiserProfileDto,
} from "@gamers-sg/shared/dto";
import { Role } from "@gamers-sg/database";

@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly gamerProfileService: GamerProfileService,
    private readonly organiserProfileService: OrganiserProfileService,
  ) {}

  @Get("me")
  @HttpCode(HttpStatus.OK)
  async getMyProfile(@CurrentUser() user: JwtPayload) {
    return this.usersService.getUserWithProfiles(user.sub);
  }

  @Put("me/profile")
  @HttpCode(HttpStatus.OK)
  @Roles(Role.GAMER)
  async updateGamerProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateGamerProfileDto,
  ) {
    return this.gamerProfileService.updateProfile(user.sub, dto);
  }

  @Post("me/apply-organiser")
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.GAMER)
  async applyForOrganiser(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateOrganiserProfileDto,
    @Req() req: Request,
  ) {
    return this.organiserProfileService.applyForOrganiser(
      user.sub,
      dto,
      req.ip,
    );
  }

  @Post("me/organiser-profile")
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.ORGANISER)
  async createOrganiserProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateOrganiserProfileDto,
  ) {
    return this.organiserProfileService.createProfile(user.sub, dto);
  }

  @Put("me/organiser-profile")
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ORGANISER)
  async updateOrganiserProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateOrganiserProfileDto,
  ) {
    return this.organiserProfileService.updateProfile(user.sub, dto);
  }

  // Public profile by username — must be before :id to avoid route conflict
  @Public()
  @Get("by-username/:username")
  @HttpCode(HttpStatus.OK)
  async getPublicProfileByUsername(
    @Param("username") username: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    const profile = await this.gamerProfileService.getPublicProfileByUsername(
      username,
      user?.sub,
    );

    if (!profile) {
      throw new NotFoundException("Profile not found");
    }

    return { success: true, data: profile };
  }

  // Discovery search — must be before :id to avoid route conflict
  @Public()
  @Get("search")
  @HttpCode(HttpStatus.OK)
  async searchUsers(
    @Query("query") query: string,
    @Query("gameId") gameId?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.usersService.searchUsers(
      query,
      user?.sub,
      gameId,
      page ? parseInt(page) : 1,
      pageSize ? parseInt(pageSize) : 20,
    );
  }

  @Get("discover/people-you-may-know")
  @HttpCode(HttpStatus.OK)
  @Roles(Role.GAMER)
  async peopleYouMayKnow(@CurrentUser() user: JwtPayload) {
    return this.usersService.peopleYouMayKnow(user.sub);
  }

  @Get(":id")
  @HttpCode(HttpStatus.OK)
  @RateLimit({ windowMinutes: 1, maxAttempts: 30, keyPrefix: "user_lookup" })
  @UseGuards(RateLimitGuard)
  async getUserById(@Param("id") userId: string) {
    return this.usersService.getPublicProfile(userId);
  }
}
