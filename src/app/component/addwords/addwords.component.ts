import { Component, OnInit, } from '@angular/core';
import { UserWord } from '../../store/words/model';
import { Store } from '@ngrx/store';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { getWordById, submitWord } from '../../store/words/action';
import { ActivatedRoute } from '@angular/router';
import { selectWords } from '../../store/words/selector';


@Component({
  selector: 'app-addwords',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './addwords.component.html',
  styleUrl: './addwords.component.scss'
})
export class AddwordsComponent implements OnInit {
  addWordForm!: FormGroup;
  isEditFlow: boolean = false;

  constructor(private store: Store, private activeroute: ActivatedRoute) { }

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
      const data = this.store.select(selectWords);
      data.subscribe(words => {
        this.addWordForm.patchValue({
          word: words?.word,
          meaning: words?.meaning
        });
      });

    }

  }

  onSubmit() {
    if (this.addWordForm.valid) {
      const userData: UserWord = this.addWordForm.value;
      this.store.dispatch(submitWord({ word: userData }));
    }
  }

}
