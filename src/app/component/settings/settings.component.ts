import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import { readLoginDisplayName } from '../../util/loginStorage';

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
    return readLoginDisplayName();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
