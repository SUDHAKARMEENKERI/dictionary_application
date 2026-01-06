import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-seo-topic-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './seo-topic-landing.component.html',
  styleUrl: './seo-topic-landing.component.scss'
})
export class SeoTopicLandingComponent implements OnInit {
  category = '';
  topic = '';

  constructor(
    private route: ActivatedRoute,
    private title: Title,
    private meta: Meta
  ) {}

  ngOnInit(): void {
    this.category = (this.route.snapshot.data?.['category'] ?? '').toString();
    this.topic = (this.route.snapshot.data?.['topic'] ?? '').toString();

    const t = (this.topic || '').trim();
    if (t) {
      const pageTitle = `${t} Interview Questions and Answers | CareerPrepBook`;
      const description = `${t} interview questions and answers with clear explanations and practice by topic.`;

      this.title.setTitle(pageTitle);
      this.meta.updateTag({ name: 'description', content: description });
      this.meta.updateTag({ property: 'og:title', content: pageTitle });
      this.meta.updateTag({ property: 'og:description', content: description });
      this.meta.updateTag({ name: 'twitter:title', content: pageTitle });
      this.meta.updateTag({ name: 'twitter:description', content: description });
    }
  }
}
