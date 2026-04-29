import { Injectable } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';

/**
 * Property-specific filters applied against the notification `data` JSON column.
 * The `data` shape varies per channel/provider:
 *   - Email:    { from, to, cc?, bcc?, subject, html, text, replyTo? }
 *   - SMS:      { to, message }
 *   - WhatsApp: { to, type, template?: { name, namespace, language, components }, text?: { body } }
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
  templateName?: string;
  dataFilter?: Record<string, string>;
}

const ADVANCED_KEY_RE = /^[a-zA-Z0-9_]{1,64}$/;

/** Double-quote an alias so PostgreSQL preserves case in raw SQL strings. */
function q(alias: string): string {
  return `"${alias}"`;
}

@Injectable()
export class NotificationDataFilterHelper {
  applyTo<T>(qb: SelectQueryBuilder<T>, alias: string, filters: NotificationDataFilters): void {
    if (filters.recipient) {
      qb.andWhere(this.recipientPredicate(alias), {
        ndf_recipient: `%${filters.recipient}%`,
      });
    }

    if (filters.sender) {
      qb.andWhere(`${q(alias)}.data->>'from' ILIKE :ndf_sender`, {
        ndf_sender: `%${filters.sender}%`,
      });
    }

    if (filters.subject) {
      qb.andWhere(`${q(alias)}.data->>'subject' ILIKE :ndf_subject`, {
        ndf_subject: `%${filters.subject}%`,
      });
    }

    if (filters.messageBody) {
      qb.andWhere(this.messageBodyPredicate(alias), {
        ndf_messageBody: `%${filters.messageBody}%`,
      });
    }

    if (filters.templateName) {
      qb.andWhere(`${q(alias)}.data->'template'->>'name' ILIKE :ndf_templateName`, {
        ndf_templateName: `%${filters.templateName}%`,
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

        qb.andWhere(`${q(alias)}.data->>:ndf_dfk_${i} ILIKE :ndf_dfv_${i}`, {
          [`ndf_dfk_${i}`]: key,
          [`ndf_dfv_${i}`]: `%${value}%`,
        });
      });
    }
  }

  private recipientPredicate(alias: string): string {
    // Match `to`/`cc`/`bcc` whether stored as scalar string or array of strings,
    // plus push `target`. jsonb_typeof guards skip undefined or unexpected types.
    const a = q(alias);

    return `(
      (jsonb_typeof(${a}.data->'to')  = 'string' AND ${a}.data->>'to'  ILIKE :ndf_recipient) OR
      (jsonb_typeof(${a}.data->'to')  = 'array'  AND EXISTS (SELECT 1 FROM jsonb_array_elements_text(${a}.data->'to')  AS x(v) WHERE x.v ILIKE :ndf_recipient)) OR
      (jsonb_typeof(${a}.data->'cc')  = 'string' AND ${a}.data->>'cc'  ILIKE :ndf_recipient) OR
      (jsonb_typeof(${a}.data->'cc')  = 'array'  AND EXISTS (SELECT 1 FROM jsonb_array_elements_text(${a}.data->'cc')  AS x(v) WHERE x.v ILIKE :ndf_recipient)) OR
      (jsonb_typeof(${a}.data->'bcc') = 'string' AND ${a}.data->>'bcc' ILIKE :ndf_recipient) OR
      (jsonb_typeof(${a}.data->'bcc') = 'array'  AND EXISTS (SELECT 1 FROM jsonb_array_elements_text(${a}.data->'bcc') AS x(v) WHERE x.v ILIKE :ndf_recipient)) OR
      (${a}.data->>'target' ILIKE :ndf_recipient)
    )`;
  }

  private messageBodyPredicate(alias: string): string {
    const a = q(alias);

    return `(
      ${a}.data->>'text'    ILIKE :ndf_messageBody OR
      ${a}.data->>'html'    ILIKE :ndf_messageBody OR
      ${a}.data->>'message' ILIKE :ndf_messageBody OR
      ${a}.data#>>'{text,body}'        ILIKE :ndf_messageBody OR
      ${a}.data#>>'{message,default}'  ILIKE :ndf_messageBody
    )`;
  }
}
