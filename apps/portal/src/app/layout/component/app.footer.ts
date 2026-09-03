import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { APP_VERSION } from '../../core/constants/app-version';

@Component({
  standalone: true,
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="layout-footer">
    <a
      href="https://osmosys.co/"
      target="_blank"
      rel="noopener noreferrer"
      class="text-primary font-bold hover:underline"
      >Copyright &copy; {{ currentYear() }} Osmosys Software Solutions</a
    >
    | All Rights Reserved | <span class="text-muted-color">v{{ appVersion }}</span>
  </div>`,
})
export class AppFooter {
  readonly currentYear = signal(new Date().getFullYear());

  readonly appVersion = APP_VERSION;
}
