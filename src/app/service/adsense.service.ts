import { Injectable, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { environment } from '../../environments/environment';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

@Injectable({ providedIn: 'root' })
export class AdsenseService {
  private readonly router = inject(Router);
  private initialized = false;
  private scriptLoaded = false;

  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    if (!environment.adsenseEnabled || !environment.adsenseClient) return;

    this.loadScript(environment.adsenseClient);

    // SPA: attempt to refresh ads on navigation (safe no-op if no ad slots).
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.refresh());
  }

  refresh(): void {
    if (!environment.adsenseEnabled || !environment.adsenseClient) return;
    // If the script is already on the page (e.g. injected by an older build),
    // treat it as loaded so we can still refresh on SPA navigations.
    if (!this.scriptLoaded && typeof document !== 'undefined') {
      const existing = document.querySelector<HTMLScriptElement>(
        'script[data-adsense="true"],script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]'
      );
      if (existing) this.scriptLoaded = true;
    }

    if (!this.scriptLoaded) return;

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      // Triggers AdSense to re-scan for new <ins class="adsbygoogle"> nodes.
      window.adsbygoogle.push({});
    } catch {
      // ignore
    }
  }

  private loadScript(clientId: string): void {
    if (this.scriptLoaded) return;
    if (typeof document === 'undefined') return;

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-adsense="true"],script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]'
    );
    if (existing) {
      this.scriptLoaded = true;
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`;
    script.crossOrigin = 'anonymous';
    script.setAttribute('data-adsense', 'true');
    script.onload = () => {
      this.scriptLoaded = true;
      this.refresh();

    };

    document.head.appendChild(script);
  }
}
