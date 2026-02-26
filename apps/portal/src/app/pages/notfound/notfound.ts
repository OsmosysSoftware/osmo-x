import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';
import { AppLogo } from '../../shared/components/logo/logo';

@Component({
  selector: 'app-notfound',
  standalone: true,
  imports: [RouterModule, AppFloatingConfigurator, ButtonModule, AppLogo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <app-floating-configurator />
    <div
      class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-screen overflow-hidden"
    >
      <div class="flex flex-col items-center justify-center">
        <div
          style="
            border-radius: 56px;
            padding: 0.3rem;
            background: linear-gradient(180deg, color-mix(in srgb, var(--primary-color), transparent 60%) 10%, rgba(33, 150, 243, 0) 30%);
          "
        >
          <div
            class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20 flex flex-col items-center"
            style="border-radius: 53px"
          >
            <app-logo height="40px" class="mb-4" />
            <span class="text-primary font-bold text-3xl">404</span>
            <h1 class="text-surface-900 dark:text-surface-0 font-bold text-3xl lg:text-5xl mb-2">
              Not Found
            </h1>
            <div class="text-surface-600 dark:text-surface-200 mb-8">
              Requested resource is not available.
            </div>
            <p-button label="Go to Dashboard" routerLink="/" />
          </div>
        </div>
      </div>
    </div>`,
})
export class Notfound {}
