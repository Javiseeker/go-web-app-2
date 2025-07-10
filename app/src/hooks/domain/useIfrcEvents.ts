/* ------------------------------------------------------------------
   hook: useIfrcEvents
   Fetch IFRC "previous crises / learning" data for a country & dtype
------------------------------------------------------------------- */

import { useCallback } from 'react';
import { useRequest } from '#utils/restRequest';

export interface IfrcEvent {
    ai_structured_summary: string | null;
    // add more fields when they appear in the schema
}

/**
 * Usage:
 *   const { response, pending, error, refetch } = useIfrcEvents(countryId, dtypeId);
 */
export default function useIfrcEvents(
    countryId?: number,
    disasterTypeId?: number,
) {
    const skip = !(countryId && disasterTypeId);

    const {
        response,
        pending,
        error,
        trigger,
    } = useRequest<IfrcEvent>({
        skip,
        url  : '/api/v2/ifrc-events/',
        query: skip ? undefined : {
            country       : countryId,
            disaster_type : disasterTypeId,
        },
    });

    // Create a refetch function that uses the trigger
    const refetch = useCallback(() => {
        if (!skip && trigger) {
            return trigger();
        }
        return Promise.resolve();
    }, [skip, trigger]);

    return {
        response,
        pending,
        error,
        refetch,
    };
}