import { useRequest } from '#utils/restRequest';
import { useMemo } from 'react';

// Cache object to store responses
const cache = new Map<string, { data: PerDrefSummary; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

interface BudgetOverview {
    total_allocation: string;
    operation_timeframe: string;
    target_beneficiaries: number;
    cost_per_beneficiary: string;
    funding_status: string;
}

interface SectoralBreakdown {
    summary: string;
    major_sectors: string[];
    support_costs: string;
}

interface FinancialAnalysis {
    summary: string;
    key_insights: string[];
    resource_allocation_strategy: string;
    cost_effectiveness_assessment: string;
}

interface OperationalCosts {
    human_resources: string;
    logistics_and_operations: string;
    coordination_and_partnerships: string;
    monitoring_and_evaluation: string;
}

interface BudgetSummary {
    budget_overview?: BudgetOverview;
    sectoral_breakdown?: SectoralBreakdown;
    financial_analysis?: FinancialAnalysis;
    operational_costs?: OperationalCosts;
    confidence_level?: string;
    data_quality_notes?: string;
}

interface Metadata {
    dref_id: number;
    dref_title: string;
    dref_appeal_code: string; // NEW - Added appeal code
    dref_date: string;
    dref_created_at: string;
    dref_budget_file: string;
    dref_op_update_number: number;
    dref_source?: string;
    event_id?: number;
    event_name?: string;
    field_reports_count?: number;
    status?: string;
    errors?: string[];
}

interface Indicator {
    title: string;
    people_targeted: number;
}

interface FutureAction {
    indicators: Indicator[];
    budget: number;
    people_targeted_total: number | null;
    needs_addressed: string; // NEW - Added needs addressed field
}

interface Sector {
    title: string;
    title_display: string;
    actions_taken_summary?: string; // Made optional since some sectors don't have this
    needs_summary: string;
    future_actions: FutureAction[];
}

export interface PerDrefSummary {
    operational_summary: string;
    sectors: Sector[];
    dref_type: string;
    dref_onset: string;
    budget_summary?: BudgetSummary;
    metadata?: Metadata;
}

/**
 * Usage:
 *   const { response, pending, error, refetch } = usePerDrefSummary(drefId);
 */
export default function usePerDrefSummary(drefId?: number) {
    // Hardcode the ID for testing
    const hardcodedId = 6955;
    const cacheKey = `dref-summary-${hardcodedId}`;
        
    // Check cache
    const cachedData = useMemo(() => {
        const cached = cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.data;
        }
        return null;
    }, [cacheKey]);
        
    const { response, pending, error, refetch } = useRequest<PerDrefSummary>({
        skip: !!cachedData, // Skip if we have cached data
        url: '/api/v2/per-dref-summary/',
        query: { id: hardcodedId },
        onSuccess: (data) => {
            // Cache the successful response
            if (data) {
                cache.set(cacheKey, { data, timestamp: Date.now() });
            }
        },
    });
        
    // Return cached data if available, otherwise return fresh response
    return {
        response: cachedData || response,
        pending: !cachedData && pending,
        error: !cachedData ? error : undefined,
        refetch,
    };
}