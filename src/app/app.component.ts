import { Component } from '@angular/core';
import { WordlistComponent } from './component/wordlist/wordlist.component';

@Component({
  selector: 'app-root',
  imports: [WordlistComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'dictionary_application';
}
