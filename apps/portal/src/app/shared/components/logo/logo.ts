import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-logo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: inline-block; line-height: 0;' },
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="60 0 700 130"
      [style.height]="height()"
      style="width: auto;"
    >
      <g transform="translate(40,20)">
        <line x1="80" y1="40" x2="160" y2="40" style="stroke: var(--text-color); stroke-width: 8; stroke-linecap: round; stroke-linejoin: round; fill: none;" />
        <line x1="160" y1="40" x2="200" y2="10" style="stroke: var(--text-color); stroke-width: 8; stroke-linecap: round; stroke-linejoin: round; fill: none;" />
        <line x1="160" y1="40" x2="200" y2="70" style="stroke: var(--text-color); stroke-width: 8; stroke-linecap: round; stroke-linejoin: round; fill: none;" />
        <circle cx="80" cy="40" r="14" style="fill: var(--text-color);" />
        <circle cx="160" cy="40" r="12" style="fill: var(--primary-color);" />
        <circle cx="200" cy="10" r="12" style="fill: var(--primary-color);" />
        <circle cx="200" cy="70" r="12" style="fill: var(--primary-color);" />
        <g transform="translate(220,-8)">
          <rect x="0" y="0" rx="8" ry="8" width="72" height="48" style="fill: var(--primary-color);" />
          <polygon points="16,48 28,48 22,56" style="fill: var(--primary-color);" />
          <circle cx="50" cy="20" r="6" style="fill: var(--text-color);" />
        </g>
        <g transform="translate(220,50)">
          <rect x="0" y="0" rx="8" ry="8" width="72" height="48" style="fill: var(--primary-color);" />
          <polygon points="16,0 28,0 22,-8" style="fill: var(--primary-color);" />
          <circle cx="50" cy="28" r="6" style="fill: var(--text-color);" />
        </g>
      </g>
      <text x="360" y="95" style="font-family: Arial, sans-serif; font-weight: 700; font-size: 110px; fill: var(--text-color);">OsmoX</text>
    </svg>
  `,
})
export class AppLogo {
  readonly height = input('40px');
}
