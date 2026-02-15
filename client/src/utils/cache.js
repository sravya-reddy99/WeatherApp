// Cache duration (30 minutes) and maximum number of cached items
export const CACHE_DURATION = 30 * 60 * 1000;
export const MAX_CACHE_ITEMS = 10;

// Retrieves cached data for a given key, returns null if expired or not found
export const getCachedData = (key) => {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_DURATION) {
        localStorage.removeItem(key);
        return null;
    }
    return data;
};

// Stores data in cache with timestamp, removes oldest item if cache is full
export const setCachedData = (key, data) => {
    const cacheItem = {
        data,
        timestamp: Date.now()
    };
    
    try {
        const cacheKeys = Object.keys(localStorage).filter(k => k.startsWith('weather_'));
        if (cacheKeys.length >= MAX_CACHE_ITEMS) {
            const oldest = cacheKeys.reduce((a, b) => {
                const aTime = JSON.parse(localStorage.getItem(a)).timestamp;
                const bTime = JSON.parse(localStorage.getItem(b)).timestamp;
                return aTime < bTime ? a : b;
            });
            localStorage.removeItem(oldest);
        }
        
        localStorage.setItem(key, JSON.stringify(cacheItem));
    } catch (error) {
        console.warn('Cache storage failed:', error);
        clearOldCache();
    }
};

// Removes all expired items from the cache
export const clearOldCache = () => {
    const now = Date.now();
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('weather_')) {
            const cached = JSON.parse(localStorage.getItem(key));
            if (now - cached.timestamp > CACHE_DURATION) {
                localStorage.removeItem(key);
            }
        }
    });
};