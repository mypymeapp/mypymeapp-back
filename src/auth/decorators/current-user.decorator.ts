import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type CurrentUser = {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
}

export const GetCurrentUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): CurrentUser => {
        const request = ctx.switchToHttp().getRequest();
        return request.user;
    },
);
