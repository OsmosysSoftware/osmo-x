// OsmoX API Models
// These are temporary manual types until OpenAPI types are generated from the backend.
// All properties use snake_case to match the backend SnakeCaseInterceptor output.

export interface PaginatedResponse<T> {
  items: T[];
  self: string;
  first: string;
  last: string;
  next: string | null;
  prev: string | null;
  page_info: PageInfo;
}

export interface PageInfo {
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface Application {
  application_id: number;
  name: string;
  user_id: number;
  organization_id: number;
  test_mode_enabled: boolean;
  whitelist_recipients: string;
  status: number;
  created_by: number | null;
  updated_by: number | null;
  created_on: string;
  updated_on: string;
}

export interface Provider {
  provider_id: number;
  name: string;
  channel_type: number;
  is_enabled: number;
  configuration: Record<string, unknown>;
  application_id: number;
  user_id: number;
  status: number;
  created_by: number | null;
  updated_by: number | null;
  created_on: string;
  updated_on: string;
}

export interface MasterProvider {
  master_provider_id: number;
  name: string;
  channel_type: number;
  configuration_schema: Record<string, unknown>;
  is_active: boolean;
  created_by: number | null;
  updated_by: number | null;
  created_on: string;
  updated_on: string;
}

export interface ProviderChain {
  chain_id: number;
  chain_name: string;
  application_id: number;
  provider_type: number;
  description?: string;
  is_default: number;
  status: number;
  created_by: number | null;
  updated_by: number | null;
  created_on: string;
  updated_on: string;
}

export interface ProviderChainMember {
  id: number;
  chain_id: number;
  provider_id: number;
  priority_order: number;
  is_active: number;
  status: number;
  created_by: number | null;
  updated_by: number | null;
  created_on: string;
  updated_on: string;
}

export interface Notification {
  id: number;
  channel_type: number;
  data: Record<string, unknown>;
  delivery_status: number;
  result: Record<string, unknown> | null;
  application_id: number;
  provider_id: number | null;
  status: number;
  created_on: string;
  updated_on: string;
  application_details?: Application;
}

export interface ArchivedNotification {
  id: number;
  notification_id: number;
  channel_type: number;
  data: Record<string, unknown>;
  delivery_status: number;
  result: Record<string, unknown> | null;
  application_id: number;
  provider_id: number | null;
  status: number;
  created_on: string;
  updated_on: string;
  application_details?: Application;
}

export interface ServerApiKey {
  api_key_id: number;
  masked_api_key: string;
  application_id: number;
  status: number;
  created_by: number | null;
  updated_by: number | null;
  created_on: string;
  updated_on: string;
}

export interface Webhook {
  id: number;
  provider_id: number;
  webhook_url: string;
  is_verified: number;
  status: number;
  created_by: number | null;
  updated_by: number | null;
  created_on: string;
  updated_on: string;
}

export interface Organization {
  organization_id: number;
  name: string;
  slug: string;
  status: number;
  created_by: number | null;
  updated_by: number | null;
  created_on: string;
  updated_on: string;
}
