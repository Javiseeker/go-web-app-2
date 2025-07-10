import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
    Container,
    HtmlOutput,
    KeyFigure,
    TextOutput,
    Button,
} from '@ifrc-go/ui';
import { useTranslation } from '@ifrc-go/ui/hooks';
import { resolveToString } from '@ifrc-go/ui/utils';
import {
    compareDate,
    isDefined,
    isNotDefined,
    isTruthyString,
    listToGroupList,
    listToMap,
} from '@togglecorp/fujs';

import SeverityIndicator from '#components/domain/SeverityIndicator';
import Link from '#components/Link';
import useDisasterType from '#hooks/domain/useDisasterType';
import useGlobalEnums from '#hooks/domain/useGlobalEnums';
import useIfrcEvents from '#hooks/domain/useIfrcEvents';
import usePerDrefStatus from '#hooks/domain/usePerDrefStatus';
import { type EmergencyOutletContext } from '#utils/outletContext';
import { cleanAiText } from '#utils/textcleaner';

import EmergencyMap from './EmergencyMap';
import FieldReportStats from './FieldReportStats';

import i18n from './i18n.json';
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

export function Component() {
    const strings = useTranslation(i18n);
    const disasterTypes = useDisasterType();
    const { emergencyResponse } = useOutletContext<EmergencyOutletContext>();
    const { api_visibility_choices } = useGlobalEnums();
    const [showFullDref, setShowFullDref] = useState(false);
    
    // Add state to track manual refetch and copy status
    const [isRefetching, setIsRefetching] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    // Use the new hooks
    const { response: ifrcEvents, pending: ifrcEventsPending, error: ifrcEventsError, refetch: refetchIfrcEvents } = useIfrcEvents(
        emergencyResponse?.countries?.[0]?.id,
        emergencyResponse?.dtype
    );

    // Debug logging for IFRC Events
    console.log('=== IFRC EVENTS DEBUG ===');
    console.log('Country ID:', emergencyResponse?.countries?.[0]?.id);
    console.log('Disaster Type:', emergencyResponse?.dtype);
    console.log('IFRC Events Response:', ifrcEvents);
    console.log('IFRC Events Pending:', ifrcEventsPending);
    console.log('IFRC Events Error:', ifrcEventsError);
    console.log('refetchIfrcEvents function:', refetchIfrcEvents);
    console.log('========================');

    // Get DREF ID from appeals - but always use a value to trigger the hook
    const drefId = emergencyResponse?.appeals && emergencyResponse.appeals.length > 0 
        ? emergencyResponse.appeals[0].id 
        : 1; // Use 1 as default to ensure the hook runs
    
    const { response: perDrefStatus, pending: perDrefStatusPending, error: perDrefStatusError } = usePerDrefStatus(drefId);

    // Debug logging for PER-DREF Status
    console.log('=== PER-DREF STATUS DEBUG ===');
    console.log('DREF ID:', drefId);
    console.log('PER-DREF Response:', perDrefStatus);
    console.log('PER-DREF Pending:', perDrefStatusPending);
    console.log('PER-DREF Error:', perDrefStatusError);
    console.log('Emergency Appeals:', emergencyResponse?.appeals);
    console.log('===========================');

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

    const disasterType = disasterTypes?.find(
        (typeOfDisaster) => typeOfDisaster.id === emergencyResponse?.dtype,
    );

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

    // Sync handler for previous crises
    const handleSyncPreviousCrises = () => {
        console.log('=== SYNC BUTTON CLICKED ===');
        console.log('refetchIfrcEvents exists?', !!refetchIfrcEvents);
        console.log('refetchIfrcEvents type:', typeof refetchIfrcEvents);
        
        if (refetchIfrcEvents) {
            setIsRefetching(true);
            console.log('Starting refetch...');
            
            // Call refetch
            refetchIfrcEvents();
            
            // Since we don't know if it returns a promise, 
            // use a timeout to reset the loading state
            setTimeout(() => {
                console.log('Resetting isRefetching state');
                setIsRefetching(false);
            }, 2000);
        } else {
            console.error('refetchIfrcEvents is not available!');
        }
        console.log('===========================');
    };

    // Copy handler for previous crises
    const handleCopyPreviousCrises = async () => {
        console.log('=== COPY BUTTON CLICKED ===');
        console.log('AI Summary exists?', !!ifrcEvents?.ai_structured_summary);
        
        if (ifrcEvents?.ai_structured_summary) {
            try {
                const cleanedText = cleanAiText(ifrcEvents.ai_structured_summary);
                console.log('Cleaned text length:', cleanedText.length);
                console.log('First 100 chars:', cleanedText.substring(0, 100));
                
                await navigator.clipboard.writeText(cleanedText);
                console.log('✅ Text successfully copied to clipboard!');
                
                // Show copied status
                setIsCopied(true);
                setTimeout(() => {
                    setIsCopied(false);
                }, 2000);
            } catch (err) {
                console.error('❌ Failed to copy to clipboard:', err);
            }
        } else {
            console.log('No AI summary available to copy');
        }
        console.log('===========================');
    };

    // Determine if we should show loading state
    const isLoadingPreviousCrises = ifrcEventsPending || isRefetching;

    return (
        <div className={styles.emergencyDetails}>
            {hasKeyFigures && (
                <Container
                    className={styles.keyFigureList}
                    heading={strings.emergencyKeyFiguresTitle}
                    childrenContainerClassName={styles.keyFigureList}
                    withHeaderBorder
                >
                    {emergencyResponse?.key_figures.map(
                        (keyFigure) => (
                            <KeyFigure
                                key={keyFigure.id}
                                className={styles.keyFigure}
                                value={Math.round(
                                    Number.parseInt(
                                        keyFigure.number.replace(/[^\d.-]/g, ''),
                                        10,
                                    ),
                                )}
                                label={keyFigure.deck}
                                description={resolveToString(
                                    strings.sourceLabel,
                                    {
                                        source: keyFigure.source,
                                    },
                                )}
                            />
                        ),
                    )}
                </Container>
            )}

            {isDefined(emergencyResponse) && (
                <Container
                    heading={strings.emergencyOverviewTitle}
                    withHeaderBorder
                    childrenContainerClassName={styles.overviewContent}
                >
                    <TextOutput
                        className={styles.overviewItem}
                        label={strings.disasterCategorization}
                        value={(
                            <>
                                {emergencyResponse.ifrc_severity_level_display}
                                <SeverityIndicator
                                    level={emergencyResponse.ifrc_severity_level}
                                />
                            </>
                        )}
                        valueClassName={styles.disasterCategoryValue}
                        strongValue
                    />
                    <TextOutput
                        className={styles.overviewItem}
                        label={strings.disasterType}
                        value={disasterType?.name}
                        strongValue
                    />
                    <TextOutput
                        className={styles.overviewItem}
                        label={strings.startDate}
                        valueType="date"
                        value={emergencyResponse?.disaster_start_date}
                        strongValue
                    />
                    <TextOutput
                        className={styles.overviewItem}
                        label={strings.visibility}
                        value={isDefined(emergencyResponse.visibility)
                            ? visibilityMap?.[emergencyResponse.visibility]
                            : '--'}
                        strongValue
                    />
                    <TextOutput
                        className={styles.overviewItem}
                        label={strings.MDRCode}
                        value={mdrCode}
                        strongValue
                    />
                    <TextOutput
                        className={styles.overviewItem}
                        label={strings.GLIDENumber}
                        value={emergencyResponse?.glide}
                        strongValue
                    />
                    <TextOutput
                        className={styles.overviewItem}
                        label={strings.assistanceRequestedByNS}
                        valueType="boolean"
                        value={assistanceIsRequestedByNS}
                        strongValue
                    />
                    <TextOutput
                        className={styles.overviewItem}
                        label={strings.assistanceRequestedByGovernment}
                        valueType="boolean"
                        value={assistanceIsRequestedByCountry}
                        strongValue
                    />
                </Container>
            )}

            {/* Situational Overview */}
            <Container
                heading={(
                    <div className={styles.sectionHeadingRow}>
                        <div className={styles.sectionTitle}>{strings.situationalOverviewTitle}</div>
                        {perDrefStatus && (
                            <div className={styles.sectionLabel}>
                                {perDrefStatus.type_of_onset_display} / {perDrefStatus.type_of_dref_display}
                            </div>
                        )}
                    </div>
                )}
                withHeaderBorder
                childrenContainerClassName={styles.situationalOverviewContent}
            >
                {isTruthyString(emergencyResponse?.summary)
                    ? <HtmlOutput value={emergencyResponse.summary} />
                    : <p className={styles.placeholderText}>No situational overview data available</p>}
            </Container>

            {/* Previous Crises */}
            <Container
                heading={(
                    <div className={styles.sectionHeadingRow}>
                        <div className={styles.sectionTitle}>{strings.previousCrisesTitle}</div>
                        <div className={styles.sectionControls}>
                            <Button
                                variant="tertiary"
                                size="small"
                                icon={isRefetching ? "loading" : "refresh"}
                                onClick={handleSyncPreviousCrises}
                                disabled={isLoadingPreviousCrises}
                            >
                                {isRefetching ? strings.syncingButton : strings.syncButton}
                            </Button>
                            <Button
                                variant="tertiary"
                                size="small"
                                icon={isCopied ? "check" : "copy"}
                                onClick={handleCopyPreviousCrises}
                                disabled={!ifrcEvents?.ai_structured_summary || isLoadingPreviousCrises}
                            >
                                {isCopied ? strings.copiedButton : strings.copyButton}
                            </Button>
                        </div>
                    </div>
                )}
                withHeaderBorder
                childrenContainerClassName={styles.previousCrisesContent}
            >
                {isLoadingPreviousCrises && (
                    <p className={styles.placeholderText}>
                        {isRefetching ? 'Syncing previous crises data...' : 'Loading previous crises data...'}
                    </p>
                )}
                {ifrcEventsError && !isLoadingPreviousCrises && (
                    <p className={styles.placeholderText}>Error loading previous crises data</p>
                )}
                {!isLoadingPreviousCrises && !ifrcEventsError && (
                    isTruthyString(ifrcEvents?.ai_structured_summary)
                        ? <HtmlOutput value={cleanAiText(ifrcEvents.ai_structured_summary)} />
                        : <p className={styles.placeholderText}>No previous crises data available</p>
                )}
            </Container>

            {/* DREF Operational Strategy */}
            <Container
                heading={(
                    <div className={styles.sectionHeadingRow}>
                        <div className={styles.sectionTitle}>{strings.drefOperationalStrategyTitle}</div>
                        <Button
                            variant="tertiary"
                            size="small"
                            icon="more"
                            onClick={() => setShowFullDref(!showFullDref)}
                            className={styles.moreButton}
                        >
                            {strings.moreButton}
                        </Button>
                    </div>
                )}
                withHeaderBorder
                childrenContainerClassName={styles.drefOperationalStrategyContent}
            >
                {isTruthyString(emergencyResponse?.dref_operational_strategy) ? (
                    showFullDref
                        ? <HtmlOutput value={emergencyResponse.dref_operational_strategy} />
                        : <HtmlOutput value={`${emergencyResponse.dref_operational_strategy.substring(0, 200)}...`} />
                ) : (
                    <p className={styles.placeholderText}>No DREF operational strategy data available</p>
                )}
            </Container>

            <div className={styles.mapKeyFigureContainer}>
                {emergencyResponse && !emergencyResponse.hide_field_report_map && (
                    <Container
                        className={styles.mapContainer}
                        heading={strings.emergencyMapTitle}
                        withHeaderBorder
                    >
                        {emergencyResponse && (
                            <EmergencyMap
                                event={emergencyResponse}
                            />
                        )}
                    </Container>
                )}
                {hasFieldReports
                    && isDefined(latestFieldReport)
                    && !emergencyResponse.hide_attached_field_reports && (
                    <Container
                        className={styles.fieldReportStatsContainer}
                        heading={strings.emergencyKeyFiguresTitle}
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
                <Container
                    heading={strings.contactsTitle}
                    childrenContainerClassName={styles.contactsContent}
                    withHeaderBorder
                >
                    {Object.entries(groupedContacts).map(([contactGroup, contacts]) => (
                        <Container
                            key={contactGroup}
                            heading={contactGroup}
                            childrenContainerClassName={styles.contactList}
                            headingLevel={4}
                        >
                            {contacts.map((contact) => (
                                <div key={contact.id} className={styles.contact}>
                                    <div className={styles.details}>
                                        <div className={styles.name}>{contact.name}</div>
                                        <div className={styles.title}>{contact.title}</div>
                                    </div>
                                    <div className={styles.contactMechanisms}>
                                        <div className={styles.type}>{contact.ctype}</div>
                                        {isTruthyString(contact.email) && (
                                            <TextOutput
                                                value={(
                                                    <Link href={`mailto:${contact.email}`} external withLinkIcon>
                                                        {contact.email}
                                                    </Link>
                                                )}
                                            />
                                        )}
                                        {isTruthyString(contact.phone) && (
                                            <TextOutput
                                                value={(
                                                    <Link href={`tel:${contact.phone}`} withLinkIcon external>
                                                        {contact.phone}
                                                    </Link>
                                                )}
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </Container>
                    ))}
                </Container>
            )}
        </div>
    );
}

Component.displayName = 'EmergencyDetails';