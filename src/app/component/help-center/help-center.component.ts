import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-help-center',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './help-center.component.html',
  styleUrl: './help-center.component.scss'
})
export class HelpCenterComponent {
  faqs = [
    {
      q: 'How do I add a new word to my dictionary?',
      a: 'Go to Word List → Add Word, fill the word and meaning, then submit.'
    },
    {
      q: 'How do I edit an existing word?',
      a: 'Open Word List and click Edit on the word you want to update.'
    },
    {
      q: 'Where can I practice interview questions?',
      a: 'Use Interview Prep for topics, then open Tutorial, Quiz, or Output Practice.'
    },
    {
      q: 'How do I add an Interview Q&A?',
      a: 'Open Interview Q&A → Add Interview Q&A and submit your question and answer.'
    },
    {
      q: 'I forgot my password. What should I do?',
      a: 'Use the Forgot Password page from the Login screen to reset it.'
    }
  ];

  trackByIndex = (i: number) => i;
}
