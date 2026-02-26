import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, AppMenuitem, RouterModule],
  template: `<ul class="layout-menu">
    <ng-container *ngFor="let item of model; let i = index">
      <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
      <li *ngIf="item.separator" class="menu-separator"></li>
    </ng-container>
  </ul> `,
})
export class AppMenu implements OnInit {
  model: MenuItem[] = [];

  ngOnInit() {
    this.model = [
      {
        label: 'Home',
        items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/dashboard'] }],
      },
      {
        label: 'Notifications',
        items: [
          {
            label: 'Active',
            icon: 'pi pi-fw pi-bell',
            routerLink: ['/notifications'],
          },
          {
            label: 'Archived',
            icon: 'pi pi-fw pi-inbox',
            routerLink: ['/archived-notifications'],
          },
        ],
      },
      {
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
          { label: 'Webhooks', icon: 'pi pi-fw pi-bolt', routerLink: ['/webhooks'] },
          { label: 'API Keys', icon: 'pi pi-fw pi-key', routerLink: ['/api-keys'] },
        ],
      },
      {
        label: 'Administration',
        items: [
          { label: 'Users', icon: 'pi pi-fw pi-users', routerLink: ['/users'] },
        ],
      },
    ];
  }
}
