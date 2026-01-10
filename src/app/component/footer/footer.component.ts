import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  year = new Date().getFullYear();

  quickLinks: Array<{ label: string; path: string }> = [
    { label: 'Home', path: '/dashboard' },
    { label: 'Word List', path: '/words' },
    { label: 'Interview Q&A', path: '/interview-qa' },
    { label: 'Programming Questions', path: '/programming-questions' },
  ];

  practiceLinks: Array<{ label: string; path: string }> = [
    { label: 'Quiz', path: '/quiz' },
    { label: 'Output Practice', path: '/output-practice' },
    // { label: 'Topic Tutorial', path: '/tutorial' },
    { label: 'My Progress', path: '/progress' },
  ];

  companyLinks: Array<{ label: string; path: string }> = [
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
    { label: 'Settings', path: '/settings' },
    { label: 'Help Center', path: '/help-center' },
    { label: 'FAQ', path: '/faq' },
    { label: 'Privacy Policy', path: '/privacy-policy' },
    { label: 'Disclaimer', path: '/disclaimer' },
    { label: 'Terms', path: '/terms' },
  ];

  trackByPath = (_: number, link: { path: string }) => link.path;

}
