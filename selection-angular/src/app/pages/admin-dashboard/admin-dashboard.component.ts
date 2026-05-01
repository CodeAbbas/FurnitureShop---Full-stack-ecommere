import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  providers: [ProductService],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {

  private productService = inject(ProductService);

  products: Product[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';

  readonly fallbackImage: string =
    'https://picsum.photos/seed/selection/100/100';

  ngOnInit(): void {
    this.loadProducts();
  }

  // ============================================================
  //  Data fetching
  // ============================================================

  loadProducts(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.productService.getProducts({ pn: 1, ps: 200 }).subscribe({
      next: (response) => {
        this.products = response;
        this.isLoading = false;
      },
      error: (err: Error) => {
        this.errorMessage = err.message;
        this.isLoading = false;
      }
    });
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


  stockBadgeClass(inStock: number): string {
    if (inStock === 0) {
      return 'bg-danger';
    }
    if (inStock <= 5) {
      return 'bg-warning text-dark';
    }
    return 'bg-success';
  }

  stockLabel(inStock: number): string {
    if (inStock === 0) {
      return 'Out of stock';
    }
    if (inStock <= 5) {
      return inStock + ' (Low)';
    }
    return String(inStock);
  }

  // ============================================================
  //  Action stubs
  // ============================================================

  onEdit(productId: string): void {
    console.log('[AdminDashboard] Edit pending ProductForm:', productId);
  }

  onDelete(productId: string): void {
    console.log('[AdminDashboard] Delete pending confirm modal:', productId);
  }

  onAddNew(): void {
    console.log('[AdminDashboard] Add new pending ProductForm.');
  }
}