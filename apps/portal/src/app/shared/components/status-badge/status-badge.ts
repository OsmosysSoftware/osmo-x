import { Component, ChangeDetectionStrategy, computed, input } from '@angular/core';
import { TagModule } from 'primeng/tag';
import { DeliveryStatus } from '../../../core/constants/notification';

@Component({
  selector: 'app-status-badge',
  imports: [TagModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p-tag [value]="label()" [severity]="severity()" />`,
})
export class StatusBadgeComponent {
  readonly status = input.required<number>();

  readonly label = computed(() => DeliveryStatus[this.status()] ?? `Unknown`);

  readonly severity = computed<'success' | 'warn' | 'danger' | 'info' | 'secondary'>(() => {
    switch (this.status()) {
      case 5:
        return 'success';
      case 1:
        return 'warn';
      case 6:
        return 'danger';
      case 2:
      case 3:
      case 4:
        return 'info';
      default:
        return 'secondary';
    }
  });
}
