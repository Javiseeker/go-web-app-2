import { Container } from '@ifrc-go/ui';
import { useTranslation } from '@ifrc-go/ui/hooks';

import type { RapidResponseData } from '#hooks/domain/useRapidResponse';

import i18n from './i18n.json';
import styles from './styles.module.css';

interface Props {
    className?: string;
    rapidResponseData?: RapidResponseData;
    rapidResponsePending: boolean;
    rapidResponseError?: unknown;
}

function RapidResponse({ 
    className, 
    rapidResponseData, 
    rapidResponsePending, 
    rapidResponseError 
}: Props) {
    const strings = useTranslation(i18n);

    const handleFileDownload = () => {
        if (rapidResponseData?.file_url) {
            const link = document.createElement('a');
            link.href = rapidResponseData.file_url;
            link.download = 'rapid_response_capacity_questions.xlsx';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    if (rapidResponsePending) {
        return (
            <Container
                className={className}
                heading={strings.rapidResponseTitle}
                withHeaderBorder
            >
                <div className={styles.rapidResponseContent}>
                    <p>{strings.loadingRapidResponse || 'Loading rapid response data...'}</p>
                </div>
            </Container>
        );
    }

    if (rapidResponseError || !rapidResponseData?.file_url) {
        return (
            <Container
                className={className}
                heading={strings.rapidResponseTitle}
                withHeaderBorder
            >
                <div className={styles.rapidResponseContent}>
                    <p>{strings.noRapidResponseData || 'No rapid response data available for this emergency.'}</p>
                </div>
            </Container>
        );
    }

    return (
        <Container
            className={className}
            heading={strings.rapidResponseTitle}
            withHeaderBorder
        >
            <div className={styles.rapidResponseContent}>
                <div className={styles.filesList}>
                    <div
                        className={styles.fileItem}
                        tabIndex={0}
                        role="button"
                        onClick={handleFileDownload}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleFileDownload();
                            }
                        }}
                        aria-label={`${strings.rapidResponseDownloadFile || 'Download'} Rapid Response Capacity Questions`}
                    >
                        <div className={styles.fileIcon}>📊</div>
                        <div className={styles.fileDetails}>
                            <button
                                type="button"
                                className={styles.fileName}
                                onClick={(e) => { e.stopPropagation(); handleFileDownload(); }}
                                title={`${strings.rapidResponseDownloadFile || 'Download'}: Rapid Response Capacity Questions`}
                            >
                                Rapid Response Capacity Questions.xlsx
                            </button>
                            <p className={styles.fileDescription}>
                                {strings.rapidResponseFileDescription || 'Pre-filled capacity assessment questionnaire based on emergency context'}
                            </p>
                            <div className={styles.fileMeta}>
                                <span className={styles.fileSize}>Excel File</span>
                                <span className={styles.fileSeparator}>•</span>
                                <span className={styles.fileDate}>
                                    {strings.generatedFile || 'Generated for this emergency'}
                                </span>
                            </div>
                        </div>
                        <button
                            type="button"
                            className={styles.downloadButton}
                            onClick={(e) => { e.stopPropagation(); handleFileDownload(); }}
                            aria-label={`${strings.rapidResponseDownloadFile || 'Download'} Rapid Response Capacity Questions`}
                        >
                            ⬇
                        </button>
                    </div>
                </div>
            </div>
        </Container>
    );
}

export default RapidResponse;
