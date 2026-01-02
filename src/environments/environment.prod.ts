import { Environment } from './environment.model';

export const environment: Environment = {
  production: true,
  apiUrl: 'https://dictionaryappbackend-production.up.railway.app/api',

  analytics: {
    // POST {apiUrl}{pageViewIncrementPath}?pageName=...
    pageViewIncrementPath: '/page-view/increment'
  },

  // Google AdSense
  // Set `adsenseEnabled: true` and `adsenseClient: 'ca-pub-...'` to enable ads.
  adsenseEnabled: false,
  adsenseClient: ''
};
