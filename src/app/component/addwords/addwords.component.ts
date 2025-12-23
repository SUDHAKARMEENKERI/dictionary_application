import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, } from '@angular/core';
import { UserWord } from '../../store/words/model';
import { Store } from '@ngrx/store';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { getWordById, submitWord, submitWordSuccess, submitWordFailure, updateWordById, updateWordByIdSuccess, updateWordByIdFailure } from '../../store/words/action';
import { ActivatedRoute, Router } from '@angular/router';
import { selectWords, selectWordsError } from '../../store/words/selector';
import { UserSignUpService } from '../../service/user-signup.service';
import { LoaderService } from '../../service/loader.service';
import { WordListService } from '../../service/word-list.service';
import { ExportDataToExcel } from '../../util/exportData';
import { ModalComponent } from '../modal/modal.component';
import { Actions, ofType } from '@ngrx/effects';


@Component({
  selector: 'app-addwords',
  imports: [ReactiveFormsModule, CommonModule, ModalComponent],
  templateUrl: './addwords.component.html',
  styleUrls: ['./addwords.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  standalone: true,
})
export class AddwordsComponent implements OnInit {
  addWordForm!: FormGroup;
  isEditFlow = false;
  userList: any;
  isOwner = false;

  openModalDetails = {
    isOpen: false,
    message: ''
  }

  error$: any;
  constructor(private store: Store, private activeroute: ActivatedRoute, private router: Router,
    private userService: UserSignUpService, private loaderService: LoaderService,
    private wordService: WordListService, private actions$: Actions
  ) { }


  ngOnInit(): void {
    this.addWordForm = new FormGroup({
      id: new FormControl(''),
      word: new FormControl('', [Validators.required]),
      meaning: new FormControl('', [Validators.required]),
      show_for_others: new FormControl(false, [Validators.required])
    });

    this.activeroute.paramMap.subscribe(params => {
      if (params.get('id')) {
        this.isEditFlow = true;
        this.store.dispatch(getWordById({ id: Number(params.get('id')) }));
      }
    });

    if (this.isEditFlow) {
      this.store.select(selectWords).subscribe(words => {
        this.addWordForm.patchValue({
          id: words?.id,
          word: words?.word,
          meaning: words?.meaning,
          show_for_others: words?.show_for_others
        });
      });
      this.error$ = this.store.select(selectWordsError);

    }

    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.userList = users;
      },
      error: (error) => {
        this.openModalDetails = {
          isOpen: true,
          message: 'Opps! Something went wrong while fetching users.'
        }
      }
    });

    const loginUser = localStorage.getItem('login');
    if (loginUser) {
      this.isOwner = JSON.parse(loginUser).mobile === '9611675325' ? true : false;
    }
  }

  onSubmit() {
    this.loaderService.show();
    if (this.addWordForm.valid) {
      const userData: any = { ...this.addWordForm.value };
      const data = localStorage.getItem('login');
      if (data) {
        const user = JSON.parse(data);
        userData.mobile = user.mobile;
        userData.firstName = user.firstName;
        userData.lastName = user.lastName;
      }
      if (this.isEditFlow) {
        this.store.dispatch(updateWordById({ word: userData }));
        this.errorHandleForSubmit(updateWordByIdSuccess,updateWordByIdFailure,'edit');
      } else {
        this.store.dispatch(submitWord({ word: userData }));
        this.errorHandleForSubmit(submitWordSuccess,submitWordFailure,'add');
      }
    }
  }

  private errorHandleForSubmit(success: any, failure: any, wordAction: string) {
    this.actions$.pipe(
      ofType(success, failure)
    ).subscribe(action => {
      this.loaderService.hide();
      if (action.type === failure.type) {
        this.openModalDetails = { isOpen: true, message: action.error };
      } else {
        this.router.navigate(['/wordlist', { state: wordAction }]);
      }
    });
  }

  showWordList() {
    this.router.navigate(['/wordlist']);
  }

  exportToExcel(): void {
    const exporter = new ExportDataToExcel(this.wordService, this.userService);
    exporter.exportToExcel('userList', 'UserList');
  }

  showAllUserWordList() {
    this.router.navigate(['/wordlist', { state: 'all' }]);
  }
}
