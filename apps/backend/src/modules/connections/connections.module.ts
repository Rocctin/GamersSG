import { Module } from "@nestjs/common";
import {
  ConnectionsController,
  UserConnectionsController,
} from "./connections.controller";
import { ConnectionsService } from "./connections.service";
import { AuditModule } from "../audit/audit.module";

@Module({
  imports: [AuditModule],
  controllers: [ConnectionsController, UserConnectionsController],
  providers: [ConnectionsService],
  exports: [ConnectionsService],
})
export class ConnectionsModule {}
