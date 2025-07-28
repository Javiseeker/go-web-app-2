/* ------------------------------------------------------------------
   hook: usePerDrefSituationalOverview
   Fetch PER-DREF situational overview for emergency response details
------------------------------------------------------------------- */

import { useRequest } from '#utils/restRequest';

interface PerDrefSituationalOverviewResponse {
    situational_overview: string;
    metadata: {
        event_id: number;
        event_name: string;
        disaster_type: string;
        country: string;
        latest_update_number: number;
        total_operational_updates: number;
        dref_id: number;
        dref_title: string;
        dref_date: string;
    };
}

/**
 * Usage:
 *   const { response, pending, error, refetch } = usePerDrefSituationalOverview(eventId);
 *
 * Note: Always fetches data for ID 6955 regardless of the eventId parameter
 */
export default function usePerDrefSituationalOverview(eventId?: number) {
    return useRequest<PerDrefSituationalOverviewResponse>({
        skip: !eventId, // Still skip if no eventId is provided
        url: '/api/v2/per-dref-situational-overview/',
        query: { id: 6955 }, // Always use hardcoded ID 6955
    });
}