import { Component } from '@angular/core';
import { WordslistComponent } from '../wordslist/wordslist.component';

@Component({
  selector: 'app-home-page',
  imports: [WordslistComponent],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent {

}
