import { useRequest } from '#utils/restRequest';
import { useMemo, useEffect } from 'react';

const cache = new Map<string, { data: IfrcEvent; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

interface LessonSource {
    PAN: string;
}

interface Lesson {
    title: string;
    insight: string;
    sources: LessonSource[] | string[];
}

interface StructuredSummary {
    lessons?: Lesson[];
    fallback_note?: string;
}

interface IfrcEvent {
    ai_structured_summary: Lesson[] | StructuredSummary | string | null;
    fallback_note?: string;
}

export default function useIfrcEvents(
    countryId?: number,
    disasterTypeId?: number,
) {
    const skip = !(countryId && disasterTypeId);
    const cacheKey = `ifrc-events-${countryId}-${disasterTypeId}`;

    // Debug: log parameters & cacheKey
    useEffect(() => {
        console.log('[useIfrcEvents] Params:', { countryId, disasterTypeId });
        console.log('[useIfrcEvents] cacheKey:', cacheKey);
    }, [countryId, disasterTypeId, cacheKey]);

    // Check cache
    const cachedData = useMemo(() => {
        if (skip) return null;

        const cached = cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            console.log('[useIfrcEvents] Returning cached data for:', cacheKey);
            return cached.data;
        }
        return null;
    }, [cacheKey, skip]);

    const { response, pending, error, refetch } = useRequest<IfrcEvent>({
        skip: skip || !!cachedData,
        url: '/api/v2/ifrc-events/',
        query: skip
            ? undefined
            : {
                  country: countryId,
                  disaster_type: disasterTypeId,
              },
        onSuccess: (data) => {
            if (data && !skip) {
                console.log('[useIfrcEvents] Caching response for:', cacheKey);
                cache.set(cacheKey, { data, timestamp: Date.now() });
            }
        },
    });

    return {
        response: cachedData || response,
        pending: !cachedData && pending,
        error: !cachedData ? error : undefined,
        refetch: () => {
            console.log('[useIfrcEvents] Manual refetch called, clearing cache:', cacheKey);
            cache.delete(cacheKey);
            return refetch();
        },
    };
}
