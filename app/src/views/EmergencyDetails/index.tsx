import {
    useMemo,
    useState,
} from 'react';
import { useOutletContext } from 'react-router-dom';
import {
    Button,
    Container,
    HtmlOutput,
    KeyFigure,
    TextOutput,
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
import usePerDrefSummary from '#hooks/domain/usePerDrefSummary';
import cleanAiText from '#utils/textcleaner';
import { type EmergencyOutletContext } from '#utils/outletContext';
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
        if (
            isNotDefined(selectedReport) ||
            compareFunction(
                currentReport?.updated_at,
                selectedReport.updated_at,
                direction,
            ) > 0
        ) {
            return currentReport;
        }
        return selectedReport;
    }, undefined);
}

function EmergencyDetails() {
    const strings = useTranslation(i18n);
    const disasterTypes = useDisasterType();
    const { emergencyResponse } = useOutletContext<EmergencyOutletContext>();
    const { api_visibility_choices } = useGlobalEnums();
    const [showFullDref, setShowFullDref] = useState(false);

    const [isRefetching, setIsRefetching] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    const {
        response: ifrcEvents,
        pending: ifrcEventsPending,
        error: ifrcEventsError,
        refetch: refetchIfrcEvents,
    } = useIfrcEvents(
        emergencyResponse?.countries?.[0]?.id,
        emergencyResponse?.dtype,
    );

    const drefId =
        emergencyResponse?.appeals &&
        emergencyResponse.appeals.length > 0
            ? emergencyResponse.appeals[0].id
            : 1;

    const {
        response: perDrefStatus,
    } = usePerDrefStatus(drefId);

    const {
        response: perDrefSummary,
        pending: perDrefSummaryPending,
        error: perDrefSummaryError,
    } = usePerDrefSummary(drefId);

    const visibilityMap = useMemo(
        () => listToMap(
            api_visibility_choices,
            ({ key }) => key,
            ({ value }) => value,
        ),
        [api_visibility_choices],
    );

    const hasKeyFigures =
        isDefined(emergencyResponse) &&
        emergencyResponse.key_figures.length !== 0;

    const disasterType = disasterTypes?.find(
        (typeOfDisaster) =>
            typeOfDisaster.id === emergencyResponse?.dtype,
    );

    const mdrCode =
        isDefined(emergencyResponse) &&
        isDefined(emergencyResponse?.appeals) &&
        emergencyResponse.appeals.length > 0
            ? emergencyResponse?.appeals[0].code
            : undefined;

    const hasFieldReports =
        isDefined(emergencyResponse) &&
        isDefined(emergencyResponse?.field_reports) &&
        emergencyResponse?.field_reports.length > 0;

    const firstFieldReport = hasFieldReports
        ? getFieldReport(
            emergencyResponse.field_reports,
            compareDate,
            -1,
        )
        : undefined;

    const assistanceIsRequestedByNS = firstFieldReport?.ns_request_assistance;
    const assistanceIsRequestedByCountry = firstFieldReport?.request_assistance;

    const latestFieldReport = hasFieldReports
        ? getFieldReport(
            emergencyResponse.field_reports,
            compareDate,
        )
        : undefined;

    const emergencyContacts = emergencyResponse?.contacts;

    const groupedContacts = useMemo(() => {
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
            (contact) =>
                contact.email.endsWith('ifrc.org')
                    ? 'IFRC'
                    : 'National Societies',
        );
        return grouped;
    }, [emergencyContacts, latestFieldReport]);

    const handleSyncPreviousCrises = () => {
        if (refetchIfrcEvents) {
            setIsRefetching(true);
            refetchIfrcEvents();
            setTimeout(() => {
                setIsRefetching(false);
            }, 2000);
        }
    };

    const handleCopyPreviousCrises = async () => {
        if (ifrcEvents?.ai_structured_summary) {
            try {
                const cleanedText = cleanAiText(ifrcEvents.ai_structured_summary);
                await navigator.clipboard.writeText(cleanedText);
                setIsCopied(true);
                setTimeout(() => {
                    setIsCopied(false);
                }, 2000);
            } catch {
                // silent fail
            }
        }
    };

    const isLoadingPreviousCrises = ifrcEventsPending || isRefetching;

    const operationalSummary = perDrefSummary?.operational_summary ?? '';
    const budgetSummary = perDrefSummary?.budget_summary;

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
                        value={
                            isDefined(emergencyResponse.visibility)
                                ? visibilityMap?.[emergencyResponse.visibility]
                                : '--'
                        }
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
                        <div className={styles.sectionTitle}>
                            {strings.situationalOverviewTitle}
                        </div>
                        {perDrefStatus && (
                            <div
                                className={styles.sectionLabel}
                                style={{
                                    color:
                                        perDrefStatus.type_of_onset_display === 'Sudden' ||
                                        perDrefStatus.type_of_onset_display === 'Imminent'
                                            ? 'var(--go-ui-color-alert)'
                                            : undefined,
                                }}
                            >
                                {perDrefStatus.type_of_onset_display}
                                {' '}
                                /
                                {perDrefStatus.type_of_dref_display}
                            </div>
                        )}
                    </div>
                )}
                withHeaderBorder
                childrenContainerClassName={styles.situationalOverviewContent}
            >
                {isTruthyString(emergencyResponse?.summary)
                    ? <HtmlOutput value={emergencyResponse.summary} />
                    : (
                        <p className={styles.placeholderText}>
                            No situational overview data available
                        </p>
                    )}
            </Container>

            {/* Previous Crises */}
            <Container
                heading={(
                    <div className={styles.sectionHeadingRow}>
                        <div className={styles.sectionTitle}>
                            {strings.previousCrisesTitle}
                        </div>
                        <div className={styles.sectionControls}>
                            <Button
                                variant="tertiary"
                                size="small"
                                icon={isRefetching ? 'loading' : 'refresh'}
                                onClick={handleSyncPreviousCrises}
                                disabled={isLoadingPreviousCrises}
                            >
                                {isRefetching
                                    ? strings.syncingButton
                                    : strings.syncButton}
                            </Button>
                            <Button
                                variant="tertiary"
                                size="small"
                                icon={isCopied ? 'check' : 'copy'}
                                onClick={handleCopyPreviousCrises}
                                disabled={
                                    !ifrcEvents?.ai_structured_summary ||
                                    isLoadingPreviousCrises
                                }
                            >
                                {isCopied
                                    ? strings.copiedButton
                                    : strings.copyButton}
                            </Button>
                        </div>
                    </div>
                )}
                withHeaderBorder
                childrenContainerClassName={styles.previousCrisesContent}
            >
                {isLoadingPreviousCrises && (
                    <p className={styles.placeholderText}>
                        {isRefetching
                            ? 'Syncing previous crises data...'
                            : 'Loading previous crises data...'}
                    </p>
                )}
                {ifrcEventsError && !isLoadingPreviousCrises && (
                    <p className={styles.placeholderText}>
                        Error loading previous crises data
                    </p>
                )}
                {!isLoadingPreviousCrises && !ifrcEventsError && (
                    isTruthyString(ifrcEvents?.ai_structured_summary)
                        ? (
                            <HtmlOutput value={cleanAiText(
                                ifrcEvents.ai_structured_summary,
                            )} />
                        )
                        : (
                            <p className={styles.placeholderText}>
                                No previous crises data available
                            </p>
                        )
                )}
            </Container>

            {/* DREF Operational Strategy */}
            <Container
                heading={strings.drefOperationalStrategyTitle}
                withHeaderBorder
                childrenContainerClassName={styles.drefOperationalStrategyContent}
            >
                {perDrefSummaryPending && (
                    <p className={styles.placeholderText}>
                        Loading DREF operational strategy data...
                    </p>
                )}

                {!perDrefSummaryPending && perDrefSummaryError && (
                    <p className={styles.placeholderText}>
                        Error loading DREF operational strategy data
                    </p>
                )}

                {!perDrefSummaryPending &&
                    !perDrefSummaryError &&
                    operationalSummary && (
                        <>
                            <HtmlOutput
                                value={
                                    showFullDref
                                        ? operationalSummary
                                        : `${
                                            operationalSummary.substring(
                                                0,
                                                300,
                                            )
                                        }${operationalSummary.length > 300
                                            ? '...'
                                            : ''}`
                                }
                            />
                            {operationalSummary.length > 300 && (
                                <Button
                                    variant="secondary"
                                    size="small"
                                    icon={showFullDref ? 'less' : 'more'}
                                    onClick={() => setShowFullDref(!showFullDref)}
                                    className={styles.moreButton}
                                >
                                    {showFullDref
                                        ? 'Show Less'
                                        : 'Show More'}
                                </Button>
                            )}
                        </>
                )}

                {!perDrefSummaryPending &&
                    !perDrefSummaryError &&
                    !operationalSummary && (
                        <p className={styles.placeholderText}>
                            No DREF operational strategy data available
                        </p>
                )}

                {showFullDref && budgetSummary && (
                    <Container heading="Budget Summary" withHeaderBorder>
                        <dl className={styles.budgetDefinitionList}>
                            <div>
                                <dt>Total Allocation:</dt>
                                <dd>
                                    {budgetSummary.budget_overview?.total_allocation ?? 'N/A'}
                                </dd>
                            </div>
                            <div>
                                <dt>Operation Timeframe:</dt>
                                <dd>
                                    {budgetSummary.budget_overview?.operation_timeframe ?? 'N/A'}
                                </dd>
                            </div>
                            <div>
                                <dt>Target Beneficiaries:</dt>
                                <dd>
                                    {budgetSummary.budget_overview?.target_beneficiaries ?? 'N/A'}
                                </dd>
                            </div>
                            <div>
                                <dt>Cost per Beneficiary:</dt>
                                <dd>
                                    {budgetSummary.budget_overview?.cost_per_beneficiary ?? 'N/A'}
                                </dd>
                            </div>
                            <div>
                                <dt>Funding Status:</dt>
                                <dd>
                                    {budgetSummary.budget_overview?.funding_status ?? 'N/A'}
                                </dd>
                            </div>
                            <div>
                                <dt>Sectoral Budget Summary:</dt>
                                <dd>
                                    {budgetSummary.sectoral_breakdown?.summary ??
                                        'No sectoral budget breakdown provided'}
                                </dd>
                            </div>
                            <div>
                                <dt>Financial Analysis Summary:</dt>
                                <dd>
                                    {budgetSummary.financial_analysis?.summary ??
                                        'Limited data inhibits detailed financial analysis; no sectoral allocation or activity distribution available'}
                                </dd>
                            </div>
                            <div>
                                <dt>Confidence Level:</dt>
                                <dd>
                                    {budgetSummary.confidence_level ?? 'N/A'}
                                </dd>
                            </div>
                            <div>
                                <dt>Data Quality Notes:</dt>
                                <dd>
                                    {budgetSummary.data_quality_notes ?? 'N/A'}
                                </dd>
                            </div>
                        </dl>
                    </Container>
                )}
            </Container>

            <div className={styles.mapKeyFigureContainer}>
                {emergencyResponse &&
                    !emergencyResponse.hide_field_report_map && (
                        <Container
                            className={styles.mapContainer}
                            heading={strings.emergencyMapTitle}
                            withHeaderBorder
                        >
                            {emergencyResponse && (
                                <EmergencyMap event={emergencyResponse} />
                            )}
                        </Container>
                )}
                {hasFieldReports &&
                    isDefined(latestFieldReport) &&
                    !emergencyResponse.hide_attached_field_reports && (
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

            {isDefined(groupedContacts) &&
                Object.keys(groupedContacts).length > 0 && (
                    <Container
                        heading={strings.contactsTitle}
                        childrenContainerClassName={styles.contactsContent}
                        withHeaderBorder
                    >
                        {Object.entries(groupedContacts).map(
                            ([contactGroup, contacts]) => (
                                <Container
                                    key={contactGroup}
                                    heading={contactGroup}
                                    childrenContainerClassName={styles.contactList}
                                    headingLevel={4}
                                >
                                    {contacts.map((contact) => (
                                        <div key={contact.id} className={styles.contact}>
                                            <div className={styles.details}>
                                                <div className={styles.name}>
                                                    {contact.name}
                                                </div>
                                                <div className={styles.title}>
                                                    {contact.title}
                                                </div>
                                            </div>
                                            <div className={styles.contactMechanisms}>
                                                <div className={styles.type}>
                                                    {contact.ctype}
                                                </div>
                                                {isTruthyString(contact.email) && (
                                                    <TextOutput
                                                        value={(
                                                            <Link
                                                                href={`mailto:${contact.email}`}
                                                                external
                                                                withLinkIcon
                                                            >
                                                                {contact.email}
                                                            </Link>
                                                        )}
                                                    />
                                                )}
                                                {isTruthyString(contact.phone) && (
                                                    <TextOutput
                                                        value={(
                                                            <Link
                                                                href={`tel:${contact.phone}`}
                                                                withLinkIcon
                                                                external
                                                            >
                                                                {contact.phone}
                                                            </Link>
                                                        )}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </Container>
                            ),
                        )}
                    </Container>
            )}
        </div>
    );
}

EmergencyDetails.displayName = 'EmergencyDetails';
export default EmergencyDetails;
