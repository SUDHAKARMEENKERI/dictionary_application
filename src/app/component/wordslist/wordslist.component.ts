import { Component, inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AsyncPipe, CommonModule } from '@angular/common';
import { loadDepartment } from '../../store/action';
import { selectDepartments, selectDepartmentsLoading, selectDepartmentState } from '../../store/seletor';
import { selectWords } from '../../store/words/selector';
import { loadWords } from '../../store/words/action';
import { Router } from '@angular/router';


@Component({
  selector: 'app-wordslist',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wordslist.component.html',
  styleUrl: './wordslist.component.scss'
})
export class WordslistComponent implements OnInit{
  constructor(private router: Router) {}

  private store: Store = inject(Store);

  // department$ = this.store.select(selectDepartments);
  // loading$ = this.store.select(selectDepartmentsLoading);

  wordList$ = this.store.select(selectWords);
  wordlistData: any = [];


  ngOnInit(): void {
    // this.store.dispatch(loadDepartment());
    this.store.dispatch(loadWords());
    this.wordList$.subscribe(data => {
      this.wordlistData = data;
    });
    console.log('Word List Data:', this.wordlistData);
  }
  editWord(item: any) {
    this.router.navigate(['/addWords', item.id]);
  }

  deleteWord(id: number) {
    this.wordlistData = this.wordlistData.filter((item: any) => item.id !== id);
    localStorage.setItem('wordList', JSON.stringify(this.wordlistData));

  }

}
