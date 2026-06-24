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
 *
 * Comma-separated values are supported for recipient, sender, subject, templateName,
 * and dataFilter entries — each term is matched with OR so any hit returns the row.
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
      const values = this.splitValues(filters.recipient);
      const clauses = values.map((_, i) => this.recipientPredicate(alias, `ndf_recipient_${i}`));
      const params = Object.fromEntries(values.map((v, i) => [`ndf_recipient_${i}`, `%${v}%`]));

      qb.andWhere(values.length === 1 ? clauses[0] : `(${clauses.join(' OR ')})`, params);
    }

    if (filters.sender) {
      this.applyILike(
        qb,
        `${q(alias)}.data->>'from'`,
        'ndf_sender',
        this.splitValues(filters.sender),
      );
    }

    if (filters.subject) {
      this.applyILike(
        qb,
        `${q(alias)}.data->>'subject'`,
        'ndf_subject',
        this.splitValues(filters.subject),
      );
    }

    if (filters.messageBody) {
      qb.andWhere(this.messageBodyPredicate(alias), {
        ndf_messageBody: `%${filters.messageBody}%`,
      });
    }

    if (filters.templateName) {
      this.applyILike(
        qb,
        `${q(alias)}.data->'template'->>'name'`,
        'ndf_templateName',
        this.splitValues(filters.templateName),
      );
    }

    if (filters.dataFilter) {
      Object.entries(filters.dataFilter).forEach(([key, value], i) => {
        if (!ADVANCED_KEY_RE.test(key)) {
          return;
        }

        const values = this.splitValues(value);

        if (values.length === 1) {
          qb.andWhere(`${q(alias)}.data->>:ndf_dfk_${i} ILIKE :ndf_dfv_${i}_0`, {
            [`ndf_dfk_${i}`]: key,
            [`ndf_dfv_${i}_0`]: `%${values[0]}%`,
          });
        } else {
          const clauses = values.map(
            (_, j) => `${q(alias)}.data->>:ndf_dfk_${i} ILIKE :ndf_dfv_${i}_${j}`,
          );
          const params = {
            [`ndf_dfk_${i}`]: key,
            ...Object.fromEntries(values.map((v, j) => [`ndf_dfv_${i}_${j}`, `%${v}%`])),
          };

          qb.andWhere(`(${clauses.join(' OR ')})`, params);
        }
      });
    }
  }

  private splitValues(value: string): string[] {
    return value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }

  private applyILike<T>(
    qb: SelectQueryBuilder<T>,
    expression: string,
    paramBase: string,
    values: string[],
  ): void {
    if (values.length === 1) {
      qb.andWhere(`${expression} ILIKE :${paramBase}_0`, { [`${paramBase}_0`]: `%${values[0]}%` });
    } else {
      const clauses = values.map((_, i) => `${expression} ILIKE :${paramBase}_${i}`);
      const params = Object.fromEntries(values.map((v, i) => [`${paramBase}_${i}`, `%${v}%`]));

      qb.andWhere(`(${clauses.join(' OR ')})`, params);
    }
  }

  private recipientPredicate(alias: string, param: string): string {
    const a = q(alias);

    return `(
      (jsonb_typeof(${a}.data->'to')  = 'string' AND ${a}.data->>'to'  ILIKE :${param}) OR
      (jsonb_typeof(${a}.data->'to')  = 'array'  AND EXISTS (SELECT 1 FROM jsonb_array_elements_text(${a}.data->'to')  AS x(v) WHERE x.v ILIKE :${param})) OR
      (jsonb_typeof(${a}.data->'cc')  = 'string' AND ${a}.data->>'cc'  ILIKE :${param}) OR
      (jsonb_typeof(${a}.data->'cc')  = 'array'  AND EXISTS (SELECT 1 FROM jsonb_array_elements_text(${a}.data->'cc')  AS x(v) WHERE x.v ILIKE :${param})) OR
      (jsonb_typeof(${a}.data->'bcc') = 'string' AND ${a}.data->>'bcc' ILIKE :${param}) OR
      (jsonb_typeof(${a}.data->'bcc') = 'array'  AND EXISTS (SELECT 1 FROM jsonb_array_elements_text(${a}.data->'bcc') AS x(v) WHERE x.v ILIKE :${param})) OR
      (${a}.data->>'target' ILIKE :${param})
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
