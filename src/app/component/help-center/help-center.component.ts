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
      a: 'Go to Word List → Add Word, enter the word + meaning (and any notes if available), then submit. Your word will appear in your list.'
    },
    {
      q: 'How do I edit an existing word?',
      a: 'Open Word List, find the word, then click Edit to update the meaning, notes, or corrections.'
    },
    {
      q: 'Where can I practice interview questions?',
      a: 'Open Interview Prep, choose a technology and a topic, then learn via Tutorial (Q&A). Use Quiz for scoring and Output Practice for code-output style questions.'
    },
    {
      q: 'How do I add an Interview Q&A?',
      a: 'Open Interview Q&A → Add Interview Q&A. Write a clear question, add a concise answer, and include key points or examples when possible.'
    },
    {
      q: 'I forgot my password. What should I do?',
      a: 'Go to Login → Forgot Password and follow the steps to reset your password securely. If you still can’t access your account, contact support.'
    }
  ];

  trackByIndex = (i: number) => i;
}
