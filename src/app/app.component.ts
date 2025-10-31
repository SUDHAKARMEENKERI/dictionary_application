import { Component } from '@angular/core';
import { HomePageComponent } from './component/home-page/home-page.component';

@Component({
  selector: 'app-root',
  imports: [HomePageComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'dictionary_application';
}
