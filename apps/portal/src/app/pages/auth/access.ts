import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';

@Component({
  selector: 'app-access',
  standalone: true,
  imports: [ButtonModule, RouterModule, AppFloatingConfigurator],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-floating-configurator />
    <div
      class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-screen overflow-hidden"
    >
      <div class="flex flex-col items-center justify-center">
        <div
          style="
            border-radius: 56px;
            padding: 0.3rem;
            background: linear-gradient(
              180deg,
              color-mix(in srgb, var(--primary-color), transparent 60%) 10%,
              rgba(33, 150, 243, 0) 30%
            );
          "
        >
          <div
            class="w-full bg-surface-0 dark:bg-surface-900 py-16 px-8 sm:px-20 flex flex-col items-center"
            style="border-radius: 53px"
          >
            <div
              class="flex justify-center items-center border-2 border-primary rounded-full mb-6"
              style="width: 4rem; height: 4rem"
            >
              <i class="pi pi-lock text-primary" style="font-size: 1.5rem"></i>
            </div>
            <h1 class="text-surface-900 dark:text-surface-0 font-bold text-3xl lg:text-5xl mb-2">
              Access Denied
            </h1>
            <p class="text-muted-color text-center mb-8 max-w-sm">
              You do not have the necessary permissions. Please contact your administrator.
            </p>
            <p-button label="Go to Dashboard" icon="pi pi-home" routerLink="/" />
          </div>
        </div>
      </div>
    </div>
  `,
})
export class Access {}
