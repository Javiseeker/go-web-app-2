import {
    Container,
    TextOutput,
} from '@ifrc-go/ui';
import { useTranslation } from '@ifrc-go/ui/hooks';
import { isDefined } from '@togglecorp/fujs';

import SeverityIndicator from '#components/domain/SeverityIndicator';

import i18n from './i18n.json';
import styles from './styles.module.css';

type EmergencyResponse = {
    ifrc_severity_level_display?: string;
    ifrc_severity_level?: number;
    disaster_start_date?: string;
    visibility?: string;
    glide?: string;
};

type DisasterType = {
    id: number;
    name: string;
};

interface Props {
    emergencyResponse: EmergencyResponse;
    disasterType?: DisasterType;
    visibilityMap?: Record<string, string>;
    mdrCode?: string;
    assistanceIsRequestedByNS?: boolean;
    assistanceIsRequestedByCountry?: boolean;
}

function Overview(props: Props) {
    const {
        emergencyResponse,
        disasterType,
        visibilityMap,
        mdrCode,
        assistanceIsRequestedByNS,
        assistanceIsRequestedByCountry,
    } = props;

    const strings = useTranslation(i18n);

    return (
        <Container
            heading={strings.emergencyOverviewTitle}
            withHeaderBorder
            childrenContainerClassName={styles.overviewContent}
        >
            <TextOutput
                className={styles.overviewItem}
                label={strings.disasterCategorization}
                value={(
                    <div className={styles.disasterCategoryValue}>
                        <span>{emergencyResponse.ifrc_severity_level_display}</span>
                        <SeverityIndicator
                            level={emergencyResponse.ifrc_severity_level}
                        />
                    </div>
                )}
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
                label={strings.mdrCode}
                value={mdrCode}
                strongValue
            />
            <TextOutput
                className={styles.overviewItem}
                label={strings.glideNumber}
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
    );
}

export default Overview;
