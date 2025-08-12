import {
    Container,
    TextOutput,
} from '@ifrc-go/ui';
import { useTranslation } from '@ifrc-go/ui/hooks';
import { isDefined } from '@togglecorp/fujs';

import SeverityIndicator from '#components/domain/SeverityIndicator';

import i18n from '../i18n.json';
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
                label={strings.overviewDisasterCategorization}
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
                label={strings.overviewDisasterType}
                value={disasterType?.name}
                strongValue
            />
            <TextOutput
                label={strings.overviewStartDate}
                valueType="date"
                value={emergencyResponse?.disaster_start_date}
                strongValue
            />
            <TextOutput
                label={strings.overviewVisibility}
                value={isDefined(emergencyResponse.visibility)
                    ? visibilityMap?.[emergencyResponse.visibility]
                    : '--'}
                strongValue
            />
            <TextOutput
                label={strings.overviewMdrCode}
                value={mdrCode}
                strongValue
            />
            <TextOutput
                label={strings.overviewGlideNumber}
                value={emergencyResponse?.glide}
                strongValue
            />
            <TextOutput
                label={strings.overviewAssistanceRequestedByNS}
                valueType="boolean"
                value={assistanceIsRequestedByNS}
                strongValue
            />
            <TextOutput
                label={strings.overviewAssistanceRequestedByGovernment}
                valueType="boolean"
                value={assistanceIsRequestedByCountry}
                strongValue
            />
        </Container>
    );
}

export default Overview;
