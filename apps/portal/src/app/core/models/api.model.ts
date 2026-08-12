// OsmoX API Models
// Derived from auto-generated OpenAPI types. Regenerate with: npm run generate:api
// All properties use snake_case to match the backend SnakeCaseInterceptor output.

import { components } from '../types/api.types';

// ===========================
// Response DTOs (from OpenAPI schemas)
// ===========================

export type Notification = components['schemas']['NotificationResponseDto'];
export type ArchivedNotification = components['schemas']['ArchivedNotificationResponseDto'];
export type Application = components['schemas']['ApplicationResponseDto'];
export type Provider = components['schemas']['ProviderResponseDto'];
export type ProviderChain = components['schemas']['ProviderChainResponseDto'];
export type ProviderChainMember = components['schemas']['ProviderChainMemberResponseDto'];
// MasterProvider: backend DTO types `configuration` as `string` but it's a JSONB column
// containing field descriptors with label, id, pattern, type for each config key.
export interface ConfigFieldDescriptor {
  label: string;
  id: string;
  pattern: string;
  type: string;
}
export type MasterProvider = Omit<
  components['schemas']['MasterProviderResponseDto'],
  'configuration'
> & {
  configuration: Record<string, ConfigFieldDescriptor>;
};
export type ServerApiKey = components['schemas']['ServerApiKeyResponseDto'];
// Webhook: last_delivery_status/last_attempted_at were added to the backend DTO alongside
// notify_webhook_logs but aren't in the generated types yet. Manual addition pending the next
// `npm run generate:api` run against a live backend.
export type Webhook = components['schemas']['WebhookResponseDto'] & {
  last_delivery_status: number | null;
  last_attempted_at: string | null;
};
// WebhookLog: new backend DTO (GET /webhooks/logs), not yet present in generated types.
// Manual addition pending the next `npm run generate:api` run against a live backend.
export interface WebhookLog {
  id: number;
  webhook_id: number;
  notification_id: number;
  attempt_number: number;
  status: number;
  http_status_code: number | null;
  request_body: unknown;
  response_body: unknown;
  error_message: string | null;
  requested_at: string;
  created_on: string;
}
export type Organization = components['schemas']['OrganizationResponseDto'];
export type UserResponse = components['schemas']['UserResponseDto'];
export type DashboardStats = components['schemas']['DashboardStatsResponseDto'];
export type DashboardAnalytics = components['schemas']['DashboardAnalyticsResponseDto'];
export type TrendDataPoint = components['schemas']['TrendDataPointDto'];
export type ChannelBreakdown = components['schemas']['ChannelBreakdownDto'];
export type ApplicationStats = components['schemas']['ApplicationStatsDto'];
export type ProviderStats = components['schemas']['ProviderStatsDto'];
export type AuthResponse = components['schemas']['AuthResponseDto'];
export type AuthUserData = components['schemas']['AuthUserData'];
export type PageInfo = components['schemas']['PageInfoDto'];

// ===========================
// Input DTOs (from OpenAPI schemas)
// ===========================

// Application input DTOs: backend DTO types `whitelistRecipients` as `string` but validates with
// @IsObject() and actually accepts JSON objects. Override to match runtime behavior.
export type CreateApplicationInput = Omit<
  components['schemas']['CreateApplicationInput'],
  'whitelist_recipients'
> & {
  whitelist_recipients?: Record<string, string[]> | null;
};
export type UpdateApplicationInput = Omit<
  components['schemas']['UpdateApplicationInput'],
  'whitelist_recipients'
> & {
  whitelist_recipients?: Record<string, string[]> | null;
};
// Provider input DTOs: backend DTO types `configuration` as `string` but validates with
// @IsObject() and actually accepts/returns JSON objects. Override to match runtime behavior.
export type CreateProviderInput = Omit<
  components['schemas']['CreateProviderInput'],
  'configuration'
> & {
  configuration: Record<string, unknown>;
};
export type UpdateProviderInput = Omit<
  components['schemas']['UpdateProviderInput'],
  'configuration'
> & {
  configuration?: Record<string, unknown>;
};
export type CreateProviderChainInput = components['schemas']['CreateProviderChainInput'];
export type UpdateProviderChainInput = components['schemas']['UpdateProviderChainInput'];
export type CreateProviderChainMemberInput =
  components['schemas']['CreateProviderChainMemberInput'];
export type UpdateProviderPriorityOrderInput =
  components['schemas']['UpdateProviderPriorityOrderInput'];
export type DeleteProviderChainMemberInput =
  components['schemas']['DeleteProviderChainMemberInput'];
export type CreateUserInput = components['schemas']['CreateUserInput'];
export type UpdateUserInput = components['schemas']['UpdateUserInput'];
export type UpdateProfileInput = components['schemas']['UpdateProfileInput'];
export type ChangePasswordInput = components['schemas']['ChangePasswordInput'];
export type CreateWebhookInput = components['schemas']['CreateWebhookInput'];
export type UpdateWebhookInput = components['schemas']['UpdateWebhookInput'];
export type CreateOrganizationInput = components['schemas']['CreateOrganizationInput'];
export type UpdateOrganizationInput = components['schemas']['UpdateOrganizationInput'];
export type LoginUserInput = components['schemas']['LoginUserInput'];
export type RefreshTokenDto = components['schemas']['RefreshTokenDto'];

// ===========================
// Paginated Response (generic wrapper)
// ===========================

// The generated PaginatedResponse has `items: unknown[][]` because Swagger
// can't express generics. We define a typed version for frontend use.
export interface PaginatedResponse<T> {
  items: T[];
  self: string;
  first: string;
  last: string;
  next: string | null;
  prev: string | null;
  page_info: PageInfo;
}
