import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../../prisma/prisma.service";
import {
  RATE_LIMIT_META,
  type RateLimitConfig,
} from "../decorators/rate-limit.decorator";

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const config = this.reflector.getAllAndOverride<RateLimitConfig | undefined>(
      RATE_LIMIT_META,
      [context.getHandler(), context.getClass()],
    );

    let key: string;
    let windowMinutes: number;
    let maxAttempts: number;

    if (config) {
      // New config-based behavior: key by IP, use config values
      const ip = (request.ip || request.socket.remoteAddress || "unknown") as string;
      key = `${config.keyPrefix}:${ip}`;
      windowMinutes = config.windowMinutes;
      maxAttempts = config.maxAttempts;
    } else {
      // Legacy fallback: magic-link behavior (keys by email)
      const email = request.body?.email || "unknown";
      key = `magic_link:${email.toLowerCase().trim()}`;
      windowMinutes = 15;
      maxAttempts = 5;
    }

    const now = new Date();
    const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000);

    // Upsert rate limit bucket — reset if window expired, increment if within
    const bucket = await this.prisma.rateLimitBucket.upsert({
      where: { key },
      update: {},
      create: {
        key,
        count: 1,
        window_start: now,
      },
    });

    // Check if window has expired
    if (bucket.window_start < windowStart) {
      // Reset window
      await this.prisma.rateLimitBucket.update({
        where: { key },
        data: {
          count: 1,
          window_start: now,
        },
      });
      return true;
    }

    // Check if over limit
    if (bucket.count >= maxAttempts) {
      const retryAfter = Math.ceil(
        (bucket.window_start.getTime() +
          windowMinutes * 60 * 1000 -
          now.getTime()) /
          1000,
      );
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Too many requests. Please try again in ${retryAfter} seconds.`,
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Increment count
    await this.prisma.rateLimitBucket.update({
      where: { key },
      data: { count: bucket.count + 1 },
    });

    return true;
  }
}
