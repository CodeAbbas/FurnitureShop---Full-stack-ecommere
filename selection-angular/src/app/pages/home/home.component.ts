import {
  AfterViewInit,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';

interface HeroSlide {
  image: string;
  title: string;
  subtitle: string;
}


interface LookbookEntry {
  category: string;
  image: string;
}


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  providers: [ProductService],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {

  private productService = inject(ProductService);

  // ============================================================
  //  Hero gallery slider state
  // ============================================================

  slides: HeroSlide[] = [
    {
      image: 'https://picsum.photos/seed/livingroom/1600/600',
      title: 'Curated Living, Crafted to Last',
      subtitle: 'Pieces designed for character, comfort, and longevity.'
    },
    {
      image: 'https://picsum.photos/seed/sofa-hero/1600/600',
      title: 'The Autumn Collection',
      subtitle: 'Warm tones and soft textures, ready for your home.'
    },
    {
      image: 'https://picsum.photos/seed/bedroom/1600/600',
      title: 'Build a Bedroom You Love',
      subtitle: 'Beds, wardrobes, and nightstands made to fit together.'
    }
  ];

  currentSlide: number = 0;

  private autoSlideTimer: ReturnType<typeof setInterval> | null = null;
  private readonly AUTOPLAY_INTERVAL_MS = 5000;

  // ============================================================
  //  Featured + lookbook state
  // ============================================================

  featuredProducts: Product[] = [];
  lookbookEntries: LookbookEntry[] = [];
  isLoadingProducts: boolean = true;
  errorMessage: string = '';

  readonly fallbackImage: string =
    'https://picsum.photos/seed/selection/600/400';

  // ============================================================
  //  Lifecycle
  // ============================================================

  ngOnInit(): void {
    this.loadProducts();
  }

  ngAfterViewInit(): void {

    this.startAutoplay();
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
  }

  // ============================================================
  //  Slider — public template handlers
  // ============================================================

  nextSlide(): void {
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
  }

  prevSlide(): void {
    this.currentSlide =
      (this.currentSlide - 1 + this.slides.length) % this.slides.length;
  }

  goToSlide(index: number): void {
    if (index >= 0 && index < this.slides.length) {
      this.currentSlide = index;
    }
  }

  pauseAutoplay(): void {
    this.stopAutoplay();
  }

  resumeAutoplay(): void {
    this.startAutoplay();
  }

  @HostListener('document:keydown.arrowright')
  onArrowRight(): void {
    this.nextSlide();
  }

  @HostListener('document:keydown.arrowleft')
  onArrowLeft(): void {
    this.prevSlide();
  }

  // ============================================================
  //  Slider — private timer plumbing
  // ============================================================

  private startAutoplay(): void {
    if (this.autoSlideTimer || this.slides.length <= 1) {
      return;
    }
    this.autoSlideTimer = setInterval(
      () => this.nextSlide(),
      this.AUTOPLAY_INTERVAL_MS
    );
  }

  private stopAutoplay(): void {
    if (this.autoSlideTimer) {
      clearInterval(this.autoSlideTimer);
      this.autoSlideTimer = null;
    }
  }

  // ============================================================
  //  Data — featured + lookbook
  // ============================================================

  private loadProducts(): void {
    this.isLoadingProducts = true;
    this.errorMessage = '';

    this.productService.getProducts({ pn: 1, ps: 200 }).subscribe({
      next: (products) => {
        this.featuredProducts = this.pickFeatured(products);
        this.lookbookEntries = this.buildLookbook(products);
        this.isLoadingProducts = false;
      },
      error: (err: Error) => {
        this.errorMessage = err.message;
        this.isLoadingProducts = false;
      }
    });
  }
  private pickFeatured(products: Product[]): Product[] {
    return products
      .filter((p) => p.newArrival || p.topSelling || (p.inStock ?? 0) > 0)
      .slice(0, 8);
  }
  private buildLookbook(products: Product[]): LookbookEntry[] {
    const byCategory = new Map<string, LookbookEntry>();
    products.forEach((p) => {
      if (!p.category || byCategory.has(p.category)) {
        return;
      }
      byCategory.set(p.category, {
        category: p.category,
        image: (p.images && p.images.length > 0)
          ? p.images[0]
          : this.fallbackImage
      });
    });
    return Array.from(byCategory.values());
  }

  // ============================================================
  //  View helpers
  // ============================================================

  getProductImage(product: Product): string {
    if (product.images && product.images.length > 0) {
      return product.images[0];
    }
    return this.fallbackImage;
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = this.fallbackImage;
  }

  hasDiscount(product: Product): boolean {
    return !!product.oldPrice && product.oldPrice > (product.price ?? 0);
  }

  // Brings back the missing method for the slider
  trackByIndex(index: number): number {
    return index;
  }

  // The single, correctly typed fallback for the products
  trackByProductId(_index: number, product: Product): string {
    return product._id ?? '';
  }
}