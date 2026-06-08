import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { AuditAction } from "@gamers-sg/database";

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(input: {
    actorId: string;
    action: AuditAction;
    targetId?: string;
    targetType?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
  }): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actor_id: input.actorId,
          action: input.action,
          target_id: input.targetId,
          target_type: input.targetType,
          metadata: input.metadata ?? {},
          ip_address: input.ipAddress,
        },
      });
    } catch (err) {
      // Never let audit failure crash the main flow
      this.logger.error("Failed to create audit log:", err);
    }
  }
}
