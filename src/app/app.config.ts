import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideStorage, getStorage } from '@angular/fire/storage';

const firebaseConfig = {
  apiKey: "AIzaSyClupoVOea7FEOOPZDpuOUeSRoa6gXSAOc",
  authDomain: "restaurantease-f8c3a.firebaseapp.com",
  projectId: "restaurantease-f8c3a",
  storageBucket: "restaurantease-f8c3a.firebasestorage.app",
  messagingSenderId: "1073838957988",
  appId: "1:1073838957988:web:eb32188cd79820def34d31"
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage())
  ]
};
