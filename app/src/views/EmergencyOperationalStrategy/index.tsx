import { useOutletContext } from 'react-router-dom';

import usePerDrefSummary from '#hooks/domain/usePerDrefSummary';
import { type EmergencyOutletContext } from '#utils/outletContext';

import OperationalStrategy from './OperationalStrategy';

/** @knipignore */
// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const { emergencyResponse } = useOutletContext<EmergencyOutletContext>();

    // Get DREF ID from emergency response
    const drefId = emergencyResponse?.appeals && emergencyResponse.appeals.length > 0
        ? emergencyResponse.appeals[0].id
        : null;

    // Fetch DREF summary data
    const {
        response: perDrefSummary,
        pending: perDrefSummaryPending,
        error: perDrefSummaryError,
    } = usePerDrefSummary(drefId);

    return (
        <OperationalStrategy
            perDrefSummary={perDrefSummary}
            perDrefSummaryPending={perDrefSummaryPending}
            perDrefSummaryError={perDrefSummaryError}
        />
    );
}

Component.displayName = 'EmergencyOperationalStrategy';
