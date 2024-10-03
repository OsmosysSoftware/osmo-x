import { SetMetadata } from '@nestjs/common';
import { UserRoles } from '../constants/database';

// Type definition for allowed values (only values from UserRoles)
type UserRoleValues = (typeof UserRoles)[keyof typeof UserRoles];

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const Roles = (...roles: UserRoleValues[]) => SetMetadata('roles', roles);
