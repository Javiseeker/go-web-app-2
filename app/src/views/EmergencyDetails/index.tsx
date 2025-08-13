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
import useRapidResponse from '#hooks/domain/useRapidResponse';
import { type EmergencyOutletContext } from '#utils/outletContext';

import Contacts from './Contacts';
import EmergencyMap from './EmergencyMap';
import FieldReportStats from './FieldReportStats';
import KeyFigures from './KeyFigures';
import Overview from './Overview';
import PreviousCrises from './PreviousCrises';
import RapidResponse from './RapidResponse';
import SituationalOverview from './SituationalOverview';

import styles from './styles.module.css';

/* ------------------------------------------------------------------ */
/* Types & helpers                                                     */
/* ------------------------------------------------------------------ */

type EventItem = GoApiResponse<'/api/v2/event/{id}'>;
type FieldReport = EventItem['field_reports'][number];
type Appeal = EventItem['appeals'][number];

function getFieldReport(
    reports: FieldReport[],
    compareFn: (a?: string, b?: string, direction?: number) => number,
    direction?: number,
): FieldReport | undefined {
    if (!reports.length) {
        return undefined;
    }
    return reports.reduce<FieldReport | undefined>((sel, cur) => {
        if (
            isNotDefined(sel)
            || compareFn(cur?.updated_at, sel.updated_at, direction) > 0
        ) {
            return cur;
        }
        return sel;
    }, undefined);
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

/** @knipignore */
// eslint-disable-next-line import/prefer-default-export
export function Component() {
    /* ---------------- base data ---------------- */
    const disasterTypes = useDisasterType();
    const { emergencyResponse } = useOutletContext<EmergencyOutletContext>();
    const { api_visibility_choices } = useGlobalEnums();

    const disasterType = disasterTypes?.find(
        (d) => d.id === emergencyResponse?.dtype,
    );
    const countryId = emergencyResponse?.countries?.[0]?.id;
    const disasterTypeId = disasterType?.id;

    /* ---------- DREF detection (appeals only) ---------- */
    // Debug logging to see what we have
    // console.log('Emergency Response Appeals:', emergencyResponse?.appeals);
    // console.log('All appeal types:', emergencyResponse?.appeals?.map((a) => ({
    //     id: a?.id,
    //     type_display: a?.type_display,
    //     code: a?.code,
    //     name: a?.name,
    // })));

    const drefAppeal = emergencyResponse?.appeals?.find((a: Appeal) => {
        const label = a?.type_display ?? '';
        // console.log('Checking appeal:', {
        //     id: a?.id,
        //     type_display: label,
        //     matches: /dref/i.test(label)
        // });
        return typeof label === 'string' && /dref/i.test(label);
    });

    const hasDref = Boolean(drefAppeal);
    // const drefId = drefAppeal?.id; // Get the DREF ID for the API call

    // console.log('Found DREF Appeal:', drefAppeal);
    // console.log('DREF ID:', drefId);

    /* ---------------- situational overview logic ---------------- */
    const manualSO = emergencyResponse?.situational_overview;

    const {
        response: aiSO,
        pending: aiPending,
        error: aiError,
    } = usePerDrefSituationalOverview(
        // Use event ID, not DREF ID - API expects event ID
        manualSO ? undefined : emergencyResponse?.id,
    );

    const overviewText = manualSO ?? aiSO?.situational_overview;
    const overviewMeta = manualSO ? undefined : aiSO?.metadata;
    const overviewPending = manualSO ? false : aiPending;
    const overviewError = manualSO ? undefined : aiError;

    /* ---------------- other hooks ---------------- */
    const shouldFetchIfrc = !hasDref && isDefined(countryId) && isDefined(disasterTypeId);

    const {
        response: ifrcEvents,
        pending: ifrcEventsPending,
        error: ifrcEventsError,
    } = useIfrcEvents(
        shouldFetchIfrc ? countryId : undefined,
        shouldFetchIfrc ? disasterTypeId : undefined,
    );

    const {
        response: rapidResponseData,
        pending: rapidResponsePending,
        error: rapidResponseError,
    } = useRapidResponse({ country: countryId, disaster_type: disasterTypeId });

    /* ---------------- misc data build ---------------- */
    const visibilityMap = useMemo(
        () => listToMap(
            api_visibility_choices,
            ({ key }) => key,
            ({ value }) => value,
        ),
        [api_visibility_choices],
    );

    const hasKeyFigures = isDefined(emergencyResponse) && emergencyResponse.key_figures.length > 0;

    const hasFieldReports = emergencyResponse?.field_reports
        && emergencyResponse.field_reports.length > 0;

    const mdrCode = emergencyResponse?.appeals?.length
        ? emergencyResponse.appeals[0].code
        : undefined;

    const firstFieldReport = hasFieldReports
        ? getFieldReport(emergencyResponse.field_reports, compareDate, -1)
        : undefined;
    const assistanceIsRequestedByNS = firstFieldReport?.ns_request_assistance;
    const assistanceIsRequestedByCountry = firstFieldReport?.request_assistance;
    const latestFieldReport = hasFieldReports
        ? getFieldReport(emergencyResponse.field_reports, compareDate)
        : undefined;

    /* Contacts grouped by org (IFRC vs NS) */
    const groupedContacts = useMemo(() => {
        type Contact = Omit<
            NonNullable<typeof emergencyResponse>['contacts'][number],
            'event'
        >;
        let contacts: Contact[] | undefined = emergencyResponse?.contacts;
        if (!contacts?.length) {
            contacts = latestFieldReport?.contacts;
        }

        const grouped = listToGroupList(
            contacts
                ?.map((c) => {
                    if (isNotDefined(c)) {
                        return undefined;
                    }
                    const { ctype } = c;
                    if (isNotDefined(ctype)) {
                        return undefined;
                    }
                    return { ...c, ctype };
                })
                .filter(isDefined) ?? [],
            (c) => (c.email.endsWith('ifrc.org') ? 'IFRC' : 'National Societies'),
        );
        return grouped;
    }, [emergencyResponse?.contacts, latestFieldReport]);

    /* ---------------- precomputed nodes (helps linting) ---------------- */
    const emergencyMapNode = useMemo(() => {
        if (!emergencyResponse || emergencyResponse.hide_field_report_map) {
            return null;
        }

        return (
            <Container
                className={styles.mapContainer}
                heading="Emergency Map"
                withHeaderBorder
            >
                <EmergencyMap event={emergencyResponse} />
            </Container>
        );
    }, [emergencyResponse]);

    const fieldReportStatsNode = useMemo(() => {
        if (
            !hasFieldReports
            || !latestFieldReport
            || emergencyResponse?.hide_attached_field_reports
        ) {
            return null;
        }

        return (
            <Container
                className={styles.fieldReportStatsContainer}
                heading="Field Report Statistics"
                withHeaderBorder
            >
                <FieldReportStats
                    report={latestFieldReport}
                    disasterType={emergencyResponse!.dtype}
                />
            </Container>
        );
    }, [hasFieldReports, latestFieldReport, emergencyResponse]);

    /* ---------------- render ---------------- */
    return (
        <div className={styles.emergencyDetails}>
            {hasKeyFigures && (
                <KeyFigures keyFigures={emergencyResponse!.key_figures} />
            )}

            {emergencyResponse && (
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
                overviewText={overviewText}
                metadata={overviewMeta}
                pending={overviewPending}
                error={overviewError}
            />

            {/* Hide PreviousCrises (and skip fetch) when this emergency has a DREF */}
            {!hasDref && (
                <PreviousCrises
                    ifrcEvents={ifrcEvents}
                    ifrcEventsPending={ifrcEventsPending}
                    ifrcEventsError={ifrcEventsError}
                />
            )}

            <RapidResponse
                rapidResponseData={rapidResponseData}
                rapidResponsePending={rapidResponsePending}
                rapidResponseError={rapidResponseError}
            />

            <div className={styles.mapKeyFigureContainer}>
                {emergencyMapNode}
                {fieldReportStatsNode}
            </div>

            {groupedContacts && Object.keys(groupedContacts).length > 0 && (
                <Contacts groupedContacts={groupedContacts} />
            )}
        </div>
    );
}

Component.displayName = 'EmergencyDetails';
