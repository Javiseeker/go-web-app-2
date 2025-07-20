import { useState } from 'react';
import { Button } from '@ifrc-go/ui';
import { useTranslation } from '@ifrc-go/ui/hooks';

import type { PerDrefSummary } from '#hooks/domain/usePerDrefSummary';

import i18n from './i18n.json';
import styles from './styles.module.css';

// Mock sector data based on your design
interface SectorData {
    id: string;
    name: string;
    icon: string;
    budget: string;
    peopleTargeted: string;
    indicators: Array<{
        name: string;
        targeted: number | string;
    }>;
    needs: string;
}

interface Props {
    perDrefSummary?: PerDrefSummary;
    perDrefSummaryPending: boolean;
    perDrefSummaryError?: unknown;
}

function OperationalStrategy(props: Props) {
    const {
        perDrefSummary,
        perDrefSummaryPending,
        perDrefSummaryError,
    } = props;

    const strings = useTranslation(i18n);
    const [expandedSectors, setExpandedSectors] = useState<Set<string>>(new Set());

    // Extract data from API response
    const operationalSummary = perDrefSummary?.operational_summary || '';
    const budgetOverview = perDrefSummary?.budget_summary?.budget_overview;

    // Parse operational summary into objectives and strategy
    const summaryLines = operationalSummary.split('\n').filter((line) => line.trim());
    const operationObjectives = summaryLines[0] || '';
    const operationStrategy = summaryLines.slice(1).join('\n') || '';

    // Mock engaged sectors (since not in API response) - matching Figma icons
    const engagedSectors = [
        { id: 'health', name: 'Health', icon: '🏥' },
        { id: 'livelihood', name: 'Livelihood', icon: '🏘️' },
        { id: 'shelter', name: 'Shelter', icon: '🏠' },
    ];

    // Mock sectoral needs data (since detailed breakdown not available in API)
    const sectoralNeeds: SectorData[] = [
        {
            id: 'health',
            name: 'HEALTH',
            icon: '🏥',
            budget: budgetOverview?.total_allocation || '60,000 CHF',
            peopleTargeted: budgetOverview?.target_beneficiaries?.toString() || '55,355',
            indicators: [
                { name: 'Number of people reached with awareness sessions', targeted: '25,067' },
                { name: 'Number of ambulance teams trained', targeted: 6 },
                { name: 'Number of SDB replenishment kit pro-cured', targeted: 1 },
                { name: 'Number of SDB training kits procured', targeted: 2 },
            ],
            needs: 'Emergency health interventions including medical supplies, first aid training, and health awareness sessions for flood-affected communities.',
        },
        {
            id: 'shelter',
            name: 'SHELTER',
            icon: '🏠',
            budget: budgetOverview?.total_allocation || '60,000 CHF',
            peopleTargeted: budgetOverview?.target_beneficiaries?.toString() || '55,355',
            indicators: [
                { name: 'Number of emergency shelters provided', targeted: '840' },
                { name: 'Number of shelter repair kits distributed', targeted: 200 },
                { name: 'Number of people in temporary accommodation', targeted: 1500 },
            ],
            needs: 'Immediate shelter support including emergency accommodation, repair materials, and temporary housing solutions for displaced families.',
        },
        {
            id: 'livelihoods',
            name: 'LIVELIHOODS',
            icon: '🏘️',
            budget: budgetOverview?.total_allocation || '60,000 CHF',
            peopleTargeted: budgetOverview?.target_beneficiaries?.toString() || '55,355',
            indicators: [
                { name: 'Number of cash grants distributed', targeted: '840' },
                { name: 'Number of livelihood restoration activities', targeted: 15 },
                { name: 'Number of people supported with income generation', targeted: 2100 },
            ],
            needs: 'Multi-purpose cash grants and livelihood restoration activities to help affected households recover their economic stability and resilience.',
        },
    ];

    const toggleSectorExpansion = (sectorId: string) => {
        const newExpanded = new Set(expandedSectors);
        if (newExpanded.has(sectorId)) {
            newExpanded.delete(sectorId);
        } else {
            newExpanded.add(sectorId);
        }
        setExpandedSectors(newExpanded);
    };

    if (perDrefSummaryPending) {
        return (
            <div className={styles.operationalStrategy}>
                <p className={styles.loadingText}>
                    {strings.loadingOperationalStrategy}
                </p>
            </div>
        );
    }

    if (perDrefSummaryError) {
        return (
            <div className={styles.operationalStrategy}>
                <p className={styles.errorText}>
                    {strings.errorLoadingOperationalStrategy}
                </p>
            </div>
        );
    }

    return (
        <div className={styles.operationalStrategy}>
            {/* Last Update */}
            <div className={styles.lastUpdate}>
                {strings.lastUpdateLabel}
                {' '}
                12 June, 2025
            </div>

            {/* Top Two-Column Layout */}
            <div className={styles.topSection}>
                <div className={styles.objectivesCard}>
                    <h3 className={styles.cardTitle}>
                        {strings.operationObjectivesTitle}
                    </h3>
                    <p className={styles.contentText}>
                        {operationObjectives || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer sodales sit amet quam non fermentum. Ut finibus fermentum ultrices. Nunc ut elit sollicitudin, malesuada libero non, lobortis nisl. Sed ac elit in augue interdum porta sed nec metus. Nullam pharetra neque id tortor lacinia, in tempor quam rutrum. Pellentesque ullamcorper luctus hendrerit. Integer venenatis diam ac felis auctor, at gravida augue pellentesque. Duis velit orci, dapibus sit amet metus sit amet.'}
                    </p>
                </div>

                <div className={styles.strategyCard}>
                    <h3 className={styles.cardTitle}>
                        {strings.operationStrategyTitle}
                    </h3>
                    <p className={styles.contentText}>
                        {operationStrategy || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer sodales sit amet quam non fermentum. Ut finibus fermentum ultrices. Nunc ut elit sollicitudin, malesuada libero non, lobortis nisl. Sed ac elit in augue interdum porta sed nec metus. Nullam pharetra neque id tortor lacinia, in tempor quam rutrum. Pellentesque ullamcorper luctus hendrerit. Integer venenatis diam ac felis auctor, at gravida augue pellentesque. Duis velit orci, dapibus sit amet metus sit amet.'}
                    </p>
                </div>
            </div>

            {/* AI Disclaimer */}
            <div className={styles.aiDisclaimer}>
                <span className={styles.infoIcon}>
                    ℹ️
                </span>
                <span className={styles.disclaimerText}>
                    {strings.aiDisclaimerText}
                    <button
                        type="button"
                        className={styles.seeHereLink}
                    >
                        {strings.seeHereLink}
                    </button>
                    .
                </span>
            </div>

            {/* Sectors Engaged */}
            <div className={styles.sectionContainer}>
                <h2 className={styles.sectionTitle}>
                    {strings.sectorsEngagedTitle}
                </h2>
                <div className={styles.sectorsGrid}>
                    {engagedSectors.map((sector) => (
                        <div key={sector.id} className={styles.sectorCard}>
                            <span className={styles.sectorIcon}>
                                {sector.icon}
                            </span>
                            <span className={styles.sectorName}>
                                {sector.name}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Operational Sectoral Needs */}
            <div className={styles.sectionContainer}>
                <h2 className={styles.sectionTitle}>
                    {strings.operationalSectoralNeedsTitle}
                </h2>
                <div className={styles.sectoralNeedsContent}>
                    {sectoralNeeds.map((sector) => {
                        const isExpanded = expandedSectors.has(sector.id);
                        return (
                            <div key={sector.id} className={styles.sectoralNeedCard}>
                                <div className={styles.sectorHeader}>
                                    <div className={styles.sectorInfo}>
                                        <span className={styles.sectorIcon}>
                                            {sector.icon}
                                        </span>
                                        <span className={styles.sectorTitle}>
                                            {sector.name}
                                        </span>
                                    </div>
                                    <div className={styles.sectorMetrics}>
                                        <div className={styles.metricGroup}>
                                            <span className={styles.metricLabel}>
                                                {strings.budgetLabel}
                                                :
                                            </span>
                                            <span className={styles.metricValue}>
                                                {sector.budget}
                                            </span>
                                        </div>
                                        <div className={styles.metricGroup}>
                                            <span className={styles.metricLabel}>
                                                {strings.peopleTargetedLabel}
                                                :
                                            </span>
                                            <span className={styles.metricValue}>
                                                {sector.peopleTargeted}
                                            </span>
                                        </div>
                                    </div>
                                    <Button
                                        variant="tertiary"
                                        size="small"
                                        onClick={() => toggleSectorExpansion(sector.id)}
                                        className={styles.expandButton}
                                    >
                                        {isExpanded ? '▲' : '▼'}
                                    </Button>
                                </div>

                                {isExpanded && (
                                    <div className={styles.sectorDetails}>
                                        <div className={styles.indicatorsSection}>
                                            <h4 className={styles.subSectionTitle}>
                                                {strings.indicatorsTitle}
                                            </h4>
                                            <div className={styles.indicatorsTable}>
                                                <div className={styles.tableHeader}>
                                                    <span>
                                                        {strings.targetedLabel}
                                                    </span>
                                                </div>
                                                {sector.indicators.map((indicator) => (
                                                    <div
                                                        key={`${sector.id}-${indicator.name}`}
                                                        className={styles.indicatorRow}
                                                    >
                                                        <span className={styles.indicatorName}>
                                                            {indicator.name}
                                                        </span>
                                                        <span className={styles.indicatorValue}>
                                                            {indicator.targeted}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className={styles.needsSection}>
                                            <h4 className={styles.subSectionTitle}>
                                                {strings.needsTitle}
                                            </h4>
                                            <p className={styles.needsText}>
                                                {sector.needs}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default OperationalStrategy;
