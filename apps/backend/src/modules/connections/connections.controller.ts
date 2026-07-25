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
import { ConnectionsService } from "./connections.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import type { JwtPayload } from "@gamers-sg/shared/types";
import type { SendConnectionRequestDto } from "@gamers-sg/shared/dto";
import { Role, ConnectionStatus } from "@gamers-sg/database";

@Controller("connections")
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  /**
   * Send a connection request to another gamer.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.GAMER)
  async sendRequest(
    @CurrentUser() user: JwtPayload,
    @Body() dto: SendConnectionRequestDto,
  ) {
    return this.connectionsService.sendRequest(user.sub, dto);
  }

  /**
   * Accept an incoming connection request.
   */
  @Put(":id/accept")
  @HttpCode(HttpStatus.OK)
  @Roles(Role.GAMER)
  async acceptRequest(
    @CurrentUser() user: JwtPayload,
    @Param("id") connectionId: string,
  ) {
    return this.connectionsService.acceptRequest(user.sub, connectionId);
  }

  /**
   * Reject an incoming connection request.
   */
  @Put(":id/reject")
  @HttpCode(HttpStatus.OK)
  @Roles(Role.GAMER)
  async rejectRequest(
    @CurrentUser() user: JwtPayload,
    @Param("id") connectionId: string,
  ) {
    return this.connectionsService.rejectRequest(user.sub, connectionId);
  }

  /**
   * Remove/cancel a connection (either party can do this).
   */
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @Roles(Role.GAMER)
  async removeConnection(
    @CurrentUser() user: JwtPayload,
    @Param("id") connectionId: string,
  ) {
    return this.connectionsService.removeConnection(user.sub, connectionId);
  }

  /**
   * List the authenticated user's connections.
   * ?status=PENDING|ACCEPTED|REJECTED  (default: all except REJECTED)
   * &page=1&pageSize=20
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles(Role.GAMER)
  async listConnections(
    @CurrentUser() user: JwtPayload,
    @Query("status") status?: ConnectionStatus,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    return this.connectionsService.listConnections(user.sub, {
      status,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  /**
   * Get count of incoming pending requests (for sidebar badge).
   */
  @Get("pending-count")
  @HttpCode(HttpStatus.OK)
  @Roles(Role.GAMER)
  async getPendingCount(@CurrentUser() user: JwtPayload) {
    return this.connectionsService.getPendingCount(user.sub);
  }
}

/**
 * Separate controller for public connection count lookup
 * (mounted on the `users` prefix by the module).
 */
@Controller("users")
export class UserConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  /**
   * Get the accepted connection count for any user (public).
   */
  @Public()
  @Get(":userId/connections/count")
  @HttpCode(HttpStatus.OK)
  async getConnectionCount(@Param("userId") userId: string) {
    return this.connectionsService.getConnectionCount(userId);
  }
}
