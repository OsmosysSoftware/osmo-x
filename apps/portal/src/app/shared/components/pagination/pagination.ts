import { Component, input, output, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginatorModule } from 'primeng/paginator';
export interface PageInfo {
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
}

export interface PageEvent {
  page: number;
  limit: number;
}

@Component({
  selector: 'app-pagination',
  imports: [CommonModule, PaginatorModule],
  templateUrl: './pagination.html',
  styleUrls: ['./pagination.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationComponent {
  // Inputs
  readonly pageInfo = input.required<PageInfo>();
  readonly loading = input<boolean>(false);

  // Outputs
  readonly pageChange = output<number>();
  readonly paginationChange = output<PageEvent>();

  // Computed values
  readonly first = computed(() => {
    const info = this.pageInfo();

    return (info.page - 1) * info.limit;
  });

  readonly rows = computed(() => this.pageInfo().limit);
  readonly totalRecords = computed(() => this.pageInfo().total_items);

  onPageChange(event: { page?: number; first?: number; rows?: number }): void {
    // PrimeNG paginator is 0-indexed, but our API is 1-indexed
    const newPage = (event.page ?? 0) + 1;
    const newLimit = event.rows ?? this.pageInfo().limit;

    this.pageChange.emit(newPage);
    this.paginationChange.emit({ page: newPage, limit: newLimit });
  }
}
