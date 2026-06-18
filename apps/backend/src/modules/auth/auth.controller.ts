import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
  UnauthorizedException,
} from "@nestjs/common";
import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { RateLimitGuard } from "../../common/guards/rate-limit.guard";
import { RateLimit } from "../../common/decorators/rate-limit.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { Public } from "../../common/decorators/public.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { JwtPayload } from "@gamers-sg/shared/types";
import { AUTH } from "@gamers-sg/shared/constants";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("magic-link/request")
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimitGuard)
  async requestMagicLink(
    @Body("email") email: string,
    @Req() req: Request,
  ) {
    const ip = (req.ip || req.socket.remoteAddress) ?? "unknown";
    const userAgent = req.headers["user-agent"] ?? "unknown";
    return this.authService.requestMagicLink(email, ip, userAgent);
  }

  @Public()
  @Post("magic-link/verify")
  @HttpCode(HttpStatus.OK)
  @RateLimit({ windowMinutes: 15, maxAttempts: 10, keyPrefix: "verify" })
  @UseGuards(RateLimitGuard)
  async verifyMagicLink(
    @Body("token") token: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyMagicLink(token);

    // Set refresh token as httpOnly cookie (only sent to /api/auth)
    const refreshMaxAge = AUTH.REFRESH_TOKEN_EXPIRY_MS;
    res.cookie("refresh_token", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth",
      maxAge: refreshMaxAge,
    });

    // Set access token as httpOnly cookie (readable by Next.js middleware at all paths)
    res.cookie("access_token", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 900_000, // 15 minutes in ms
    });

    // Return everything except the raw refresh token
    return {
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
      user: result.user,
    };
  }

  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @RateLimit({ windowMinutes: 5, maxAttempts: 20, keyPrefix: "refresh" })
  @UseGuards(RateLimitGuard)
  async refreshTokens(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException("No refresh token provided");
    }

    const result = await this.authService.refreshTokens(refreshToken);

    const refreshMaxAge = AUTH.REFRESH_TOKEN_EXPIRY_MS;
    res.cookie("refresh_token", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth",
      maxAge: refreshMaxAge,
    });

    // Set access token as httpOnly cookie (readable by Next.js middleware at all paths)
    res.cookie("access_token", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 900_000, // 15 minutes in ms
    });

    return {
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
      user: result.user,
    };
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token;
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    res.clearCookie("refresh_token", { path: "/api/auth" });
    res.clearCookie("access_token", { path: "/" });
    return { message: "Logged out successfully" };
  }

  @Get("me")
  @HttpCode(HttpStatus.OK)
  async getCurrentUser(@CurrentUser() user: JwtPayload) {
    return { user };
  }
}
