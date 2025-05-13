import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { importProvidersFrom } from '@angular/core';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import {
  provideAuth,
  initializeAuth,
  browserLocalPersistence
} from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    importProvidersFrom(AppModule),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => initializeAuth(
      initializeApp(environment.firebase),
      {
        persistence: browserLocalPersistence
      }
    )),
    provideFirestore(() => getFirestore())
  ]
});
