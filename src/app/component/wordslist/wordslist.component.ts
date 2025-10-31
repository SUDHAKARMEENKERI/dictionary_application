import { Component, inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AsyncPipe, CommonModule } from '@angular/common';
import { loadDepartment } from '../../store/action';
import { selectDepartments, selectDepartmentsLoading, selectDepartmentState } from '../../store/seletor';


@Component({
  selector: 'app-wordslist',
  standalone: true,
  imports: [CommonModule, AsyncPipe],
  templateUrl: './wordslist.component.html',
  styleUrl: './wordslist.component.scss'
})
export class WordslistComponent implements OnInit{
  private store: Store = inject(Store);

  department$ = this.store.select(selectDepartments);
  loading$ = this.store.select(selectDepartmentsLoading);

  constructor() {}

  ngOnInit(): void {
    this.store.dispatch(loadDepartment());
  }


}
