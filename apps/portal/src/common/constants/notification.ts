export const DeliveryStatus = {
  PENDING: 1,
  IN_PROGRESS: 2,
  SUCCESS: 3,
  FAILED: 4,
};

export const ChannelType = {
  SMTP: 1,
  MAILGUN: 2,
  WA_360_DAILOG: 3,
  WA_TWILIO: 4,
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
};
