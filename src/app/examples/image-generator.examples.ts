/**
 * Example usage of the Image Generator Service
 * 
 * This demonstrates how the service can be used independently
 * if you want to integrate it into other components
 */

import { ImageGeneratorService } from '../service/image-generator.service';

// Example 1: Generate MCQ Image
const mcqQuestion = {
  question: "What is a Promise in JavaScript?",
  options: [
    "A synchronous operation",
    "An object representing eventual completion of an async operation",
    "A type of loop",
    "A variable declaration"
  ],
  correctAnswer: "An object representing eventual completion of an async operation",
  questionText: "What is a Promise in JavaScript?",
  topic: "JavaScript Promises"
};

async function generateMCQImage(imageService: ImageGeneratorService) {
  const imageUrl = await imageService.generateQuestionImage(
    mcqQuestion,
    'mcq',
    'JavaScript',
    1
  );
  
  // Use the imageUrl (data URL)
  console.log('MCQ Image generated:', imageUrl);
  // Can be used in <img> tag or downloaded
}

// Example 2: Generate Q&A Image
const qaQuestion = {
  question: "Explain the difference between var, let, and const in JavaScript.",
  answer: "var is function-scoped, let and const are block-scoped. const creates immutable bindings while let allows reassignment.",
  topic: "JavaScript Fundamentals",
  level: "intermediate"
};

async function generateQAImage(imageService: ImageGeneratorService) {
  const imageUrl = await imageService.generateQuestionImage(
    qaQuestion,
    'qa',
    'JavaScript',
    2
  );
  
  console.log('Q&A Image generated:', imageUrl);
}

// Example 3: Batch Generation
async function generateBatch(
  imageService: ImageGeneratorService, 
  questions: any[], 
  questionType: 'mcq' | 'qa',
  topic: string
) {
  const imageUrls: string[] = [];
  
  for (let i = 0; i < questions.length; i++) {
    const imageUrl = await imageService.generateQuestionImage(
      questions[i],
      questionType,
      topic,
      i + 1
    );
    imageUrls.push(imageUrl);
    
    // Progress callback
    console.log(`Generated ${i + 1} of ${questions.length}`);
  }
  
  return imageUrls;
}

// Example 4: Download Function
function downloadImage(imageUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = imageUrl;
  link.download = filename;
  link.click();
}

// Example 5: Integration in Component
/*
export class MyComponent {
  constructor(private imageGenerator: ImageGeneratorService) {}
  
  async createPromoImages() {
    const questions = await this.fetchQuestions();
    
    for (let i = 0; i < questions.length; i++) {
      const imageUrl = await this.imageGenerator.generateQuestionImage(
        questions[i],
        'mcq',
        'JavaScript',
        i + 1
      );
      
      // Auto download
      this.downloadImage(imageUrl, `promo-${i + 1}.jpg`);
    }
  }
  
  downloadImage(url: string, name: string) {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
  }
}
*/

// Example 6: Custom Styling (modify service for this)
/*
To customize the image design, modify these methods in image-generator.service.ts:

1. Background colors - line ~25 in generateQuestionImage():
   gradient.addColorStop(0, '#YOUR_COLOR_1');
   gradient.addColorStop(1, '#YOUR_COLOR_2');

2. Topic badge color - line ~38:
   this.ctx.fillStyle = '#YOUR_BADGE_COLOR';

3. Text colors - throughout drawMCQContent() and drawQAContent()

4. Dimensions - constructor:
   this.canvas.width = 1920;  // For Full HD
   this.canvas.height = 1080;
*/

export {
  generateMCQImage,
  generateQAImage,
  generateBatch,
  downloadImage
};
