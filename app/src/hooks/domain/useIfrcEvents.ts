import { useMemo } from 'react';

import { useRequest } from '#utils/restRequest';

const cache = new Map<string, { data: IfrcEvent; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

interface OperationalLearningSource {
  id: number;
  code: string;
  name: string;
  event_id: number;
}

interface LessonMetadata {
  eventID?: number[];
  operational_learning_source?: OperationalLearningSource[];
}

interface Lesson {
  title: string;
  insight: string;
  recommendations?: string[];
  source_note?: string;
  area?: string;
  rr_questions?: string[];
  metadata?: LessonMetadata;
}

export interface IfrcEvent {
  ai_structured_summary: Lesson[];
  fallback_note?: string;
}

export default function useIfrcEvents(
    countryId?: number,
    disasterTypeId?: number,
) {
    const skip = !(countryId && disasterTypeId);
    const cacheKey = `ifrc-events-${countryId}-${disasterTypeId}`;

    // Check cache
    const cachedData = useMemo(() => {
        if (skip) return null;
        const cached = cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.data;
        }
        return null;
    }, [cacheKey, skip]);

    const {
        response, pending, error, refetch,
    } = useRequest<IfrcEvent>({
        skip: skip || !!cachedData,
        // v2 endpoint with the same query params
        url: '/api/v2/ifrc-events/',
        query: skip
            ? undefined
            : {
                country: countryId,
                disaster_type: disasterTypeId,
            },
        onSuccess: (data) => {
            if (data && !skip) {
                cache.set(cacheKey, {
                    data,
                    timestamp: Date.now(),
                });
            }
        },
    });

    return {
        response: cachedData || response,
        pending: !cachedData && pending,
        error: !cachedData ? error : undefined,
        refetch: () => {
            cache.delete(cacheKey);
            return refetch();
        },
    };
}
