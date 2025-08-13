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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function usePerDrefSituationalOverview(_eventId?: number) {
    // ⚠️ ⚠️ ⚠️ CRITICAL: HARDCODED ID FOR TESTING ONLY - MUST BE CHANGED IN PRODUCTION ⚠️ ⚠️ ⚠️
    // TODO: Remove hardcoded ID and use dynamic eventId parameter in production
    // Currently hardcoded to 6955 for testing purposes - shows same data on all emergencies

    const hardcodedId = 6955; // ← THIS MUST BE CHANGED TO USE eventId PARAMETER IN PRODUCTION!

    return useRequest<PerDrefSituationalOverviewResponse>({
        skip: false, // Always fetch since we're using hardcoded ID
        url: '/api/v1/ucl/dref-situational-overview/',
        query: { id: hardcodedId }, // Use hardcoded ID instead of eventId
    });
}
