import { useOutletContext } from 'react-router-dom';

import usePerDrefSummary from '#hooks/domain/usePerDrefSummary';
import { type EmergencyOutletContext } from '#utils/outletContext';

import OperationalStrategy from './OperationalStrategy';

/** @knipignore */
// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const { emergencyResponse } = useOutletContext<EmergencyOutletContext>();

    // Use EVENT ID, not DREF ID - the API documentation shows it needs event ID
    const eventId = emergencyResponse?.id;

    // Fetch DREF summary data using event ID
    const {
        response: perDrefSummary,
        pending: perDrefSummaryPending,
        error: perDrefSummaryError,
    } = usePerDrefSummary(eventId);

    return (
        <OperationalStrategy
            perDrefSummary={perDrefSummary}
            perDrefSummaryPending={perDrefSummaryPending}
            perDrefSummaryError={perDrefSummaryError}
        />
    );
}

Component.displayName = 'EmergencyOperationalStrategy';
