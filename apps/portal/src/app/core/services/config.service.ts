import { Injectable, signal } from '@angular/core';

interface AppConfig {
  apiUrl: string;
  apiDocsUrl: string;
}

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly _config = signal<AppConfig | null>(null);
  readonly config = this._config.asReadonly();

  async load(): Promise<void> {
    const res = await fetch('/assets/config.json', { cache: 'no-store' });

    if (!res.ok) {
      throw new Error(`Failed to load /assets/config.json (${res.status})`);
    }

    this._config.set((await res.json()) as AppConfig);
  }

  get apiUrl(): string {
    const c = this._config();

    if (!c) {
      throw new Error('ConfigService accessed before load() resolved');
    }

    return c.apiUrl;
  }

  get apiDocsUrl(): string {
    const c = this._config();

    if (!c) {
      throw new Error('ConfigService accessed before load() resolved');
    }

    return c.apiDocsUrl;
  }
}
