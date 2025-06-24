/**
 * ✅ Angular 20 Main Bootstrap File
 * Properly configured with Zone.js for change detection
 */

// ✅ STEP 1: Import Zone.js BEFORE any Angular imports
// This is critical - Zone.js must be imported first to patch browser APIs
import 'zone.js';

// ✅ STEP 2: Import Angular core modules
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';

// ✅ STEP 3: Bootstrap the application with proper error handling
bootstrapApplication(App, appConfig)
  .catch(err => {
    console.error('❌ Angular Bootstrap Error:', err);
    
    // ✅ Additional debugging for Zone.js issues
    if (err.message?.includes('Zone') || err.message?.includes('NG0908')) {
      console.error('🔍 Zone.js Error Details:', {
        zoneExists: typeof Zone !== 'undefined',
        zoneVersion: typeof Zone !== 'undefined' ? Zone.root : 'Not available',
        nodeEnv: typeof process !== 'undefined' ? process.env : 'Browser environment'
      });
    }
  });
