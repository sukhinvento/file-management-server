import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  canActivate(context) {
    // In non-production environments, allow requests without JWT
    if (this.configService.get('NODE_ENV') !== 'production') {
      return true;
    }
    return super.canActivate(context);
  }
} 