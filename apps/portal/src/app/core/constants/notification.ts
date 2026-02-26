export const DeliveryStatus: Record<number, string> = {
  1: 'Pending',
  2: 'In Progress',
  3: 'Awaiting Confirmation',
  4: 'Queued Confirmation',
  5: 'Success',
  6: 'Failed',
};

export const ChannelType: Record<number, string> = {
  1: 'SMTP',
  2: 'Mailgun',
  3: 'WhatsApp 360Dialog',
  4: 'WhatsApp Twilio',
  5: 'SMS Twilio',
  6: 'SMS Plivo',
  7: 'WhatsApp Twilio Business',
  9: 'Push SNS',
  10: 'Voice Twilio',
  11: 'AWS SES',
  12: 'SMS SNS',
};
