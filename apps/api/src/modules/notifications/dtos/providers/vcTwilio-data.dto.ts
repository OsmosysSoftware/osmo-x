import { IsNotEmpty } from 'class-validator';

export class VcTwilioDataDto {
  @IsNotEmpty()
  from: string;

  @IsNotEmpty()
  to: string;

  // Need atleast one of url, twiml for successful request
  url?: string;
  twiml?: string;

  // Remaining parameters
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
  applicationSid?: string;
}
