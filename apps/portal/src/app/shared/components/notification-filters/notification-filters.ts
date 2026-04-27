import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PopoverModule } from 'primeng/popover';
import { TooltipModule } from 'primeng/tooltip';
import {
  AdvancedFilterRow,
  NotificationFilters,
} from '../../../core/models/notification-filters.model';

interface FilterToken {
  id: string;
  label: string;
  namedKey?: keyof NotificationFilters;
  dataFilterKey?: string;
}

interface ActiveChip {
  id: string;
  label: string;
  remove: () => void;
}

const ALLOWED_KEY_RE = /^[a-zA-Z0-9_]{1,64}$/;

const FILTER_TOKENS: FilterToken[] = [
  { id: 'recipient', label: 'Recipient', namedKey: 'recipient' },
  { id: 'sender', label: 'Sender', namedKey: 'sender' },
  { id: 'subject', label: 'Subject', namedKey: 'subject' },
  { id: 'message_body', label: 'Message body', namedKey: 'message_body' },
  { id: 'template_name', label: 'Template (WA360)', namedKey: 'template_name' },
  { id: 'contentSid', label: 'ContentSid', dataFilterKey: 'contentSid' },
];

@Component({
  selector: 'app-notification-filters',
  standalone: true,
  imports: [FormsModule, ButtonModule, InputTextModule, MessageModule, PopoverModule, TooltipModule],
  templateUrl: './notification-filters.html',
  styleUrl: './notification-filters.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick()',
  },
})
export class NotificationFiltersComponent {
  private readonly searchInputRef = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  readonly filters = input.required<NotificationFilters>();
  readonly filtersChange = output<NotificationFilters>();
  readonly clear = output<void>();

  // ---- Search bar state ----
  readonly selectedToken = signal<FilterToken | null>(null);
  readonly inputValue = signal<string>('');
  readonly dropdownVisible = signal<boolean>(false);

  // ---- Advanced popover state ----
  readonly advRows = signal<AdvancedFilterRow[]>([]);

  readonly ALLOWED_KEY_RE = ALLOWED_KEY_RE;

  // ---- Derived ----

  readonly availableTokens = computed<FilterToken[]>(() => {
    const f = this.filters();
    const advKeys = new Set((f.advancedFilters ?? []).map((r) => r.key));

    return FILTER_TOKENS.filter((t) => {
      if (t.namedKey) {

        return !f[t.namedKey];
      }

      if (t.dataFilterKey) {

        return !advKeys.has(t.dataFilterKey);
      }

      return true;
    });
  });

  readonly activeChips = computed<ActiveChip[]>(() => {
    const f = this.filters();
    const chips: ActiveChip[] = [];

    if (f.search) {
      chips.push({
        id: 'search',
        label: `"${f.search}"`,
        remove: () => this.removeField('search'),
      });
    }

    for (const token of FILTER_TOKENS) {
      if (token.namedKey) {
        const val = f[token.namedKey] as string | undefined;

        if (val) {
          chips.push({
            id: token.id,
            label: `${token.label} = ${val}`,
            remove: () => this.removeField(token.namedKey as keyof NotificationFilters),
          });
        }
      }
    }

    for (const row of f.advancedFilters ?? []) {
      chips.push({
        id: `adv:${row.id}`,
        label: `${row.key} = ${row.value}`,
        remove: () => this.removeAdvancedRow(row.id),
      });
    }

    return chips;
  });

  readonly activeCount = computed(() => this.activeChips().length);

  readonly placeholder = computed(() =>
    this.selectedToken() || this.activeChips().length > 0 ? '' : 'Search or filter results...',
  );

  readonly advCanApply = computed(
    () =>
      this.advRows().length > 0 &&
      this.advRows().every(
        (r) => Boolean(r.key) && Boolean(r.value) && ALLOWED_KEY_RE.test(r.key),
      ),
  );

  // ---- Search bar interactions ----

  onBarClick(event: Event): void {
    event.stopPropagation();
    this.dropdownVisible.set(true);
    this.searchInputRef()?.nativeElement.focus();
  }

  onFocus(): void {
    this.dropdownVisible.set(true);
  }

  onInputBlur(): void {
    // mousedown preventDefault on the dropdown div keeps focus in the input when
    // clicking dropdown items, so this only fires when clicking truly outside
    // (e.g. a PrimeNG dropdown that stops click propagation).
    this.dropdownVisible.set(false);
  }

  onInputChange(value: string): void {
    this.inputValue.set(value);
  }

  onKeydown(event: KeyboardEvent): void {
    const val = this.inputValue().trim();
    const token = this.selectedToken();

    if (event.key === 'Enter') {
      if (!val) {

        return;
      }

      if (token) {
        this.commitToken(token, val);
      }
      else {
        this.commitSearch(val);
      }
    }
    else if (event.key === 'Escape') {
      this.closeDropdown();
    }
    else if (event.key === 'Backspace' && !this.inputValue()) {
      if (token) {
        this.selectedToken.set(null);
      } else {
        const chips = this.activeChips();

        if (chips.length > 0) {
          chips[chips.length - 1].remove();
        }
      }
    }
  }

  selectToken(token: FilterToken): void {
    this.selectedToken.set(token);
    this.inputValue.set('');
    this.dropdownVisible.set(false);
    setTimeout(() => this.searchInputRef()?.nativeElement.focus(), 0);
  }

  commitFromDropdown(): void {
    const val = this.inputValue().trim();

    if (!val) {

      return;
    }

    const token = this.selectedToken();

    if (token) {
      this.commitToken(token, val);
    }
    else {
      this.commitSearch(val);
    }
  }

  closeDropdown(): void {
    this.dropdownVisible.set(false);
    this.selectedToken.set(null);
    this.inputValue.set('');
  }

  onDocumentClick(): void {
    this.dropdownVisible.set(false);
  }

  private commitToken(token: FilterToken, value: string): void {
    if (token.namedKey) {
      this.filtersChange.emit({ ...this.filters(), [token.namedKey]: value });
    }
    else if (token.dataFilterKey) {
      const row: AdvancedFilterRow = { id: this.makeId(), key: token.dataFilterKey, value };
      const existing = this.filters().advancedFilters ?? [];

      this.filtersChange.emit({ ...this.filters(), advancedFilters: [...existing, row] });
    }

    this.selectedToken.set(null);
    this.inputValue.set('');
    this.dropdownVisible.set(false);
  }

  private commitSearch(value: string): void {
    // Clear all named text filters — keep only structural (dropdown) filters.
    const f = this.filters();

    this.filtersChange.emit({
      channel_type: f.channel_type,
      delivery_status: f.delivery_status,
      application_id: f.application_id,
      provider_id: f.provider_id,
      date_from: f.date_from,
      date_to: f.date_to,
      sort: f.sort,
      order: f.order,
      search: value,
    });
    this.inputValue.set('');
    this.dropdownVisible.set(false);
  }

  // ---- Advanced popover ----

  openAdvanced(popover: { toggle: (event: MouseEvent) => void }, event: MouseEvent): void {
    const applied = this.filters().advancedFilters ?? [];

    this.advRows.set(applied.length ? [...applied] : [this.makeRow()]);
    popover.toggle(event);
  }

  addAdvRow(): void {
    this.advRows.update((rows) => [...rows, this.makeRow()]);
  }

  removeAdvRow(index: number): void {
    this.advRows.update((rows) => rows.filter((_, i) => i !== index));
  }

  updateAdvKey(index: number, key: string): void {
    this.advRows.update((rows) => rows.map((r, i) => (i === index ? { ...r, key } : r)));
  }

  updateAdvValue(index: number, value: string): void {
    this.advRows.update((rows) => rows.map((r, i) => (i === index ? { ...r, value } : r)));
  }

  applyAdvanced(popover: { hide: () => void }): void {
    if (!this.advCanApply()) {

      return;
    }

    const rows = this.advRows().filter((r) => r.key && r.value);

    this.filtersChange.emit({ ...this.filters(), advancedFilters: rows });
    popover.hide();
  }

  // ---- Clear all ----

  onClearAll(): void {
    this.clear.emit();
  }

  // ---- Chip removal ----

  private removeField(key: keyof NotificationFilters): void {
    const f = { ...this.filters() };

    delete f[key];
    this.filtersChange.emit(f);
  }

  private removeAdvancedRow(rowId: string): void {
    const f = { ...this.filters() };

    f.advancedFilters = (f.advancedFilters ?? []).filter((r) => r.id !== rowId);
    this.filtersChange.emit(f);
  }

  private makeId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private makeRow(): AdvancedFilterRow {
    return { id: this.makeId(), key: '', value: '' };
  }
}
