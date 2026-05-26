import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { DashboardComponent } from './dashboard';
import { DashboardService } from '../../features/dashboard/dashboard.service';
import { ConfigService } from '../../core/services/config.service';
import { NotificationTrendsWidget } from './widgets/notification-trends-widget';
import { ChannelBreakdownWidget } from './widgets/channel-breakdown-widget';
import { ApplicationStatsWidget } from './widgets/application-stats-widget';
import {
  DashboardAnalytics,
  DashboardStats,
} from '../../core/models/api.model';

class ConfigServiceStub {
  readonly apiUrl = 'http://test.local/api/v1';
  readonly apiDocsUrl = 'http://test.local/api/docs';

  load(): Promise<void> {
    return Promise.resolve();
  }
}

class DashboardServiceStub {
  readonly stats = signal<DashboardStats | null>(null);
  readonly analytics = signal<DashboardAnalytics | null>(null);

  loadStats = jasmine.createSpy('loadStats').and.returnValue(of(null));
  loadAnalytics = jasmine.createSpy('loadAnalytics').and.returnValue(of(null));
}

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let component: DashboardComponent;
  let dashboardService: DashboardServiceStub;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        { provide: ConfigService, useClass: ConfigServiceStub },
        { provide: DashboardService, useClass: DashboardServiceStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    dashboardService = TestBed.inject(DashboardService) as unknown as DashboardServiceStub;
  });

  describe('analytics null-state', () => {
    it('does not call initChart on any widget when analytics() is null', () => {
      // Spy on each widget's prototype initChart method (private — accessed via cast).
      const trendsProto = NotificationTrendsWidget.prototype as unknown as {
        initChart: () => void;
      };
      const channelProto = ChannelBreakdownWidget.prototype as unknown as {
        initChart: () => void;
      };
      const appStatsProto = ApplicationStatsWidget.prototype as unknown as {
        initChart: () => void;
      };

      const trendsSpy = spyOn(trendsProto, 'initChart').and.callThrough();
      const channelSpy = spyOn(channelProto, 'initChart').and.callThrough();
      const appStatsSpy = spyOn(appStatsProto, 'initChart').and.callThrough();

      dashboardService.analytics.set(null);

      fixture.detectChanges();

      // No analytics data → effect should observe empty data and the initChart
      // body returns early without doing any chart work. We assert "no calls"
      // BEFORE the 150ms setTimeout would fire by checking immediately.
      // (The fact that we never advanced fakeAsync/tick means the timers
      // queued by the widgets' effect haven't fired yet.)
      expect(trendsSpy).not.toHaveBeenCalled();
      expect(channelSpy).not.toHaveBeenCalled();
      expect(appStatsSpy).not.toHaveBeenCalled();
    });

    it('initialises the analyticsLoading signal as true', () => {
      expect(component.analyticsLoading()).toBeTrue();
    });

    it('passes a fallback [] to each widget when analytics() is null', () => {
      dashboardService.analytics.set(null);
      fixture.detectChanges();

      // Pull the rendered widget instances and read their data input.
      const trendsEl = fixture.debugElement.query(
        (node) => node.componentInstance instanceof NotificationTrendsWidget,
      );
      const channelEl = fixture.debugElement.query(
        (node) => node.componentInstance instanceof ChannelBreakdownWidget,
      );

      expect(trendsEl).toBeTruthy();
      expect(channelEl).toBeTruthy();

      const trendsCmp = trendsEl.componentInstance as NotificationTrendsWidget;
      const channelCmp = channelEl.componentInstance as ChannelBreakdownWidget;

      expect(trendsCmp.data()).toEqual([]);
      expect(channelCmp.data()).toEqual([]);
    });

    it('calls loadStats and loadAnalytics on init with the default source/period', () => {
      fixture.detectChanges();

      expect(dashboardService.loadStats).toHaveBeenCalledWith('both', '24h');
      expect(dashboardService.loadAnalytics).toHaveBeenCalledWith('24h', 'both');
    });
  });
});
