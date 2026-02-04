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
    questionNumber: number,
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
    this.drawHeader(topic, questionNumber);

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

  private drawHeader(topic: string, questionNumber: number): void {
    // Topic badge
    this.ctx.fillStyle = '#FFD700';
    this.roundRect(50, 50, 300, 60, 10);
    
    this.ctx.fillStyle = '#1e3c72';
    this.ctx.font = 'bold 24px Arial, sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(topic.toUpperCase(), 70, 88);

    // Question number - reduced size
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.font = 'bold 60px Arial, sans-serif';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`#${questionNumber}`, this.layoutWidth - 50, 110);
  }

  private drawMCQContent(question: any, startY: number): void {
    const padding = 60;
    const maxWidth = this.layoutWidth - (padding * 2);

    // Question text background
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    this.roundRect(padding, startY, maxWidth, 600, 15);

    // Question title
    this.ctx.fillStyle = '#2a5298';
    this.ctx.font = 'bold 28px Arial, sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('QUESTION', padding + 30, startY + 45);

    // Question text
    this.ctx.fillStyle = '#333';
    this.ctx.font = '24px Arial, sans-serif';
    const questionText = question.question || question.questionText || 'Question not available';
    this.wrapText(questionText, padding + 30, startY + 90, maxWidth - 60, 32);

    // Options (if available)
    const options = question.options || [];
    if (options.length > 0) {
      let optionY = startY + 200;
      const optionLabels = ['A', 'B', 'C', 'D'];
      
      this.ctx.font = '20px Arial, sans-serif';
      options.slice(0, 4).forEach((option: string, index: number) => {
        const isCorrect = question.correctAnswer === option || 
                         question.correctAnswer === optionLabels[index];
        
        // Option background
        this.ctx.fillStyle = isCorrect ? 'rgba(76, 175, 80, 0.2)' : 'rgba(0, 0, 0, 0.05)';
        this.roundRect(padding + 30, optionY - 25, maxWidth - 60, 50, 8);
        
        // Option label
        this.ctx.fillStyle = isCorrect ? '#4CAF50' : '#666';
        this.ctx.font = 'bold 20px Arial, sans-serif';
        this.ctx.fillText(`${optionLabels[index]}.`, padding + 50, optionY);
        
        // Option text
        this.ctx.fillStyle = '#333';
        this.ctx.font = '20px Arial, sans-serif';
        const optionText = option.length > 80 ? option.substring(0, 80) + '...' : option;
        this.ctx.fillText(optionText, padding + 90, optionY);
        
        optionY += 60;
      });
    }
  }

  private drawQAContent(question: any, startY: number): void {
    const padding = 60;
    const maxWidth = this.layoutWidth - (padding * 2);

    // Question section
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    this.roundRect(padding, startY, maxWidth, 280, 15);

    this.ctx.fillStyle = '#2a5298';
    this.ctx.font = 'bold 28px Arial, sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('QUESTION', padding + 30, startY + 45);

    this.ctx.fillStyle = '#333';
    this.ctx.font = '24px Arial, sans-serif';
    const questionText = question.question || 'Question not available';
    this.wrapText(questionText, padding + 30, startY + 90, maxWidth - 60, 32);

    // Answer section
    const answerY = startY + 300;
    this.ctx.fillStyle = 'rgba(76, 175, 80, 0.15)';
    this.roundRect(padding, answerY, maxWidth, 280, 15);

    this.ctx.fillStyle = '#4CAF50';
    this.ctx.font = 'bold 28px Arial, sans-serif';
    this.ctx.fillText('ANSWER', padding + 30, answerY + 45);

    this.ctx.fillStyle = '#333';
    this.ctx.font = '22px Arial, sans-serif';
    const answerText = question.answer || 'Answer not available';
    this.wrapText(answerText, padding + 30, answerY + 90, maxWidth - 60, 30);
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

  private wrapText(text: string, x: number, y: number, maxWidth: number, lineHeight: number): void {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    const maxLines = 4;
    let lineCount = 0;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = this.ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && n > 0) {
        this.ctx.fillText(line, x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
        lineCount++;
        
        if (lineCount >= maxLines) {
          this.ctx.fillText(line.trim() + '...', x, currentY);
          return;
        }
      } else {
        line = testLine;
      }
    }
    this.ctx.fillText(line, x, currentY);
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
