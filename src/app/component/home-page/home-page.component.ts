import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home-page',
  imports: [CommonModule],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent implements OnInit{
  isClickedbtn: boolean = false;

  ngOnInit(): void {
    this.router.navigate(['/addWords']);
  }

  constructor(private router: Router) {}
  showWordList() {
    this.isClickedbtn = true;
    this.router.navigate(['/wordlist']);
  }
}
