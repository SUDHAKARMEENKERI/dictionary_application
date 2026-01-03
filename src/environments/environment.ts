// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.

import { Environment } from './environment.model';

export const environment: Environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',

  analytics: {
    // Matches: http://localhost:8080/api/page-view/increment?pageName=HomePage
    baseUrl: 'http://localhost:8080/api',
    pageViewIncrementPath: '/page-view/increment'
  },

  // Google AdSense
  // Set `adsenseEnabled: true`, `adsenseClient: 'ca-pub-...'`, and `adsenseSlot: '...'` to enable ads.
  adsenseEnabled: false,
  adsenseClient: '',
  adsenseSlot: ''
};
