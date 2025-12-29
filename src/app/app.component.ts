import { Component } from '@angular/core';
import { HomePageComponent } from './component/home-page/home-page.component';
import { Router, RouterOutlet } from '@angular/router';
import { HeaderComponent } from './component/header/header.component';
import { CommonModule } from '@angular/common';
import { LoaderComponent } from './shared/loader/loader.component';
import { FooterComponent } from './component/footer/footer.component';
import { SeoService } from './service/seo.service';
import { AdsenseService } from './service/adsense.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, CommonModule, LoaderComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(public router: Router, private seo: SeoService, private adsense: AdsenseService) {
    this.seo.init();
    this.adsense.init();
  }
  title = 'CareerPrepBook';
}
