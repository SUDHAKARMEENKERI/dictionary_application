import { Environment } from './environment.model';

export const environment: Environment = {
  production: true,
  apiUrl: 'https://dictionaryappbackend-production.up.railway.app/api',

  analytics: {
    // POST {apiUrl}{pageViewIncrementPath}?pageName=...
    pageViewIncrementPath: '/page-view/increment'
  },

  // Google AdSense
  // Set `adsenseEnabled: true`, `adsenseClient: 'ca-pub-...'`, and `adsenseSlot: '...'` to enable ads.
  adsenseEnabled: true,
  adsenseClient: 'ca-pub-8186517750881163',
  adsenseSlot: ''
};
