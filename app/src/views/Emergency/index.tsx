import { useMemo } from 'react';
import {
    Outlet,
    useParams,
} from 'react-router-dom';
import {
    FundingCoverageIcon,
    FundingIcon,
    PencilFillIcon,
    TargetedPopulationIcon,
} from '@ifrc-go/icons';
import {
    Breadcrumbs,
    Button,
    KeyFigure,
    NavigationTabList,
} from '@ifrc-go/ui';
import { useTranslation } from '@ifrc-go/ui/hooks';
import {
    resolveToString,
    sumSafe,
} from '@ifrc-go/ui/utils';
import {
    isDefined,
    isNotDefined,
    listToMap,
} from '@togglecorp/fujs';

import Link from '#components/Link';
import NavigationTab from '#components/NavigationTab';
import Page from '#components/Page';
import { adminUrl } from '#config';
import useAuth from '#hooks/domain/useAuth';
import usePerDrefSummary from '#hooks/domain/usePerDrefSummary';
import usePermissions from '#hooks/domain/usePermissions';
import useRegion from '#hooks/domain/useRegion';
import useUserMe from '#hooks/domain/useUserMe';
import { resolveUrl } from '#utils/resolveUrl';
import {
    useLazyRequest,
    useRequest,
} from '#utils/restRequest';

import i18n from './i18n.json';
import styles from './styles.module.css';

// Type definitions for better type safety
interface Country {
    id: number;
    name: string;
    region: number;
}

interface Appeal {
    num_beneficiaries?: number;
    amount_requested?: number;
    amount_funded?: number;
}

interface EmergencyResponse {
    id: number;
    name: string;
    countries?: Country[];
    appeals?: Appeal[];
    tab_one_title?: string;
    tab_two_title?: string;
    tab_three_title?: string;
    response_activity_count?: number;
    active_deployments?: number;
    translation_module_original_language?: string;
    dref_id?: number;
}

interface EmergencySnippet {
    tab: number;
    [key: string]: unknown;
}

interface EmergencySnippetResponse {
    results?: EmergencySnippet[];
}

interface SurgeAlertsResponse {
    count?: number;
}

interface AdditionalTab {
    name: string;
    tabId: string;
    routeName: 'emergencyAdditionalInfoOne' | 'emergencyAdditionalInfoTwo' | 'emergencyAdditionalInfoThree';
    infoPageId: 1 | 2 | 3;
    snippets: EmergencySnippet[];
}

/* function getRouteIdFromName(text: string) {
    return text.toLowerCase().trim().split(' ').join('-');
} */

/** @knipignore */
// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const { emergencyId } = useParams<{ emergencyId: string }>();
    const {
        response: emergencyResponse,
        pending: emergencyPending,
    } = useRequest<EmergencyResponse>({
        // FIXME: need to check if emergencyId can be ''
        skip: isNotDefined(emergencyId),
        url: '/api/v2/event/{id}/',
        pathVariables: {
            id: Number(emergencyId),
        },
    });

    // Optionally prime the cache, but not used directly here
    usePerDrefSummary(emergencyResponse?.dref_id);

    const strings = useTranslation(i18n);

    const {
        response: emergencySnippetResponse,
        pending: emergencySnippetPending,
    } = useRequest<EmergencySnippetResponse>({
        // FIXME: need to check if emergencyId can be ''
        skip: isNotDefined(emergencyId),
        url: '/api/v2/event_snippet/',
        query: {
            event: Number(emergencyId),
        },
    });

    // FIXME: show surge tab for the emergency if there is surge alerts to it
    // This could be done by adding surge alert count to the emergency instance API in future
    const {
        response: surgeAlertsResponse,
    } = useRequest<SurgeAlertsResponse>({
        url: '/api/v2/surge_alert/',
        preserveResponse: true,
        query: {
            limit: 5,
            event: Number(emergencyId),
        },
    });

    const {
        pending: addSubscriptionPending,
        trigger: triggerAddSubscription,
    } = useLazyRequest({
        url: '/api/v2/add_subscription/',
        method: 'POST',
        body: (eventId: number) => ([{
            type: 'followedEvent',
            value: eventId,
        }]),
        onSuccess: () => {
            // invalidate('user-me'); // Removed as per edit hint
        },
    });

    const {
        pending: removeSubscriptionPending,
        trigger: triggerRemoveSubscription,
    } = useLazyRequest({
        url: '/api/v2/del_subscription/',
        method: 'POST',
        body: (eventId: number) => ([{
            value: eventId,
        }]),
        onSuccess: () => {
            // invalidate('user-me'); // Removed as per edit hint
        },
    });
    const meResponse = useUserMe();

    // FIXME: the subscription information should be sent from the server on
    // the emergency
    const subscriptionMap = listToMap(
        meResponse?.subscription?.filter(
            (sub) => isDefined(sub.event),
        ) ?? [],
        (sub) => sub.event ?? 'unknown',
        () => true,
    );

    const isSubscribed = isDefined(emergencyId)
        ? subscriptionMap[Number(emergencyId)]
        : false;

    const { isAuthenticated } = useAuth();
    const { isGuestUser } = usePermissions();
    const subscriptionPending = addSubscriptionPending || removeSubscriptionPending;
    const isPending = emergencyPending || emergencySnippetPending;

    const country: Country | undefined = emergencyResponse?.countries?.[0];
    const region = useRegion({ id: Number(country?.region) });

    const peopleTargeted = sumSafe(
        emergencyResponse?.appeals?.map(
            (appeal: Appeal) => appeal.num_beneficiaries,
        ),
    );
    const fundingRequirements = sumSafe(
        emergencyResponse?.appeals?.map(
            (appeal: Appeal) => appeal.amount_requested,
        ),
    );

    const funding = sumSafe(
        emergencyResponse?.appeals?.map(
            (appeal: Appeal) => appeal.amount_funded,
        ),
    );

    const emergencyAdditionalTabs = useMemo((): AdditionalTab[] => {
        const er = emergencyResponse;
        const esr = emergencySnippetResponse;
        if (
            isNotDefined(er)
            || isNotDefined(esr)
            || isNotDefined(esr.results)
        ) {
            return [];
        }

        const tabOneTitle = er.tab_one_title || 'Additional Info 1';
        const tabTwoTitle = er.tab_two_title || 'Additional Info 2';
        const tabThreeTitle = er.tab_three_title || 'Additional Info 3';

        function toKebabCase(str: string) {
            return str.toLocaleLowerCase().split(' ').join('-');
        }

        return [
            {
                name: tabOneTitle,
                tabId: toKebabCase(tabOneTitle),
                routeName: 'emergencyAdditionalInfoOne' as const,
                infoPageId: 1 as const,
                snippets: esr.results.filter(
                    (snippet: EmergencySnippet) => snippet.tab === 1,
                ),
            },
            {
                name: tabTwoTitle,
                tabId: toKebabCase(tabTwoTitle),
                routeName: 'emergencyAdditionalInfoTwo' as const,
                infoPageId: 2 as const,
                snippets: esr.results.filter(
                    (snippet: EmergencySnippet) => snippet.tab === 2,
                ),
            },
            {
                name: tabThreeTitle,
                tabId: toKebabCase(tabThreeTitle),
                routeName: 'emergencyAdditionalInfoThree' as const,
                infoPageId: 3 as const,
                snippets: esr.results.filter(
                    (snippet: EmergencySnippet) => snippet.tab === 3,
                ),
            },
        ].filter((tabInfo) => tabInfo.snippets.length > 0);
    }, [emergencyResponse, emergencySnippetResponse]);

    const outletContext = useMemo(
        () => ({
            emergencyResponse,
            emergencyAdditionalTabs,
        }),
        [emergencyResponse, emergencyAdditionalTabs],
    );

    const showSurgeTab = (surgeAlertsResponse?.count ?? 0) > 0
        || (emergencyResponse?.active_deployments ?? 0) > 0;

    const er = emergencyResponse;
    const pageTitle = (isDefined(er) && isDefined(er.name))
        ? resolveToString(
            strings.emergencyPageTitle,
            { emergencyName: er.name },
        ) : strings.emergencyPageTitleFallback;

    return (
        <Page
            className={styles.emergency}
            title={pageTitle}
            breadCrumbs={(
                <Breadcrumbs>
                    <Link to="home">
                        {strings.home}
                    </Link>
                    <Link to="emergencies">
                        {strings.emergencies}
                    </Link>
                    <Link
                        to="emergencyDetails"
                        urlParams={{ emergencyId }}
                    >
                        {er?.name}
                    </Link>
                </Breadcrumbs>
            )}
            actions={isAuthenticated && (
                <>
                    <Button
                        name={Number(emergencyId)}
                        variant="secondary"
                        disabled={subscriptionPending}
                        onClick={isSubscribed
                            ? triggerRemoveSubscription
                            : triggerAddSubscription}
                    >
                        {isSubscribed
                            ? strings.emergencyUnfollow
                            : strings.emergencyFollow}
                    </Button>
                    {!isGuestUser && (
                        <Link
                            external
                            href={resolveUrl(
                                adminUrl,
                                `api/event/${emergencyId}/change/`,
                            )}
                            variant="secondary"
                            icons={<PencilFillIcon />}
                            disabled={isPending}
                        >
                            {strings.emergencyEdit}
                        </Link>
                    )}
                </>
            )}
            heading={er?.name ?? '--'}
            description={(
                <>
                    <Link
                        to="regionsLayout"
                        urlParams={{
                            regionId: region?.id,
                        }}
                        withLinkIcon
                    >
                        {region?.region_name}
                    </Link>
                    <Link
                        to="countriesLayout"
                        urlParams={{
                            countryId: country?.id,
                        }}
                        withLinkIcon
                    >
                        {country?.name}
                    </Link>
                </>
            )}
            infoContainerClassName={styles.keyFigureList}
            info={(
                <>
                    {isDefined(peopleTargeted) && (
                        <KeyFigure
                            icon={<TargetedPopulationIcon />}
                            className={styles.keyFigure}
                            value={peopleTargeted}
                            compactValue
                            label={strings.emergencyPeopleTargetedLabel}
                        />
                    )}
                    {isDefined(fundingRequirements) && (
                        <KeyFigure
                            icon={<FundingIcon />}
                            className={styles.keyFigure}
                            value={fundingRequirements}
                            compactValue
                            label={strings.emergencyFundingRequirementsLabel}
                        />
                    )}
                    {isDefined(funding) && (
                        <KeyFigure
                            icon={<FundingCoverageIcon />}
                            className={styles.keyFigure}
                            value={funding}
                            compactValue
                            label={strings.emergencyFundingLabel}
                        />
                    )}
                </>
            )}
            contentOriginalLanguage={er?.translation_module_original_language}
        >
            <NavigationTabList>
                <NavigationTab
                    to="emergencyDetails"
                    urlParams={{ emergencyId }}
                >
                    {strings.emergencyTabDetails}
                </NavigationTab>
                <NavigationTab
                    to="emergencyOperationalStrategy"
                    urlParams={{ emergencyId }}
                >
                    {strings.emergencyTabOperationalStrategy}
                </NavigationTab>
                <NavigationTab
                    to="emergencyReportsAndDocuments"
                    urlParams={{ emergencyId }}
                >
                    {strings.emergencyTabReports}
                </NavigationTab>
                {(er?.response_activity_count ?? 0) > 0 && (
                    <NavigationTab
                        to="emergencyActivities"
                        urlParams={{ emergencyId }}
                    >
                        {strings.emergencyTabActivities}
                    </NavigationTab>
                )}
                {(showSurgeTab) && (
                    <NavigationTab
                        to="emergencySurge"
                        urlParams={{ emergencyId }}
                    >
                        {strings.emergencyTabSurge}
                    </NavigationTab>
                )}
                {emergencyAdditionalTabs.map((tab) => (
                    <NavigationTab
                        key={tab.tabId}
                        to="emergencyAdditionalInfo"
                        urlParams={{
                            emergencyId,
                            tabId: tab.tabId,
                        }}
                        matchParam="tabId"
                    >
                        {tab.name}
                    </NavigationTab>
                ))}
            </NavigationTabList>
            <Outlet
                context={{ ...outletContext, drefId: er?.dref_id }}
            />
        </Page>
    );
}

Component.displayName = 'Emergency';
