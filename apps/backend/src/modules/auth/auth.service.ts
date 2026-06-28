import { Injectable, UnauthorizedException, ForbiddenException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../prisma/prisma.service";
import { EmailService } from "./email/email.service";
import { AuditService } from "../audit/audit.service";
import { AUTH } from "@gamers-sg/shared/constants";
import { AuditAction, Role, AccountStatus } from "@gamers-sg/database";
import * as crypto from "crypto";
import * as bcrypt from "bcryptjs";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly auditService: AuditService,
  ) {}

  async requestMagicLink(email: string, ip: string, userAgent: string) {
    // 1. Validate email format
    const normalizedEmail = email.toLowerCase().trim();
    if (!this.isValidEmail(normalizedEmail)) {
      throw new UnauthorizedException("Invalid email format");
    }

    // 2. Upsert user
    let user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          role: Role.GAMER,
          status: AccountStatus.APPROVED,
        },
      });
    }

    // 3. Generate token
    const rawToken = crypto.randomBytes(64).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    // 4. Invalidate prior unused tokens for this user
    await this.prisma.authToken.updateMany({
      where: {
        user_id: user.id,
        used_at: null,
        expires_at: { gt: new Date() },
      },
      data: { used_at: new Date() },
    });

    // 5. Store AuthToken
    const expiresAt = new Date(
      Date.now() + AUTH.MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000,
    );

    await this.prisma.authToken.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
        request_ip: ip,
        user_agent: userAgent,
      },
    });

    // 6. Send email
    await this.emailService.sendMagicLinkEmail(normalizedEmail, rawToken);

    // 7. Audit
    await this.auditService.log({
      actorId: user.id,
      action: AuditAction.MAGIC_LINK_SENT,
      targetType: "auth",
      ipAddress: ip,
    });

    // 8. Return (always same message — don't reveal if user exists)
    return {
      message:
        "If an account exists with this email, a magic link has been sent.",
    };
  }

  async verifyMagicLink(rawToken: string) {
    // 1. Hash the raw token
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    // 2. Find AuthToken
    const authToken = await this.prisma.authToken.findUnique({
      where: { token_hash: tokenHash },
      include: { user: true },
    });

    // 3. Validate
    if (!authToken) {
      throw new UnauthorizedException("Invalid or expired magic link");
    }
    if (authToken.used_at) {
      throw new UnauthorizedException("Magic link has already been used");
    }
    if (authToken.expires_at < new Date()) {
      throw new UnauthorizedException("Magic link has expired");
    }

    const user = authToken.user;

    // 4. Check user status
    if (user.status === AccountStatus.SUSPENDED) {
      throw new ForbiddenException("Account is suspended");
    }

    // 5. Mark token used
    await this.prisma.authToken.update({
      where: { id: authToken.id },
      data: { used_at: new Date() },
    });

    // 6. Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // 7. Audit
    await this.auditService.log({
      actorId: user.id,
      action: AuditAction.LOGIN_SUCCESS,
      targetType: "auth",
      ipAddress: authToken.request_ip ?? undefined,
    });

    return tokens;
  }

  async refreshTokens(refreshTokenRaw: string) {
    const tokenHash = crypto
      .createHash("sha256")
      .update(refreshTokenRaw)
      .digest("hex");

    const storedRefToken = await this.prisma.refreshToken.findUnique({
      where: { token_hash: tokenHash },
      include: { user: true },
    });

    if (!storedRefToken) {
      throw new UnauthorizedException("Invalid refresh token");
    }
    if (storedRefToken.revoked_at) {
      throw new UnauthorizedException("Refresh token has been revoked");
    }
    if (storedRefToken.expires_at < new Date()) {
      throw new UnauthorizedException("Refresh token has expired");
    }

    const user = storedRefToken.user;

    if (user.status === AccountStatus.SUSPENDED) {
      throw new ForbiddenException("Account is suspended");
    }

    // Revoke old token
    await this.prisma.refreshToken.update({
      where: { id: storedRefToken.id },
      data: { revoked_at: new Date() },
    });

    // Issue new pair
    return this.generateTokens(user.id, user.email, user.role);
  }

  async logout(refreshTokenRaw: string) {
    const tokenHash = crypto
      .createHash("sha256")
      .update(refreshTokenRaw)
      .digest("hex");

    await this.prisma.refreshToken.updateMany({
      where: { token_hash: tokenHash, revoked_at: null },
      data: { revoked_at: new Date() },
    });
  }

  async revokeAllUserTokens(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { user_id: userId, revoked_at: null },
      data: { revoked_at: new Date() },
    });
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: Role,
  ) {
    const payload = { sub: userId, email, role };
    const accessToken = this.jwtService.sign(payload);

    const refreshTokenRaw = crypto.randomBytes(64).toString("hex");
    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(refreshTokenRaw)
      .digest("hex");

    const refreshExpiresAt = new Date(
      Date.now() + AUTH.REFRESH_TOKEN_EXPIRY_MS,
    );

    await this.prisma.refreshToken.create({
      data: {
        user_id: userId,
        token_hash: refreshTokenHash,
        expires_at: refreshExpiresAt,
      },
    });

    // Build user profile response
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        gamer_profile: {
          include: {
            games: {
              include: { game: true },
            },
          },
        },
        organiser_profile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException("User account not found");
    }

    return {
      accessToken,
      refreshToken: refreshTokenRaw,
      expiresIn: 900, // 15 minutes in seconds
      user: this.mapUserToProfile(user),
    };
  }

  private mapUserToProfile(user: any) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.created_at.toISOString(),
      gamerProfile: user.gamer_profile
        ? {
            id: user.gamer_profile.id,
            username: user.gamer_profile.username,
            displayName: user.gamer_profile.display_name,
            bio: user.gamer_profile.bio,
            avatarUrl: user.gamer_profile.avatar_url,
            visibility: user.gamer_profile.visibility,
            isMember: user.gamer_profile.is_member,
            pointsBalance: user.gamer_profile.points_balance,
            games: user.gamer_profile.games?.map((g: any) => ({
              id: g.game.id,
              name: g.game.name,
              slug: g.game.slug,
              coverImage: g.game.cover_image,
              category: g.game.category,
              inGameRole: g.in_game_role,
            })),
          }
        : undefined,
      organiserProfile: user.organiser_profile
        ? {
            id: user.organiser_profile.id,
            organisationName: user.organiser_profile.organisation_name,
            organisationType: user.organiser_profile.organisation_type,
            website: user.organiser_profile.website,
            contactPerson: user.organiser_profile.contact_person,
            contactNumber: user.organiser_profile.contact_number,
            description: user.organiser_profile.description,
          }
        : undefined,
    };
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
