import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BannerGeneratorService {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private bannerMessages: { [key: string]: string } = {
    learn: 'Learn Programming & Web Development',
    free: 'Get Free Access to Premium Content',
    interview: 'Ace Your Tech Interviews',
    quiz: 'Challenge Yourself with Daily Quizzes',
    progress: 'Track Your Learning Progress',
    community: 'Join Our Growing Community'
  };

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  async generateBanner(
    width: number,
    height: number,
    type: string,
    customText: string,
    ctaText: string
  ): Promise<string> {
    try {
      this.canvas.width = width;
      this.canvas.height = height;

      // Draw tech-themed gradient background
      const gradient = this.ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#0a1628');
      gradient.addColorStop(0.3, '#1a2947');
      gradient.addColorStop(0.7, '#0f1f3a');
      gradient.addColorStop(1, '#0a1628');
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, width, height);

      // Add tech circuit patterns
      this.drawTechBackground(width, height);

      // Add decorative elements
      this.drawModernDecorativeElements(width, height);

      // Draw content based on size
      if (width < 400 || height < 150) {
        // Small banner (leaderboard)
        this.drawSmallBanner(width, height, customText, ctaText);
      } else if (width < 800 || height < 400) {
        // Medium banner
        this.drawMediumBanner(width, height, customText, ctaText);
      } else {
        // Large banner
        this.drawLargeBanner(width, height, customText, ctaText, type);
      }

      return new Promise((resolve, reject) => {
        this.canvas.toBlob((blob) => {
          if (blob) {
            resolve(URL.createObjectURL(blob));
          } else {
            reject(new Error('Failed to create banner image'));
          }
        }, 'image/jpeg', 0.95);
      });
    } catch (error) {
      console.error('Error generating banner:', error);
      throw new Error('Failed to generate banner. Please try again.');
    }
  }

  private drawDecorativeElements(width: number, height: number): void {
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    
    // Draw circles for decoration
    const circles = [
      { x: width * 0.1, y: height * 0.2, r: Math.min(width, height) * 0.1 },
      { x: width * 0.9, y: height * 0.8, r: Math.min(width, height) * 0.15 },
      { x: width * 0.85, y: height * 0.1, r: Math.min(width, height) * 0.08 }
    ];

    circles.forEach(circle => {
      this.ctx.beginPath();
      this.ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  private drawModernDecorativeElements(width: number, height: number): void {
    // Gradient overlay circles with glow effect
    const circles = [
      { x: width * 0.15, y: height * 0.25, r: Math.min(width, height) * 0.15, opacity: 0.08 },
      { x: width * 0.85, y: height * 0.75, r: Math.min(width, height) * 0.20, opacity: 0.10 },
      { x: width * 0.90, y: height * 0.15, r: Math.min(width, height) * 0.12, opacity: 0.06 },
      { x: width * 0.10, y: height * 0.80, r: Math.min(width, height) * 0.10, opacity: 0.05 }
    ];

    circles.forEach(circle => {
      const gradient = this.ctx.createRadialGradient(
        circle.x, circle.y, 0,
        circle.x, circle.y, circle.r
      );
      gradient.addColorStop(0, `rgba(255, 215, 0, ${circle.opacity})`);
      gradient.addColorStop(0.5, `rgba(255, 255, 255, ${circle.opacity * 0.5})`);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2);
      this.ctx.fill();
    });

    // Add geometric patterns
    this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.08)';
    this.ctx.lineWidth = 2;
    
    // Draw diagonal lines
    for (let i = 0; i < 5; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(width * (0.7 + i * 0.05), 0);
      this.ctx.lineTo(width * (0.9 + i * 0.05), height);
      this.ctx.stroke();
    }

    // Add corner accents
    this.drawCornerAccent(width * 0.05, height * 0.05, width * 0.08, '#FFD700', 0.15);
    this.drawCornerAccent(width * 0.95, height * 0.95, width * 0.08, '#FFD700', 0.12);
  }

  private drawCornerAccent(x: number, y: number, size: number, color: string, opacity: number): void {
    this.ctx.strokeStyle = `${color}`;
    this.ctx.globalAlpha = opacity;
    this.ctx.lineWidth = 3;
    
    this.ctx.beginPath();
    this.ctx.moveTo(x - size, y);
    this.ctx.lineTo(x, y);
    this.ctx.lineTo(x, y - size);
    this.ctx.stroke();
    
    this.ctx.globalAlpha = 1;
  }

  private drawTechBackground(width: number, height: number): void {
    // Draw circuit board patterns
    this.ctx.strokeStyle = 'rgba(0, 150, 255, 0.15)';
    this.ctx.lineWidth = 1;

    // Horizontal lines
    for (let i = 0; i < 10; i++) {
      const y = (height / 10) * i;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
      this.ctx.stroke();
    }

    // Vertical lines
    for (let i = 0; i < 15; i++) {
      const x = (width / 15) * i;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
      this.ctx.stroke();
    }

    // Add circuit nodes
    this.ctx.fillStyle = 'rgba(0, 200, 255, 0.3)';
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const radius = Math.random() * 3 + 1;
      
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Glow effect
      const glow = this.ctx.createRadialGradient(x, y, 0, x, y, radius * 4);
      glow.addColorStop(0, 'rgba(0, 200, 255, 0.4)');
      glow.addColorStop(1, 'rgba(0, 200, 255, 0)');
      this.ctx.fillStyle = glow;
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius * 4, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private drawSmallBanner(width: number, height: number, customText: string, ctaText: string): void {
    const padding = 10;
    const fontSize = Math.floor(height / 6);

    // App name with glow
    this.ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
    this.ctx.shadowBlur = 10;
    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('CareerPrepBook', padding, height / 2);
    this.ctx.shadowBlur = 0;

    // CTA button with gradient
    const btnWidth = Math.min(120, width * 0.3);
    const btnHeight = Math.floor(height * 0.6);
    const btnX = width - btnWidth - padding;
    const btnY = (height - btnHeight) / 2;

    // Button gradient
    const btnGradient = this.ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnHeight);
    btnGradient.addColorStop(0, '#FFD700');
    btnGradient.addColorStop(1, '#FFC107');
    this.ctx.fillStyle = btnGradient;
    this.roundRect(btnX, btnY, btnWidth, btnHeight, 4);

    // Button border glow
    this.ctx.shadowColor = 'rgba(255, 215, 0, 0.4)';
    this.ctx.shadowBlur = 8;
    this.ctx.strokeStyle = '#FFE54C';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.roundRectPath(btnX, btnY, btnWidth, btnHeight, 4);
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;

    // Button text
    this.ctx.fillStyle = '#1e3c72';
    this.ctx.font = `bold ${Math.floor(fontSize * 0.8)}px Arial, sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(ctaText, btnX + btnWidth / 2, btnY + btnHeight / 2);
  }

  private drawMediumBanner(width: number, height: number, customText: string, ctaText: string): void {
    const padding = 30;

    // App name with glow
    this.ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
    this.ctx.shadowBlur = 15;
    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = `bold ${Math.floor(width / 50)}px Arial, sans-serif`;
    this.ctx.textAlign = 'left';
    this.ctx.fillText('CareerPrepBook', padding, padding + 15);
    this.ctx.shadowBlur = 0;

    // CARD for content
    const cardMargin = padding + 10;
    const cardWidth = width - (cardMargin * 2);
    const cardHeight = height * 0.60;
    const cardX = cardMargin;
    const cardY = height * 0.20;
    const cardRadius = 15;

    // Card shadow
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    this.ctx.shadowBlur = 25;
    this.ctx.shadowOffsetY = 10;
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    this.roundRect(cardX + 8, cardY + 8, cardWidth, cardHeight, cardRadius);
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetY = 0;

    // Card background with gradient
    const cardGradient = this.ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardHeight);
    cardGradient.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
    cardGradient.addColorStop(1, 'rgba(255, 255, 255, 0.10)');
    this.ctx.fillStyle = cardGradient;
    this.roundRect(cardX, cardY, cardWidth, cardHeight, cardRadius);

    // Card border
    this.ctx.shadowColor = 'rgba(255, 215, 0, 0.4)';
    this.ctx.shadowBlur = 15;
    this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
    this.ctx.lineWidth = 2.5;
    this.ctx.beginPath();
    this.roundRectPath(cardX, cardY, cardWidth, cardHeight, cardRadius);
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;

    // Remove emojis from text
    const cleanText = customText.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();

    // Main text inside card
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    this.ctx.shadowBlur = 12;
    this.ctx.shadowOffsetY = 4;
    this.ctx.fillStyle = 'white';
    const fontSize = Math.floor(width / 38);
    this.ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    this.ctx.textAlign = 'center';
    const lineHeight = fontSize * 1.3;
    this.wrapText(cleanText, width / 2, cardY + cardHeight * 0.30, cardWidth - 40, lineHeight);
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetY = 0;

    // CTA Button inside card
    const btnY = cardY + cardHeight - 65;
    const btnWidth = Math.min(160, cardWidth * 0.6);
    const btnHeight = 42;
    const btnX = (width - btnWidth) / 2;

    // Button shadow
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    this.ctx.shadowBlur = 15;
    this.ctx.shadowOffsetY = 6;
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    this.roundRect(btnX, btnY, btnWidth, btnHeight, 8);
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetY = 0;

    // Button gradient
    const btnGradient = this.ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnHeight);
    btnGradient.addColorStop(0, '#FFD700');
    btnGradient.addColorStop(1, '#FFC107');
    this.ctx.fillStyle = btnGradient;
    this.roundRect(btnX, btnY, btnWidth, btnHeight, 8);

    // Button glow
    this.ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
    this.ctx.shadowBlur = 20;
    this.ctx.strokeStyle = '#FFE54C';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.roundRectPath(btnX, btnY, btnWidth, btnHeight, 8);
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;

    // CTA Button text
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    this.ctx.shadowBlur = 4;
    this.ctx.fillStyle = '#1e3c72';
    this.ctx.font = `bold ${Math.floor(width / 65)}px Arial, sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(ctaText, width / 2, btnY + btnHeight / 2);
    this.ctx.shadowBlur = 0;

    // Footer branding
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    this.ctx.shadowBlur = 8;
    this.ctx.fillStyle = 'rgba(255, 215, 0, 0.95)';
    this.ctx.font = `bold ${Math.floor(width / 90)}px Arial, sans-serif`;
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'bottom';
    this.ctx.fillText('careerprepbook.com', width - padding, height - 10);
    this.ctx.shadowBlur = 0;
  }

  private drawLargeBanner(width: number, height: number, customText: string, ctaText: string, type: string): void {
    const isVertical = height > width;
    const padding = isVertical ? 40 : 50;

    // Main Headline at top left
    this.ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
    this.ctx.shadowBlur = 25;
    this.ctx.fillStyle = 'white';
    const headlineFontSize = isVertical ? Math.floor(width / 18) : Math.floor(width / 22);
    this.ctx.font = `bold italic ${headlineFontSize}px Arial, sans-serif`;
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    const cleanText = customText.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
    this.ctx.fillText(cleanText, padding, padding);
    this.ctx.shadowBlur = 0;

    // Draw feature list (left side)
    const listStartY = padding + headlineFontSize + 30;
    this.drawFeatureList(padding, listStartY, width, height, isVertical);

    // Draw diagonal banner stripe
    this.drawDiagonalBanner(width, height, 'Practice Anytime, Anywhere!', isVertical);

    // Draw laptop/screen mockup (right side) - ONLY for horizontal banners
    if (!isVertical && width > 600) {
      const mockupX = width * 0.50;
      const mockupY = height * 0.20;
      const mockupW = width * 0.45;
      const mockupH = height * 0.55;
      this.drawLaptopMockup(mockupX, mockupY, mockupW, mockupH);
      
      // Draw phone mockup
      const phoneX = mockupX - width * 0.08;
      const phoneY = mockupY + mockupH * 0.35;
      this.drawPhoneMockup(phoneX, phoneY, width * 0.12, height * 0.40);
      
      // Draw floating icons
      this.drawFloatingIcons(width, height);
    }

    // CTA Button
    const btnWidth = isVertical ? Math.min(width - (padding * 2), 280) : Math.min(200, width * 0.20);
    const btnHeight = isVertical ? 75 : 55;
    const btnX = padding;
    const btnY = isVertical ? height - 180 : height - btnHeight - 35;

    // Button shadow
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    this.ctx.shadowBlur = 20;
    this.ctx.shadowOffsetY = 8;
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.roundRect(btnX, btnY, btnWidth, btnHeight, 10);
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetY = 0;

    // Button gradient
    const btnGradient = this.ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnHeight);
    btnGradient.addColorStop(0, '#FFD700');
    btnGradient.addColorStop(1, '#FF8C00');
    this.ctx.fillStyle = btnGradient;
    this.roundRect(btnX, btnY, btnWidth, btnHeight, 10);

    // Button glow
    this.ctx.shadowColor = 'rgba(255, 215, 0, 0.7)';
    this.ctx.shadowBlur = 30;
    this.ctx.strokeStyle = '#FFE54C';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.roundRectPath(btnX, btnY, btnWidth, btnHeight, 10);
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;

    // Button text
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    this.ctx.shadowBlur = 5;
    this.ctx.fillStyle = 'white';
    const btnFontSize = isVertical ? Math.floor(width / 32) : Math.floor(width / 55);
    this.ctx.font = `bold ${btnFontSize}px Arial, sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(ctaText, btnX + btnWidth / 2, btnY + btnHeight / 2);
    this.ctx.shadowBlur = 0;

    // Bottom branding
    const footerY = height - (isVertical ? 45 : 20);
    const footerFontSize = isVertical ? Math.floor(width / 25) : Math.floor(width / 40);
    
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    this.ctx.shadowBlur = 12;
    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = `bold ${footerFontSize}px Arial, sans-serif`;
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('CareerPrepBook.com', width - padding, footerY);
    this.ctx.shadowBlur = 0;
  }

  private drawFeatureList(x: number, y: number, width: number, height: number, isVertical: boolean): void {
    const features = [
      'Daily Interview MCQs',
      'Java & Spring Boot',
      'Free PDF Downloads'
    ];

    const fontSize = isVertical ? Math.floor(width / 30) : Math.floor(width / 55);
    const lineHeight = fontSize * 2.5;
    const checkSize = fontSize * 1.2;

    features.forEach((feature, index) => {
      const featureY = y + (index * lineHeight);

      // Checkmark circle
      const circleGradient = this.ctx.createRadialGradient(
        x + checkSize / 2, featureY + checkSize / 2, 0,
        x + checkSize / 2, featureY + checkSize / 2, checkSize
      );
      circleGradient.addColorStop(0, '#00FF88');
      circleGradient.addColorStop(1, '#00CC66');
      
      this.ctx.shadowColor = 'rgba(0, 255, 136, 0.6)';
      this.ctx.shadowBlur = 15;
      this.ctx.fillStyle = circleGradient;
      this.ctx.beginPath();
      this.ctx.arc(x + checkSize / 2, featureY + checkSize / 2, checkSize / 2, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;

      // Checkmark symbol
      this.ctx.strokeStyle = 'white';
      this.ctx.lineWidth = 3;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.ctx.beginPath();
      this.ctx.moveTo(x + checkSize * 0.25, featureY + checkSize * 0.5);
      this.ctx.lineTo(x + checkSize * 0.45, featureY + checkSize * 0.7);
      this.ctx.lineTo(x + checkSize * 0.75, featureY + checkSize * 0.3);
      this.ctx.stroke();

      // Feature text
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      this.ctx.shadowBlur = 10;
      this.ctx.fillStyle = 'white';
      this.ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      this.ctx.textAlign = 'left';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(feature, x + checkSize * 1.6, featureY + checkSize / 2);
      this.ctx.shadowBlur = 0;
    });
  }

  private drawDiagonalBanner(width: number, height: number, text: string, isVertical: boolean): void {
    const bannerHeight = isVertical ? 60 : 50;
    const bannerY = isVertical ? height * 0.60 : height * 0.58;
    const skew = 15;

    this.ctx.save();
    
    // Banner shadow
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    this.ctx.shadowBlur = 20;
    this.ctx.shadowOffsetY = 10;
    
    // Banner background
    const bannerGradient = this.ctx.createLinearGradient(0, bannerY, 0, bannerY + bannerHeight);
    bannerGradient.addColorStop(0, '#FFD700');
    bannerGradient.addColorStop(0.5, '#FFC107');
    bannerGradient.addColorStop(1, '#FF8C00');
    this.ctx.fillStyle = bannerGradient;
    
    this.ctx.beginPath();
    this.ctx.moveTo(-50, bannerY + skew);
    this.ctx.lineTo(width + 50, bannerY);
    this.ctx.lineTo(width + 50, bannerY + bannerHeight);
    this.ctx.lineTo(-50, bannerY + bannerHeight + skew);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetY = 0;

    // Banner text
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    this.ctx.shadowBlur = 8;
    this.ctx.fillStyle = '#0a1628';
    const bannerFontSize = isVertical ? Math.floor(width / 28) : Math.floor(width / 50);
    this.ctx.font = `bold italic ${bannerFontSize}px Arial, sans-serif`;
    this.ctx.textAlign = isVertical ? 'center' : 'left';
    this.ctx.textBaseline = 'middle';
    const textX = isVertical ? width / 2 : 50;
    this.ctx.fillText(text, textX, bannerY + bannerHeight / 2 + 5);
    this.ctx.shadowBlur = 0;
    
    this.ctx.restore();
  }

  private drawLaptopMockup(x: number, y: number, w: number, h: number): void {
    const screenWidth = w * 0.88;
    const screenHeight = h * 0.72;
    const screenX = x + (w - screenWidth) / 2;
    const screenY = y;
    const bezelSize = 8;

    // Laptop shadow
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    this.ctx.shadowBlur = 40;
    this.ctx.shadowOffsetY = 15;
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.roundRect(screenX + 15, screenY + 15, screenWidth, screenHeight, 10);
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetY = 0;

    // Screen bezel/frame
    const bezelGradient = this.ctx.createLinearGradient(screenX, screenY, screenX, screenY + screenHeight);
    bezelGradient.addColorStop(0, '#2a2a2a');
    bezelGradient.addColorStop(1, '#1a1a1a');
    this.ctx.fillStyle = bezelGradient;
    this.roundRect(screenX, screenY, screenWidth, screenHeight, 10);

    // Inner screen
    const innerScreenX = screenX + bezelSize;
    const innerScreenY = screenY + bezelSize;
    const innerScreenW = screenWidth - bezelSize * 2;
    const innerScreenH = screenHeight - bezelSize * 2;

    const screenGradient = this.ctx.createLinearGradient(innerScreenX, innerScreenY, innerScreenX, innerScreenY + innerScreenH);
    screenGradient.addColorStop(0, '#1a2947');
    screenGradient.addColorStop(1, '#0a1628');
    this.ctx.fillStyle = screenGradient;
    this.roundRect(innerScreenX, innerScreenY, innerScreenW, innerScreenH, 5);

    // Screen content - "TOP INTERVIEW QUESTIONS" with better styling
    const contentY = innerScreenY + innerScreenH * 0.35;
    const boxWidth = innerScreenW * 0.75;
    const boxHeight = innerScreenH * 0.45;
    const boxX = innerScreenX + (innerScreenW - boxWidth) / 2;
    const boxY = contentY - boxHeight / 2;

    // Content box with border
    this.ctx.strokeStyle = '#0099FF';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.roundRectPath(boxX, boxY, boxWidth, boxHeight, 8);
    this.ctx.stroke();

    // Text inside box
    const textSize = Math.floor(innerScreenW / 14);
    this.ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
    this.ctx.shadowBlur = 20;
    
    this.ctx.fillStyle = 'white';
    this.ctx.font = `bold ${textSize}px Arial, sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('TOP', boxX + boxWidth / 2, boxY + boxHeight * 0.30);
    
    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = `bold italic ${textSize}px Arial, sans-serif`;
    this.ctx.fillText('INTERVIEW', boxX + boxWidth / 2, boxY + boxHeight * 0.50);
    
    this.ctx.fillStyle = 'white';
    this.ctx.fillText('QUESTIONS', boxX + boxWidth / 2, boxY + boxHeight * 0.70);
    this.ctx.shadowBlur = 0;

    // FREE PDF Badge (top right corner)
    const badgeSize = innerScreenW * 0.18;
    const badgeX = innerScreenX + innerScreenW - badgeSize - 10;
    const badgeY = innerScreenY + 10;
    
    // Badge shadow
    this.ctx.shadowColor = 'rgba(255, 0, 0, 0.6)';
    this.ctx.shadowBlur = 20;
    
    const badgeGradient = this.ctx.createRadialGradient(
      badgeX + badgeSize / 2, badgeY + badgeSize / 2, 0,
      badgeX + badgeSize / 2, badgeY + badgeSize / 2, badgeSize / 2
    );
    badgeGradient.addColorStop(0, '#FF0000');
    badgeGradient.addColorStop(1, '#CC0000');
    this.ctx.fillStyle = badgeGradient;
    this.ctx.beginPath();
    this.ctx.arc(badgeX + badgeSize / 2, badgeY + badgeSize / 2, badgeSize / 2, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;

    this.ctx.fillStyle = 'white';
    const badgeTextSize = Math.floor(badgeSize / 4.5);
    this.ctx.font = `bold ${badgeTextSize}px Arial, sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText('FREE', badgeX + badgeSize / 2, badgeY + badgeSize / 2.3);
    this.ctx.fillText('PDF', badgeX + badgeSize / 2, badgeY + badgeSize / 1.5);

    // Laptop base
    const baseY = screenY + screenHeight;
    const baseHeight = h * 0.08;
    const baseGradient = this.ctx.createLinearGradient(x, baseY, x, baseY + baseHeight);
    baseGradient.addColorStop(0, '#3a3a3a');
    baseGradient.addColorStop(1, '#2a2a2a');
    this.ctx.fillStyle = baseGradient;
    this.ctx.beginPath();
    this.ctx.moveTo(x, baseY);
    this.ctx.lineTo(x + w, baseY);
    this.ctx.lineTo(x + w * 0.95, baseY + baseHeight);
    this.ctx.lineTo(x + w * 0.05, baseY + baseHeight);
    this.ctx.closePath();
    this.ctx.fill();
  }

  private drawPhoneMockup(x: number, y: number, w: number, h: number): void {
    const phoneRadius = 15;

    // Phone shadow
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    this.ctx.shadowBlur = 30;
    this.ctx.shadowOffsetY = 12;
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.roundRect(x + 8, y + 8, w, h, phoneRadius);
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetY = 0;

    // Phone body
    const phoneGradient = this.ctx.createLinearGradient(x, y, x, y + h);
    phoneGradient.addColorStop(0, '#2a2a2a');
    phoneGradient.addColorStop(1, '#1a1a1a');
    this.ctx.fillStyle = phoneGradient;
    this.roundRect(x, y, w, h, phoneRadius);

    // Phone screen
    const screenPadding = w * 0.08;
    const screenX = x + screenPadding;
    const screenY = y + h * 0.08;
    const screenW = w - screenPadding * 2;
    const screenH = h * 0.84;

    const screenGradient = this.ctx.createLinearGradient(screenX, screenY, screenX, screenY + screenH);
    screenGradient.addColorStop(0, '#0a1628');
    screenGradient.addColorStop(1, '#1a2947');
    this.ctx.fillStyle = screenGradient;
    this.roundRect(screenX, screenY, screenW, screenH, 10);

    // Screen content - "MCQ OF THE DAY"
    const contentBoxW = screenW * 0.85;
    const contentBoxH = screenH * 0.35;
    const contentBoxX = screenX + (screenW - contentBoxW) / 2;
    const contentBoxY = screenY + screenH * 0.35;

    // Content box
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    this.roundRect(contentBoxX, contentBoxY, contentBoxW, contentBoxH, 8);

    this.ctx.strokeStyle = '#FFD700';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.roundRectPath(contentBoxX, contentBoxY, contentBoxW, contentBoxH, 8);
    this.ctx.stroke();

    // Text
    const textSize = Math.floor(w / 10);
    this.ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
    this.ctx.shadowBlur = 15;
    this.ctx.fillStyle = 'white';
    this.ctx.font = `bold ${textSize}px Arial, sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('MCQ', contentBoxX + contentBoxW / 2, contentBoxY + contentBoxH * 0.35);
    this.ctx.fillStyle = '#FFD700';
    this.ctx.fillText('OF THE', contentBoxX + contentBoxW / 2, contentBoxY + contentBoxH * 0.55);
    this.ctx.fillStyle = 'white';
    this.ctx.fillText('DAY', contentBoxX + contentBoxW / 2, contentBoxY + contentBoxH * 0.75);
    this.ctx.shadowBlur = 0;
  }

  private drawFloatingIcons(width: number, height: number): void {
    // Database icon
    this.drawDatabaseIcon(width * 0.58, height * 0.15, width * 0.06);
    
    // Coffee cup icon
    this.drawCoffeeIcon(width * 0.88, height * 0.30, width * 0.05);
    
    // Lightning bolt
    this.drawLightningIcon(width * 0.83, height * 0.12, width * 0.04);
    
    // Document icon
    this.drawDocumentIcon(width * 0.92, height * 0.50, width * 0.05);
  }

  private drawDatabaseIcon(x: number, y: number, size: number): void {
    this.ctx.shadowColor = 'rgba(0, 150, 255, 0.6)';
    this.ctx.shadowBlur = 15;
    
    // Database cylinders
    for (let i = 0; i < 3; i++) {
      const offsetY = i * size * 0.25;
      this.ctx.fillStyle = '#0099FF';
      this.ctx.beginPath();
      this.ctx.ellipse(x + size / 2, y + offsetY, size / 2, size / 6, 0, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.shadowBlur = 0;
  }

  private drawCoffeeIcon(x: number, y: number, size: number): void {
    this.ctx.shadowColor = 'rgba(255, 150, 0, 0.6)';
    this.ctx.shadowBlur = 15;
    this.ctx.fillStyle = '#FFA500';
    this.roundRect(x, y, size, size * 1.2, size * 0.1);
    
    // Handle
    this.ctx.strokeStyle = '#FFA500';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(x + size, y + size * 0.6, size * 0.3, -Math.PI / 2, Math.PI / 2);
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;
  }

  private drawLightningIcon(x: number, y: number, size: number): void {
    this.ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
    this.ctx.shadowBlur = 20;
    this.ctx.fillStyle = '#FFD700';
    this.ctx.beginPath();
    this.ctx.moveTo(x + size * 0.5, y);
    this.ctx.lineTo(x + size * 0.3, y + size * 0.6);
    this.ctx.lineTo(x + size * 0.6, y + size * 0.6);
    this.ctx.lineTo(x + size * 0.4, y + size * 1.2);
    this.ctx.lineTo(x + size * 0.7, y + size * 0.5);
    this.ctx.lineTo(x + size * 0.4, y + size * 0.5);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.shadowBlur = 0;
  }

  private drawDocumentIcon(x: number, y: number, size: number): void {
    this.ctx.shadowColor = 'rgba(255, 100, 100, 0.6)';
    this.ctx.shadowBlur = 15;
    this.ctx.fillStyle = '#FF6666';
    this.roundRect(x, y, size, size * 1.3, size * 0.1);
    
    // Lines
    this.ctx.strokeStyle = 'white';
    this.ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(x + size * 0.2, y + size * 0.3 + i * size * 0.25);
      this.ctx.lineTo(x + size * 0.8, y + size * 0.3 + i * size * 0.25);
      this.ctx.stroke();
    }
    this.ctx.shadowBlur = 0;
  }

  private roundRectPath(x: number, y: number, width: number, height: number, radius: number): void {
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
  }

  private wrapText(text: string, x: number, y: number, maxWidth: number, lineHeight: number): void {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    const lines: string[] = [];
    const maxLines = 4;

    // Build all lines first
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = this.ctx.measureText(testLine);

      if (metrics.width > maxWidth && n > 0) {
        lines.push(line.trim());
        line = words[n] + ' ';
        
        if (lines.length >= maxLines - 1) {
          // If we're at max lines, add ellipsis to remaining text
          const remaining = words.slice(n).join(' ');
          if (remaining.length > 30) {
            lines.push(words.slice(n, n + 3).join(' ') + '...');
          } else {
            lines.push(remaining);
          }
          break;
        }
      } else {
        line = testLine;
      }
    }
    
    // Add the last line if not already added
    if (line.trim() && lines.length < maxLines) {
      lines.push(line.trim());
    }

    // Center the block of text vertically if multiple lines
    const totalHeight = lines.length * lineHeight;
    let startY = currentY - (totalHeight / 2) + (lineHeight / 2);

    // Draw all lines
    lines.forEach((textLine) => {
      this.ctx.fillText(textLine, x, startY);
      startY += lineHeight;
    });
  }

  private roundRect(x: number, y: number, width: number, height: number, radius: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
    this.ctx.fill();
  }
}
