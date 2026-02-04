import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PageViewCounterService, PageViewStats } from '../../service/page-view-counter.service';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-page-view-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './page-view-stats.component.html',
  styleUrls: ['./page-view-stats.component.scss']
})
export class PageViewStatsComponent implements OnInit {
  stats: PageViewStats[] = [];
  totalViews = 0;
  totalPages = 0;
  loading = true;
  errorMessage = '';
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  pageSizeOptions = [5, 10, 20, 50, 100];

  // Expose Math for template
  Math = Math;

  constructor(
    private pageViewService: PageViewCounterService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check if user is admin before loading data
    if (!this.authService.isAdmin()) {
      this.errorMessage = 'Access Denied: Admin privileges required';
      this.loading = false;
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        this.router.navigate(['/dashboard']);
      }, 2000);
      return;
    }

    this.loadPageViewStats();
  }

  loadPageViewStats(): void {
    this.loading = true;
    this.errorMessage = '';

    this.pageViewService.getPageViewStats().subscribe({
      next: (response: PageViewStats[]) => {
        this.stats = (response || []).sort((a, b) => b.viewCount - a.viewCount);
        this.totalViews = this.stats.reduce((sum, stat) => sum + stat.viewCount, 0);
        this.totalPages = this.stats.length;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching page view stats:', error);
        this.errorMessage = 'Failed to load page view statistics. Please try again later.';
        this.loading = false;
      }
    });
  }

  getSortedStats(): PageViewStats[] {
    return [...this.stats].sort((a, b) => b.viewCount - a.viewCount);
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateString;
    }
  }

  // Pagination methods
  get paginatedStats(): PageViewStats[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.getSortedStats().slice(startIndex, endIndex);
  }

  get totalPagesCount(): number {
    return Math.ceil(this.stats.length / this.itemsPerPage);
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const total = this.totalPagesCount;
    
    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      if (this.currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push(-1); // ellipsis
        pages.push(total);
      } else if (this.currentPage >= total - 3) {
        pages.push(1);
        pages.push(-1); // ellipsis
        for (let i = total - 4; i <= total; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push(-1); // ellipsis
        for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) pages.push(i);
        pages.push(-1); // ellipsis
        pages.push(total);
      }
    }
    return pages;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPagesCount) {
      this.currentPage = page;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPagesCount) {
      this.currentPage++;
    }
  }

  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.itemsPerPage = parseInt(target.value, 10);
    this.currentPage = 1; // Reset to first page
  }
}
