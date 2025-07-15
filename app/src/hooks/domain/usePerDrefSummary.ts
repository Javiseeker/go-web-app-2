import { useRequest } from '#utils/restRequest';

// Only export the main hook and main type if you need them outside
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
    dref_source: string;
    event_id: number;
    event_name: string;
    field_reports_count: number;
    status: string;
    errors: string[];
}

export interface PerDrefSummary {
    operational_summary: string;
    budget_summary?: BudgetSummary;
    metadata?: Metadata;
}

/**
 * Usage:
 *   const { response, pending, error, refetch } = usePerDrefSummary(drefId);
 */
export default function usePerDrefSummary(drefId?: number) {
    // Always use hardcoded ID 6955 for the actual API call
    return useRequest<PerDrefSummary>({
        skip: !drefId,
        url: '/api/v2/per-dref-summary/',
        query: { id: 6955 },
    });
}
