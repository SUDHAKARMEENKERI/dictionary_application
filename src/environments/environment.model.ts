export type Environment = {
  production: boolean;
  apiUrl: string;
  analytics?: {
    /** Optional override base URL for analytics calls (e.g. dev proxy on :4200). */
    baseUrl?: string;
    /** Relative path under baseUrl/apiUrl. Example: '/page-view/increment' */
    pageViewIncrementPath?: string;
  };
  adsenseEnabled: boolean;
  adsenseClient: string;
  /** Default AdSense slot id to use for global placements. */
  adsenseSlot: string;
};
