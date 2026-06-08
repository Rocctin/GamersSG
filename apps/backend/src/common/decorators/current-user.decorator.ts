import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { JwtPayload } from "@gamers-sg/shared/types";

/** Extracts the authenticated user from the request. */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext): JwtPayload | string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    return data ? user[data] : user;
  },
);
