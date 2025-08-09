import { useRequest } from '#utils/restRequest';
import { useMemo } from 'react';

// Cache object to store responses
const cache = new Map<string, { data: PerDrefSummary; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

interface Indicator {
    title: string;
    people_targeted: number;
}

interface FutureAction {
    indicators: Indicator[];
    budget: number;
    people_targeted_total: number | null;
    intervention_summary: string;
    _description: string;
}

interface Sector {
    title: string;
    title_display: string;
    actions_taken_summary?: string;
    needs_summary: string;
    future_actions: FutureAction[];
}

interface Metadata {
    dref_id: number;
    dref_title: string;
    dref_appeal_code: string;
    dref_date: string;
    dref_created_at: string;
    dref_budget_file: string;
    dref_op_update_number: number;
    dref_source?: string;
    event_id?: number;
    event_name?: string;
    field_reports_count?: number;
    status?: string;
    errors?: string[];
}

export interface PerDrefSummary {
    operational_summary: string;
    sectors: Sector[];
    dref_type: string;
    dref_onset: string;
    metadata?: Metadata;
}

/**
 * Usage:
 *   const { response, pending, error, refetch } = usePerDrefSummary(drefId);
 */
export default function usePerDrefSummary(drefId?: number) {
    const hardcodedId = 6955;
    const cacheKey = `dref-summary-${hardcodedId}`;

    const cachedData = useMemo(() => {
        const cached = cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.data;
        }
        return null;
    }, [cacheKey]);

    const { response, pending, error, refetch } = useRequest<PerDrefSummary>({
        skip: !!cachedData,
        url: '/api/v1/ucl/dref-summary/',
        query: { id: hardcodedId },
        onSuccess: (data) => {
            if (data) {
                cache.set(cacheKey, { data, timestamp: Date.now() });
            }
        },
    });

    return {
        response: cachedData || response,
        pending: !cachedData && pending,
        error: !cachedData ? error : undefined,
        refetch,
    };
}
