import { Component, inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { CommonModule } from '@angular/common';
import { selectWords } from '../../store/words/selector';
import { deleteWordById, loadWords } from '../../store/words/action';
import { ActivatedRoute, Router } from '@angular/router';
import { BannerComponent } from '../banner/banner.component';
import { WordListService } from '../../service/word-list.service';
import { selectMobile } from '../../store/seletor';

@Component({
  selector: 'app-wordslist',
  standalone: true,
  imports: [CommonModule, BannerComponent],
  templateUrl: './wordslist.component.html',
  styleUrl: './wordslist.component.scss'
})
export class WordslistComponent implements OnInit {
  openModalDetails: any = {
    isOpen: false,
    message: ''
  };

  constructor(private router: Router, private activeRouter: ActivatedRoute,
    private wordService: WordListService
  ) { }


  private store: Store = inject(Store);

  // department$ = this.store.select(selectDepartments);
  // loading$ = this.store.select(selectDepartmentsLoading);

  wordList$ = this.store.select(selectWords);
  wordlistData: any = [];

  ngOnInit(): void {

    // this.store.dispatch(loadDepartment());
    this.loadWordsList();
    setTimeout(() => {
      this.openModalDetails = {
        isOpen: false
      }
    }, 3000);
    this.activeRouter.paramMap.subscribe(el => {
      if (el.get('state') === 'add') {
        this.openModalDetails = {
          isOpen: true,
          message: 'Aded New Word Successfully'
        }
      } else if (el.get('state') === 'edit') {
        this.openModalDetails = {
          isOpen: true,
          message: 'Word Edit Successfully'
        }
      }
    });

  }

  editWord(item: any) {
    this.router.navigate(['/addWords', item.id]);
  }

  deleteWord(item: any) {
    this.store.dispatch(deleteWordById({ id: item.id }));
    this.loadWordsList();
    this.openModalDetails = {
      isOpen: true,
      message: 'Word Deleted Successfully'
    }
    setTimeout(() => {
      this.openModalDetails = {
        isOpen: false
      }
    }, 3000);
  }

  loadWordsList() {
    setTimeout(() => {
      // this.store.dispatch(loadWords());
      // this.wordList$.subscribe(data => {
      // this.wordlistData = data;
      // });
      const data = localStorage.getItem('login');
    if (data) {
      const mobile = JSON.parse(data).mobile;
      this.wordService.fetchWordsByMobile(mobile).subscribe({
        next: (data) => {
          this.wordlistData = data;
        },
        error: (error) => console.error('Error fetching words by mobile', error)
      });

    }
    }, 500);

    
  }

  addWord() {
    this.router.navigate(['/addWords']);
  }

}
