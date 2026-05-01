import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ToastComponent, ToastType } from '../../components/ui/toast/toast.component';

import { ProductService } from '../../services/product.service';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { Product } from '../../models/product.model';
import { Review } from '../../models/review.model';


@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ToastComponent],
  providers: [ProductService],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit {

  private productService = inject(ProductService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private formBuilder = inject(FormBuilder);
  private cartService = inject(CartService);

  toastMessage: string = '';
  toastType: ToastType = 'success';
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  product: Product | null = null;
  isLoading: boolean = true;
  errorMessage: string = '';


  selectedImage: string = '';

  reviewForm!: FormGroup;
  isSubmittingReview: boolean = false;
  reviewErrorMessage: string = '';
  reviewSuccessMessage: string = '';

  readonly fallbackImage: string =
    'https://picsum.photos/seed/selection/800/600';

  ngOnInit(): void {
    this.initReviewForm();

    const productId = this.route.snapshot.paramMap.get('id');
    if (!productId) {
      this.errorMessage = 'No product ID was supplied in the URL.';
      this.isLoading = false;
      return;
    }

    this.loadProduct(productId);
  }

  // ============================================================
  //  Data fetching
  // ============================================================

  private loadProduct(productId: string): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.productService.getProduct(productId).subscribe({
      next: (response) => {
        this.product = response;
        this.selectedImage = this.getInitialImage(response);
        this.isLoading = false;
      },
      error: (err: Error) => {
        this.errorMessage = err.message;
        this.isLoading = false;
      }
    });
  }

  private getInitialImage(product: Product): string {
    if (product.images && product.images.length > 0) {
      return product.images[0];
    }
    return this.fallbackImage;
  }

  private reloadReviews(productId: string): void {
    this.productService.getReviews(productId).subscribe({
      next: (reviews) => {
        if (this.product) {
          this.product.reviews = reviews;
        }
      },
      error: (err: Error) => {
        console.error('[ProductDetailComponent] reloadReviews failed:', err);
      }
    });
  }

  // ============================================================
  //  Reactive Form — strict 1-5 stars validation
  // ============================================================


  private initReviewForm(): void {
    this.reviewForm = this.formBuilder.group({
      comment: ['', [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(500)
      ]],
      stars: [5, [
        Validators.required,
        Validators.min(1),
        Validators.max(5),
        Validators.pattern(/^[1-5]$/)
      ]]
    });
  }


  isInvalid(controlName: string): boolean {
    const control = this.reviewForm.controls[controlName];
    return !!control && control.invalid && control.touched;
  }

  // ============================================================
  //  Image gallery helpers
  // ============================================================

  selectImage(imageUrl: string): void {
    this.selectedImage = imageUrl;
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = this.fallbackImage;
  }

  // ============================================================
  //  Auth-aware getters used by the template
  // ============================================================

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get hasDiscount(): boolean {
    return !!this.product
      && !!this.product.oldPrice
      && this.product.oldPrice > (this.product.price ?? 0);
  }

  // ============================================================
  //  Actions
  // ============================================================

  onSubmitReview(): void {
    if (!this.product || !this.product._id) {
      return;
    }

    if (this.reviewForm.invalid) {
      this.reviewForm.markAllAsTouched();
      return;
    }

    const username = this.authService.getUsername();
    if (!username) {
      this.reviewErrorMessage = 'Your session has expired. Please log in again.';
      return;
    }

    const payload = {
      username: username,
      comment: this.reviewForm.value.comment,
      stars: Number(this.reviewForm.value.stars)
    };

    this.isSubmittingReview = true;
    this.reviewErrorMessage = '';
    this.reviewSuccessMessage = '';

    this.productService.addReview(this.product._id, payload).subscribe({
      next: () => {
        this.isSubmittingReview = false;
        this.reviewSuccessMessage = 'Thank you! Your review has been posted.';
        this.reviewForm.reset({ stars: 5, comment: '' });
        if (this.product && this.product._id) {
          this.reloadReviews(this.product._id);
        }
      },
      error: (err: Error) => {
        this.isSubmittingReview = false;
        this.reviewErrorMessage = err.message;
      }
    });
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


  starsArray(count: number): number[] {
    return Array(count).fill(0);
  }
}