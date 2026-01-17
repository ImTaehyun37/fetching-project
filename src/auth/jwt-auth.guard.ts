import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Add custom logic if needed
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    if (err || !user) {
        // Instead of throwing JSON 401, redirect to Login handling
        // But for API strictness, we might throw. 
        // Since we are building an HTML app, let's allow "Optional" logic in some places
        // or redirect.
        // For now, standard behavior: throw error.
        // We will handle redirection in the Controller using filters or try/catch if needed,
        // or simple: if Endpoint require login, it fails.
        throw err || new UnauthorizedException();
    }
    return user;
  }
}
