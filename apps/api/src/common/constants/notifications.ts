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
  SMS_KAPSYSTEM: 8,
};

export const QueueAction = {
  SEND: 'send',
  DELIVERY_STATUS: 'delivery-status',
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
  SMS_KAPSYSTEM: {
    SUCCESS_STATES: ['DELIVRD'],
    FAILURE_STATES: ['EXPIRED', 'UNDELIV', 'FAILED'],
  },
};

export const SkipProviderConfirmationChannels = [
  ChannelType.SMS_KAPSYSTEM,
  ChannelType.WA_360_DAILOG,
];
