import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  InternalServerErrorException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ConflictException } from 'src/common/exceptions/app.exception';
import { ErrorCode, ErrorCodes } from 'src/common/constants/error-codes';

// Postgres SQLSTATE for unique_violation.
const POSTGRES_UNIQUE_VIOLATION = '23505';

// Maps a known unique-constraint name to a user-facing conflict. Any constraint not listed here
// still gets a clean 409 instead of a raw 500, just with a generic message.
const UNIQUE_CONSTRAINT_CONFLICTS: Record<string, { errorCode: ErrorCode; message: string }> = {
  UQ_APP_CHAIN_NAME_ACTIVE: {
    errorCode: ErrorCodes.CHAIN_ALREADY_EXISTS,
    message: 'Provider chain with same name already exists',
  },
};

@Injectable()
export class DatabaseErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      catchError((error) => {
        if (error.code === 'ER_BAD_FIELD_ERROR') {
          return throwError(
            () => new InternalServerErrorException(`Database error occurred: ${error.message}`),
          );
        }

        // A DB-level unique violation reaching here means it wasn't caught by an app-level
        // pre-check (e.g. a race, or a constraint the app doesn't check for) — surface it as a
        // clean conflict instead of letting it fall through to a generic 500.
        if (error.code === POSTGRES_UNIQUE_VIOLATION) {
          const known = error.constraint
            ? UNIQUE_CONSTRAINT_CONFLICTS[error.constraint]
            : undefined;

          return throwError(
            () =>
              new ConflictException(
                known?.errorCode ?? ErrorCodes.GENERAL_CONFLICT,
                known?.message ?? 'A record with these values already exists',
              ),
          );
        }

        return throwError(() => error);
      }),
    );
  }
}
