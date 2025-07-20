/* ------------------------------------------------------------------
   hook: usePerDrefStatus
   Fetch PER-DREF status info for showing the
   "Imminent / Anticipatory" label on EmergencyDetails
------------------------------------------------------------------- */

import { useRequest } from '#utils/restRequest';

export interface PerDrefStatus {
    dref_id: number;
    dref_count: number;
    type_of_dref_display: string; // e.g. "Response"
    type_of_onset_display: string; // e.g. "Sudden"
}

/**
 * Usage:
 *   const { response, pending, error, refetch } = usePerDrefStatus(drefId);
 *
 * Note: Always fetches data for ID 6955 regardless of the drefId parameter
 */
export default function usePerDrefStatus(drefId?: number) {
    // Always use hardcoded ID 6955 for the actual API call
    return useRequest<PerDrefStatus>({
        skip: !drefId,
        url: '/api/v2/per-dref-status/',
        query: { id: 6955 },
    });
}
