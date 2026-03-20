import { Injectable } from '@angular/core';
import jsonData from '../assets/products.json';

@Injectable({
  providedIn: 'root',
})
export class SelectionService {
  getProducts() {
    return jsonData;
  }

}
