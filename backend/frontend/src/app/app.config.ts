import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';

import { routes } from './app.routes';
import { DtoTransformationInterceptor } from './interceptors/dto-transformation.interceptor';

/**
 * ✅ Angular 20 Application Configuration
 * Properly configured with Zone.js change detection
 */
export const appConfig: ApplicationConfig = {
  providers: [
    // ✅ CRITICAL: Enable Zone.js change detection for Angular 20
    // This tells Angular to use Zone.js for automatic change detection
    provideZoneChangeDetection({ 
      eventCoalescing: true,           // ✅ Improves performance by batching events
      runCoalescing: true              // ✅ Reduces unnecessary change detection cycles
    }),
    
    // ✅ Standard Angular providers
    provideRouter(routes),
    provideClientHydration(),
    provideHttpClient(withInterceptorsFromDi()),
    
    // ✅ Custom interceptors
    {
      provide: HTTP_INTERCEPTORS,
      useClass: DtoTransformationInterceptor,
      multi: true
    }
  ]
};
