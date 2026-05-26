import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { NotificationFiltersComponent } from './notification-filters';
import { NotificationFilters } from '../../../core/models/notification-filters.model';

// Host component to drive the input() signal — input.required<>() refuses
// programmatic set without a binding.
@Component({
  selector: 'app-host',
  standalone: true,
  imports: [NotificationFiltersComponent],
  template: `<app-notification-filters
    [filters]="filters()"
    (filtersChange)="onChange($event)"
    (clear)="onClear()"
  />`,
})
class HostComponent {
  readonly filters = signal<NotificationFilters>({});
  readonly lastChange = signal<NotificationFilters | null>(null);
  readonly clearCount = signal(0);

  onChange(event: NotificationFilters): void {
    this.lastChange.set(event);
  }

  onClear(): void {
    this.clearCount.update((n) => n + 1);
  }
}

describe('NotificationFiltersComponent.activeChips', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let filters: NotificationFiltersComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();

    const debugFilters = fixture.debugElement.query(
      (node) => node.componentInstance instanceof NotificationFiltersComponent,
    );

    filters = debugFilters.componentInstance as NotificationFiltersComponent;
  });

  it('returns an empty chip array when no filter fields are set', () => {
    host.filters.set({});
    fixture.detectChanges();

    expect(filters.activeChips()).toEqual([]);
    expect(filters.activeCount()).toBe(0);
  });

  it('produces a "search" chip with quoted label when filters.search is set', () => {
    host.filters.set({ search: 'hello world' });
    fixture.detectChanges();

    const chips = filters.activeChips();

    expect(chips.length).toBe(1);
    expect(chips[0].id).toBe('search');
    expect(chips[0].label).toBe('"hello world"');
  });

  it('emits a removal that clears search when the search chip remove is invoked', () => {
    host.filters.set({ search: 'hello', recipient: 'a@b.c' });
    fixture.detectChanges();

    const searchChip = filters.activeChips().find((c) => c.id === 'search');

    expect(searchChip).toBeTruthy();
    searchChip!.remove();

    // Only search was removed; recipient stays.
    expect(host.lastChange()).toEqual({ recipient: 'a@b.c' });
  });

  it('builds one chip per named text filter with "<Label> = <value>" formatting', () => {
    host.filters.set({
      recipient: 'a@b.c',
      sender: 's@x.y',
      subject: 'Welcome',
      message_body: 'hi there',
      template_name: 'welcome_v2',
    });
    fixture.detectChanges();

    const chips = filters.activeChips();
    const byId = new Map(chips.map((c) => [c.id, c]));

    expect(chips.length).toBe(5);
    expect(byId.get('recipient')?.label).toBe('Recipient = a@b.c');
    expect(byId.get('sender')?.label).toBe('Sender = s@x.y');
    expect(byId.get('subject')?.label).toBe('Subject = Welcome');
    expect(byId.get('message_body')?.label).toBe('Message body = hi there');
    expect(byId.get('template_name')?.label).toBe('Template Name (WA360) = welcome_v2');
  });

  it('named-chip remove() clears only that one field', () => {
    host.filters.set({ recipient: 'a@b.c', sender: 's@x.y' });
    fixture.detectChanges();

    const senderChip = filters.activeChips().find((c) => c.id === 'sender');

    senderChip!.remove();

    expect(host.lastChange()).toEqual({ recipient: 'a@b.c' });
  });

  it('emits one chip per advancedFilters row keyed adv:<id> with "<key> = <value>" label', () => {
    host.filters.set({
      advancedFilters: [
        { id: 'row1', key: 'contentSid', value: 'CS123' },
        { id: 'row2', key: 'tracking', value: 'tk-9' },
      ],
    });
    fixture.detectChanges();

    const chips = filters.activeChips();

    expect(chips.length).toBe(2);
    expect(chips[0].id).toBe('adv:row1');
    expect(chips[0].label).toBe('contentSid = CS123');
    expect(chips[1].id).toBe('adv:row2');
    expect(chips[1].label).toBe('tracking = tk-9');
  });

  it('advanced-chip remove() drops only the matching row by id', () => {
    host.filters.set({
      advancedFilters: [
        { id: 'row1', key: 'contentSid', value: 'CS123' },
        { id: 'row2', key: 'tracking', value: 'tk-9' },
      ],
    });
    fixture.detectChanges();

    const target = filters.activeChips().find((c) => c.id === 'adv:row1');

    target!.remove();

    expect(host.lastChange()).toEqual({
      advancedFilters: [{ id: 'row2', key: 'tracking', value: 'tk-9' }],
    });
  });

  it('activeCount equals the sum of search + named + advanced chips', () => {
    host.filters.set({
      search: 'q',
      recipient: 'a@b.c',
      advancedFilters: [
        { id: 'r1', key: 'k1', value: 'v1' },
        { id: 'r2', key: 'k2', value: 'v2' },
      ],
    });
    fixture.detectChanges();

    expect(filters.activeCount()).toBe(4);
  });
});
