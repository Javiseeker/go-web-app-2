import {
    Container,
    HtmlOutput,
} from '@ifrc-go/ui';
import { useTranslation } from '@ifrc-go/ui/hooks';
import { isTruthyString } from '@togglecorp/fujs';

import i18n from './i18n.json';
import styles from './styles.module.css';

interface PerDrefSituationalOverviewResponse {
    situational_overview: string;
    metadata: {
        event_id: number;
        event_name: string;
        disaster_type: string;
        country: string;
        latest_update_number: number;
        total_operational_updates: number;
        dref_id: number;
        dref_title: string;
        dref_date: string;
    };
}

interface Props {
    situationalOverviewResponse?: PerDrefSituationalOverviewResponse;
    pending?: boolean;
    error?: any;
}

function SituationalOverview(props: Props) {
    const { situationalOverviewResponse, pending, error } = props;
    const strings = useTranslation(i18n);

    return (
        <Container
            heading={strings.situationalOverviewTitle}
            withHeaderBorder
            childrenContainerClassName={styles.situationalOverviewContent}
        >
            {pending && <p>{strings.loading || 'Loading...'}</p>}
            {error && <p>{strings.errorLoadingData || 'Error loading data'}</p>}
            {!pending && !error && isTruthyString(situationalOverviewResponse?.situational_overview) ? (
                <HtmlOutput
                    value={situationalOverviewResponse.situational_overview}
                    className={styles.summaryContent}
                />
            ) : !pending && !error && (
                <p>{strings.situationalOverviewNoData}</p>
            )}
        </Container>
    );
}

export default SituationalOverview;