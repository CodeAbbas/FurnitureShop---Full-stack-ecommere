import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, RouterLink],
  providers: [ProductService, CartService],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.css'
})
export class CatalogComponent implements OnInit {

  private productService = inject(ProductService);
  private cartService = inject(CartService);
  toastMessage: string = '';
  private toastTimer: ReturnType<typeof setTimeout> | null = null;


  products: Product[] = [];

  isLoading: boolean = true;


  errorMessage: string = '';


  readonly fallbackImage: string =
    'https://picsum.photos/seed/selection/600/400';

  ngOnInit(): void {
    this.loadProducts();
  }

 
  loadProducts(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.productService.getProducts().subscribe({
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
    this.showToast(
      added
        ? `"${product.title}" added to your cart.`
        : `"${product.title}" is out of stock.`
    );
  }
  private showToast(message: string): void {
    this.toastMessage = message;
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastTimer = setTimeout(() => {
      this.toastMessage = '';
      this.toastTimer = null;
    }, 3000);
  }
}