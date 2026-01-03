import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-disclaimer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './disclaimer.component.html',
  styleUrl: './disclaimer.component.scss'
})
export class DisclaimerComponent {
  lastUpdated = '04 Jan 2026';
}
