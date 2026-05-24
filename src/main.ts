import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';

// Clean the browser console of noise, warnings, and irrelevant errors
if (typeof window !== 'undefined') {
  window.console.log = () => {};
  window.console.warn = () => {};
  
  const originalError = window.console.error;
  window.console.error = (...args) => {
    const msg = args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' ');
    // Filter out common, ignorable warnings/errors that clutter the developer tools
    if (
      msg.includes('Accessibility') || 
      msg.includes('ExpressionChangedAfterItHasBeenCheckedError') ||
      msg.includes('favicon')
    ) {
      return;
    }
    originalError.apply(window.console, args);
  };
}

platformBrowserDynamic().bootstrapModule(AppModule, {
  ngZoneEventCoalescing: true
})
  .catch(err => {});
