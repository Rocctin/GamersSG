import { Module } from "@nestjs/common";
import { GamesController } from "./games.controller";
import { GamesService } from "./games.service";
import { UsersModule } from "../users/users.module";
import { AuditModule } from "../audit/audit.module";

@Module({
  imports: [UsersModule, AuditModule],
  controllers: [GamesController],
  providers: [GamesService],
  exports: [GamesService],
})
export class GamesModule {}
