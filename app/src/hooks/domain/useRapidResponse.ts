import { useRequest } from '#utils/restRequest';
import { useMemo } from 'react';

// Cache object to store responses
const cache = new Map<string, { data: RapidResponseData; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

export interface RapidResponseData {
    file_url: string;
}

interface RapidResponseParams {
    country?: number;
    disaster_type?: number;
}

/**
 * Usage:
 *   const { response, pending, error, refetch } = useRapidResponse({ country: 46, disaster_type: 2 });
 */
export default function useRapidResponse(params: RapidResponseParams) {
    const { country, disaster_type } = params;
    
    // Create cache key based on parameters
    const cacheKey = `rr-capacity-${country}-${disaster_type}`;
    
    // Check cache
    const cachedData = useMemo(() => {
        const cached = cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.data;
        }
        return null;
    }, [cacheKey]);

    const { response, pending, error, refetch } = useRequest<RapidResponseData>({
        skip: !!cachedData || !country || !disaster_type, // Skip if we have cached data or missing params
        url: '/api/v1/ucl/rapid-response-capacity-questions/',
        query: {
            country,
            disaster_type,
        },
        onSuccess: (data) => {
            // Cache the successful response
            if (data) {
                cache.set(cacheKey, { data, timestamp: Date.now() });
            }
        },
    });

    // Return cached data if available, otherwise return fresh response
    return {
        response: cachedData || response,
        pending: !cachedData && pending,
        error: !cachedData ? error : undefined,
        refetch,
    };
}