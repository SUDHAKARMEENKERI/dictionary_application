import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { catchError, distinctUntilChanged, filter, map, of, shareReplay, startWith, take, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { apiEmpty } from '../util/apiRx';
import { isUserAdmin, readLoginMobile, updateLoginStorage } from '../util/loginStorage';
import { UserSignUpService } from './user-signup.service';

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

  private readonly adminCache = new Map<string, boolean>();
  private readonly adminRequestCache = new Map<string, ReturnType<PageViewCounterService['fetchAdminStatus$']>>();

  constructor(
    private readonly router: Router,
    private readonly http: HttpClient,
    private readonly userService: UserSignUpService
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
    // Requirement: count only non-admin traffic.
    // If the logged-in user is admin, do not call the increment API.
    if (isUserAdmin()) return;

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

    // Anonymous users: track directly.
    if (!mobile) {
      this.http
        .post(endpoint, payload)
        .pipe(apiEmpty('PageViewCounterService.track'))
        .subscribe();
      return;
    }

    // Logged-in users: confirm admin status from user API once, then decide.
    this.getIsAdminForMobile$(mobile)
      .pipe(take(1))
      .subscribe((isAdminUser) => {
        if (isAdminUser) return;
        this.http
          .post(endpoint, payload)
          .pipe(apiEmpty('PageViewCounterService.track'))
          .subscribe();
      });
  }

  private fetchAdminStatus$(mobile: string) {
    const m = (mobile ?? '').toString().trim();
    return this.userService.getUserDetailsByMobile(m).pipe(
      map((u: any) => {
        // Backend may use different naming.
        return !!(u?.admin === true || u?.is_admin === true || u?.isAdmin === true);
      }),
      catchError(() => of(false)),
      tap((isAdminUser) => {
        this.adminCache.set(m, isAdminUser);
        // Keep local storage in sync so other guards can short-circuit too.
        if (isAdminUser) updateLoginStorage({ admin: true });
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    );
  }

  private getIsAdminForMobile$(mobile: string) {
    const m = (mobile ?? '').toString().trim();
    if (!m) return of(false);
    const cached = this.adminCache.get(m);
    if (cached !== undefined) return of(cached);

    const inflight = this.adminRequestCache.get(m);
    if (inflight) return inflight;

    const req$ = this.fetchAdminStatus$(m).pipe(
      tap(() => this.adminRequestCache.delete(m))
    );
    this.adminRequestCache.set(m, req$);
    return req$;
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
