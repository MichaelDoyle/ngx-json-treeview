import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

export type Theme = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  readonly theme = signal<Theme>('system');

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem('theme-preference') as Theme;
      if (savedTheme) {
        this.theme.set(savedTheme);
      }

      // Listen for system changes if we are in system mode
      window
        .matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', () => {
          if (this.theme() === 'system') {
            this.applyTheme('system');
          }
        });
    }

    effect(() => {
      const currentTheme = this.theme();
      this.applyTheme(currentTheme);
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('theme-preference', currentTheme);
      }
    });
  }

  setTheme(newTheme: Theme) {
    this.theme.set(newTheme);
  }

  private applyTheme(theme: Theme) {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const isDark =
      theme === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : theme === 'dark';

    this.document.body.dataset['theme'] = isDark ? 'dark' : 'light';
  }
}
