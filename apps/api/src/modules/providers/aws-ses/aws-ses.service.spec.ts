import { BadRequestException, Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as nodemailer from 'nodemailer';
import { SESv2Client } from '@aws-sdk/client-sesv2';
import * as fs from 'node:fs/promises';
import { Readable } from 'stream';
import { AwsSesService } from './aws-ses.service';
import { ProvidersService } from '../providers.service';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

jest.mock('@aws-sdk/client-sesv2', () => ({
  SESv2Client: jest.fn(),
  SendEmailCommand: jest.fn(),
}));

jest.mock('node:fs/promises', () => ({
  readFile: jest.fn(),
}));

const mockSendMail = jest.fn();
const mockGetConfigById = jest.fn();

const mockSentMessageInfo = {
  envelope: { from: 'from@example.com', to: ['to@example.com'] },
  messageId: '<msg-id@email.amazonses.com>',
  response: 'msg-id',
  accepted: ['to@example.com'],
  rejected: [],
  pending: [],
  raw: Buffer.from('raw email'),
};

describe('AwsSesService', () => {
  let service: AwsSesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    (SESv2Client as unknown as jest.Mock).mockImplementation(() => ({}));
    (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail: mockSendMail });
    mockGetConfigById.mockResolvedValue({
      AWS_REGION: 'us-east-1',
      AWS_ACCESS_KEY_ID: 'test-key-id',
      AWS_SECRET_ACCESS_KEY: 'test-secret-key',
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AwsSesService,
        {
          provide: ProvidersService,
          useValue: { getConfigById: mockGetConfigById },
        },
        { provide: Logger, useValue: { debug: jest.fn(), error: jest.fn() } },
      ],
    }).compile();

    service = module.get<AwsSesService>(AwsSesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('normalizeEmails', () => {
    it('splits a comma-separated string into trimmed email array', () => {
      const result = service.normalizeEmails('a@test.com, b@test.com , c@test.com');

      expect(result).toEqual(['a@test.com', 'b@test.com', 'c@test.com']);
    });

    it('wraps a single string address in an array', () => {
      expect(service.normalizeEmails('only@test.com')).toEqual(['only@test.com']);
    });

    it('filters out empty strings produced by trailing commas', () => {
      expect(service.normalizeEmails('a@test.com,')).toEqual(['a@test.com']);
    });

    it('trims whitespace from each element of an array', () => {
      expect(service.normalizeEmails(['  a@test.com ', 'b@test.com'])).toEqual([
        'a@test.com',
        'b@test.com',
      ]);
    });
  });

  describe('sendAwsSes', () => {
    const formattedData = {
      from: 'sender@example.com',
      to: 'recipient@example.com',
      subject: 'Hello',
      text: 'Hello world',
      html: '<b>Hello world</b>',
    };

    it('creates SESv2Client with credentials from provider config', async () => {
      mockSendMail.mockResolvedValue(mockSentMessageInfo);

      await service.sendAwsSes(formattedData, 42);

      expect(mockGetConfigById).toHaveBeenCalledWith(42);
      expect(SESv2Client).toHaveBeenCalledWith({
        region: 'us-east-1',
        credentials: {
          accessKeyId: 'test-key-id',
          secretAccessKey: 'test-secret-key',
        },
      });
    });

    it('creates nodemailer SES transporter with sesClient and SendEmailCommand', async () => {
      mockSendMail.mockResolvedValue(mockSentMessageInfo);

      await service.sendAwsSes(formattedData, 1);

      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          SES: expect.objectContaining({
            sesClient: expect.any(Object),
          }),
        }),
      );
    });

    it('sends mail with normalized to/cc/bcc and correct fields', async () => {
      mockSendMail.mockResolvedValue(mockSentMessageInfo);
      const data = {
        ...formattedData,
        to: 'a@test.com, b@test.com',
        cc: 'cc@test.com',
        bcc: 'bcc@test.com',
        replyTo: 'reply@test.com',
      };

      await service.sendAwsSes(data, 1);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'sender@example.com',
          to: ['a@test.com', 'b@test.com'],
          cc: ['cc@test.com'],
          bcc: ['bcc@test.com'],
          replyTo: ['reply@test.com'],
          subject: 'Hello',
        }),
      );
    });

    it('defaults cc, bcc, and replyTo to empty arrays when not provided', async () => {
      mockSendMail.mockResolvedValue(mockSentMessageInfo);

      await service.sendAwsSes(formattedData, 1);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({ cc: [], bcc: [], replyTo: [] }),
      );
    });

    it('returns the result from transporter.sendMail', async () => {
      mockSendMail.mockResolvedValue(mockSentMessageInfo);

      const result = await service.sendAwsSes(formattedData, 1);

      expect(result).toBe(mockSentMessageInfo);
    });

    it('re-throws MessageRejected errors directly', async () => {
      const rejectedError = Object.assign(new Error('Message rejected'), {
        name: 'MessageRejected',
      });

      mockSendMail.mockRejectedValue(rejectedError);

      await expect(service.sendAwsSes(formattedData, 1)).rejects.toThrow(rejectedError);
    });

    it('wraps generic errors in a descriptive message', async () => {
      mockSendMail.mockRejectedValue(new Error('network timeout'));

      await expect(service.sendAwsSes(formattedData, 1)).rejects.toThrow(
        'Failed to send message: network timeout',
      );
    });
  });

  describe('formatNotificationData', () => {
    it('returns notification data unchanged when no attachments or icalEvent', async () => {
      const input = { from: 'a@b.com', to: 'c@d.com', subject: 'Hi' };

      const result = await service.formatNotificationData(input);

      expect(result).toEqual(input);
    });

    it('converts text-file attachment content to buffer and moves attachments → attachment', async () => {
      const input = {
        from: 'a@b.com',
        attachments: [{ filename: 'names.txt', content: 'John Doe\nJane Doe' }],
      };

      const result = await service.formatNotificationData(input);

      expect(result.attachment).toHaveLength(1);
      expect((result.attachment as Array<{ filename: string; contentType: string }>)[0]).toEqual(
        expect.objectContaining({ filename: 'names.txt', contentType: 'text/plain' }),
      );
      expect(result.attachments).toBeUndefined();
    });

    it('converts base64 binary attachment content to buffer', async () => {
      const pdfBase64 = Buffer.from('%PDF-1.4').toString('base64');
      const input = {
        from: 'a@b.com',
        attachments: [{ filename: 'doc.pdf', content: pdfBase64 }],
      };

      const result = await service.formatNotificationData(input);
      const attachment = (result.attachment as Array<{ content: Buffer; contentType: string }>)[0];

      expect(Buffer.isBuffer(attachment.content)).toBe(true);
      expect(attachment.contentType).toBe('application/pdf');
    });

    it('appends ical event as text/calendar attachment with correct contentType', async () => {
      const icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR';
      const input = {
        from: 'a@b.com',
        icalEvent: {
          content: icsContent,
          method: 'REQUEST',
          filename: 'invite.ics',
        },
      };

      const result = await service.formatNotificationData(input);
      const attachments = result.attachment as Array<{
        filename: string;
        contentType: string;
        content: string;
      }>;

      expect(attachments).toHaveLength(1);
      expect(attachments[0].filename).toBe('invite.ics');
      expect(attachments[0].contentType).toBe('text/calendar; method=REQUEST; charset=UTF-8');
      expect(attachments[0].content).toBe(icsContent);
    });

    it('combines existing attachments with ical event attachment', async () => {
      const input = {
        from: 'a@b.com',
        attachments: [{ filename: 'notes.txt', content: 'some notes' }],
        icalEvent: { content: 'BEGIN:VCALENDAR\nEND:VCALENDAR', method: 'REQUEST' },
      };

      const result = await service.formatNotificationData(input);
      const attachments = result.attachment as unknown[];

      expect(attachments).toHaveLength(2);
    });

    it('accepts snake_case ical_event field as a fallback', async () => {
      const input = {
        from: 'a@b.com',
        ical_event: { content: 'BEGIN:VCALENDAR\nEND:VCALENDAR', method: 'CANCEL' },
      };

      const result = await service.formatNotificationData(input);
      const attachments = result.attachment as Array<{ contentType: string }>;

      expect(attachments[0].contentType).toBe('text/calendar; method=CANCEL; charset=UTF-8');
    });

    it('reads ical content from filesystem path', async () => {
      const icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR';

      (fs.readFile as jest.Mock).mockResolvedValue(Buffer.from(icsContent));

      const input = { from: 'a@b.com', icalEvent: { path: '/tmp/invite.ics' } };

      const result = await service.formatNotificationData(input);
      const attachments = result.attachment as Array<{ content: string }>;

      expect(attachments[0].content).toBe(icsContent);
    });

    it('throws BadRequestException when icalEvent has neither content nor path', async () => {
      const input = { from: 'a@b.com', icalEvent: {} };

      await expect(service.formatNotificationData(input)).rejects.toThrow(BadRequestException);
    });

    it('reads attachment content from filesystem path', async () => {
      const fileContent = Buffer.from('file data');

      (fs.readFile as jest.Mock).mockResolvedValue(fileContent);

      const input = {
        from: 'a@b.com',
        attachments: [{ filename: 'data.csv', path: '/tmp/data.csv' }],
      };

      const result = await service.formatNotificationData(input);
      const attachment = (result.attachment as Array<{ content: Buffer }>)[0];

      expect(Buffer.isBuffer(attachment.content)).toBe(true);
    });

    it('normalizes a serialized Buffer object (from JSON deserialization)', async () => {
      const original = Buffer.from('hello');
      const serialized = JSON.parse(JSON.stringify(original));
      const input = {
        from: 'a@b.com',
        attachments: [{ filename: 'hello.txt', content: serialized }],
      };

      const result = await service.formatNotificationData(input);
      const attachment = (result.attachment as Array<{ content: Buffer }>)[0];

      expect(Buffer.isBuffer(attachment.content)).toBe(true);
      expect(attachment.content.toString()).toBe('hello');
    });

    it('normalizes a Readable stream to a Buffer', async () => {
      const readable = Readable.from([Buffer.from('stream '), Buffer.from('content')]);
      const input = {
        from: 'a@b.com',
        attachments: [{ filename: 'output.txt', content: readable }],
      };

      const result = await service.formatNotificationData(input);
      const attachment = (result.attachment as Array<{ content: Buffer }>)[0];

      expect(Buffer.isBuffer(attachment.content)).toBe(true);
      expect(attachment.content.toString()).toBe('stream content');
    });
  });
});
