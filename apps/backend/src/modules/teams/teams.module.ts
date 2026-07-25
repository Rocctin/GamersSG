import { Module } from "@nestjs/common";
import { TeamsController } from "./teams.controller";
import { AdminTeamsController } from "./admin-teams.controller";
import { TeamsService } from "./teams.service";
import { AuditModule } from "../audit/audit.module";

@Module({
  imports: [AuditModule],
  controllers: [TeamsController, AdminTeamsController],
  providers: [TeamsService],
  exports: [TeamsService],
})
export class TeamsModule {}
