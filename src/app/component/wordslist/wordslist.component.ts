import { Component, inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { CommonModule } from '@angular/common';
import { selectWords } from '../../store/words/selector';
import { deleteWordById } from '../../store/words/action';
import { ActivatedRoute, Router } from '@angular/router';
import { BannerComponent } from '../banner/banner.component';
import { WordListService } from '../../service/word-list.service';
import { LoaderService } from '../../service/loader.service';
import { ExportDataToExcel } from '../../util/exportData';
import { UserSignUpService } from '../../service/user-signup.service';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-wordslist',
  standalone: true,
  imports: [CommonModule, BannerComponent, ModalComponent],
  templateUrl: './wordslist.component.html',
  styleUrl: './wordslist.component.scss'
})
export class WordslistComponent implements OnInit {
  openBannerDetails: any = {
    isOpen: false,
    message: ''
  };

  openModalDetails: any = {
    isOpen: false,
    message: ''
  };
  isShowAllUserWords: boolean = false;

  constructor(private router: Router, private activeRouter: ActivatedRoute,
    private wordService: WordListService, private userService: UserSignUpService,
    private loaderService: LoaderService
  ) { }


  private store: Store = inject(Store);

  // department$ = this.store.select(selectDepartments);
  // loading$ = this.store.select(selectDepartmentsLoading);

  wordList$ = this.store.select(selectWords);
  wordlistData: any = [];

  ngOnInit(): void {
    // this.store.dispatch(loadDepartment());
    this.loadWordsList();
    this.activeRouter.paramMap.subscribe(el => {
      if (el.get('state') === 'add') {
        this.openBannerDetails = {
          isOpen: true,
          message: 'Aded New Word Successfully'
        }
      } else if (el.get('state') === 'edit') {
        this.openBannerDetails = {
          isOpen: true,
          message: 'Word Edit Successfully'
        }
      } else if (el.get('state') === 'all') {
        this.isShowAllUserWords = true;
      }
    });
  }

  editWord(item: any) {
    this.router.navigate(['/addWords', item.id]);
  }

  deleteWord(item: any) {
    this.store.dispatch(deleteWordById({ id: item.id }));
    this.loadWordsList();
    this.openBannerDetails = {
      isOpen: true,
      message: 'Word Deleted Successfully'
    }
  }

  loadWordsList() {
    setTimeout(() => {
      this.loaderService.show();
      if (this.isShowAllUserWords) {
        this.wordService.fetchWords().subscribe({
          next: (data) => {
            this.loaderService.hide();
            this.wordlistData = data;
            console.log('All Words Data:', this.wordlistData);
          },
          error: (error) => {
            this.loaderService.hide();
            console.error('Error fetching words', error);
            this.openModalDetails = {
              isOpen: true,
              message: 'Opps! Something went wrong while fetching word list.'
            }
          }
        });
      } else {
        // this.store.dispatch(loadWords());
        // this.wordList$.subscribe(data => {
        // this.wordlistData = data;
        // });
        const data = localStorage.getItem('login');
        if (data) {
          const mobile = JSON.parse(data).mobile;
          this.wordService.fetchWordsByMobile(mobile).subscribe({
            next: (data) => {
              this.loaderService.hide();
              this.wordlistData = data;
            },
            error: (error) => {
              this.loaderService.hide();
              console.error('Error fetching words by mobile', error);
              this.openModalDetails = {
                isOpen: true,
                message: 'Opps! Something went wrong while fetching word list.'
              }
            }
          });
        }
      }
    }, 500);
  }

  addWord() {
    this.router.navigate(['/addWords']);
  }

  exportToExcel(): void {
    const exporter = new ExportDataToExcel(this.wordService, this.userService);
    exporter.exportToExcel('wordList', 'WordList');
  }
}
