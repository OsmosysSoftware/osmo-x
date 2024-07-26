import { DatabaseErrorInterceptor } from './database-error.interceptor';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

describe('DatabaseErrorInterceptor', () => {
  let interceptor: DatabaseErrorInterceptor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DatabaseErrorInterceptor],
    }).compile();

    interceptor = module.get<DatabaseErrorInterceptor>(DatabaseErrorInterceptor);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should handle ER_BAD_FIELD_ERROR and throw InternalServerErrorException', (done) => {
    const context: ExecutionContext = {} as ExecutionContext;
    const callHandler: CallHandler = {
      handle: () => throwError(() => ({ code: 'ER_BAD_FIELD_ERROR' })),
    };

    interceptor
      .intercept(context, callHandler)
      .pipe(
        catchError((error) => {
          expect(error).toBeInstanceOf(InternalServerErrorException);
          expect(error.message).toBe(`Database error occurred: ${error.message}`);
          done();
          return of(null); // Prevent further propagation
        }),
      )
      .subscribe();
  });

  it('should propagate other errors as they are', (done) => {
    const context: ExecutionContext = {} as ExecutionContext;
    const callHandler: CallHandler = {
      handle: () => throwError(() => new Error('Other error')),
    };

    interceptor
      .intercept(context, callHandler)
      .pipe(
        catchError((error) => {
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toBe(`Other error: ${error.message}`);
          done();
          return of(null); // Prevent further propagation
        }),
      )
      .subscribe();
  });
});
