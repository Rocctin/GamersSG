import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { AuditModule } from "../audit/audit.module";
import { ConnectionsModule } from "../connections/connections.module";

@Module({
  imports: [AuditModule, ConnectionsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
