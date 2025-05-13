import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  updateDoc,
  query,
  where,
  collectionData
} from '@angular/fire/firestore';
import { Dish } from '../models/dish.model';
import { Observable, from, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DishService {
  private firestore = inject(Firestore);

  constructor() {}

  // Real-time observable
  getAllDishes(): Observable<Dish[]> {
    const dishCollection = collection(this.firestore, 'dishes');
    return collectionData(dishCollection, { idField: 'id' }) as Observable<Dish[]>;
  }

  getDishById(id: string): Observable<Dish | null> {
    const dishDocRef = doc(this.firestore, `dishes/${id}`);
    return from(getDoc(dishDocRef)).pipe(
      map(snapshot =>
        snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Dish) : null
      )
    );
  }

  addDish(dish: Dish): Observable<void> {
    const dishDocRef = doc(this.firestore, `dishes/${dish.id}`);
    return from(setDoc(dishDocRef, dish));
  }

  updateDish(dish: Dish): Observable<void> {
    const dishDocRef = doc(this.firestore, `dishes/${dish.id}`);
    return from(updateDoc(dishDocRef, { ...dish }));
  }

  deleteDish(id: string): Observable<void> {
    const dishDocRef = doc(this.firestore, `dishes/${id}`);
    return from(deleteDoc(dishDocRef));
  }

  getDishesByCategory(category: string): Observable<Dish[]> {
    const dishCollection = collection(this.firestore, 'dishes');
    const q = query(dishCollection, where('category', '==', category));
    return collectionData(q, { idField: 'id' }) as Observable<Dish[]>;
  }

  getFeaturedDishes(): Observable<Dish[]> {
    const dishCollection = collection(this.firestore, 'dishes');
    const q = query(dishCollection, where('featured', '==', true));
    return collectionData(q, { idField: 'id' }) as Observable<Dish[]>;
  }
}
