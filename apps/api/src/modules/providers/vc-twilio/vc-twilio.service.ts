import { BadRequestException, Injectable } from '@nestjs/common';
import * as Twilio from 'twilio';
import { ProvidersService } from '../providers.service';

export interface VcTwilioData {
  from: string;
  to: string;
  method?: string;
  fallbackUrl?: string;
  fallbackMethod?: string;
  statusCallback?: string;
  statusCallbackEvent?: Array<string>;
  statusCallbackMethod?: string;
  sendDigits?: string;
  timeout?: number;
  record?: boolean;
  recordingChannels?: string;
  recordingStatusCallback?: string;
  recordingStatusCallbackMethod?: string;
  sipAuthUsername?: string;
  sipAuthPassword?: string;
  machineDetection?: string;
  machineDetectionTimeout?: number;
  recordingStatusCallbackEvent?: Array<string>;
  trim?: string;
  callerId?: string;
  machineDetectionSpeechThreshold?: number;
  machineDetectionSpeechEndThreshold?: number;
  machineDetectionSilenceTimeout?: number;
  asyncAmd?: string;
  asyncAmdStatusCallback?: string;
  asyncAmdStatusCallbackMethod?: string;
  byoc?: string;
  callReason?: string;
  callToken?: string;
  recordingTrack?: string;
  timeLimit?: number;
  url?: string;
  twiml?: string;
  applicationSid?: string;
}

export interface VcTwilioResponseData {
  account_sid: string;
  annotation: string | null;
  answered_by: string | null;
  api_version: string;
  caller_name: string | null;
  date_created: string;
  date_updated: string;
  direction: string;
  duration: string;
  end_time: string;
  forwarded_from: string;
  from: string;
  from_formatted: string;
  group_sid: string | null;
  parent_call_sid: string | null;
  phone_number_sid: string;
  price: string;
  price_unit: string;
  sid: string;
  start_time: string;
  status: string;
  subresource_uris: {
    notifications: string;
    recordings: string;
    payments: string;
    events: string;
    siprec: string;
    streams: string;
    transcriptions: string;
    user_defined_message_subscriptions: string;
    user_defined_messages: string;
  };
  to: string;
  to_formatted: string;
  trunk_sid: string | null;
  uri: string;
  queue_time: string;
}

@Injectable()
export class VcTwilioService {
  private twilioClient;
  private twilioVoiceCallObject: Partial<VcTwilioData>;

  constructor(private readonly providersService: ProvidersService) {}

  async assignTransport(providerId: number): Promise<void> {
    const vcTwilioConfig = await this.providersService.getConfigById(providerId);
    const accountSid = vcTwilioConfig.TWILIO_VC_ACCOUNT_SID as string;
    const authToken = vcTwilioConfig.TWILIO_VC_AUTH_TOKEN as string;
    this.twilioClient = Twilio(accountSid, authToken);
  }

  async filterRequestBody(requestBody: Partial<VcTwilioData>): Promise<void> {
    const allowedKeys = [
      'from',
      'to',
      'method',
      'fallbackUrl',
      'fallbackMethod',
      'statusCallback',
      'statusCallbackEvent',
      'statusCallbackMethod',
      'sendDigits',
      'timeout',
      'record',
      'recordingChannels',
      'recordingStatusCallback',
      'recordingStatusCallbackMethod',
      'sipAuthUsername',
      'sipAuthPassword',
      'machineDetection',
      'machineDetectionTimeout',
      'recordingStatusCallbackEvent',
      'trim',
      'callerId',
      'machineDetectionSpeechThreshold',
      'machineDetectionSpeechEndThreshold',
      'machineDetectionSilenceTimeout',
      'asyncAmd',
      'asyncAmdStatusCallback',
      'asyncAmdStatusCallbackMethod',
      'byoc',
      'callReason',
      'callToken',
      'recordingTrack',
      'timeLimit',
      'url',
      'twiml',
      'applicationSid',
    ];

    if (requestBody.url === undefined && requestBody.twiml === undefined) {
      throw new BadRequestException(
        'Request must include either a "url" or "twiml" parameter for Twilio voice calls',
      );
    }

    for (const key of allowedKeys) {
      if (requestBody[key] !== undefined) {
        this.twilioVoiceCallObject[key] = requestBody[key];
      }
    }
  }

  async sendVoiceCall(body: VcTwilioData, providerId: number): Promise<VcTwilioResponseData> {
    try {
      await this.assignTransport(providerId);
      // Function to create correct object for twilioClient and verify if one of url, twiml exist in request body
      this.twilioVoiceCallObject = {};
      await this.filterRequestBody(body);
      const voiceCall = await this.twilioClient.calls.create(this.twilioVoiceCallObject);
      return voiceCall;
    } catch (error) {
      throw new Error(`Failed to send voice call: ${error.message}`);
    }
  }

  async getDeliveryStatus(sid: string, providerId: number): Promise<VcTwilioResponseData> {
    try {
      await this.assignTransport(providerId);
      const message = await this.twilioClient.calls(sid).fetch();
      return message;
    } catch (error) {
      throw new Error(`Failed to fetch delivery status: ${error.message}`);
    }
  }
}
