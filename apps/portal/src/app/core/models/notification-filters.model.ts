/**
 * Shared filter shape for the Notifications and Archived Notifications list pages.
 * Property names match the API query-param names verbatim (snake_case end-to-end).
 * No translation at the HTTP boundary — filters.field_name maps directly to
 * params.set('field_name', ...) and to the backend DTO field.
 */
export interface NotificationFilters {
  channel_type?: number;
  delivery_status?: number;
  application_id?: number;
  provider_id?: number;
  search?: string;
  date_from?: string;
  date_to?: string;
  sort?: string;
  order?: 'asc' | 'desc';

  // Property-specific filters against the notification `data` JSON column.
  recipient?: string;
  sender?: string;
  subject?: string;
  message_body?: string;
  /** WhatsApp 360Dialog / Twilio Business template name (data.template.name). */
  template_name?: string;

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
