import { Injectable, inject, Injector } from '@angular/core';
import {
  Firestore,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  addDoc,
  serverTimestamp,
  updateDoc,
  collectionData,
  DocumentData,
 
} from '@angular/fire/firestore';
import { Observable, from, switchMap, take } from 'rxjs';
import { Order } from '../models/order.model';
import { AuthService } from './auth.service';
import { CartItem } from '../models/cart-item.model';
import { runInInjectionContext } from '@angular/core';
@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private injector = inject(Injector);

  constructor(
    private firestore: Firestore,
    private authService: AuthService
  ) {}

  getOrdersByUser(userId: string): Observable<Order[]> {
    return runInInjectionContext(this.injector, () => {
      const orderQuery = query(
        collection(this.firestore, 'orders'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      return collectionData(orderQuery, { idField: 'id' }) as Observable<Order[]>;
    });
  }

  getAllOrders(): Observable<Order[]> {
    return runInInjectionContext(this.injector, () => {
      const orderQuery = query(
        collection(this.firestore, 'orders'),
        orderBy('createdAt', 'desc')
      );
      return collectionData(orderQuery, { idField: 'id' }) as Observable<Order[]>;
    });
  }

  getOrderById(id: string): Observable<Order> {
    return runInInjectionContext(this.injector, () => {
      const docRef = doc(this.firestore, `orders/${id}`);
      return from(getDoc(docRef)).pipe(
        switchMap(snapshot => {
          const data = snapshot.data();
          if (!data) throw new Error('Order not found');
          return from([{ id, ...data } as Order]);
        })
      );
    });
  }

  placeOrder(address: string, phone: string): Observable<any> {
    const user = this.authService.currentUser;
    if (!user) throw new Error('User must be logged in to place an order');

    return runInInjectionContext(this.injector, () => {
      const cartDocRef = doc(this.firestore, `carts/${user.uid}`);

      return from(getDoc(cartDocRef)).pipe(
        take(1),
        switchMap(snap => {
          const items: CartItem[] = snap.exists() ? snap.data()['items'] || [] : [];
          const total = items.reduce(
            (sum, item) => sum + item.dish.price * (item.quantity || 1),
            0
          );

          const order: Order = {
            userId: user.uid,
            items,
            total,
            status: 'pending',
            createdAt: new Date(),
            address,
            phone,
          };

          return from(
            addDoc(collection(this.firestore, 'orders'), {
              ...order,
              createdAt: serverTimestamp(),
            })
          ).pipe(
            switchMap(() =>
              from(updateDoc(cartDocRef, { items: [] })) // Clear cart
            )
          );
        })
      );
    });
  }

  updateOrderStatus(
    orderId: string,
    status: 'pending' | 'processing' | 'completed' | 'cancelled'
  ): Observable<void> {
    return runInInjectionContext(this.injector, () => {
      const orderRef = doc(this.firestore, `orders/${orderId}`);
      return from(updateDoc(orderRef, { status }));
    });
  }
}
