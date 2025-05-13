import { Injectable, inject, Injector, NgZone, runInInjectionContext } from "@angular/core";
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  authState,
  User as FirebaseUser,
} from "@angular/fire/auth";
import {
  Firestore,
  doc,
  setDoc,
  getDoc,
  DocumentData,
} from "@angular/fire/firestore";
import { BehaviorSubject, Observable, from, of } from "rxjs";
import { switchMap, map, catchError } from "rxjs/operators";
import { User } from "../models/user.model";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private readonly injector = inject(Injector);
  private readonly ngZone = inject(NgZone);

  private currentUserSubject = new BehaviorSubject<User | null | undefined>(undefined);
  public currentUser$ = this.currentUserSubject.asObservable();
  public isLoggedIn$ = this.currentUser$.pipe(map(user => !!user));
  public isAdmin$ = this.currentUser$.pipe(map(user => !!user?.isAdmin));

  constructor(
    private auth: Auth,
    private firestore: Firestore
  ) {
    this.initAuthStateListener();
  }

  private initAuthStateListener(): void {
    this.ngZone.run(() => {
      authState(this.auth)
        .pipe(
          switchMap((firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
              return this.getUserData(firebaseUser.uid).pipe(
                map(userData => ({
                  uid: firebaseUser.uid,
                  email: firebaseUser.email || '',
                  displayName: firebaseUser.displayName || '',
                  isAdmin: userData?.['role'] === 'admin' ||
                    firebaseUser.email === environment.adminEmail,
                  role: userData?.['role'] || 'user',
                  createdAt: userData?.['createdAt']
                })),
                catchError(error => {
                  console.error('Error fetching user data:', error);
                  return of(null);
                })
              );
            }
            return of(null);
          }),
          catchError(error => {
            console.error('Auth state observable error:', error);
            return of(null);
          })
        )
        .subscribe(user => this.currentUserSubject.next(user));
    });
  }

  getUserData(uid: string): Observable<DocumentData | null> {
    return runInInjectionContext(this.injector, () => {
      const userDocRef = doc(this.firestore, `users/${uid}`);
      return from(getDoc(userDocRef)).pipe(
        map(docSnap => docSnap.exists() ? docSnap.data() : null),
        catchError(error => {
          console.error("getUserData error:", error);
          return of(null);
        })
      );
    });
  }

  login(email: string, password: string): Observable<User> {
    return runInInjectionContext(this.injector, () => {
      return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
        switchMap(userCredential => {
          return this.getUserData(userCredential.user.uid).pipe(
            map(userData => ({
              uid: userCredential.user.uid,
              email: userCredential.user.email || '',
              displayName: userCredential.user.displayName || '',
              isAdmin: userData?.['role'] === 'admin' ||
                userCredential.user.email === environment.adminEmail,
              role: userData?.['role'] || 'user',
              createdAt: userData?.['createdAt']
            }))
          );
        }),
        catchError(error => {
          console.error("Login error:", error);
          throw error;
        })
      );
    });
  }

  register(email: string, password: string, role: 'user' | 'admin' = 'user'): Observable<User> {
    return runInInjectionContext(this.injector, () => {
      return from(createUserWithEmailAndPassword(this.auth, email, password)).pipe(
        switchMap(userCredential => {
          const user = userCredential.user;
          const isAdmin = role === 'admin' || user.email === environment.adminEmail;
          const userData = {
            email: user.email,
            role: role,
            isAdmin: isAdmin,
            createdAt: new Date()
          };

          const userDocRef = doc(this.firestore, `users/${user.uid}`);
          return from(setDoc(userDocRef, userData)).pipe(
            map(() => ({
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || '',
              role: role,
              isAdmin: isAdmin,
              createdAt: userData.createdAt
            }))
          );
        }),
        catchError(error => {
          console.error("Registration error:", error);
          throw error;
        })
      );
    });
  }

  logout(): Observable<void> {
    return runInInjectionContext(this.injector, () => {
      return from(signOut(this.auth)).pipe(
        catchError(error => {
          console.error("Logout error:", error);
          throw error;
        })
      );
    });
  }

  updateUserRole(uid: string, role: 'user' | 'admin'): Observable<void> {
    return runInInjectionContext(this.injector, () => {
      const userDocRef = doc(this.firestore, `users/${uid}`);
      return from(setDoc(userDocRef, {
        role,
        isAdmin: role === 'admin'
      }, { merge: true })).pipe(
        catchError(error => {
          console.error("Update role error:", error);
          throw error;
        })
      );
    });
  }

  get currentUser(): User | null | undefined {
    return this.currentUserSubject.value;
  }
}
