import {
    Container,
    HtmlOutput,
} from '@ifrc-go/ui';
import { useTranslation } from '@ifrc-go/ui/hooks';
import { isTruthyString } from '@togglecorp/fujs';

import i18n from './i18n.json';
import styles from './styles.module.css';

interface Metadata {
    event_id?: number;
    event_name?: string;
    disaster_type?: string;
    country?: string;
    latest_update_number?: number;
    total_operational_updates?: number;
    dref_id?: number;
    dref_title?: string;
    dref_appeal_code?: string;
    dref_date?: string;
}

interface Props {
    /** The full situational-overview HTML/text (manual or AI). */
    overviewText?: string;
    /** Optional metadata (only present when AI hook supplies it). */
    metadata?: Metadata;
    /** Loading & error states (for the AI fetch, if it runs). */
    pending?: boolean;
    error?: unknown;
}

function SituationalOverview(props: Props) {
    const {
        overviewText, metadata, pending, error,
    } = props;
    const strings = useTranslation(i18n);

    /* Format "ABC123 Country Hazard 2025" */
    const formattedMeta = () => {
        if (!metadata) return '';
        const {
            dref_appeal_code, country, disaster_type, dref_date,
        } = metadata;
        const year = dref_date ? new Date(dref_date).getFullYear() : undefined;
        return [dref_appeal_code, country, disaster_type, year]
            .filter(isTruthyString)
            .join(' ');
    };

    return (
        <Container
            heading={strings.situationalOverviewTitle}
            withHeaderBorder
            childrenContainerClassName={styles.situationalOverviewContent}
        >
            {pending && (
                <p>{strings.loadingSituationalOverview || 'Loading Situational Overview…'}</p>
            )}
            {error && (
                <p>{strings.errorLoadingSituationalOverview || 'Error loading overview'}</p>
            )}

            {!pending && !error && (
                <>
                    {isTruthyString(overviewText) ? (
                        <HtmlOutput value={overviewText} className={styles.summaryContent} />
                    ) : (
                        <p>{strings.situationalOverviewNoData}</p>
                    )}

                    {formattedMeta() && (
                        <div className={styles.metadataDisplay}>
                            <span className={styles.metadataLabel}>{formattedMeta()}</span>
                        </div>
                    )}
                </>
            )}
        </Container>
    );
}

export default SituationalOverview;
