import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { AuthService } from '../../core/services/auth.service';
import { UserRoles } from '../../core/constants/roles';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [AppMenuitem, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ul class="layout-menu">
    @for (item of model(); track item.label; let i = $index) {
      @if (item.separator) {
        <li class="menu-separator"></li>
      } @else {
        <li app-menuitem [item]="item" [index]="i" [root]="true"></li>
      }
    }
  </ul> `,
})
export class AppMenu {
  private readonly authService = inject(AuthService);

  readonly model = computed<MenuItem[]>(() => {
    const isOrgAdmin = this.authService.hasMinimumRole(UserRoles.ORG_ADMIN);
    const isSuperAdmin = this.authService.isSuperAdmin();

    const items: MenuItem[] = [
      {
        label: 'Home',
        items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/dashboard'] }],
      },
      {
        label: 'Notifications',
        items: [
          {
            label: 'All Notifications',
            icon: 'pi pi-fw pi-bell',
            routerLink: ['/notifications'],
          },
          {
            label: 'Archived Notifications',
            icon: 'pi pi-fw pi-inbox',
            routerLink: ['/archived-notifications'],
          },
        ],
      },
    ];

    if (isOrgAdmin) {
      items.push({
        label: 'Configuration',
        items: [
          {
            label: 'Applications',
            icon: 'pi pi-fw pi-th-large',
            routerLink: ['/applications'],
          },
          { label: 'Providers', icon: 'pi pi-fw pi-link', routerLink: ['/providers'] },
          {
            label: 'Provider Chains',
            icon: 'pi pi-fw pi-sitemap',
            routerLink: ['/provider-chains'],
          },
          {
            label: 'Chain Members',
            icon: 'pi pi-fw pi-arrows-h',
            routerLink: ['/provider-chain-members'],
          },
          { label: 'Webhooks', icon: 'pi pi-fw pi-bolt', routerLink: ['/webhooks'] },
          { label: 'API Keys', icon: 'pi pi-fw pi-key', routerLink: ['/api-keys'] },
        ],
      });
    }

    const administrationItems: MenuItem[] = [];

    if (isOrgAdmin) {
      administrationItems.push({
        label: 'Users',
        icon: 'pi pi-fw pi-users',
        routerLink: ['/users'],
      });
    }

    if (isSuperAdmin) {
      administrationItems.push({
        label: 'Organizations',
        icon: 'pi pi-fw pi-building',
        routerLink: ['/organizations'],
      });
    }

    if (administrationItems.length > 0) {
      items.push({
        label: 'Administration',
        items: administrationItems,
      });
    }

    return items;
  });
}
