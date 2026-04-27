import { DataSource, SelectQueryBuilder } from 'typeorm';
import { NotificationDataFilterHelper } from './notification-data-filter.helper';

class FakeEntity {}

/**
 * Builds a SelectQueryBuilder against a stand-alone DataSource that's never
 * connected. We never call .getMany()/.getQueryAndParameters() — well, we call
 * getQueryAndParameters() which does NOT require an active connection, so this
 * works for asserting SQL fragments + bound parameters at unit-test speed.
 */
function buildQb(): SelectQueryBuilder<FakeEntity> {
  const ds = new DataSource({
    type: 'postgres',
    host: 'localhost',
    database: 'fake',
    entities: [],
    synchronize: false,
    logging: false,
  });

  return ds
    .createQueryBuilder()
    .select('n.*')
    .from('notify_notifications', 'notification') as unknown as SelectQueryBuilder<FakeEntity>;
}

describe('NotificationDataFilterHelper', () => {
  let helper: NotificationDataFilterHelper;

  beforeEach(() => {
    helper = new NotificationDataFilterHelper();
  });

  it('applies recipient predicate covering to/cc/bcc/target', () => {
    const qb = buildQb();
    helper.applyTo(qb, 'notification', { recipient: 'jane@example.com' });
    const [sql, params] = qb.getQueryAndParameters();

    expect(sql).toContain("notification.data->'to'");
    expect(sql).toContain("jsonb_array_elements_text(notification.data->'to')");
    expect(sql).toContain("notification.data->>'target'");
    expect(params).toContain('%jane@example.com%');
  });

  it('applies sender against data.from', () => {
    const qb = buildQb();
    helper.applyTo(qb, 'notification', { sender: 'noreply@osmox.co' });
    const [sql, params] = qb.getQueryAndParameters();

    expect(sql).toContain("notification.data->>'from' ILIKE");
    expect(params).toContain('%noreply@osmox.co%');
  });

  it('applies subject against data.subject', () => {
    const qb = buildQb();
    helper.applyTo(qb, 'notification', { subject: 'Invoice' });
    const [sql, params] = qb.getQueryAndParameters();

    expect(sql).toContain("notification.data->>'subject' ILIKE");
    expect(params).toContain('%Invoice%');
  });

  it('applies messageBody across text/html/message and nested paths', () => {
    const qb = buildQb();
    helper.applyTo(qb, 'notification', { messageBody: 'password' });
    const [sql, params] = qb.getQueryAndParameters();

    expect(sql).toContain("notification.data->>'text'");
    expect(sql).toContain("notification.data->>'html'");
    expect(sql).toContain("notification.data->>'message'");
    expect(sql).toContain("notification.data#>>'{text,body}'");
    expect(sql).toContain("notification.data#>>'{message,default}'");
    expect(params).toContain('%password%');
  });

  it('applies dataFilter as parameterized key/value pairs and AND-combines', () => {
    const qb = buildQb();
    helper.applyTo(qb, 'notification', {
      dataFilter: { template: 'otp_v2', locale: 'en' },
    });
    const [sql, params] = qb.getQueryAndParameters();

    // Both keys and values are bound parameters (not interpolated)
    expect(sql).toMatch(/data->>\$\d+ ILIKE \$\d+/);
    expect(params).toContain('template');
    expect(params).toContain('%otp_v2%');
    expect(params).toContain('locale');
    expect(params).toContain('%en%');
    // Two separate andWhere clauses for the two pairs
    const matches = sql.match(/data->>\$\d+ ILIKE \$\d+/g) ?? [];
    expect(matches).toHaveLength(2);
  });

  it('silently drops dataFilter entries with regex-violating keys', () => {
    const qb = buildQb();
    helper.applyTo(qb, 'notification', {
      dataFilter: { ['bad-key!']: 'x', good_key: 'y' },
    });
    const [sql, params] = qb.getQueryAndParameters();

    expect(params).toContain('good_key');
    expect(params).toContain('%y%');
    // bad key is dropped silently — also the validator at the DTO boundary catches it
    expect(params).not.toContain('bad-key!');
  });

  it('emits zero clauses when no filters are provided', () => {
    const qb = buildQb();
    helper.applyTo(qb, 'notification', {});
    const [sql] = qb.getQueryAndParameters();

    // Base query has no WHERE because we didn't add any
    expect(sql.toLowerCase()).not.toContain('where');
  });

  it('combines multiple named filters via AND', () => {
    const qb = buildQb();
    helper.applyTo(qb, 'notification', {
      recipient: 'jane',
      subject: 'invoice',
      sender: 'noreply',
    });
    const [sql] = qb.getQueryAndParameters();

    // TypeORM uses AND to chain andWhere calls
    expect(sql).toContain('AND');
    expect(sql).toContain("data->>'subject'");
    expect(sql).toContain("data->>'from'");
    expect(sql).toContain("data->'to'");
  });
});
