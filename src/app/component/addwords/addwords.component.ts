import { Component, OnInit, } from '@angular/core';
import { UserWord } from '../../store/words/model';
import { Store } from '@ngrx/store';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { getWordById, submitWord, updateWordById } from '../../store/words/action';
import { ActivatedRoute, Router } from '@angular/router';
import { selectWords } from '../../store/words/selector';


@Component({
  selector: 'app-addwords',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './addwords.component.html',
  styleUrl: './addwords.component.scss'
})
export class AddwordsComponent implements OnInit {
  addWordForm!: FormGroup;
  isEditFlow = false;

  constructor(private store: Store, private activeroute: ActivatedRoute, private router: Router) { }

  ngOnInit(): void {
    this.addWordForm = new FormGroup({
      id: new FormControl(''),
      word: new FormControl('', [Validators.required]),
      meaning: new FormControl('', [Validators.required]),
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
          meaning: words?.meaning
        });
      });

    }

  }

  onSubmit() {
    if (this.addWordForm.valid) {
      const userData: UserWord = this.addWordForm.value;
      if (this.isEditFlow) {
        this.store.dispatch(updateWordById({ word: userData }));
        this.router.navigate(['/wordlist']);
      } else {
        this.store.dispatch(submitWord({ word: userData }));
      }
    }
  }

  showWordList() {
    this.router.navigate(['/wordlist']);
  }
}
