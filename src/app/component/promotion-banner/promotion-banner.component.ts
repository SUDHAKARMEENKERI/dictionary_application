import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BannerGeneratorService } from '../../service/banner-generator.service';

type BannerPreset = {
  id: string;
  label: string;
  width: number;
  height: number;
};

type MessageOption = {
  id: string;
  label: string;
  text: string;
};

@Component({
  selector: 'app-promotion-banner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './promotion-banner.component.html',
  styleUrl: './promotion-banner.component.scss'
})
export class PromotionBannerComponent implements OnDestroy {
  presets: BannerPreset[] = [
    { id: 'linkedin', label: 'LinkedIn (1200x628)', width: 1200, height: 628 },
    { id: 'instagram', label: 'Instagram (1080x1080)', width: 1080, height: 1080 },
    { id: 'youtube', label: 'YouTube Thumbnail (1280x720)', width: 1280, height: 720 },
    { id: 'story', label: 'Story/Reel (1080x1920)', width: 1080, height: 1920 }
  ];

  messageOptions: MessageOption[] = [
    { id: 'interview', label: 'Interview Prep', text: 'Ace Your Tech Interviews' },
    { id: 'quiz', label: 'Daily Quiz', text: 'Challenge Yourself with Daily Quizzes' },
    { id: 'learn', label: 'Learn', text: 'Learn Programming & Web Development' },
    { id: 'progress', label: 'Progress', text: 'Track Your Learning Progress' },
    { id: 'community', label: 'Community', text: 'Join Our Growing Community' }
  ];

  selectedPresetId = 'linkedin';
  selectedMessageId = 'interview';
  customText = 'Ace Your Tech Interviews';
  ctaText = 'Start Free';

  isGenerating = false;
  errorMessage = '';
  bannerUrl: string | null = null;

  constructor(private bannerGeneratorService: BannerGeneratorService) {}

  ngOnDestroy(): void {
    this.clearBannerUrl();
  }

  get selectedPreset(): BannerPreset {
    return this.presets.find(p => p.id === this.selectedPresetId) ?? this.presets[0];
  }

  onPresetChange(): void {
    this.errorMessage = '';
  }

  onMessageChange(): void {
    const option = this.messageOptions.find(m => m.id === this.selectedMessageId);
    if (option) {
      this.customText = option.text;
    }
  }

  generateBanner(): void {
    this.isGenerating = true;
    this.errorMessage = '';
    this.clearBannerUrl();

    const { width, height } = this.selectedPreset;
    this.bannerGeneratorService
      .generateBanner(width, height, 'promo', this.customText.trim(), this.ctaText.trim())
      .then((url) => {
        this.bannerUrl = url;
        this.isGenerating = false;
      })
      .catch(() => {
        this.errorMessage = 'Failed to generate banner. Please try again.';
        this.isGenerating = false;
      });
  }

  private clearBannerUrl(): void {
    if (this.bannerUrl) {
      URL.revokeObjectURL(this.bannerUrl);
      this.bannerUrl = null;
    }
  }
}
