import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-banner',
  imports: [CommonModule],
  templateUrl: './banner.component.html',
  styleUrl: './banner.component.scss'
})
export class BannerComponent implements OnInit{
  @Input() openModalDetails: any;

  ngOnInit(): void {
      console.log(this.openModalDetails)
  }
}
