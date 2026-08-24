import { DatabaseErrorInterceptor } from './database-error.interceptor';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ConflictException } from 'src/common/exceptions/app.exception';
import { ErrorCodes } from 'src/common/constants/error-codes';

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

  it('should translate a known unique-violation constraint into a clean ConflictException', (done) => {
    const context: ExecutionContext = {} as ExecutionContext;
    const callHandler: CallHandler = {
      handle: () => throwError(() => ({ code: '23505', constraint: 'UQ_APP_CHAIN_NAME_ACTIVE' })),
    };

    interceptor
      .intercept(context, callHandler)
      .pipe(
        catchError((error) => {
          expect(error).toBeInstanceOf(ConflictException);
          expect(error.errorCode).toBe(ErrorCodes.CHAIN_ALREADY_EXISTS);
          expect(error.getStatus()).toBe(409);
          done();
          return of(null);
        }),
      )
      .subscribe();
  });

  it('should translate an unrecognized unique-violation constraint into a generic conflict', (done) => {
    const context: ExecutionContext = {} as ExecutionContext;
    const callHandler: CallHandler = {
      handle: () => throwError(() => ({ code: '23505', constraint: 'UQ_SOME_OTHER_TABLE' })),
    };

    interceptor
      .intercept(context, callHandler)
      .pipe(
        catchError((error) => {
          expect(error).toBeInstanceOf(ConflictException);
          expect(error.errorCode).toBe(ErrorCodes.GENERAL_CONFLICT);
          done();
          return of(null);
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
