import { Module } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { GamerProfileService } from "./profiles/gamer-profile.service";
import { OrganiserProfileService } from "./profiles/organiser-profile.service";

@Module({
  controllers: [UsersController],
  providers: [UsersService, GamerProfileService, OrganiserProfileService],
  exports: [UsersService],
})
export class UsersModule {}
