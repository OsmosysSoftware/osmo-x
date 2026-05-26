import { ExecutionContext, CallHandler } from '@nestjs/common';
import { firstValueFrom, of } from 'rxjs';
import { SnakeCaseInterceptor } from './snake-case.interceptor';

interface FakeRequest {
  body?: unknown;
}

function makeContext(request: FakeRequest = {}): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function makeHandler(responseBody: unknown): CallHandler {
  return { handle: () => of(responseBody) };
}

async function runIntercept(
  interceptor: SnakeCaseInterceptor,
  request: FakeRequest,
  responseBody: unknown,
): Promise<unknown> {
  return firstValueFrom(interceptor.intercept(makeContext(request), makeHandler(responseBody)));
}

describe('SnakeCaseInterceptor', () => {
  let interceptor: SnakeCaseInterceptor;

  beforeEach(() => {
    interceptor = new SnakeCaseInterceptor();
  });

  describe('response: camelCase -> snake_case', () => {
    it('converts top-level camelCase keys', async () => {
      const result = await runIntercept(
        interceptor,
        {},
        {
          applicationId: 1,
          testModeEnabled: true,
        },
      );

      expect(result).toEqual({ application_id: 1, test_mode_enabled: true });
    });

    it('recurses through nested objects and arrays', async () => {
      const result = await runIntercept(
        interceptor,
        {},
        {
          outerKey: {
            innerKey: 'v',
            listItems: [{ itemId: 1 }],
          },
        },
      );

      expect(result).toEqual({
        outer_key: {
          inner_key: 'v',
          list_items: [{ item_id: 1 }],
        },
      });
    });

    it('serializes Date instances to ISO strings', async () => {
      const d = new Date('2025-01-01T00:00:00.000Z');
      const result = await runIntercept(interceptor, {}, { createdOn: d });

      expect(result).toEqual({ created_on: '2025-01-01T00:00:00.000Z' });
    });

    it('preserves _links / _metadata / _pagination keys (underscore prefix)', async () => {
      const result = await runIntercept(
        interceptor,
        {},
        {
          _links: { self: 'https://x' },
          _metadata: { page: 1 },
          _pagination: { hasNext: true },
          userId: 5,
        },
      );

      expect(result).toEqual({
        _links: { self: 'https://x' },
        _metadata: { page: 1 },
        _pagination: { has_next: true },
        user_id: 5,
      });
    });

    it('passes through `data`, `result`, `configuration`, `whitelistRecipients` blobs without recursing', async () => {
      const blob = { fooBar: { bazQux: 'x' } };
      const result = (await runIntercept(
        interceptor,
        {},
        {
          data: blob,
          result: blob,
          configuration: blob,
          whitelistRecipients: blob,
        },
      )) as Record<string, unknown>;

      // Top-level keys are converted (`whitelistRecipients` -> `whitelist_recipients`),
      // but the inner blobs are passed by reference and NOT recursed into.
      expect(result.data).toBe(blob);
      expect(result.result).toBe(blob);
      expect(result.configuration).toBe(blob);
      expect(result.whitelist_recipients).toBe(blob);
    });

    it('handles circular references gracefully', async () => {
      const obj: Record<string, unknown> = { name: 'root' };
      obj.self = obj;

      const result = (await runIntercept(interceptor, {}, obj)) as Record<string, unknown>;

      expect(result.name).toBe('root');
      // Circular refs become undefined per the implementation
      expect(result.self).toBeUndefined();
    });

    it('returns null/undefined/Buffer/primitives untouched', async () => {
      expect(await runIntercept(interceptor, {}, null)).toBeNull();
      expect(await runIntercept(interceptor, {}, undefined)).toBeUndefined();
      const buf = Buffer.from('hi');
      expect(await runIntercept(interceptor, {}, buf)).toBe(buf);
      expect(await runIntercept(interceptor, {}, 42)).toBe(42);
      expect(await runIntercept(interceptor, {}, 'plain')).toBe('plain');
    });
  });

  describe('request: snake_case -> camelCase', () => {
    it('mutates request.body in place from snake to camel', async () => {
      const req: FakeRequest = {
        body: { application_id: 1, test_mode_enabled: true },
      };

      await runIntercept(interceptor, req, {});

      expect(req.body).toEqual({ applicationId: 1, testModeEnabled: true });
    });

    it('recurses through nested request body objects and arrays', async () => {
      const req: FakeRequest = {
        body: { outer_key: { inner_key: [{ item_id: 1 }] } },
      };

      await runIntercept(interceptor, req, {});

      expect(req.body).toEqual({ outerKey: { innerKey: [{ itemId: 1 }] } });
    });

    it('passes through `data` request blobs without recursing into nested snake keys', async () => {
      const blob = { user_id: 7 };
      const req: FakeRequest = { body: { data: blob } };

      await runIntercept(interceptor, req, {});

      // Top-level key stays as `data`, blob is passed by reference - inner key NOT touched
      expect(req.body).toEqual({ data: blob });
      expect((req.body as { data: Record<string, unknown> }).data.user_id).toBe(7);
    });

    it('round trip: snake -> camel -> snake produces original keys', async () => {
      const original = { application_id: 1, nested_field: { deep_key: 'v' } };
      const req: FakeRequest = { body: { ...original } };
      // First pass: request transformation
      await runIntercept(interceptor, req, {});
      // Now run a response with the (now-camel) body
      const response = await runIntercept(interceptor, {}, req.body);

      expect(response).toEqual(original);
    });
  });
});
