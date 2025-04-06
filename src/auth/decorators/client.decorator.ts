import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Client = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.clientId || 'system';
  },
); 