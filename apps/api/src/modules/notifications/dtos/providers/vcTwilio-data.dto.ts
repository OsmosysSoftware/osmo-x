import { IsNotEmpty, IsOptional, ValidateIf } from 'class-validator';

export class VcTwilioDataDto {
  @IsNotEmpty()
  from: string;

  @IsNotEmpty()
  to: string;

  // Need atleast one of url, twiml for successful request
  @IsOptional()
  url?: string;

  @IsOptional()
  twiml?: string;

  @ValidateIf((obj: VcTwilioDataDto) => !obj.url && !obj.twiml)
  @IsNotEmpty({
    message: 'Request must include either a "url" or "twiml" parameter for Twilio voice calls',
  })
  validateUrlOrTwiml: string; // This is a dummy property to apply the custom validation logic

  // Remaining parameters
  @IsOptional()
  method?: string;

  @IsOptional()
  fallbackUrl?: string;

  @IsOptional()
  fallbackMethod?: string;

  @IsOptional()
  statusCallback?: string;

  @IsOptional()
  statusCallbackEvent?: Array<string>;

  @IsOptional()
  statusCallbackMethod?: string;

  @IsOptional()
  sendDigits?: string;

  @IsOptional()
  timeout?: number;

  @IsOptional()
  record?: boolean;

  @IsOptional()
  recordingChannels?: string;

  @IsOptional()
  recordingStatusCallback?: string;

  @IsOptional()
  recordingStatusCallbackMethod?: string;

  @IsOptional()
  sipAuthUsername?: string;

  @IsOptional()
  sipAuthPassword?: string;

  @IsOptional()
  machineDetection?: string;

  @IsOptional()
  machineDetectionTimeout?: number;

  @IsOptional()
  recordingStatusCallbackEvent?: Array<string>;

  @IsOptional()
  trim?: string;

  @IsOptional()
  callerId?: string;

  @IsOptional()
  machineDetectionSpeechThreshold?: number;

  @IsOptional()
  machineDetectionSpeechEndThreshold?: number;

  @IsOptional()
  machineDetectionSilenceTimeout?: number;

  @IsOptional()
  asyncAmd?: string;

  @IsOptional()
  asyncAmdStatusCallback?: string;

  @IsOptional()
  asyncAmdStatusCallbackMethod?: string;

  @IsOptional()
  byoc?: string;

  @IsOptional()
  callReason?: string;

  @IsOptional()
  callToken?: string;

  @IsOptional()
  recordingTrack?: string;

  @IsOptional()
  timeLimit?: number;

  @IsOptional()
  applicationSid?: string;
}
