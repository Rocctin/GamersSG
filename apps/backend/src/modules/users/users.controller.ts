import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { GamerProfileService } from "./profiles/gamer-profile.service";
import { OrganiserProfileService } from "./profiles/organiser-profile.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
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

  @Get(":id")
  @HttpCode(HttpStatus.OK)
  async getUserById(@Param("id") userId: string) {
    return this.usersService.getPublicProfile(userId);
  }
}
