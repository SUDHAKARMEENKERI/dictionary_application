import { Component, OnInit } from '@angular/core';
import { QuestionAnswer } from '../../models/Technology';
import { QuestionAnswerService } from '../../service/questionAnswer.Service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-tutorial',
  templateUrl: './tutorial.component.html',
  styleUrls: ['./tutorial.component.scss'],
  imports: [CommonModule],
  standalone: true
})
export class TutorialComponent implements OnInit {

  constructor(private activeRouter: ActivatedRoute) { }

  private destroy$ = new Subject<void>();
  
  ngOnInit(): void {
    this.activeRouter.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      console.log(params);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
