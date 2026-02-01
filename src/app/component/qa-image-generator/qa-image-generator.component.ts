import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { TechnologyService } from '../../service/technology.service';
import { MCQQuestionService } from '../../service/mcqQuestion.service';
import { QuestionAnswerService } from '../../service/questionAnswer.Service';
import { ImageGeneratorService } from '../../service/image-generator.service';
import { DropdownResponse } from '../../models/Technology';

@Component({
  selector: 'app-qa-image-generator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './qa-image-generator.component.html',
  styleUrls: ['./qa-image-generator.component.scss']
})
export class QaImageGeneratorComponent implements OnInit {
  categories: DropdownResponse[] = [];
  topics: DropdownResponse[] = [];
  
  selectedCategory: string = '';
  selectedTopic: string = '';
  numberOfImages: number = 5;
  selectedQuestionType: string = 'MCQ'; // MCQ, OUTPUTBASEDMCQ, OUTPUTBASED, THEORY
  
  isGenerating: boolean = false;
  generatedImages: string[] = [];
  progress: number = 0;
  statusMessage: string = '';

  questionTypes = [
    { label: 'MCQ', value: 'MCQ' },
    { label: 'Output Based MCQ', value: 'OUTPUTBASEDMCQ' },
    { label: 'Output Based (Typed)', value: 'OUTPUTBASED' },
    { label: 'Theory (Q&A)', value: 'THEORY' }
  ];

  constructor(
    private technologyService: TechnologyService,
    private mcqService: MCQQuestionService,
    private qaService: QuestionAnswerService,
    private imageGenerator: ImageGeneratorService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.technologyService.getAllTechCategories().subscribe({
      next: (data) => {
         console.log('Categories loaded:', data);
        this.categories = data;
      },
      error: (err) => {
        console.error('Error loading categories:', err);
         alert('Failed to load categories. Please check if the API is running.');
      }
    });
  }

  onCategoryChange(): void {
    if (this.selectedCategory) {
       console.log('Category selected:', this.selectedCategory);
      const categoryId = parseInt(this.selectedCategory);
      this.technologyService.getAllTechItems(categoryId).subscribe({
        next: (data) => {
           console.log('Topics loaded:', data);
          this.topics = data;
          this.selectedTopic = '';
        },
        error: (err) => {
          console.error('Error loading topics:', err);
           alert('Failed to load topics. Please check if the API is running.');
        }
      });
    }
  }

  async generateImages(): Promise<void> {
    if (!this.selectedTopic || this.numberOfImages < 1) {
      alert('Please select a topic and specify number of images');
      return;
    }

    this.isGenerating = true;
    this.generatedImages = [];
    this.progress = 0;
    this.statusMessage = 'Fetching questions...';

    try {
      let questions: any[] = [];

      // All question types use MCQ service
      const response: any = await firstValueFrom(this.mcqService.getAllMcq({
        topic: this.selectedTopic,
        category: this.selectedCategory,
        questionType: this.selectedQuestionType
      }));
     
       // Handle different response structures
       if (Array.isArray(response)) {
         questions = response.slice(0, this.numberOfImages);
       } else if (response?.data && Array.isArray(response.data)) {
         questions = response.data.slice(0, this.numberOfImages);
       } else if (response?.mcqQuestions && Array.isArray(response.mcqQuestions)) {
         questions = response.mcqQuestions.slice(0, this.numberOfImages);
       } else {
         console.warn('Unexpected response structure:', response);
         questions = [];
       }

       console.log(`Fetched ${questions.length} questions for topic: ${this.selectedTopic}`);

      if (questions.length === 0) {
         this.statusMessage = `No questions found for topic "${this.selectedTopic}". Please try a different topic.`;
        this.isGenerating = false;
        return;
      }

      this.statusMessage = `Generating ${questions.length} images...`;

      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        this.statusMessage = `Generating image ${i + 1} of ${questions.length}...`;
        
        // Determine if this is a MCQ or Theory type
        const isMcqType = this.selectedQuestionType !== 'THEORY';
        const imageUrl = await this.imageGenerator.generateQuestionImage(question, isMcqType ? 'mcq' : 'qa', this.selectedTopic, i + 1);
        
        this.generatedImages.push(imageUrl);
        this.progress = Math.round(((i + 1) / questions.length) * 100);
      }

      this.statusMessage = `Successfully generated ${this.generatedImages.length} images!`;
    } catch (error) {
      console.error('Error generating images:', error);
      const errorMessage = this.getErrorMessage(error);
      this.statusMessage = `Error: ${errorMessage}. Please check console for details.`;
      alert(`Failed to generate images: ${errorMessage}\n\nPlease check:\n1. Topic has questions in database\n2. API is running\n3. Network connection\n4. Browser console for details`);
    } finally {
      this.isGenerating = false;
    }
  }

  private getErrorMessage(error: unknown): string {
    if (typeof error === 'string') return error;
    if (error && typeof error === 'object') {
      const err = error as { message?: string; error?: { message?: string } };
      return err.message || err.error?.message || 'Unknown error';
    }
    return 'Unknown error';
  }

  downloadImage(imageUrl: string, index: number): void {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `question-${this.selectedTopic}-${index + 1}.jpg`;
    link.click();
  }

  downloadAllImages(): void {
    this.generatedImages.forEach((imageUrl, index) => {
      setTimeout(() => {
        this.downloadImage(imageUrl, index);
      }, index * 500); // Stagger downloads
    });
  }

  clearImages(): void {
    this.generatedImages = [];
    this.progress = 0;
    this.statusMessage = '';
  }
}
