export interface Notification {
  id: number;
  channelType: number;
  data: Record<string, unknown>;
  deliveryStatus: number;
  result?: Record<string, unknown> | null;
  createdOn: Date;
  updatedOn: Date;
  createdBy: string;
  updatedBy: string;
  status: number;
}

export interface NotificationResponse {
  notifications: Notification[];
  total: number;
  offset: number;
  limit: number;
}
