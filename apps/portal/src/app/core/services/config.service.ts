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

    const parsed = (await res.json()) as Partial<AppConfig>;

    if (typeof parsed?.apiUrl !== 'string' || typeof parsed?.apiDocsUrl !== 'string') {
      throw new Error('Invalid /assets/config.json: apiUrl and apiDocsUrl must be strings');
    }

    this._config.set({ apiUrl: parsed.apiUrl, apiDocsUrl: parsed.apiDocsUrl });
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
