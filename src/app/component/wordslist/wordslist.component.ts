import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { CommonModule } from '@angular/common';
import { selectWords } from '../../store/words/selector';
import { bulkSubmitWord, bulkSubmitWordFailure, bulkSubmitWordSuccess, deleteWordById, deleteWordByIdFailure, deleteWordByIdSuccess, submitWord, submitWordFailure, submitWordSuccess } from '../../store/words/action';
import { ActivatedRoute, Router } from '@angular/router';
import { BannerComponent } from '../banner/banner.component';
import { WordListService } from '../../service/word-list.service';
import { LoaderService } from '../../service/loader.service';
import { ExportDataToExcel } from '../../util/exportData';
import { UserSignUpService } from '../../service/user-signup.service';
import { ModalComponent } from '../modal/modal.component';
import { Actions, ofType } from '@ngrx/effects';
import * as XLSX from 'xlsx';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-wordslist',
  standalone: true,
  imports: [CommonModule, BannerComponent, ModalComponent, FormsModule, NgxPaginationModule],
  templateUrl: './wordslist.component.html',
  styleUrl: './wordslist.component.scss'
})
export class WordslistComponent implements OnInit, OnDestroy {
  openBannerDetails: any = {
    isOpen: false,
    message: ''
  };

  openModalDetails: any = {
    isOpen: false,
    message: ''
  };
  isShowAllUserWords: boolean = false;
  ownerData: any;
  page = 1;
  pageSize = 20;

 
  wordlistData: any = [];
  tableData: any[] = [];
  tableHeaders: string[] = [];
  filteredData: any;
  searchText: string = '';
  private destroy$ = new Subject<void>();

  constructor(private router: Router, private activeRouter: ActivatedRoute,
    private wordService: WordListService, private userService: UserSignUpService,
    private loaderService: LoaderService, private actions$: Actions
  ) { }

  private store: Store = inject(Store);

  ngOnInit(): void {
    const login = localStorage.getItem('login');
    this.ownerData = login ? JSON.parse(login) : null;
    this.loadWordsList();
    this.activeRouter.paramMap.pipe(takeUntil(this.destroy$)).subscribe(el => {
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
    this.errorHandleForSubmit(deleteWordByIdSuccess, deleteWordByIdFailure, 'Word Deleted Successfully')
  }

  private errorHandleForSubmit(success: any, failure: any, message: string) {
    this.actions$.pipe(
      ofType(success, failure)
    ).subscribe(action => {
      this.loaderService.hide();
      if (action.type === failure.type) {
        this.openModalDetails = { isOpen: true, message: action.error };
      } else {
        this.loadWordsList();
        this.openBannerDetails = {
          isOpen: true,
          message: message
        }
      }
    });
  }

  getAllUserWordList() {
    this.isShowAllUserWords = true;
    this.showAllUserWordList();
  }

  private loadWordsList() {
    setTimeout(() => {
      this.loaderService.show();
      if (this.isShowAllUserWords) {
        this.showAllUserWordList();
      } else {
        const data = localStorage.getItem('login');
        if (data) {
          const mobile = JSON.parse(data).mobile;
          this.wordService.fetchWordsByMobile(mobile).pipe(takeUntil(this.destroy$)).subscribe({
            next: (data) => {
              this.loaderService.hide();
              this.wordlistData = data;
              this.wordlistData.sort((a: any, b: any) => Number(a.mobile) - Number(b.mobile));
              this.filteredData = this.wordlistData;
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

  private showAllUserWordList() {
    this.wordService.fetchWords().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.loaderService.hide();
        this.wordlistData = data;
        this.wordlistData.sort((a: any, b: any) => Number(a.mobile) - Number(b.mobile));
        this.filteredData = this.wordlistData;
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
  }

  addWord() {
    this.router.navigate(['/addWords']);
  }

  exportToExcel(): void {
    const exporter = new ExportDataToExcel(this.wordService, this.userService);
    exporter.exportToExcel('wordList', 'WordList');
  }

  onFileChange(event: any) {
    const target: DataTransfer = <DataTransfer>(event.target);
    if (target.files.length !== 1) throw new Error('Cannot use multiple files');

    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });

      // Get first sheet
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];

      // Convert to JSON
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

      // First row = headers
      this.tableHeaders = data[0] as string[];
      // Remaining rows = table data
      this.tableData = data.slice(1).map((row: any) => {
        const rowObj: any = {};
        this.tableHeaders.forEach((header, i) => {
          rowObj[header] = row[i];
        });

        return rowObj;
      });
    };

    reader.readAsBinaryString(target.files[0]);

    this.uploadToDb();
  }

  private uploadToDb() {
    setTimeout(() => {
      const login = localStorage.getItem('login');
      let currentUser: any = null;
      if (login) {
        try {
          currentUser = JSON.parse(login);
        } catch (e) {
          console.error('Failed to parse login from localStorage', e);
          currentUser = null;
        }
      }

      if (currentUser) {
        // Attach user details to each imported row
        this.tableData = this.tableData.map((row: any) => {
          return {
            ...row,
            mobile: currentUser.mobile,
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            show_for_others: false
          };
        });
      }

      this.store.dispatch(bulkSubmitWord({ words: { words: this.tableData } }));
      this.errorHandleForSubmit(bulkSubmitWordSuccess, bulkSubmitWordFailure,'Multiple Words Added Successfully');
    }, 500);
  }

  onSearch() {
  this.filteredData = this.wordlistData.filter((item: any) =>
    item.word.toLowerCase().includes(this.searchText.toLowerCase()) || item.meaning.toLowerCase().includes(this.searchText.toLowerCase())
  );
}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
