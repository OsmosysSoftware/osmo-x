import { TestBed } from '@angular/core/testing';
import { LayoutService } from './layout.service';

describe('LayoutService', () => {
  beforeEach(() => {
    localStorage.removeItem('osmox-layout-config');
    document.documentElement.classList.remove('app-dark');

    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    document.documentElement.classList.remove('app-dark');
    localStorage.removeItem('osmox-layout-config');
  });

  describe('toggleDarkMode', () => {
    it('adds the .app-dark class to <html> when config.darkTheme=true', () => {
      const service = TestBed.inject(LayoutService);

      service.toggleDarkMode({ darkTheme: true });

      expect(document.documentElement.classList.contains('app-dark')).toBeTrue();
    });

    it('removes the .app-dark class from <html> when config.darkTheme=false', () => {
      document.documentElement.classList.add('app-dark');

      const service = TestBed.inject(LayoutService);

      service.toggleDarkMode({ darkTheme: false });

      expect(document.documentElement.classList.contains('app-dark')).toBeFalse();
    });

    it('uses the current layoutConfig when called with no arguments', () => {
      const service = TestBed.inject(LayoutService);

      service.layoutConfig.update((c) => ({ ...c, darkTheme: true }));
      // Drop residue from prior toggles.
      document.documentElement.classList.remove('app-dark');

      service.toggleDarkMode();

      expect(document.documentElement.classList.contains('app-dark')).toBeTrue();
    });
  });

  describe('theme computed (M11: pin CURRENT inverted behaviour)', () => {
    // Audit M11 flagged this as inverted. Tests document TODAY, not aspiration.
    it('returns "dark" when layoutConfig.darkTheme is falsy', () => {
      const service = TestBed.inject(LayoutService);

      service.layoutConfig.update((c) => ({ ...c, darkTheme: false }));

      expect(service.theme()).toBe('dark');
    });

    it('returns "light" when layoutConfig.darkTheme is true', () => {
      const service = TestBed.inject(LayoutService);

      service.layoutConfig.update((c) => ({ ...c, darkTheme: true }));

      expect(service.theme()).toBe('light');
    });

    it('isDarkTheme reads the un-inverted darkTheme flag directly', () => {
      const service = TestBed.inject(LayoutService);

      service.layoutConfig.update((c) => ({ ...c, darkTheme: true }));

      expect(service.isDarkTheme()).toBeTrue();

      service.layoutConfig.update((c) => ({ ...c, darkTheme: false }));

      expect(service.isDarkTheme()).toBeFalse();
    });
  });
});
