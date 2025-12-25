import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-about-us',
  imports: [CommonModule, RouterModule],
  templateUrl: './about-us.component.html',
  styleUrl: './about-us.component.scss'
})
export class AboutUsComponent {
  statistics = [
    { number: '5,000+', label: 'Active Users', icon: 'bi bi-people-fill' },
    { number: '10,000+', label: 'Words Added', icon: 'bi bi-book-fill' },
    { number: '500+', label: 'Q&A Pairs', icon: 'bi bi-chat-dots-fill' },
    { number: '50+', label: 'Contributors', icon: 'bi bi-star-fill' }
  ];

  features = [
    {
      icon: 'bi bi-lightning-fill',
      title: 'Fast Learning',
      description: 'Quickly expand your vocabulary with our organized word lists and interactive flashcards.'
    },
    {
      icon: 'bi bi-people-fill',
      title: 'Community Driven',
      description: 'Learn from real interview experiences shared by thousands of professionals in our community.'
    },
    {
      icon: 'bi bi-bar-chart-fill',
      title: 'Track Progress',
      description: 'Monitor your learning journey with detailed analytics and personalized recommendations.'
    },
    {
      icon: 'bi bi-shield-fill',
      title: 'Quality Content',
      description: 'Curated and verified content by experienced professionals and subject matter experts.'
    },
    {
      icon: 'bi bi-globe-fill',
      title: 'Always Available',
      description: 'Access your learning materials anytime, anywhere across all your devices.'
    },
    {
      icon: 'bi bi-gear-fill',
      title: 'Easy to Use',
      description: 'Intuitive interface designed for seamless learning experience without steep learning curves.'
    }
  ];

  teamMembers = [
    {
      name: 'Rajesh Kumar',
      role: 'Founder & CEO',
      bio: 'Tech enthusiast with 10+ years in education technology. Passionate about democratizing learning.',
      icon: 'bi bi-person-circle'
    },
    {
      name: 'Priya Sharma',
      role: 'Head of Content',
      bio: 'Expert educator with background in linguistics and curriculum design. Ensures quality content.',
      icon: 'bi bi-person-circle'
    },
    {
      name: 'Amit Patel',
      role: 'Tech Lead',
      bio: 'Full-stack developer focused on creating robust, scalable solutions for educational platforms.',
      icon: 'bi bi-person-circle'
    }
  ];

  values = [
    {
      icon: 'bi bi-heart-fill',
      title: 'Excellence',
      description: 'We strive for excellence in everything we do, from content quality to user experience.'
    },
    {
      icon: 'bi bi-handshake',
      title: 'Community',
      description: 'We believe in the power of community collaboration and peer learning.'
    },
    {
      icon: 'bi bi-lightbulb-fill',
      title: 'Innovation',
      description: 'Constantly innovating to provide cutting-edge learning tools and features.'
    },
    {
      icon: 'bi bi-graph-up',
      title: 'Growth',
      description: 'Committed to helping every learner achieve their career and personal growth goals.'
    }
  ];
}
