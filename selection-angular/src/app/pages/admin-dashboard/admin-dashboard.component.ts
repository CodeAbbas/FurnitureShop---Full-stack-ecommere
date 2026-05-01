import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';


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
  private router = inject(Router);

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
  get outOfStockCount(): number {
    return this.products.filter((p) => p.inStock === 0).length;
  }
  get newArrivalCount(): number {
    return this.products.filter((p) => p.newArrival).length;
  }

  // ============================================================
  //  Action stubs
  // ============================================================

  onEdit(productId: string): void {
    this.router.navigate(['/admin/products', productId, 'edit']);
  }

  onDelete(productId: string): void {
    const confirmed = window.confirm(
      'Are you sure you want to delete this product? This action cannot be undone.'
    );
    if (!confirmed) {
      return;
    }

    this.productService.deleteProduct(productId).subscribe({
      next: () => {
        this.loadProducts();
      },
      error: (err: Error) => {
        this.errorMessage = err.message;
      }
    });
  }

  onAddNew(): void {
    this.router.navigate(['/admin/products/new']);
  }
}