import { BadRequestException } from '@nestjs/common';
import { JwtPayload } from 'src/common/constants/jwtInterface';
import { UserRoles } from 'src/common/constants/database';

/**
 * Resolves the target organization ID for org-scoped operations.
 * - Non-SUPER_ADMIN users always get their own org ID from the JWT.
 * - SUPER_ADMIN can target a different org by passing requestedOrgId.
 * - Non-SUPER_ADMIN users passing a different org ID get a 400 error.
 */
export function resolveOrgId(user: JwtPayload, requestedOrgId?: number): number {
  if (requestedOrgId && requestedOrgId !== user.organizationId) {
    if (user.role !== UserRoles.SUPER_ADMIN) {
      throw new BadRequestException('Only SUPER_ADMIN can target other organizations');
    }

    return requestedOrgId;
  }

  return user.organizationId;
}
