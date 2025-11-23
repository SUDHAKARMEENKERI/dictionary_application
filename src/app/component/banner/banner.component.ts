import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-banner',
  imports: [CommonModule],
  templateUrl: './banner.component.html',
  styleUrl: './banner.component.scss'
})
export class BannerComponent implements OnChanges{
  @Input() openBannerDetails: any;

  ngOnChanges(changes: SimpleChanges): void {
     setTimeout(() => {
      this.openBannerDetails.isOpen = false;
    }, 3000);
  }
}
