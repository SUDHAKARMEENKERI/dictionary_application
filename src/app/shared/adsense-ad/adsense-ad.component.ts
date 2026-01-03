import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, Input } from '@angular/core';
import { AdsenseService } from '../../service/adsense.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-adsense-ad',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './adsense-ad.component.html',
  styleUrl: './adsense-ad.component.scss'
})
export class AdsenseAdComponent implements AfterViewInit {
  // If not provided, falls back to environment client loaded by the script.
  @Input() adClient = '';
  @Input() adSlot = '';
  @Input() adFormat: 'auto' | 'fluid' = 'auto';
  @Input() fullWidthResponsive = true;

  protected readonly env = environment;

  get resolvedSlot(): string {
    return this.adSlot || this.env.adsenseSlot || '';
  }

  constructor(private ads: AdsenseService) {}

  ngAfterViewInit(): void {
    // Try to render this ad slot after it is added to the DOM.
    this.ads.refresh();
  }
}
