import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';
import { DashboardService } from '../../features/dashboard/dashboard.service';

@Component({
  selector: 'app-dashboard',
  imports: [CardModule, SkeletonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  readonly stats = this.dashboardService.stats;
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.dashboardService.loadStats().subscribe({
      next: () => this.loading.set(false),
      error: () => {
        this.loading.set(false);
        this.error.set('Failed to load dashboard stats');
      },
    });
  }
}
