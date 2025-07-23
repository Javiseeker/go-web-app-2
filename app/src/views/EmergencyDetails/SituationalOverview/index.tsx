import {
    Container,
    HtmlOutput,
} from '@ifrc-go/ui';
import { useTranslation } from '@ifrc-go/ui/hooks';
import { isTruthyString } from '@togglecorp/fujs';

import i18n from './i18n.json';
import styles from './styles.module.css';

type EmergencyResponse = {
    summary?: string;
};

type PerDrefStatus = {
    type_of_onset_display?: string;
    type_of_dref_display?: string;
};

interface Props {
    emergencyResponse?: EmergencyResponse;
    perDrefStatus?: PerDrefStatus;
}

function SituationalOverview(props: Props) {
    const { emergencyResponse, perDrefStatus } = props;
    const strings = useTranslation(i18n);

    return (
        <Container
            heading={strings.situationalOverviewTitle}
            withHeaderBorder
            childrenContainerClassName={styles.situationalOverviewContent}
        >
            {isTruthyString(emergencyResponse?.summary) ? (
                <HtmlOutput
                    value={emergencyResponse.summary}
                    className={styles.summaryContent}
                />
            ) : (
                <p>{strings.situationalOverviewNoData}</p>
            )}
        </Container>
    );
}

export default SituationalOverview;
