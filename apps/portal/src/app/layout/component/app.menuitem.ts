import {
  Component,
  HostBinding,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  inject,
  input,
  signal,
  computed,
} from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { RippleModule } from 'primeng/ripple';
import { MenuItem } from 'primeng/api';
import { LayoutService } from '../service/layout.service';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: '[app-menuitem]',
  imports: [CommonModule, RouterModule, RippleModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (root() && item().visible !== false) {
      <div class="layout-menuitem-root-text">
        {{ item().label }}
      </div>
    }
    @if ((!item().routerLink || item().items) && item().visible !== false) {
      <a
        [attr.href]="item().url"
        (click)="itemClick($event)"
        [ngClass]="item().styleClass"
        [attr.target]="item().target"
        tabindex="0"
        pRipple
      >
        <i [ngClass]="item().icon" class="layout-menuitem-icon"></i>
        <span class="layout-menuitem-text">{{ item().label }}</span>
        @if (item().items) {
          <i class="pi pi-fw pi-angle-down layout-submenu-toggler"></i>
        }
      </a>
    }
    @if (item().routerLink && !item().items && item().visible !== false) {
      <a
        (click)="itemClick($event)"
        [ngClass]="item().styleClass"
        [routerLink]="item().routerLink"
        routerLinkActive="active-route"
        [routerLinkActiveOptions]="
          item().routerLinkActiveOptions || {
            paths: 'exact',
            queryParams: 'ignored',
            matrixParams: 'ignored',
            fragment: 'ignored',
          }
        "
        [fragment]="item().fragment"
        [queryParamsHandling]="item().queryParamsHandling"
        [preserveFragment]="item().preserveFragment"
        [skipLocationChange]="item().skipLocationChange"
        [replaceUrl]="item().replaceUrl"
        [state]="item().state"
        [queryParams]="item().queryParams"
        [attr.target]="item().target"
        tabindex="0"
        pRipple
      >
        <i [ngClass]="item().icon" class="layout-menuitem-icon"></i>
        <span class="layout-menuitem-text">{{ item().label }}</span>
        @if (item().items) {
          <i class="pi pi-fw pi-angle-down layout-submenu-toggler"></i>
        }
      </a>
    }

    @if (item().items && item().visible !== false) {
      <ul [@children]="submenuAnimation()">
        @for (child of item().items; track child.label; let i = $index) {
          <li
            app-menuitem
            [item]="child"
            [index]="i"
            [parentKey]="key()"
            [class]="child['badgeClass']"
          ></li>
        }
      </ul>
    }
  `,
  animations: [
    trigger('children', [
      state(
        'collapsed',
        style({
          height: '0',
        }),
      ),
      state(
        'expanded',
        style({
          height: '*',
        }),
      ),
      transition('collapsed <=> expanded', animate('400ms cubic-bezier(0.86, 0, 0.07, 1)')),
    ]),
  ],
})
export class AppMenuitem implements OnInit, OnDestroy {
  readonly item = input.required<MenuItem>();

  readonly index = input.required<number>();

  @HostBinding('class.layout-root-menuitem')
  get isRoot(): boolean {
    return this.root();
  }

  readonly root = input<boolean>(false);

  readonly parentKey = input<string>('');

  readonly active = signal(false);

  readonly key = signal('');

  private readonly router = inject(Router);
  private readonly layoutService = inject(LayoutService);

  private menuSourceSubscription!: Subscription;
  private menuResetSubscription!: Subscription;
  private routerSubscription!: Subscription;

  readonly submenuAnimation = computed(() =>
    this.root() ? 'expanded' : this.active() ? 'expanded' : 'collapsed',
  );

  @HostBinding('class.active-menuitem')
  get activeClass(): boolean {
    return this.active() && !this.root();
  }

  constructor() {
    this.menuSourceSubscription = this.layoutService.menuSource$.subscribe((value) => {
      Promise.resolve(null).then(() => {
        if (value.routeEvent) {
          this.active.set(
            value.key === this.key() || value.key.startsWith(this.key() + '-') ? true : false,
          );
        } else {
          if (value.key !== this.key() && !value.key.startsWith(this.key() + '-')) {
            this.active.set(false);
          }
        }
      });
    });

    this.menuResetSubscription = this.layoutService.resetSource$.subscribe(() => {
      this.active.set(false);
    });

    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        if (this.item().routerLink) {
          this.updateActiveStateFromRoute();
        }
      });
  }

  ngOnInit(): void {
    this.key.set(this.parentKey() ? this.parentKey() + '-' + this.index() : String(this.index()));

    if (this.item().routerLink) {
      this.updateActiveStateFromRoute();
    }
  }

  updateActiveStateFromRoute(): void {
    const activeRoute = this.router.isActive(this.item().routerLink[0], {
      paths: 'exact',
      queryParams: 'ignored',
      matrixParams: 'ignored',
      fragment: 'ignored',
    });

    if (activeRoute) {
      this.layoutService.onMenuStateChange({ key: this.key(), routeEvent: true });
    }
  }

  itemClick(event: Event): void {
    // avoid processing disabled items
    if (this.item().disabled) {
      event.preventDefault();

      return;
    }

    // execute command
    if (this.item().command) {
      this.item().command!({ originalEvent: event, item: this.item() });
    }

    // toggle active state
    if (this.item().items) {
      this.active.update((current) => !current);
    }

    this.layoutService.onMenuStateChange({ key: this.key() });
  }

  ngOnDestroy(): void {
    if (this.menuSourceSubscription) {
      this.menuSourceSubscription.unsubscribe();
    }

    if (this.menuResetSubscription) {
      this.menuResetSubscription.unsubscribe();
    }

    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }
}
