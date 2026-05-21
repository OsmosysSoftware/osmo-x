/* eslint-disable @typescript-eslint/no-explicit-any */
jest.mock(
  'src/common/decorators/is-data-valid.decorator',
  () => ({
    IsDataValid: () => () => undefined,
  }),
  { virtual: true },
);

import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { PushSnsDataDto } from './pushSns-data.dto';

describe('PushSnsDataDto', () => {
  const validMessage = { default: 'hello world' };

  const runValidation = async (payload: Record<string, unknown>): Promise<string[]> => {
    const instance = plainToInstance(PushSnsDataDto, payload);
    const errors = await validate(instance);
    return errors.flatMap((e) => Object.values(e.constraints ?? {}));
  };

  describe('destination XOR (target / topicArn)', () => {
    it('accepts a payload with only target', async () => {
      const messages = await runValidation({
        target: 'arn:aws:sns:us-east-1:123456789012:endpoint/GCM/MyApp/abc-123',
        message: validMessage,
      });
      expect(messages).toEqual([]);
    });

    it('accepts a payload with only topicArn', async () => {
      const messages = await runValidation({
        topicArn: 'arn:aws:sns:us-east-1:123456789012:oqsha-all-users',
        message: validMessage,
      });
      expect(messages).toEqual([]);
    });

    it('rejects when both target and topicArn are provided', async () => {
      const messages = await runValidation({
        target: 'arn:aws:sns:us-east-1:123456789012:endpoint/GCM/MyApp/abc-123',
        topicArn: 'arn:aws:sns:us-east-1:123456789012:oqsha-all-users',
        message: validMessage,
      });
      expect(messages.some((m) => m.includes('target') && m.includes('topicArn'))).toBe(true);
    });

    it('rejects when neither target nor topicArn is provided', async () => {
      const messages = await runValidation({ message: validMessage });
      expect(messages.some((m) => m.includes('target') && m.includes('topicArn'))).toBe(true);
    });

    it('treats explicit null topicArn as absent', async () => {
      const messages = await runValidation({
        target: 'arn:aws:sns:us-east-1:123456789012:endpoint/GCM/MyApp/abc-123',
        topicArn: null,
        message: validMessage,
      });
      expect(messages).toEqual([]);
    });
  });

  describe('type safety', () => {
    it('rejects when target is not a string', async () => {
      const messages = await runValidation({
        target: 42 as unknown as string,
        message: validMessage,
      });
      expect(messages.some((m) => m.toLowerCase().includes('string'))).toBe(true);
    });

    it('rejects when topicArn is not a string', async () => {
      const messages = await runValidation({
        topicArn: { foo: 'bar' } as unknown as string,
        message: validMessage,
      });
      expect(messages.some((m) => m.toLowerCase().includes('string'))).toBe(true);
    });
  });

  describe('whitespace and empty-string handling', () => {
    it('rejects whitespace-only target with a specific error', async () => {
      const messages = await runValidation({
        target: '   ',
        message: validMessage,
      });
      expect(messages.some((m) => m === 'target must not be empty when provided')).toBe(true);
    });

    it('rejects whitespace-only topicArn with a specific error', async () => {
      const messages = await runValidation({
        topicArn: '\t\n  ',
        message: validMessage,
      });
      expect(messages.some((m) => m === 'topicArn must not be empty when provided')).toBe(true);
    });

    it('rejects empty-string target with a specific error', async () => {
      const messages = await runValidation({
        target: '',
        message: validMessage,
      });
      expect(messages.some((m) => m === 'target must not be empty when provided')).toBe(true);
    });

    it('trims surrounding whitespace from a valid target', async () => {
      const raw = '  arn:aws:sns:us-east-1:123456789012:endpoint/GCM/MyApp/abc-123  ';
      const instance = plainToInstance(PushSnsDataDto, {
        target: raw,
        message: validMessage,
      });
      const errors = await validate(instance);
      expect(errors).toEqual([]);
      expect(instance.target).toBe(raw.trim());
    });

    it('trims surrounding whitespace from a valid topicArn', async () => {
      const raw = '  arn:aws:sns:us-east-1:123456789012:oqsha-all-users  ';
      const instance = plainToInstance(PushSnsDataDto, {
        topicArn: raw,
        message: validMessage,
      });
      const errors = await validate(instance);
      expect(errors).toEqual([]);
      expect(instance.topicArn).toBe(raw.trim());
    });
  });
});
