import { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Container } from '@ifrc-go/ui';
import {
    compareDate,
    isDefined,
    isNotDefined,
    listToGroupList,
    listToMap,
} from '@togglecorp/fujs';

import useDisasterType from '#hooks/domain/useDisasterType';
import useGlobalEnums from '#hooks/domain/useGlobalEnums';
import useIfrcEvents from '#hooks/domain/useIfrcEvents';
import usePerDrefSituationalOverview from '#hooks/domain/usePerDrefSituationalOverview';
import useRapidResponse from '#hooks/domain/useRapidResponse'; // <-- added import here
import { type EmergencyOutletContext } from '#utils/outletContext';

import Contacts from './Contacts';
import EmergencyMap from './EmergencyMap';
import FieldReportStats from './FieldReportStats';
import KeyFigures from './KeyFigures';
import Overview from './Overview';
import PreviousCrises from './PreviousCrises';
import SituationalOverview from './SituationalOverview';
import RapidResponse from './RapidResponse';

import styles from './styles.module.css';

type EventItem = GoApiResponse<'/api/v2/event/{id}'>;
type FieldReport = EventItem['field_reports'][number];

function getFieldReport(
    reports: FieldReport[],
    compareFunction: (
        a?: string,
        b?: string,
        direction?: number
    ) => number,
    direction?: number,
): FieldReport | undefined {
    if (reports.length === 0) {
        return undefined;
    }
    return reports.reduce((
        selectedReport: FieldReport | undefined,
        currentReport: FieldReport | undefined,
    ) => {
        if (isNotDefined(selectedReport)
            || compareFunction(
                currentReport?.updated_at,
                selectedReport.updated_at,
                direction,
            ) > 0) {
            return currentReport;
        }
        return selectedReport;
    }, undefined);
}

/** @knipignore */
// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const disasterTypes = useDisasterType();
    const { emergencyResponse } = useOutletContext<EmergencyOutletContext>();
    const { api_visibility_choices } = useGlobalEnums();

    // Find disasterType object from emergencyResponse dtype
    const disasterType = disasterTypes?.find(
        (typeOfDisaster) => typeOfDisaster.id === emergencyResponse?.dtype,
    );

    // Extract countryId from emergencyResponse (assuming first country)
    const countryId = emergencyResponse?.countries?.[0]?.id;

    // Disaster type ID from found disasterType
    const disasterTypeId = disasterType?.id;

    // Debug logs for verification
    console.log('[EmergencyDetails] countryId:', countryId);
    console.log('[EmergencyDetails] disasterTypeId:', disasterTypeId);

    // Call the new situational overview hook with emergency response ID
    const {
        response: situationalOverviewResponse,
        pending: situationalOverviewPending,
        error: situationalOverviewError,
    } = usePerDrefSituationalOverview(emergencyResponse?.id);

    // Use dynamic params instead of hardcoded values
    const {
        response: ifrcEvents,
        pending: ifrcEventsPending,
        error: ifrcEventsError,
    } = useIfrcEvents(countryId, disasterTypeId);

    // Call the rapid response hook with the same parameters
    const {
        response: rapidResponseData,
        pending: rapidResponsePending,
        error: rapidResponseError,
    } = useRapidResponse({
        country: countryId,
        disaster_type: disasterTypeId,
    });

    const visibilityMap = useMemo(
        () => listToMap(
            api_visibility_choices,
            ({ key }) => key,
            ({ value }) => value,
        ),
        [api_visibility_choices],
    );

    const hasKeyFigures = isDefined(emergencyResponse)
        && emergencyResponse.key_figures.length !== 0;

    const mdrCode = isDefined(emergencyResponse)
        && isDefined(emergencyResponse?.appeals)
        && emergencyResponse.appeals.length > 0
        ? emergencyResponse?.appeals[0].code : undefined;

    const hasFieldReports = isDefined(emergencyResponse)
        && isDefined(emergencyResponse?.field_reports)
        && emergencyResponse?.field_reports.length > 0;

    const firstFieldReport = hasFieldReports
        ? getFieldReport(emergencyResponse.field_reports, compareDate, -1) : undefined;
    const assistanceIsRequestedByNS = firstFieldReport?.ns_request_assistance;
    const assistanceIsRequestedByCountry = firstFieldReport?.request_assistance;
    const latestFieldReport = hasFieldReports
        ? getFieldReport(emergencyResponse.field_reports, compareDate) : undefined;

    const emergencyContacts = emergencyResponse?.contacts;

    const groupedContacts = useMemo(
        () => {
            type Contact = Omit<NonNullable<typeof emergencyContacts>[number], 'event'>;
            let contactsToProcess: Contact[] | undefined = emergencyContacts;
            if (!contactsToProcess || contactsToProcess.length <= 0) {
                contactsToProcess = latestFieldReport?.contacts;
            }
            const grouped = listToGroupList(
                contactsToProcess?.map(
                    (contact) => {
                        if (isNotDefined(contact)) {
                            return undefined;
                        }
                        const { ctype } = contact;
                        if (isNotDefined(ctype)) {
                            return undefined;
                        }
                        return {
                            ...contact,
                            ctype,
                        };
                    },
                ).filter(isDefined) ?? [],
                (contact) => (
                    contact.email.endsWith('ifrc.org')
                        ? 'IFRC'
                        : 'National Societies'
                ),
            );
            return grouped;
        },
        [emergencyContacts, latestFieldReport],
    );

    return (
        <div className={styles.emergencyDetails}>
            {hasKeyFigures && (
                <KeyFigures keyFigures={emergencyResponse.key_figures} />
            )}

            {isDefined(emergencyResponse) && (
                <Overview
                    emergencyResponse={emergencyResponse}
                    disasterType={disasterType}
                    visibilityMap={visibilityMap}
                    mdrCode={mdrCode}
                    assistanceIsRequestedByNS={assistanceIsRequestedByNS}
                    assistanceIsRequestedByCountry={assistanceIsRequestedByCountry}
                />
            )}

            <SituationalOverview
                situationalOverviewResponse={situationalOverviewResponse}
                pending={situationalOverviewPending}
                error={situationalOverviewError}
            />

            <PreviousCrises
                ifrcEvents={ifrcEvents}
                ifrcEventsPending={ifrcEventsPending}
                ifrcEventsError={ifrcEventsError}
            />

            <RapidResponse
                rapidResponseData={rapidResponseData}
                rapidResponsePending={rapidResponsePending}
                rapidResponseError={rapidResponseError}
            />

            <div className={styles.mapKeyFigureContainer}>
                {emergencyResponse && !emergencyResponse.hide_field_report_map && (
                    <Container
                        className={styles.mapContainer}
                        heading="Emergency Map"
                        withHeaderBorder
                    >
                        <EmergencyMap event={emergencyResponse} />
                    </Container>
                )}

                {hasFieldReports
                    && isDefined(latestFieldReport)
                    && !emergencyResponse.hide_attached_field_reports && (
                    <Container
                        className={styles.fieldReportStatsContainer}
                        heading="Field Report Statistics"
                        withHeaderBorder
                    >
                        <FieldReportStats
                            report={latestFieldReport}
                            disasterType={emergencyResponse.dtype}
                        />
                    </Container>
                )}
            </div>

            {isDefined(groupedContacts) && Object.keys(groupedContacts).length > 0 && (
                <Contacts groupedContacts={groupedContacts} />
            )}
        </div>
    );
}

Component.displayName = 'EmergencyDetails';