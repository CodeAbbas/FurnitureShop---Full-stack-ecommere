import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  BehaviorSubject,
  Observable,
  Subject,
  combineLatest,
  takeUntil
} from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  startWith
} from 'rxjs/operators';
import { ToastComponent, ToastType } from '../../components/ui/toast/toast.component';

import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { Product } from '../../models/product.model';

type SortKey = 'default' | 'price-asc' | 'price-desc' | 'name-asc';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ToastComponent],
  providers: [ProductService],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.css'
})
export class CatalogComponent implements OnInit, OnDestroy {

  private productService = inject(ProductService);
  private cartService = inject(CartService);

  // ============================================================
  //  Stream sources
  // ============================================================

  private allProductsSubject = new BehaviorSubject<Product[]>([]);
  searchControl = new FormControl<string>('', { nonNullable: true });

  categoryFilterSubject = new BehaviorSubject<string>('all');

  priceFilterSubject = new BehaviorSubject<string>('all');
  sortFilterSubject = new BehaviorSubject<SortKey>('default');

  // ============================================================
  //  Derived streams
  // ============================================================

  filteredProducts$!: Observable<Product[]>;

  categories$!: Observable<string[]>;

  // ============================================================
  //  Component-level state (loading / error / toast)
  // ============================================================

  isLoading: boolean = true;
  errorMessage: string = '';

  toastMessage: string = '';
  toastType: ToastType = 'success';
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  readonly fallbackImage: string =
    'https://picsum.photos/seed/selection/600/400';

  private destroy$ = new Subject<void>();

  // ============================================================
  //  Lifecycle
  // ============================================================

  ngOnInit(): void {
    this.buildDerivedStreams();
    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.allProductsSubject.complete();
    this.categoryFilterSubject.complete();
    this.priceFilterSubject.complete();
    this.sortFilterSubject.complete();
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }

  // ============================================================
  //  Stream wiring
  // ============================================================

  private buildDerivedStreams(): void {

    const search$ = this.searchControl.valueChanges.pipe(
      startWith(this.searchControl.value),
      debounceTime(200),
      distinctUntilChanged()
    );

    this.filteredProducts$ = combineLatest([
      this.allProductsSubject,
      search$,
      this.categoryFilterSubject,
      this.priceFilterSubject,
      this.sortFilterSubject
    ]).pipe(
      map(([products, search, category, priceBand, sortKey]) => {

        // 1) Search — case-insensitive title match, trimmed.
        const needle = (search || '').trim().toLowerCase();
        let result = needle
          ? products.filter((p) => (p.title ?? '').toLowerCase().includes(needle))
          : products;

        // 2) Category — 'all' is the no-op pass-through.
        if (category !== 'all') {
          result = result.filter((p) => p.category === category);
        }

        // 3) Price band.
        if (priceBand !== 'all') {
          result = result.filter((p) => this.matchesPrice((p.price ?? 0), priceBand));
        }

        return this.applySort([...result], sortKey);
      })
    );

    this.categories$ = this.allProductsSubject.pipe(
      map((products) => {
        const set = new Set<string>();
        products.forEach((p) => {
          if (p.category) {
            set.add(p.category);
          }
        });
        return Array.from(set).sort();
      })
    );
  }

  private matchesPrice(price: number, band: string): boolean {
    switch (band) {
      case 'under-200':  return price < 200;
      case '200-500':    return price >= 200 && price < 500;
      case '500-1000':   return price >= 500 && price < 1000;
      case 'over-1000':  return price >= 1000;
      default:           return true;
    }
  }

  private applySort(products: Product[], sortKey: SortKey): Product[] {
    switch (sortKey) {
      case 'price-asc':
        return products.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
      case 'price-desc':
        return products.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
      case 'name-asc':
        return products.sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''));
      default:
        return products;
    }
  }

  // ============================================================
  //  Data fetching
  // ============================================================

  loadProducts(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.productService.getProducts({ pn: 1, ps: 200 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.allProductsSubject.next(response);
          this.isLoading = false;
        },
        error: (err: Error) => {
          this.errorMessage = err.message;
          this.isLoading = false;
        }
      });
  }

  // ============================================================
  //  Template-bound handlers
  // ============================================================

  
  clearFilters(): void {
    this.searchControl.setValue('', { emitEvent: true });
    this.categoryFilterSubject.next('all');
    this.priceFilterSubject.next('all');
    this.sortFilterSubject.next('default');
  }
  onCategoryChange(value: string): void {
    this.categoryFilterSubject.next(value);
  }

  onPriceChange(value: string): void {
    this.priceFilterSubject.next(value);
  }

  onSortChange(value: SortKey): void {
    this.sortFilterSubject.next(value);
  }

  // ============================================================
  //  helpers
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

  onAddToCart(product: Product): void {
    const added = this.cartService.addToCart(product);
    if (added) {
      this.showToast(`"${product.title}" added to your cart.`, 'success');
    } else {
      this.showToast(`"${product.title}" is out of stock.`, 'error');
    }
  }

  private showToast(message: string, type: ToastType = 'success'): void {
    this.toastMessage = message;
    this.toastType = type;
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastTimer = setTimeout(() => {
      this.toastMessage = '';
      this.toastTimer = null;
    }, 3000);
  }

  trackByProductId(_index: number, product: Product): string {
    return product._id ?? '';
  }
}