import { Component, OnInit } from '@angular/core';
import { QuestionAnswerService } from '../../service/questionAnswer.Service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-qa-list',
  templateUrl: './qa-list.component.html',
  styleUrls: ['./qa-list.component.scss'],
  imports:[CommonModule],
  standalone: true
})
export class QaListComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {
  }

}
