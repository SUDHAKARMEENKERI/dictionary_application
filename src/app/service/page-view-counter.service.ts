import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { distinctUntilChanged, filter, map, startWith } from 'rxjs';
import { environment } from '../../environments/environment';
import { apiEmpty } from '../util/apiRx';
import { readLoginMobile } from '../util/loginStorage';

export type PageViewIncrementPayload = {
  pageName: string;
  viewCount: number;
  mobile: string;
};

export type PageViewStats = {
  id: number;
  pageName: string;
  viewCount: number;
  date: string;
  mobile: string | null;
};

@Injectable({
  providedIn: 'root'
})
export class PageViewCounterService {
  private initialized = false;

  private readonly baseUrl = environment.analytics?.baseUrl ?? environment.apiUrl;
  private readonly incrementPath = environment.analytics?.pageViewIncrementPath ?? '/page-view/increment';

  constructor(
    private readonly router: Router,
    private readonly http: HttpClient
  ) {}

  /**
   * Call once (e.g., from AppComponent) to enable page view counting.
   */
  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        map((e) => e.urlAfterRedirects),
        startWith(this.router.url),
        distinctUntilChanged()
      )
      .subscribe((path) => this.track(path));
  }

  private track(path: string): void {
    const pageName = this.getCurrentPageName(path);
    const endpointBase = this.joinUrl(this.baseUrl, this.incrementPath);
    const endpoint = `${endpointBase}?pageName=${encodeURIComponent(pageName)}`;

    // Get mobile number if user is logged in, otherwise empty string
    const mobile = readLoginMobile() || '';

    const payload: PageViewIncrementPayload = {
      pageName,
      viewCount: 1,
      mobile
    };

    this.http
      .post(endpoint, payload)
      .pipe(apiEmpty('PageViewCounterService.track'))
      .subscribe();
  }

  private getCurrentPageName(fallbackPath: string): string {
    const snapshot = this.router.routerState.snapshot.root;
    const leaf = this.getLeaf(snapshot);

    const routePath = leaf.routeConfig?.path;
    if (typeof routePath === 'string' && routePath.length > 0 && routePath !== '**') {
      // Turn something like 'interview-prep' or 'words/:id/edit' into a stable-ish name.
      const cleaned = routePath
        .replace(/\/.*/g, (m) => m) // keep slashes; handled below
        .replace(/[:*]/g, '')
        .replace(/\//g, '-');
      return this.toPascalCase(cleaned);
    }

    const componentName = (leaf.component as any)?.name;
    if (typeof componentName === 'string' && componentName.length > 0) {
      return componentName.replace(/Component$/, '');
    }

    // Fallback to URL path.
    const normalized = (fallbackPath || '').split('?')[0].split('#')[0];
    const leafPath = normalized.replace(/^\//, '');
    return this.toPascalCase(leafPath || 'HomePage') || 'HomePage';
  }

  private getLeaf(snapshot: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
    let node = snapshot;
    while (node.firstChild) node = node.firstChild;
    return node;
  }

  private toPascalCase(value: string): string {
    return (value || '')
      .split(/[^a-zA-Z0-9]+/)
      .filter(Boolean)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join('');
  }

  private joinUrl(base: string, path: string): string {
    const b = (base ?? '').replace(/\/$/, '');
    const p = (path ?? '').startsWith('/') ? path : `/${path}`;
    return `${b}${p}`;
  }

  /**
   * Fetch page view statistics (admin only)
   */
  getPageViewStats() {
    const endpoint = this.joinUrl(this.baseUrl, '/page-view');
    return this.http.get<PageViewStats[]>(endpoint);
  }
}
