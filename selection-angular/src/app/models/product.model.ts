import { Review } from './review.model';

export interface ProductVariation {
  _id?: string;
  name?: string;
  value?: string;
}

export interface Product {
  _id?: string;
  title?: string;
  category?: string;
  subcategory?: string;
  price?: number;
  oldPrice?: number;
  inStock?: number;
  topSelling?: boolean;
  newArrival?: boolean;
  description?: string;
  specification?: string;
  images?: string[];
  reviews?: any[];
  variations?: any[];
}
