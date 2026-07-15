export const workCacheKey = (id: string) => `work:${id}`;

export const serieCacheKey = (id: string) => `serie:${id}`;

export const authorCacheKey = (id: string) => `author:${id}`;

export const illustratorCacheKey = (id: string) => `illustrator:${id}`;

export const franchiseCacheKey = (id: string) => `franchise:${id}`;

export const DASHBOARD_STATS_KEY = 'dashboard:statistics';

export const cacheKeyById: Partial<Record<string, (id: string) => string>> = {
  Work: workCacheKey,
  Serie: serieCacheKey,
  Franchise: franchiseCacheKey,
  Author: authorCacheKey,
  Illustrator: illustratorCacheKey,
};

export const cacheKey: Record<string, string> = {
  Work: 'work:',
  Serie: 'serie:',
  Franchise: 'franchise:',
  Author: 'author:',
  Illustrator: 'illustrator:',
};
