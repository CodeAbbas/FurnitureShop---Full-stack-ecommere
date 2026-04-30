import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Product } from '../models/product.model';


export interface ProductQueryParams {
    pn?: number;
    ps?: number;
    category?: string;
}


export interface ProductUpdatePayload {
    title?: string;
    category?: string;
    price?: number;
    inStock?: number;
    description?: string;
}

@Injectable()
export class ProductService {

    apiBaseUrl: string = 'http://127.0.0.1:5000/api/v1.0';
    pageSize: number = 12;

    constructor(private http: HttpClient) { }

    getProducts(params: ProductQueryParams = {}): Observable<Product[]> {
        let httpParams = new HttpParams();

        const pn = params.pn ?? 1;
        const ps = params.ps ?? this.pageSize;

        httpParams = httpParams.set('pn', pn.toString());
        httpParams = httpParams.set('ps', ps.toString());

        if (params.category) {
            httpParams = httpParams.set('category', params.category);
        }

        return this.http.get<Product[]>(
            this.apiBaseUrl + '/products',
            { params: httpParams }
        ).pipe(catchError(this.handleError));
    }

    getProduct(id: string): Observable<Product> {
        return this.http.get<Product>(
            this.apiBaseUrl + '/products/' + id
        ).pipe(catchError(this.handleError));
    }


    searchProducts(query: string): Observable<Product[]> {
        const httpParams = new HttpParams().set('q', query);

        return this.http.get<Product[]>(
            this.apiBaseUrl + '/guest/search',
            { params: httpParams }
        ).pipe(catchError(this.handleError));
    }


    addProduct(product: Partial<Product>): Observable<any> {
        const postData = new FormData();
        postData.append('title', product.title ?? '');
        postData.append('category', product.category ?? '');
        postData.append('subcategory', product.subcategory ?? '');
        postData.append('price', String(product.price ?? 0));
        postData.append('oldPrice', String(product.oldPrice ?? 0));
        postData.append('inStock', String(product.inStock ?? 0));
        postData.append('topSelling', String(product.topSelling ?? false));
        postData.append('newArrival', String(product.newArrival ?? false));
        postData.append('description', product.description ?? '');
        postData.append('specification', product.specification ?? '');

        return this.http.post<any>(
            this.apiBaseUrl + '/admin/products',
            postData
        ).pipe(catchError(this.handleError));
    }

    updateProduct(id: string, updates: ProductUpdatePayload): Observable<any> {
        const putData = new FormData();

        if (updates.title !== undefined) {
            putData.append('title', updates.title);
        }
        if (updates.category !== undefined) {
            putData.append('category', updates.category);
        }
        if (updates.price !== undefined) {
            putData.append('price', String(updates.price));
        }
        if (updates.inStock !== undefined) {
            putData.append('inStock', String(updates.inStock));
        }
        if (updates.description !== undefined) {
            putData.append('description', updates.description);
        }

        return this.http.put<any>(
            this.apiBaseUrl + '/admin/products/' + id,
            putData
        ).pipe(catchError(this.handleError));
    }


    deleteProduct(id: string): Observable<any> {
        return this.http.delete<any>(
            this.apiBaseUrl + '/admin/products/' + id
        ).pipe(catchError(this.handleError));
    }


    private handleError(error: HttpErrorResponse) {
        let message = 'An unknown error occurred while contacting the server.';

        if (error.error instanceof ErrorEvent) {
            message = 'Network error: ' + error.error.message;
        } else if (error.status === 0) {
            message = 'Cannot reach the SelectionDB API. Is the Flask server running on port 5000?';
        } else if (error.status === 400) {
            message = error.error?.error ?? 'Bad request — please check the data you submitted.';
        } else if (error.status === 401) {
            message = 'You must be logged in to perform this action.';
        } else if (error.status === 403) {
            message = 'Forbidden — admin privileges are required for this action.';
        } else if (error.status === 404) {
            message = error.error?.error ?? 'The requested product could not be found.';
        } else if (error.status >= 500) {
            message = 'The server encountered an internal error. Please try again later.';
        }

        console.error('[ProductService] HTTP error:', error);
        return throwError(() => new Error(message));
    }
}