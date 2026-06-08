import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const email = request.body?.email || "unknown";
    const key = `magic_link:${email.toLowerCase().trim()}`;
    const windowMinutes = 15;
    const maxAttempts = 5;
    const now = new Date();
    const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000);

    // Upsert rate limit bucket — reset if window expired, increment if within
    const bucket = await this.prisma.rateLimitBucket.upsert({
      where: { key },
      update: {
        count: {
          // If window expired, reset to 1; otherwise increment
          // We handle this logic in the query below
        },
      },
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
        (bucket.window_start.getTime() + windowMinutes * 60 * 1000 - now.getTime()) / 1000,
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
