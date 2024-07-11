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
  PUSH_SNS: 9,
};

export const ChannelTypeMap = {
  [ChannelType.SMTP]: {
    serviceIcon: 'assets/icons/email.svg',
    altText: 'Email',
    providerName: 'SMTP',
    providerIcon: 'assets/icons/smtp.svg',
    style: 'email',
  },
  [ChannelType.MAILGUN]: {
    serviceIcon: 'assets/icons/email.svg',
    altText: 'Email',
    providerName: 'Mailgun',
    providerIcon: 'assets/icons/mailgun.svg',
    style: 'email',
  },
  [ChannelType.WA_360_DAILOG]: {
    serviceIcon: 'assets/icons/whatsapp.svg',
    altText: 'WhatsApp',
    providerName: '360dialog',
    providerIcon: 'assets/icons/360dialog.png',
    style: 'whatsapp',
  },
  [ChannelType.WA_TWILIO]: {
    serviceIcon: 'assets/icons/whatsapp.svg',
    altText: 'WhatsApp',
    providerName: 'Twilio',
    providerIcon: 'assets/icons/twilio.svg',
    style: 'whatsapp',
  },
  [ChannelType.SMS_TWILIO]: {
    serviceIcon: 'assets/icons/sms.svg',
    altText: 'SMS',
    providerName: 'Twilio',
    providerIcon: 'assets/icons/twilio.svg',
    style: 'sms',
  },
  [ChannelType.SMS_PLIVO]: {
    serviceIcon: 'assets/icons/sms.svg',
    altText: 'SMS',
    providerName: 'Plivo',
    providerIcon: 'assets/icons/plivo.png',
    style: 'sms',
  },
  [ChannelType.WA_TWILIO_BUSINESS]: {
    serviceIcon: 'assets/icons/whatsapp.svg',
    altText: 'Whatsapp',
    providerName: 'Twilio Business',
    providerIcon: 'assets/icons/twilio.svg',
    style: 'whatsapp',
  },
  [ChannelType.SMS_KAPSYSTEM]: {
    serviceIcon: 'assets/icons/sms.svg',
    altText: 'SMS',
    providerName: 'KAP System',
    providerIcon: 'assets/icons/kaps.png',
    style: 'sms',
  },
  [ChannelType.PUSH_SNS]: {
    serviceIcon: 'assets/icons/pushnotification.svg',
    altText: 'Push Notification',
    providerName: 'AWS SNS',
    providerIcon: 'assets/icons/aws.png',
    style: 'pushsns',
  },
};
