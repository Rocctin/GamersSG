import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { AuditAction, ConnectionStatus } from "@gamers-sg/database";
import type { SendConnectionRequestDto } from "@gamers-sg/shared/dto";
import type { ConnectionDto, ConnectionListResponse } from "@gamers-sg/shared/dto";

@Injectable()
export class ConnectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Send a connection request from the authenticated user to another user.
   */
  async sendRequest(
    requesterId: string,
    dto: SendConnectionRequestDto,
  ): Promise<ConnectionDto> {
    const { addresseeId } = dto;

    if (requesterId === addresseeId) {
      throw new BadRequestException("You cannot connect with yourself");
    }

    // Verify the addressee exists and is not suspended
    const addressee = await this.prisma.user.findUnique({
      where: { id: addresseeId },
    });
    if (!addressee) {
      throw new NotFoundException("User not found");
    }
    if (addressee.status === "SUSPENDED") {
      throw new BadRequestException("Cannot connect with a suspended user");
    }

    // Check for existing connection (accepted or pending)
    const existing = await this.prisma.connection.findUnique({
      where: {
        requester_id_addressee_id: {
          requester_id: requesterId,
          addressee_id: addresseeId,
        },
      },
    });

    if (existing) {
      if (existing.status === "ACCEPTED") {
        throw new ConflictException("Already connected with this user");
      }
      if (existing.status === "PENDING") {
        throw new ConflictException("A pending request already exists");
      }
      // REJECTED — allow re-send by updating the existing record
      if (existing.status === "REJECTED") {
        const updated = await this.prisma.connection.update({
          where: { id: existing.id },
          data: { status: "PENDING" },
          include: {
            requester: { include: { gamer_profile: true } },
            addressee: { include: { gamer_profile: true } },
          },
        });
        return this.mapConnection(updated, requesterId);
      }
    }

    // Create new request
    const connection = await this.prisma.connection.create({
      data: {
        requester_id: requesterId,
        addressee_id: addresseeId,
        status: "PENDING",
      },
      include: {
        requester: { include: { gamer_profile: true } },
        addressee: { include: { gamer_profile: true } },
      },
    });

    return this.mapConnection(connection, requesterId);
  }

  /**
   * Accept an incoming connection request. Only the addressee can accept.
   */
  async acceptRequest(
    userId: string,
    connectionId: string,
  ): Promise<ConnectionDto> {
    const connection = await this.prisma.connection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new NotFoundException("Connection request not found");
    }

    if (connection.addressee_id !== userId) {
      throw new ForbiddenException("Only the recipient can accept this request");
    }

    if (connection.status !== "PENDING") {
      throw new BadRequestException(
        `Cannot accept a ${connection.status.toLowerCase()} request`,
      );
    }

    const updated = await this.prisma.connection.update({
      where: { id: connectionId },
      data: { status: "ACCEPTED" },
      include: {
        requester: { include: { gamer_profile: true } },
        addressee: { include: { gamer_profile: true } },
      },
    });

    return this.mapConnection(updated, userId);
  }

  /**
   * Reject an incoming connection request. Only the addressee can reject.
   */
  async rejectRequest(
    userId: string,
    connectionId: string,
  ): Promise<ConnectionDto> {
    const connection = await this.prisma.connection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new NotFoundException("Connection request not found");
    }

    if (connection.addressee_id !== userId) {
      throw new ForbiddenException("Only the recipient can reject this request");
    }

    if (connection.status !== "PENDING") {
      throw new BadRequestException(
        `Cannot reject a ${connection.status.toLowerCase()} request`,
      );
    }

    const updated = await this.prisma.connection.update({
      where: { id: connectionId },
      data: { status: "REJECTED" },
      include: {
        requester: { include: { gamer_profile: true } },
        addressee: { include: { gamer_profile: true } },
      },
    });

    return this.mapConnection(updated, userId);
  }

  /**
   * Remove a connection. Either party can do this.
   * For outgoing (requester) — cancels the pending request.
   * For accepted — removes the connection.
   */
  async removeConnection(
    userId: string,
    connectionId: string,
  ): Promise<{ removed: boolean }> {
    const connection = await this.prisma.connection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new NotFoundException("Connection not found");
    }

    // Check if user is admin
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    const isAdmin = user?.role === "ADMIN";

    const isParticipant =
      connection.requester_id === userId ||
      connection.addressee_id === userId;

    if (!isParticipant && !isAdmin) {
      throw new ForbiddenException("You are not part of this connection");
    }

    await this.prisma.connection.delete({
      where: { id: connectionId },
    });

    // Log admin removal actions
    if (isAdmin && !isParticipant) {
      await this.auditService.log({
        actorId: userId,
        action: AuditAction.CONNECTION_REMOVED,
        targetId: connectionId,
        targetType: "connection",
        metadata: {
          requesterId: connection.requester_id,
          addresseeId: connection.addressee_id,
          status: connection.status,
        },
      });
    }

    return { removed: true };
  }

  /**
   * List connections for the authenticated user.
   * Supports filtering by status and pagination.
   */
  async listConnections(
    userId: string,
    options: {
      status?: ConnectionStatus;
      page?: number;
      pageSize?: number;
    } = {},
  ): Promise<ConnectionListResponse> {
    const { status, page = 1, pageSize = 20 } = options;

    const where: any = {
      OR: [{ requester_id: userId }, { addressee_id: userId }],
    };

    if (status) {
      where.status = status;
    } else {
      // By default, show accepted and pending (but not rejected unless filtered)
      where.status = { not: "REJECTED" };
    }

    const [connections, total] = await Promise.all([
      this.prisma.connection.findMany({
        where,
        include: {
          requester: { include: { gamer_profile: true } },
          addressee: { include: { gamer_profile: true } },
        },
        orderBy: { updated_at: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.connection.count({ where }),
    ]);

    return {
      connections: connections.map((c) => this.mapConnection(c, userId)),
      total,
      page,
      pageSize,
    };
  }

  /**
   * Get count of incoming pending requests (for sidebar badge).
   */
  async adminListConnections(options: {
    status?: ConnectionStatus;
    page?: number;
    pageSize?: number;
    search?: string;
  } = {}) {
    const { status, page = 1, pageSize = 20, search } = options;

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { requester: { email: { contains: search, mode: "insensitive" } } },
        { addressee: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [connections, total] = await Promise.all([
      this.prisma.connection.findMany({
        where,
        include: {
          requester: { include: { gamer_profile: true } },
          addressee: { include: { gamer_profile: true } },
        },
        orderBy: { updated_at: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.connection.count({ where }),
    ]);

    return {
      connections: connections.map((c) => this.mapConnection(c, c.requester_id)),
      total,
      page,
      pageSize,
    };
  }

  async getPendingCount(userId: string): Promise<{ count: number }> {
    const count = await this.prisma.connection.count({
      where: {
        addressee_id: userId,
        status: "PENDING",
      },
    });

    return { count };
  }

  /**
   * Get connection count for a user (public).
   */
  async getConnectionCount(userId: string): Promise<{ count: number }> {
    const count = await this.prisma.connection.count({
      where: {
        status: "ACCEPTED",
        OR: [{ requester_id: userId }, { addressee_id: userId }],
      },
    });

    return { count };
  }

  // ── Private mappers ──

  private mapConnection(
    conn: any,
    viewerId: string,
  ): ConnectionDto {
    const isRequester = conn.requester_id === viewerId;
    return {
      id: conn.id,
      requesterId: conn.requester_id,
      requesterDisplayName: conn.requester?.gamer_profile?.display_name ?? undefined,
      requesterUsername: conn.requester?.gamer_profile?.username ?? undefined,
      requesterAvatarUrl: conn.requester?.gamer_profile?.avatar_url ?? undefined,
      addresseeId: conn.addressee_id,
      addresseeDisplayName: conn.addressee?.gamer_profile?.display_name ?? undefined,
      addresseeUsername: conn.addressee?.gamer_profile?.username ?? undefined,
      addresseeAvatarUrl: conn.addressee?.gamer_profile?.avatar_url ?? undefined,
      status: conn.status,
      createdAt: conn.created_at.toISOString(),
      updatedAt: conn.updated_at.toISOString(),
    };
  }
}
