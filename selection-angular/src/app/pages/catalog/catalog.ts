import { Component } from '@angular/core';
import jsonData from '../../assets/products.json';
import { SelectionService } from '../../services/selection-service';

@Component({
  selector: 'app-catalog',
  imports: [],
  providers: [SelectionService],
  templateUrl: './catalog.html',
  styleUrl: './catalog.css',
})
export class Catalog {
  products: any[] = [];

  constructor(private selectionService: SelectionService) {}
  ngOnInit() {
    this.products = this.selectionService.getProducts();
  }
}
