/* ------------------------------------------------------------------
   hook: useIfrcEvents
   Fetch IFRC "previous crises / learning" data for a country & dtype
------------------------------------------------------------------- */

import { useCallback } from 'react';

export interface LessonSource {
    PAN: string;
}

export interface Lesson {
    title: string;
    insight: string;
    sources: LessonSource[];
}

export interface StructuredSummary {
    lessons?: Lesson[];
    fallback_note?: string;
}

export interface IfrcEvent {
    ai_structured_summary: StructuredSummary | string | null;
}

/**
 * Usage:
 *   const { response, pending, error, refetch } = useIfrcEvents(countryId, dtypeId);
 */
export default function useIfrcEvents(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    countryId?: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    disasterTypeId?: number,
) {
    // MOCK DATA FOR TESTING - Remove when API is ready
    const mockResponse: IfrcEvent = {
        ai_structured_summary: {
            lessons: [
                {
                    title: 'Not enough staff to support logistics',
                    insight:
                      'One learning from a previous similar operation is the following ipsum dolor sit amet, consectetur adipiscing elit. Integer sodales sit amet quam non fermentum. Ut finibus fermentum ultrices. Nunc ut elit sollicitudin, malesuada libero non, lobortis nisl. Sed ac elit in augue interdum porta sed nec metus.',
                    sources: [
                        { PAN: 'Philippines: Typhoon 05-2023' },
                    ],
                },
                {
                    title: 'Cyclone Alerts Enhance Safety',
                    insight:
                      'Issuing timely alerts for cyclonic activity, such as during Tropical Depression #13 and Cyclone Beryl, helped prepare communities for potential flooding, landslides, and storm surges, reducing risks to life and infrastructure.',
                    sources: [
                        { PAN: 'Provincial Flood/Flood - 2022-10' },
                        { PAN: 'Cyclone - 07-2024' },
                    ],
                },
                {
                    title: 'Effective Water Crisis Response',
                    insight:
                      'During the 2025 water contamination crisis in Herrera and Los Santos, emergency measures like distributing bottled water and monitoring water quality helped mitigate impacts on over 22,500 people.',
                    sources: [
                        { PAN: 'Biological Emergency - 06-2025' },
                    ],
                },
            ],
            fallback_note: 'Only 1 disaster-type events found; added country-level results.',
        },
    };

    const response = mockResponse;
    const pending = false;
    const error = null;

    const refetch = useCallback(() => Promise.resolve(), []);

    return {
        response,
        pending,
        error,
        refetch,
    };

    // Uncomment and use real API call once ready:
    /*
    const skip = !(countryId && disasterTypeId);

    const {
        response,
        pending,
        error,
        trigger,
    } = useRequest<IfrcEvent>({
        skip,
        url: '/api/v2/ifrc-events/',
        query: skip ? undefined : {
            country: countryId,
            disaster_type: disasterTypeId,
        },
    });

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
    */
}
