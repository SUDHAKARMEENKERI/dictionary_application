import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { filter } from 'rxjs/operators';

export type SeoRouteData = {
  description?: string;
  robots?: string;
  ogImage?: string;
};

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  private initialized = false;

  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.applyRouteSeo());

    // Apply once on startup.
    this.applyRouteSeo();
  }

  private applyRouteSeo(): void {
    const snapshot = this.router.routerState.snapshot.root;
    const leaf = this.getLeaf(snapshot);

    const routeTitle = this.getRouteTitle(leaf);
    const data = (leaf.data ?? {}) as SeoRouteData;

    const pageTitle = routeTitle || 'CareerPrepBook';
    const description = data.description || 'CareerPrepBook helps you practice vocabulary, interview Q&A, quizzes, and programming questions.';
    const robots = data.robots || 'index, follow';

    // URL (hash routing supported)
    const url = this.getCanonicalUrl();

    // Canonical
    this.setCanonical(url);

    // Title
    this.title.setTitle(pageTitle);

    // Basic
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'robots', content: robots });

    // Open Graph
    this.meta.updateTag({ property: 'og:site_name', content: 'CareerPrepBook' });
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    if (url) this.meta.updateTag({ property: 'og:url', content: url });

    const ogImage = data.ogImage || '/assets/images/careerprepbook-og.png';
    this.meta.updateTag({ property: 'og:image', content: ogImage });

    // Twitter
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: pageTitle });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: ogImage });
  }

  private getLeaf(snapshot: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
    let node = snapshot;
    while (node.firstChild) node = node.firstChild;
    return node;
  }

  private getRouteTitle(snapshot: ActivatedRouteSnapshot): string {
    const t = snapshot.title;
    if (typeof t === 'string') return t;
    return '';
  }

  private setCanonical(href: string): void {
    if (!href || typeof document === 'undefined') return;

    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', href);
  }

  private getCanonicalUrl(): string {
    if (typeof window === 'undefined') return '';
    try {
      const u = new URL(window.location.href);
      // Canonical URLs should not include hash fragments.
      u.hash = '';
      return u.toString();
    } catch {
      return '';
    }
  }
}
