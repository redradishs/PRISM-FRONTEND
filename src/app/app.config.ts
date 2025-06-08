import {
  ApplicationConfig,
  importProvidersFrom,
  provideZoneChangeDetection,
  isDevMode
} from '@angular/core';
import { provideRouter, withPreloading, PreloadAllModules, withEnabledBlockingInitialNavigation } from '@angular/router';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { routes } from './app.routes';

// Firebase imports
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth, connectAuthEmulator } from '@angular/fire/auth';
import { environment } from '../environments/environment';

// Interceptor import for decrypt and authorization
import { DecryptionInterceptor } from './interceptors/decryption.interceptor';
import { AuthInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({
      eventCoalescing: true,
      runCoalescing: true
    }),
    provideRouter(
      routes,
      withPreloading(PreloadAllModules),
      withEnabledBlockingInitialNavigation()
    ),
    importProvidersFrom(HttpClientModule),
    provideCharts(withDefaultRegisterables()),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWithDelay:2000'
    }),

    // HTTP Interceptor for automatic decryption
    {
      provide: HTTP_INTERCEPTORS,
      useClass: DecryptionInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },

    // Firebase providers
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => {
      const auth = getAuth();
      if (isDevMode()) {
        // Optional: Connect to auth emulator in development
        // connectAuthEmulator(auth, 'http://localhost:9099');
      }
      return auth;
    })
  ]
};
