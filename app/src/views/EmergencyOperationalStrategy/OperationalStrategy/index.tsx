import { useState } from 'react';
import { Button } from '@ifrc-go/ui';
import { useTranslation } from '@ifrc-go/ui/hooks';

import type { PerDrefSummary } from '#hooks/domain/usePerDrefSummary';

import i18n from './i18n.json';
import styles from './styles.module.css';

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
    actionsTaken?: string;
    description?: string;
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
    const [showMetadata, setShowMetadata] = useState(false);

    // Extract data from API response
    const operationalSummary = perDrefSummary?.operational_summary || '';
    const budgetOverview = perDrefSummary?.budget_summary?.budget_overview;
    const sectors = perDrefSummary?.sectors || [];
    const metadata = perDrefSummary?.metadata;
    
    // Map API sectors to engaged sectors display - SHOW ALL SECTORS
    const engagedSectors = sectors
        .filter((sector) => sector.future_actions && sector.future_actions.length > 0)
        .map((sector) => ({
            id: sector.title,
            name: sector.title_display,
            icon: getSectorIcon(sector.title),
        }));

    // Map API sectors to sectoral needs data - SHOW ALL SECTORS
    const sectoralNeeds: SectorData[] = sectors
        .filter((sector) => sector.future_actions && sector.future_actions.length > 0)
        .map((sector) => {
            // Calculate total budget for the sector
            const totalBudget = sector.future_actions.reduce((sum, action) => sum + (action.budget || 0), 0);
            
            // Calculate total people targeted
            const totalPeopleTargeted = sector.future_actions.reduce((sum, action) => {
                return sum + (action.people_targeted_total || 0);
            }, 0);

            // Extract all indicators from all future actions
            const allIndicators = sector.future_actions.flatMap((action) => 
                action.indicators.map((indicator) => ({
                    name: indicator.title,
                    targeted: indicator.people_targeted,
                }))
            );

            return {
                id: sector.title,
                name: sector.title_display.toUpperCase(),
                icon: getSectorIcon(sector.title),
                budget: totalBudget > 0 ? `${totalBudget.toLocaleString()} CHF` : '--',
                peopleTargeted: totalPeopleTargeted > 0 ? totalPeopleTargeted.toLocaleString() : '--',
                indicators: allIndicators,
                needs: sector.needs_summary || '',
                actionsTaken: sector.actions_taken_summary || '',
                description: sector.future_actions[0]?._description || '',
            };
        });

    const toggleSectorExpansion = (sectorId: string) => {
        const newExpanded = new Set(expandedSectors);
        if (newExpanded.has(sectorId)) {
            newExpanded.delete(sectorId);
        } else {
            newExpanded.add(sectorId);
        }
        setExpandedSectors(newExpanded);
    };

    const handleBudgetFileView = () => {
        if (metadata?.dref_budget_file) {
            // Open in new tab for viewing
            window.open(metadata.dref_budget_file, '_blank', 'noopener,noreferrer');
        }
    };

    if (perDrefSummaryPending) {
        return (
            <div className={styles.operationalStrategy}>
                <div className={styles.loadingContainer}>
                    <div className={styles.loadingSpinner} />
                    <p className={styles.loadingText}>
                        Loading operational strategy...
                    </p>
                </div>
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
            {/* AI Disclaimer - MOVED TO TOP */}
            <div className={styles.aiDisclaimer}>
                <span className={styles.disclaimerText}>
                    The content below has been generated or summarised by AI models.{' '}
                    <button
                        type="button"
                        className={styles.seeHereLink}
                        onClick={() => setShowMetadata(!showMetadata)}
                    >
                        See original submission
                    </button>
                    .
                </span>
            </div>

            {/* Metadata Section - Using Rapid Response File Styles */}
            {showMetadata && metadata && (
                <div className={styles.metadataSection}>
                    <div className={styles.metadataHeader}>
                        <h3>Original Submission Details</h3>
                        <button
                            type="button"
                            className={styles.closeButton}
                            onClick={() => setShowMetadata(false)}
                        >
                            ✕
                        </button>
                    </div>
                    <div className={styles.metadataContent}>
                        <div className={styles.metadataGrid}>
                            <div className={styles.metadataInfo}>
                                <p><strong>DREF ID:</strong> {metadata.dref_id}</p>
                                <p><strong>Appeal Code:</strong> {metadata.dref_appeal_code}</p>
                                <p><strong>Title:</strong> {metadata.dref_title}</p>
                                <p><strong>Date:</strong> {formatDate(metadata.dref_date)}</p>
                                <p><strong>Created:</strong> {formatDate(metadata.dref_created_at)}</p>
                                <p><strong>Type:</strong> {perDrefSummary?.dref_type}</p>
                                <p><strong>Onset:</strong> {perDrefSummary?.dref_onset}</p>
                                <p><strong>Operation Update Number:</strong> {metadata.dref_op_update_number}</p>
                            </div>
                            
                            {/* Budget File using Rapid Response styles */}
                            {metadata.dref_budget_file && (
                                <div className={styles.budgetFileSection}>
                                    <h4 className={styles.budgetFileTitle}>Budget Document</h4>
                                    <div className={styles.filesList}>
                                        <div className={styles.fileItem}>
                                            <div className={styles.fileIcon}>
                                                📄
                                            </div>
                                            <div className={styles.fileDetails}>
                                                <button
                                                    type="button"
                                                    className={styles.fileName}
                                                    onClick={handleBudgetFileView}
                                                    title="View Budget Document in new tab"
                                                >
                                                    {metadata.dref_title} - Budget Document
                                                </button>
                                                <p className={styles.fileDescription}>
                                                    Official budget documentation for this DREF operation
                                                </p>
                                                <div className={styles.fileMeta}>
                                                    <span className={styles.fileSize}>Budget Preview</span>
                                                    <span className={styles.fileSeparator}>•</span>
                                                    <span className={styles.fileDate}>
                                                        {formatDate(metadata.dref_date)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Last Update */}
            <div className={styles.lastUpdate}>
                {strings.lastUpdateLabel}
                {' '}
                {formatDate(metadata?.dref_date || metadata?.dref_created_at) || '12 June, 2025'}
            </div>

            {/* Operation Strategy - Full Width */}
            <div className={styles.fullWidthSection}>
                <div className={styles.strategyCard}>
                    <h3 className={styles.cardTitle}>
                        {strings.operationStrategyTitle}
                    </h3>
                    <p className={styles.contentText}>
                        {operationalSummary || 'No operational summary available.'}
                    </p>
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
                                <div
                                  className={styles.sectorHeader}
                                  onClick={() => toggleSectorExpansion(sector.id)}
                                  role="button"
                                  tabIndex={0}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      toggleSectorExpansion(sector.id);
                                    }
                                  }}
                                  aria-expanded={isExpanded}
                                >
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
                                                {strings.budgetLabel}:
                                            </span>
                                            <span className={styles.metricValue}>
                                                {sector.budget}
                                            </span>
                                        </div>
                                        <div className={styles.metricGroup}>
                                            <span className={styles.metricLabel}>
                                                {strings.peopleTargetedLabel}:
                                            </span>
                                            <span className={styles.metricValue}>
                                                {sector.peopleTargeted}
                                            </span>
                                        </div>
                                    </div>
                                    <span className={styles.expandIcon}>
                                        {isExpanded ? '▲' : '▼'}
                                    </span>
                                </div>

                                {isExpanded && (
                                    <div className={styles.sectorDetails}>
                                        {sector.actionsTaken && (
                                            <div className={styles.actionsTakenSection}>
                                                <h4 className={styles.subSectionTitle}>
                                                    Actions Taken
                                                </h4>
                                                <p className={styles.needsText}>
                                                    {sector.actionsTaken}
                                                </p>
                                            </div>
                                        )}

                                        {sector.needs && (
                                            <div className={styles.needsSection}>
                                                <h4 className={styles.subSectionTitle}>
                                                    {strings.needsTitle}
                                                </h4>
                                                <p className={styles.needsText}>
                                                    {sector.needs}
                                                </p>
                                            </div>
                                        )}

                                        {sector.indicators.length > 0 && (
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
                                                    {sector.indicators.map((indicator, index) => (
                                                        <div
                                                            key={`${sector.id}-indicator-${index}`}
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
                                        )}

                                        {sector.description && (
                                            <div className={styles.plannedActionsSection}>
                                                <h4 className={styles.subSectionTitle}>
                                                    {strings.plannedActionsTitle || 'Intervention'}
                                                </h4>
                                                <p className={styles.needsText}>
                                                    {sector.description}
                                                </p>
                                            </div>
                                        )}
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

// Helper function to map sector titles to icons
function getSectorIcon(sectorTitle: string): string {
    const iconMap: Record<string, string> = {
        health: '🏥',
        shelter: '🏠',
        shelter_housing_and_settlements: '🏠',
        livelihoods: '🏘️',
        livelihoods_and_basic_needs: '🏘️',
        water_sanitation_and_hygiene: '💧',
        protection_gender_and_inclusion: '👥',
        community_engagement_and_accountability: '📢',
        multi_purpose_cash: '💵',
        risk_reduction_climate_adaptation_and_recovery: '🌍',
        national_society_strengthening: '🏛️',
        coordination_and_partnerships: '🤝',
        secretariat_services: '📋',
    };

    return iconMap[sectorTitle] || '📌';
}

// Helper function to format date
function formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    } catch {
        return dateString;
    }
}

export default OperationalStrategy;