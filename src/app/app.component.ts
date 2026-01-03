import { Component } from '@angular/core';
import { HomePageComponent } from './component/home-page/home-page.component';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { HeaderComponent } from './component/header/header.component';
import { CommonModule } from '@angular/common';
import { LoaderComponent } from './shared/loader/loader.component';
import { FooterComponent } from './component/footer/footer.component';
import { SeoService } from './service/seo.service';
import { AdsenseService } from './service/adsense.service';
import { PageViewCounterService } from './service/page-view-counter.service';
import { filter } from 'rxjs/operators';
import { AdsenseAdComponent } from './shared/adsense-ad/adsense-ad.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, CommonModule, LoaderComponent, AdsenseAdComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(
    public router: Router,
    private seo: SeoService,
    private adsense: AdsenseService,
    private pageViewCounter: PageViewCounterService
  ) {
    this.seo.init();
    this.adsense.init();
    this.pageViewCounter.init();

    // Ensure each navigation starts at the top. This also prevents cases where
    // a previously-focused element (often in the footer) causes the browser to jump.
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => {
        if (typeof window === 'undefined') return;

        // Let the new view render first.
        setTimeout(() => {
          try {
            (document.activeElement as HTMLElement | null)?.blur?.();
          } catch {
            // ignore
          }

          window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        }, 0);
      });
  }
  title = 'CareerPrepBook';
}
