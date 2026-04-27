import { Injectable } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';

/**
 * Property-specific filters applied against the notification `data` JSON column.
 * The `data` shape varies per channel/provider:
 *   - Email:    { from, to, cc?, bcc?, subject, html, text, replyTo? }
 *   - SMS:      { to, message }
 *   - WhatsApp: { to, type, template?, text?: { body } }
 *   - Push:     { target, message: { GCM?, APNS?, default? } }
 *
 * All predicates use ILIKE '%v%' substring matching. The pg_trgm GIN expression
 * indexes on (data->>'subject'/'from'/'to') accelerate substring search; trigram
 * indexes require ≥ 3 character search patterns to be useful.
 */
export interface NotificationDataFilters {
  recipient?: string;
  sender?: string;
  subject?: string;
  messageBody?: string;
  dataFilter?: Record<string, string>;
}

const ADVANCED_KEY_RE = /^[a-zA-Z0-9_]{1,64}$/;

@Injectable()
export class NotificationDataFilterHelper {
  applyTo<T>(
    qb: SelectQueryBuilder<T>,
    alias: string,
    filters: NotificationDataFilters,
  ): void {
    if (filters.recipient) {
      qb.andWhere(this.recipientPredicate(alias), {
        ndf_recipient: `%${filters.recipient}%`,
      });
    }

    if (filters.sender) {
      qb.andWhere(`${alias}.data->>'from' ILIKE :ndf_sender`, {
        ndf_sender: `%${filters.sender}%`,
      });
    }

    if (filters.subject) {
      qb.andWhere(`${alias}.data->>'subject' ILIKE :ndf_subject`, {
        ndf_subject: `%${filters.subject}%`,
      });
    }

    if (filters.messageBody) {
      qb.andWhere(this.messageBodyPredicate(alias), {
        ndf_messageBody: `%${filters.messageBody}%`,
      });
    }

    if (filters.dataFilter) {
      Object.entries(filters.dataFilter).forEach(([key, value], i) => {
        // Defense in depth: keys are already validated by IsDataFilterMap at the
        // DTO boundary, but we revalidate here in case the helper is invoked from
        // a path that bypasses the DTO.
        if (!ADVANCED_KEY_RE.test(key)) {
          return;
        }

        qb.andWhere(`${alias}.data->>:ndf_dfk_${i} ILIKE :ndf_dfv_${i}`, {
          [`ndf_dfk_${i}`]: key,
          [`ndf_dfv_${i}`]: `%${value}%`,
        });
      });
    }
  }

  private recipientPredicate(alias: string): string {
    // Match `to`/`cc`/`bcc` whether stored as scalar string or array of strings,
    // plus push `target`. jsonb_typeof guards skip undefined or unexpected types.
    return `(
      (jsonb_typeof(${alias}.data->'to')  = 'string' AND ${alias}.data->>'to'  ILIKE :ndf_recipient) OR
      (jsonb_typeof(${alias}.data->'to')  = 'array'  AND EXISTS (SELECT 1 FROM jsonb_array_elements_text(${alias}.data->'to')  AS x(v) WHERE x.v ILIKE :ndf_recipient)) OR
      (jsonb_typeof(${alias}.data->'cc')  = 'string' AND ${alias}.data->>'cc'  ILIKE :ndf_recipient) OR
      (jsonb_typeof(${alias}.data->'cc')  = 'array'  AND EXISTS (SELECT 1 FROM jsonb_array_elements_text(${alias}.data->'cc')  AS x(v) WHERE x.v ILIKE :ndf_recipient)) OR
      (jsonb_typeof(${alias}.data->'bcc') = 'string' AND ${alias}.data->>'bcc' ILIKE :ndf_recipient) OR
      (jsonb_typeof(${alias}.data->'bcc') = 'array'  AND EXISTS (SELECT 1 FROM jsonb_array_elements_text(${alias}.data->'bcc') AS x(v) WHERE x.v ILIKE :ndf_recipient)) OR
      (${alias}.data->>'target' ILIKE :ndf_recipient)
    )`;
  }

  private messageBodyPredicate(alias: string): string {
    return `(
      ${alias}.data->>'text'    ILIKE :ndf_messageBody OR
      ${alias}.data->>'html'    ILIKE :ndf_messageBody OR
      ${alias}.data->>'message' ILIKE :ndf_messageBody OR
      ${alias}.data#>>'{text,body}'        ILIKE :ndf_messageBody OR
      ${alias}.data#>>'{message,default}'  ILIKE :ndf_messageBody
    )`;
  }
}
