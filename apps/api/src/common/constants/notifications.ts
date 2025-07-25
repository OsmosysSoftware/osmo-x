export const DeliveryStatus = {
  PENDING: 1,
  IN_PROGRESS: 2,
  AWAITING_CONFIRMATION: 3,
  QUEUED_CONFIRMATION: 4,
  SUCCESS: 5,
  FAILED: 6,
};

export const ChannelType = {
  SMTP: 1,
  MAILGUN: 2,
  WA_360_DAILOG: 3,
  WA_TWILIO: 4,
  SMS_TWILIO: 5,
  SMS_PLIVO: 6,
  WA_TWILIO_BUSINESS: 7,
  // We no longer support SMS_KAPSYSTEM: 8,
  PUSH_SNS: 9,
  VC_TWILIO: 10,
  AWS_SES: 11,
  SMS_SNS: 12,
};

export const QueueAction = {
  SEND: 'send',
  DELIVERY_STATUS: 'delivery-status',
  WEBHOOK: 'webhook',
};

export const ProviderDeliveryStatus = {
  MAILGUN: {
    SUCCESS_STATES: ['delivered', 'opened', 'clicked'],
    FAILURE_STATES: ['failed', 'rejected'],
  },
  WA_TWILIO: {
    SUCCESS_STATES: ['sent', 'delivered', 'read'],
    FAILURE_STATES: ['failed', 'undelivered'],
  },
  SMS_PLIVO: {
    SUCCESS_STATES: ['sent', 'delivered'],
    FAILURE_STATES: ['failed', 'undelivered', 'rejected'],
  },
  SMS_TWILIO: {
    SUCCESS_STATES: ['sent', 'delivered'],
    FAILURE_STATES: ['failed', 'undelivered'],
  },
  WA_TWILIO_BUSINESS: {
    SUCCESS_STATES: ['sent', 'delivered', 'read'],
    FAILURE_STATES: ['failed', 'undelivered'],
  },
  WA_360_DAILOG: {
    SUCCESS_STATES: ['sent', 'delivered', 'read'],
    FAILURE_STATES: ['failed'],
  },
  VC_TWILIO: {
    SUCCESS_STATES: ['completed'],
    FAILURE_STATES: ['canceled', 'busy', 'no-answer', 'failed'],
  },
};

export const SkipProviderConfirmationChannels = [
  ChannelType.WA_360_DAILOG,
  ChannelType.PUSH_SNS,
  ChannelType.SMTP,
  ChannelType.AWS_SES,
  ChannelType.SMS_SNS,
];

export const RecipientKeyForChannelType = {
  [ChannelType.SMTP]: 'to',
  [ChannelType.MAILGUN]: 'to',
  [ChannelType.WA_360_DAILOG]: 'to',
  [ChannelType.WA_TWILIO]: 'to',
  [ChannelType.SMS_TWILIO]: 'to',
  [ChannelType.SMS_PLIVO]: 'to',
  [ChannelType.WA_TWILIO_BUSINESS]: 'to',
  [ChannelType.PUSH_SNS]: 'target',
  [ChannelType.VC_TWILIO]: 'to',
  [ChannelType.AWS_SES]: 'to',
  [ChannelType.SMS_SNS]: 'to',
};
