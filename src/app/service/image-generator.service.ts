import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ImageGeneratorService {
  private readonly baseWidth = 1200;
  private readonly baseHeight = 800;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private layoutWidth = this.baseWidth;
  private layoutHeight = this.baseHeight;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.baseWidth;
    this.canvas.height = this.baseHeight;
    this.ctx = this.canvas.getContext('2d')!;
  }

  private applyPresetSize(size?: { width: number; height: number }): void {
    const width = size?.width ?? this.baseWidth;
    const height = size?.height ?? this.baseHeight;

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }

    const scaleX = width / this.baseWidth;
    const scaleY = height / this.baseHeight;
    const scale = Math.min(scaleX, scaleY);
    this.ctx.setTransform(scale, 0, 0, scale, 0, 0);

    this.layoutWidth = this.baseWidth;
    this.layoutHeight = this.baseHeight;
  }

  async generateQuestionImage(
    question: any,
    questionType: 'mcq' | 'qa',
    topic: string,
    questionNumber?: number,
    size?: { width: number; height: number }
  ): Promise<string> {
   try {
     // Validate inputs
     if (!question) {
       throw new Error('Question object is required');
     }
     if (!topic) {
       throw new Error('Topic is required');
     }

     console.log('Generating image for question:', { questionType, topic, questionNumber, question });

    this.applyPresetSize(size);

    const width = this.layoutWidth;
    const height = this.layoutHeight;

    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);

    // Background gradient
    const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#1e3c72'); 
    gradient.addColorStop(1, '#2a5298');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, width, height);

    // Add decorative elements
    this.addDecorativeElements();

    // Top branding
    this.drawTopBranding();

    // Header section
    this.drawHeader(topic);

    // Question content
    const contentY = 130;
    if (questionType === 'mcq') {
      this.drawMCQContent(question, contentY);
    } else {
      this.drawQAContent(question, contentY);
    }

    // Footer
    this.drawFooter();

    // Convert to image
     return new Promise((resolve, reject) => {
      this.canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
           console.log('Image generated successfully');
          resolve(url);
         } else {
           reject(new Error('Failed to create blob from canvas'));
        }
      }, 'image/jpeg', 0.95);
    });
   } catch (error) {
     console.error('Error in generateQuestionImage:', error);
     throw error;
   }
  }

  private addDecorativeElements(): void {
    // Add some circles for decoration
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    this.ctx.beginPath();
    this.ctx.arc(100, 100, 80, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.arc(1100, 700, 100, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.arc(1050, 150, 60, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawTopBranding(): void {
    const topY = 15;
    
    // App name on left
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    this.ctx.font = 'bold 16px Arial, sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('CareerPrepBook', 50, topY + 20);
    
    // URL on right
    this.ctx.fillStyle = 'rgba(255, 215, 0, 0.95)';
    this.ctx.font = 'bold 16px Arial, sans-serif';
    this.ctx.textAlign = 'right';
    this.ctx.fillText('careerprepbook.com', this.layoutWidth - 50, topY + 20);
  }

  private drawHeader(topic: string): void {
    // Topic badge
    this.ctx.fillStyle = '#FFD700';
    this.roundRect(50, 50, 300, 60, 10);
    
    this.ctx.fillStyle = '#1e3c72';
    this.ctx.font = 'bold 24px Arial, sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(topic.toUpperCase(), 70, 88);
  }

  private drawMCQContent(question: any, startY: number): void {
    const padding = 60;
    const maxWidth = this.layoutWidth - padding * 2;
    const innerWidth = maxWidth - 80; // keep generous side gutters for breathing room

    const questionText = question.question || question.questionText || 'Question not available';
    const options = (question.options || []).slice(0, 4);

    // Measure layout before drawing so we can size the card correctly.
    this.ctx.font = '600 22px "SFMono-Regular", "Cascadia Code", "Segoe UI", Arial, monospace';
    const questionLineHeight = 30;
    const questionMaxLines = 12;
    const questionHeight = this.measureWrappedHeight(questionText, innerWidth, questionLineHeight, questionMaxLines);

    this.ctx.font = '500 20px "Segoe UI", Arial, sans-serif';
    const optionLineHeight = 28;
    const optionMaxLines = 4;
    const optionTextWidth = innerWidth - 120; // leave space for the option label
    const optionHeights = options.map((opt: string) =>
      this.measureWrappedHeight(opt, optionTextWidth, optionLineHeight, optionMaxLines)
    );
    const optionsTotalHeight = optionHeights.reduce((sum: number, h: number) => sum + Math.max(h + 22, 52), 0)
      + (optionHeights.length > 0 ? (optionHeights.length - 1) * 10 : 0);

    const questionBoxHeight = questionHeight + 32; // padding inside box
    const preQuestionSpace = 110; // space for title + breathing room
    const optionsStartOffset = preQuestionSpace + questionBoxHeight + (optionHeights.length ? 28 : 0);
    const contentHeight = Math.max(optionsStartOffset + optionsTotalHeight + 40, preQuestionSpace + questionBoxHeight + 80);

    // Question text background
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    this.roundRect(padding, startY, maxWidth, contentHeight, 15);

    // Question title
    this.ctx.fillStyle = '#1e3a8a';
    this.ctx.font = '700 28px "Segoe UI", Arial, sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('QUESTION', padding + 30, startY + 45);

    // Question text on a soft card
    const questionBoxX = padding + 22;
    const questionBoxY = startY + 70;
    const questionBoxWidth = innerWidth + 36;
    // Subtle gradient card for the question text
    const qGrad = this.ctx.createLinearGradient(0, questionBoxY, 0, questionBoxY + questionBoxHeight);
    qGrad.addColorStop(0, 'rgba(30, 64, 175, 0.08)');
    qGrad.addColorStop(1, 'rgba(30, 64, 175, 0.03)');
    this.ctx.fillStyle = qGrad;
    this.roundRect(questionBoxX, questionBoxY, questionBoxWidth, questionBoxHeight, 12);

    // Left accent bar to visually group the code lines
    this.ctx.fillStyle = 'rgba(37, 99, 235, 0.55)';
    this.ctx.fillRect(questionBoxX + 10, questionBoxY + 10, 4, questionBoxHeight - 20);

    this.ctx.fillStyle = '#0f172a';
    this.ctx.font = '600 22px "SFMono-Regular", "Cascadia Code", "Segoe UI", Arial, monospace';
    const questionEndY = this.wrapText(
      questionText,
      questionBoxX + 18,
      questionBoxY + 28,
      innerWidth - 12,
      questionLineHeight,
      questionMaxLines
    );

    // Options (if available)
    if (options.length > 0) {
      let optionY = questionEndY + 26;
      const optionLabels = ['A', 'B', 'C', 'D'];

      options.forEach((option: string, index: number) => {
        const isCorrect =
          question.correctAnswer === option ||
          question.correctAnswer === optionLabels[index];

        const textHeight = optionHeights[index];
        const boxHeight = Math.max(textHeight + 22, 52);

        // Option background
        this.ctx.fillStyle = isCorrect ? 'rgba(74, 222, 128, 0.16)' : 'rgba(15, 23, 42, 0.04)';
        this.roundRect(padding + 30, optionY, innerWidth, boxHeight, 10);

        // Option label
        this.ctx.fillStyle = isCorrect ? '#16a34a' : '#475569';
        this.ctx.font = '700 20px "Segoe UI", Arial, sans-serif';
        this.ctx.fillText(`${optionLabels[index]}.`, padding + 50, optionY + 28);

        // Option text
        this.ctx.fillStyle = '#0f172a';
        this.ctx.font = '500 20px "Segoe UI", Arial, sans-serif';
        this.wrapText(option, padding + 90, optionY + 28, optionTextWidth, optionLineHeight, optionMaxLines);

        optionY += boxHeight + 10;
      });
    }
  }

  private drawQAContent(question: any, startY: number): void {
    const padding = 60;
    const maxWidth = this.layoutWidth - padding * 2;
    const innerWidth = maxWidth - 80;

    const questionText = question.question || 'Question not available';
    const answerText = question.answer || 'Answer not available';

    // Measure layout
    this.ctx.font = '600 22px "SFMono-Regular", "Cascadia Code", "Segoe UI", Arial, monospace';
    const questionLineHeight = 30;
    const questionMaxLines = 12;
    const questionHeight = this.measureWrappedHeight(questionText, innerWidth, questionLineHeight, questionMaxLines);

    this.ctx.font = '600 22px "Segoe UI", Arial, sans-serif';
    const answerLineHeight = 30;
    const answerMaxLines = 10;
    const answerHeight = this.measureWrappedHeight(answerText, innerWidth, answerLineHeight, answerMaxLines);

    const questionSectionHeight = Math.max(questionHeight + 130, 220);
    const answerSectionHeight = Math.max(answerHeight + 140, 240);
    const answerStartY = startY + questionSectionHeight + 32;

    // Question section
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    this.roundRect(padding, startY, maxWidth, questionSectionHeight, 15);

    this.ctx.fillStyle = '#1e3a8a';
    this.ctx.font = '700 28px "Segoe UI", Arial, sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('QUESTION', padding + 30, startY + 45);

    // Question box
    const questionBoxHeight = questionHeight + 32;
    const questionBoxX = padding + 22;
    const questionBoxY = startY + 70;
    const questionBoxWidth = innerWidth + 36;

    // Subtle gradient card for the question text
    const qGrad = this.ctx.createLinearGradient(0, questionBoxY, 0, questionBoxY + questionBoxHeight);
    qGrad.addColorStop(0, 'rgba(30, 64, 175, 0.08)');
    qGrad.addColorStop(1, 'rgba(30, 64, 175, 0.03)');
    this.ctx.fillStyle = qGrad;
    this.roundRect(questionBoxX, questionBoxY, questionBoxWidth, questionBoxHeight, 12);

    // Left accent bar to visually group the code lines
    this.ctx.fillStyle = 'rgba(37, 99, 235, 0.55)';
    this.ctx.fillRect(questionBoxX + 10, questionBoxY + 10, 4, questionBoxHeight - 20);

    this.ctx.fillStyle = '#0f172a';
    this.ctx.font = '600 22px "SFMono-Regular", "Cascadia Code", "Segoe UI", Arial, monospace';
    this.wrapText(questionText, questionBoxX + 18, questionBoxY + 28, innerWidth - 12, questionLineHeight, questionMaxLines);

    // Answer section
    this.ctx.fillStyle = 'rgba(34, 197, 94, 0.12)';
    this.roundRect(padding, answerStartY, maxWidth, answerSectionHeight, 15);

    this.ctx.fillStyle = '#15803d';
    this.ctx.font = '700 28px "Segoe UI", Arial, sans-serif';
    this.ctx.fillText('ANSWER', padding + 30, answerStartY + 45);

    this.ctx.fillStyle = '#0f172a';
    this.ctx.font = '600 22px "Segoe UI", Arial, sans-serif';
    this.wrapText(answerText, padding + 30, answerStartY + 90, innerWidth, answerLineHeight, answerMaxLines);
  }

  private drawFooter(): void {
    const footerY = this.layoutHeight - 25;
    const footerLineY = this.layoutHeight - 42;
    
    // Separator line
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(60, footerLineY);
    this.ctx.lineTo(this.layoutWidth - 60, footerLineY);
    this.ctx.stroke();
    
    // App name on left
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    this.ctx.font = 'bold 14px Arial, sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('CareerPrepBook', 80, footerY);
    
    // URL on right
    this.ctx.fillStyle = 'rgba(255, 215, 0, 0.95)';
    this.ctx.font = 'bold 14px Arial, sans-serif';
    this.ctx.textAlign = 'right';
    this.ctx.fillText('Visit: careerprepbook.com', this.layoutWidth - 80, footerY);
  }

  private getWrappedLines(text: string, maxWidth: number, maxLines: number): string[] {
    const normalized = (text || '')
      .toString()
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // force line breaks on common code delimiters to prevent single-line overflow
      .replace(/;\s*/g, ';\n')
      .replace(/\{\s*/g, '{\n')
      .replace(/\}\s*/g, '}\n')
      .replace(/\)(?!;)\s*/g, ')\n');
    const paragraphs = normalized.split('\n').filter((p) => p.trim().length > 0);
    const lines: string[] = [];

    const chunkWordToWidth = (word: string): string[] => {
      const chunks: string[] = [];
      let current = '';
      for (const ch of word) {
        const next = current + ch;
        if (this.ctx.measureText(next).width > maxWidth && current.length) {
          chunks.push(current);
          current = ch;
        } else {
          current = next;
        }
      }
      if (current.length) chunks.push(current);
      return chunks.length ? chunks : [word];
    };

    const pushWithEllipsis = (value: string) => {
      let candidate = value.trim();
      const ellipsis = '...';
      while (candidate.length > 0 && this.ctx.measureText(`${candidate}${ellipsis}`).width > maxWidth) {
        candidate = candidate.slice(0, -1);
      }
      lines.push(candidate.length ? `${candidate}${ellipsis}` : ellipsis);
    };

    for (const paragraph of paragraphs) {
      if (lines.length >= maxLines) break;

      const words = paragraph
        .split(/\s+/)
        .filter(Boolean)
        .flatMap((w) => (this.ctx.measureText(w).width > maxWidth ? chunkWordToWidth(w) : [w]));
      let line = '';

      for (const word of words) {
        if (lines.length >= maxLines) break;

        const testLine = line ? `${line} ${word}` : word;
        const testWidth = this.ctx.measureText(testLine).width;

        if (testWidth > maxWidth) {
          if (line) {
            lines.push(line);
            line = word;
          } else {
            lines.push(this.truncateToWidth(word, maxWidth, true));
            line = '';
          }
        } else {
          line = testLine;
        }
      }

      if (lines.length < maxLines && line) {
        lines.push(line);
      }

      if (lines.length >= maxLines) {
        const last = lines[maxLines - 1];
        lines.length = maxLines - 1;
        pushWithEllipsis(last);
        break;
      }
    }

    if (lines.length > maxLines) {
      lines.length = maxLines;
      const last = lines[maxLines - 1];
      lines[maxLines - 1] = this.truncateToWidth(last, maxWidth, true);
    }

    return lines;
  }

  private truncateToWidth(text: string, maxWidth: number, withEllipsis = false): string {
    const ellipsis = withEllipsis ? '...' : '';
    let candidate = text;
    while (candidate.length > 0 && this.ctx.measureText(`${candidate}${ellipsis}`).width > maxWidth) {
      candidate = candidate.slice(0, -1);
    }
    return candidate.length ? `${candidate}${ellipsis}` : ellipsis;
  }

  private measureWrappedHeight(text: string, maxWidth: number, lineHeight: number, maxLines: number): number {
    const lines = this.getWrappedLines(text, maxWidth, maxLines);
    return lines.length * lineHeight;
  }

  private wrapText(
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
    maxLines: number
  ): number {
    const lines = this.getWrappedLines(text, maxWidth, maxLines);
    let currentY = y;

    lines.forEach((line) => {
      this.ctx.fillText(line, x, currentY);
      currentY += lineHeight;
    });

    return currentY;
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
