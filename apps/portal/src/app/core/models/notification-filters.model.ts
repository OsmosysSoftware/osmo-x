/**
 * Shared filter shape for the Notifications and Archived Notifications list pages.
 * Property names use camelCase here; HTTP services convert to snake_case at the
 * boundary (recipient, sender, subject, message_body, data_filter[key]).
 */
export interface NotificationFilters {
  channelType?: number;
  deliveryStatus?: number;
  applicationId?: number;
  providerId?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: string;
  order?: 'asc' | 'desc';

  // Property-specific filters against the notification `data` JSON column.
  recipient?: string;
  sender?: string;
  subject?: string;
  messageBody?: string;

  /**
   * Free-form key/value pairs against top-level `data` keys. Keys are
   * validated server-side against ^[a-zA-Z0-9_]{1,64}$. Multiple rows are
   * AND-combined.
   */
  advancedFilters?: AdvancedFilterRow[];
}

export interface AdvancedFilterRow {
  /** Stable identifier for *ngFor track-by, since (key,value) can both be empty during edits. */
  id: string;
  key: string;
  value: string;
}
