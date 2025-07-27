import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRoles } from 'src/common/constants/database';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Fetch required roles from the metadata
    const requiredRoles = this.reflector.getAllAndOverride<(keyof typeof UserRoles)[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // Allow access if no roles are specified
    }

    // Determine request based on context type
    const req =
      context.getType<'graphql' | 'http'>() === 'graphql'
        ? GqlExecutionContext.create(context).getContext().req
        : context.switchToHttp().getRequest();

    const authorizationHeader = req.headers?.authorization;

    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      return false; // No or invalid authorization token
    }

    const token = authorizationHeader.split(' ')[1];
    const secret = this.configService.getOrThrow('JWT_SECRET');

    try {
      // Decode the JWT token to get the user information
      const decodedToken = this.jwtService.verify(token, { secret });
      const userRoleId = decodedToken.role;

      // Check if the user's role matches any of the required roles
      return requiredRoles.includes(userRoleId);
    } catch (error) {
      return false; // Invalid token or other error
    }
  }
}
