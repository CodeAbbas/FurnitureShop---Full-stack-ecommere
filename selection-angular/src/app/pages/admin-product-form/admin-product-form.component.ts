import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import {
  ProductService,
  ProductUpdatePayload
} from '../../services/product.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-admin-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  providers: [ProductService],
  templateUrl: './admin-product-form.component.html',
  styleUrl: './admin-product-form.component.css'
})
export class AdminProductFormComponent implements OnInit {

  private productService = inject(ProductService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private formBuilder = inject(FormBuilder);

  isEditMode: boolean = false;

  productId: string | null = null;

  productForm!: FormGroup;
  isLoading: boolean = false;
  isSubmitting: boolean = false;
  errorMessage: string = '';

  ngOnInit(): void {
    this.initProductForm();

    this.productId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.productId;

    if (this.isEditMode && this.productId) {
      this.loadProductForEdit(this.productId);
    }
  }

  // ============================================================
  //  Reactive Form — strict validators
  // ============================================================


  private initProductForm(): void {
    this.productForm = this.formBuilder.group({
      title: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(120)
      ]],
      category: ['', [
        Validators.required,
        Validators.minLength(2)
      ]],
      subcategory: [''],
      price: [0, [
        Validators.required,
        Validators.min(0),
        Validators.max(100000)
      ]],
      oldPrice: [0, [
        Validators.min(0),
        Validators.max(100000)
      ]],
      inStock: [0, [
        Validators.required,
        Validators.min(0),
        Validators.max(10000),
        Validators.pattern(/^[0-9]+$/)
      ]],
      topSelling: [false],
      newArrival: [false],
      description: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(1000)
      ]],
      specification: [''],
      imageUrl: ['']
    });

    if (this.isEditMode) {
      this.lockEditOnlyFields();
    }
  }

  private lockEditOnlyFields(): void {
    const lockedFields = [
      'subcategory',
      'oldPrice',
      'topSelling',
      'newArrival',
      'specification',
      'imageUrl'
    ];
    lockedFields.forEach((name) => {
      this.productForm.controls[name]?.disable();
    });
  }

  isInvalid(controlName: string): boolean {
    const control = this.productForm.controls[controlName];
    return !!control && control.invalid && control.touched;
  }

  // ============================================================
  //  Edit Mode — load existing product
  // ============================================================

  private loadProductForEdit(productId: string): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.productService.getProduct(productId).subscribe({
      next: (product) => {
        this.patchFormFromProduct(product);
        this.isLoading = false;
      },
      error: (err: Error) => {
        this.errorMessage = err.message;
        this.isLoading = false;
      }
    });
  }

  private patchFormFromProduct(product: Product): void {
    this.productForm.patchValue({
      title: product.title,
      category: product.category,
      subcategory: product.subcategory,
      price: product.price,
      oldPrice: product.oldPrice,
      inStock: product.inStock,
      topSelling: product.topSelling,
      newArrival: product.newArrival,
      description: product.description,
      specification: product.specification,
      imageUrl: (product.images && product.images.length > 0)
        ? product.images[0]
        : ''
    });
  }

  // ============================================================
  //  Submit
  // ============================================================

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    if (this.isEditMode && this.productId) {
      this.submitUpdate(this.productId);
    } else {
      this.submitCreate();
    }
  }

  private submitCreate(): void {
    const formValue = this.productForm.value;
    const payload: Partial<Product> = {
      title: formValue.title,
      category: formValue.category,
      subcategory: formValue.subcategory || '',
      price: Number(formValue.price),
      oldPrice: Number(formValue.oldPrice) || 0,
      inStock: Number(formValue.inStock),
      topSelling: !!formValue.topSelling,
      newArrival: !!formValue.newArrival,
      description: formValue.description,
      specification: formValue.specification || ''
    };

    this.productService.addProduct(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/admin/dashboard']);
      },
      error: (err: Error) => {
        this.errorMessage = err.message;
        this.isSubmitting = false;
      }
    });
  }
  private submitUpdate(productId: string): void {
    const value = this.productForm.value;

    const payload: ProductUpdatePayload = {
      title: value.title,
      category: value.category,
      price: Number(value.price),
      inStock: Number(value.inStock),
      description: value.description
    };

    this.productService.updateProduct(productId, payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/admin/dashboard']);
      },
      error: (err: Error) => {
        this.errorMessage = err.message;
        this.isSubmitting = false;
      }
    });
  }

  // ============================================================
  //  View helpers
  // ============================================================

  get pageTitle(): string {
    return this.isEditMode ? 'Edit Product' : 'Add New Product';
  }

  get submitButtonLabel(): string {
    if (this.isSubmitting) {
      return this.isEditMode ? 'Saving changes...' : 'Creating product...';
    }
    return this.isEditMode ? 'Save Changes' : 'Create Product';
  }
  isFieldLocked(controlName: string): boolean {
    const control = this.productForm.controls[controlName];
    return this.isEditMode && !!control && control.disabled;
  }

  onCancel(): void {
    this.router.navigate(['/admin/dashboard']);
  }
}