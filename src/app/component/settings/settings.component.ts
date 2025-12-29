import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {
  constructor(private authService: AuthService, private router: Router) {}

  get displayName(): string {
    const raw = localStorage.getItem('login');
    if (!raw) return '';
    try {
      const parsed = JSON.parse(raw);
      return [parsed.firstName, parsed.lastName].filter(Boolean).join(' ');
    } catch {
      return '';
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
