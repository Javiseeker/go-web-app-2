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
        dref_appeal_code: string; // Added appeal code
        dref_date: string;
    };
}

/**
 * Usage:
 *   const { response, pending, error, refetch } = usePerDrefSituationalOverview(eventId);
 */
export default function usePerDrefSituationalOverview(eventId?: number) {
    return useRequest<PerDrefSituationalOverviewResponse>({
        skip: !eventId, // Skip request if no eventId is provided
        url: '/api/v1/ucl/dref-situational-overview/',
        query: { id: eventId }, // Use provided eventId
    });
}
