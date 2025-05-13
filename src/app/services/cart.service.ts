import { Injectable, inject, NgZone, runInInjectionContext, Injector } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  deleteDoc,
  addDoc,
  getDocs
} from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { CartItem } from '../models/cart-item.model';
import { Dish } from '../models/dish.model';
import { AuthService } from './auth.service';
import { Order } from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  private ngZone = inject(NgZone);
  private injector = inject(Injector);

  private cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
  private userId: string | null = null;

  constructor() {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.userId = user.uid;
        this.loadCartFromFirestore();
      } else {
        this.userId = null;
        this.cartItemsSubject.next([]);
      }
    });
  }

  getCartItems(): Observable<CartItem[]> {
    return this.cartItemsSubject.asObservable();
  }

  private loadCartFromFirestore(): void {
    if (!this.userId) return;

    runInInjectionContext(this.injector, async () => {
      const cartRef = collection(this.firestore, `users/${this.userId}/cart`);
      const snapshot = await getDocs(cartRef);
      const items: CartItem[] = snapshot.docs.map(doc => doc.data() as CartItem);
      this.ngZone.run(() => this.cartItemsSubject.next(items));
    });
  }

  private saveCartToFirestore(): void {
    if (!this.userId) return;

    runInInjectionContext(this.injector, async () => {
      const cartRef = collection(this.firestore, `users/${this.userId}/cart`);

      // Delete previous cart items
      const existingDocs = await getDocs(cartRef);
      await Promise.all(
        existingDocs.docs.map(docSnap =>
          deleteDoc(doc(this.firestore, `users/${this.userId}/cart/${docSnap.id}`))
        )
      );

      // Add current cart items
      const cartItems = this.cartItemsSubject.value;
      for (const item of cartItems) {
        await addDoc(cartRef, item);
      }
    });
  }

  addToCart(dish: Dish): void {
    runInInjectionContext(this.injector, async () => {
      const currentItems = [...this.cartItemsSubject.value];
      const existingItem = currentItems.find(item => item.dish.id === dish.id);

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        currentItems.push({ dish, quantity: 1 });
      }

      this.ngZone.run(() => this.cartItemsSubject.next(currentItems));
      await this.saveCartToFirestore();
    });
  }

  removeFromCart(dishId: string): void {
    runInInjectionContext(this.injector, async () => {
      const updatedItems = this.cartItemsSubject.value.filter(item => item.dish.id !== dishId);
      this.ngZone.run(() => this.cartItemsSubject.next(updatedItems));
      await this.saveCartToFirestore();
    });
  }

  increaseQuantity(dishId: string): void {
    runInInjectionContext(this.injector, async () => {
      const items = [...this.cartItemsSubject.value];
      const item = items.find(i => i.dish.id === dishId);
      if (item) {
        item.quantity += 1;
        this.ngZone.run(() => this.cartItemsSubject.next(items));
        await this.saveCartToFirestore();
      }
    });
  }

  decreaseQuantity(dishId: string): void {
    runInInjectionContext(this.injector, async () => {
      const items = [...this.cartItemsSubject.value];
      const item = items.find(i => i.dish.id === dishId);
      if (item) {
        item.quantity = Math.max(1, item.quantity - 1);
        this.ngZone.run(() => this.cartItemsSubject.next(items));
        await this.saveCartToFirestore();
      }
    });
  }

  checkout(address?: string, phone?: string): void {
    if (!this.userId) return;

    runInInjectionContext(this.injector, async () => {
      const items = this.cartItemsSubject.value;
      const total = items.reduce((sum, item) => sum + item.dish.price * item.quantity, 0);

      const order: Order = {
        userId: this.userId!,
        items,
        total,
        status: 'pending',
        createdAt: new Date(),
        address,
        phone
      };

      const ordersRef = collection(this.firestore, 'orders');
      await addDoc(ordersRef, order);

      this.ngZone.run(() => this.cartItemsSubject.next([]));
      await this.saveCartToFirestore();
    });
  }
}
