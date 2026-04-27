import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { DrawerModule } from 'primeng/drawer';
import { AutoCompleteModule, AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import {
  AdvancedFilterRow,
  NotificationFilters,
} from '../../../core/models/notification-filters.model';

interface ActiveChip {
  id: string;
  label: string;
  remove: () => void;
}

const RESERVED_KEYS = new Set<string>([
  // Recipient (covered by named filter)
  'to',
  'cc',
  'bcc',
  'target',
  // Sender
  'from',
  'replyTo',
  // Subject
  'subject',
  // Message body (top-level + nested handled by named filter)
  'text',
  'html',
  'message',
  // Channel discriminator
  'type',
]);

const ALLOWED_KEY_RE = /^[a-zA-Z0-9_]{1,64}$/;
const KEY_SUGGESTIONS = ['template', 'locale', 'campaign_id', 'priority', 'tag', 'reference_id'];

@Component({
  selector: 'app-notification-filters',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    ChipModule,
    DrawerModule,
    AutoCompleteModule,
    IftaLabelModule,
    InputTextModule,
    MessageModule,
    TooltipModule,
    DividerModule,
  ],
  templateUrl: './notification-filters.html',
  styleUrl: './notification-filters.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationFiltersComponent {
  // External contract
  readonly filters = input.required<NotificationFilters>();
  readonly filtersChange = output<NotificationFilters>();
  readonly clear = output<void>();

  // Drawer state
  readonly filtersOpen = signal(false);

  // Local in-progress edits — committed to parent only on Apply.
  readonly localFilters = signal<NotificationFilters>({});

  // Advanced rows — local; merged into localFilters only on Apply.
  readonly advancedRows = signal<AdvancedFilterRow[]>([]);

  // AutoComplete suggestions filtered by current typed prefix.
  readonly filteredKeys = signal<string[]>(KEY_SUGGESTIONS);

  // Surface RESERVED_KEYS in template for the inline error message branch.
  readonly RESERVED_KEYS = RESERVED_KEYS;

  // Active chips read from the *applied* filters() input — not localFilters —
  // so removing a chip emits filtersChange immediately, bypassing the drawer's
  // Apply gate and updating the table without forcing the user to open the drawer.
  readonly activeChips = computed<ActiveChip[]>(() => {
    const f = this.filters();
    const chips: ActiveChip[] = [];

    if (f.recipient) {
      chips.push({
        id: 'recipient',
        label: `Recipient: ${f.recipient}`,
        remove: () => this.emitWithoutKey('recipient'),
      });
    }

    if (f.sender) {
      chips.push({
        id: 'sender',
        label: `Sender: ${f.sender}`,
        remove: () => this.emitWithoutKey('sender'),
      });
    }

    if (f.subject) {
      chips.push({
        id: 'subject',
        label: `Subject: ${f.subject}`,
        remove: () => this.emitWithoutKey('subject'),
      });
    }

    if (f.messageBody) {
      chips.push({
        id: 'messageBody',
        label: `Message body: ${f.messageBody}`,
        remove: () => this.emitWithoutKey('messageBody'),
      });
    }

    for (const row of f.advancedFilters ?? []) {
      chips.push({
        id: `advanced:${row.id}`,
        label: `${row.key}=${row.value}`,
        remove: () => this.removeAdvancedFromApplied(row.id),
      });
    }

    return chips;
  });

  readonly activeCount = computed(() => this.activeChips().length);

  // Apply button gating: every advanced row must have a non-empty value AND
  // a valid key. Empty rows block Apply silently (no red); only filled-in
  // invalid keys show the inline error message.
  readonly canApply = computed(() =>
    this.advancedRows().every((r) => Boolean(r.key) && Boolean(r.value) && this.isKeyValid(r.key)),
  );

  constructor() {
    // Hydrate localFilters from the applied filters() input — but ONLY when the
    // drawer is closed. While the drawer is open the user's in-progress edits
    // are sovereign; an external filters() change (e.g. URL nav, parent
    // re-render, chip removal) must not wipe them.
    effect(() => {
      if (!this.filtersOpen()) {
        const applied = this.filters();

        this.localFilters.set({ ...applied });
        this.advancedRows.set([...(applied.advancedFilters ?? [])]);
      }
    });
  }

  // ---- localFilters editing ----

  setLocal<K extends keyof NotificationFilters>(key: K, value: NotificationFilters[K]): void {
    this.localFilters.update((f) => ({ ...f, [key]: value }));
  }

  // ---- Advanced rows editing ----

  addRow(): void {
    this.advancedRows.update((rows) => [
      ...rows,
      { id: this.makeId(), key: '', value: '' },
    ]);
  }

  removeRow(index: number): void {
    this.advancedRows.update((rows) => rows.filter((_, i) => i !== index));
  }

  updateKey(index: number, key: string): void {
    this.advancedRows.update((rows) =>
      rows.map((r, i) => (i === index ? { ...r, key } : r)),
    );
  }

  updateValue(index: number, value: string): void {
    this.advancedRows.update((rows) =>
      rows.map((r, i) => (i === index ? { ...r, value } : r)),
    );
  }

  searchKeys(event: AutoCompleteCompleteEvent): void {
    const q = (event.query ?? '').toLowerCase();
    const filtered = KEY_SUGGESTIONS.filter(
      (k) => !RESERVED_KEYS.has(k) && k.toLowerCase().includes(q),
    );

    this.filteredKeys.set(filtered);
  }

  isKeyValid(key: string): boolean {
    if (!key) {
      return true; // empty key = not yet entered, not "invalid"
    }

    return ALLOWED_KEY_RE.test(key) && !RESERVED_KEYS.has(key);
  }

  // ---- Apply / Reset ----

  onApply(): void {
    if (!this.canApply()) {
      return;
    }

    const next: NotificationFilters = {
      ...this.localFilters(),
      advancedFilters: this.advancedRows().filter((r) => r.key && r.value),
    };

    this.filtersChange.emit(next);
    this.filtersOpen.set(false);
  }

  onClearAll(): void {
    // Clear local in-progress edits as well so the drawer reflects the cleared state.
    this.localFilters.set({});
    this.advancedRows.set([]);
    this.clear.emit();
  }

  // ---- Chip removal helpers (operate on applied filters() directly) ----

  private emitWithoutKey(key: keyof NotificationFilters): void {
    const f = { ...this.filters() };

    delete f[key];
    this.filtersChange.emit(f);
  }

  private removeAdvancedFromApplied(rowId: string): void {
    const f = { ...this.filters() };

    f.advancedFilters = (f.advancedFilters ?? []).filter((r) => r.id !== rowId);
    this.filtersChange.emit(f);
  }

  private makeId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}
