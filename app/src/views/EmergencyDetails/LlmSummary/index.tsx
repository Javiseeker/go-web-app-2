import { useState, useCallback } from 'react';
import { useTranslation } from '@ifrc-go/ui/hooks';
import {
    Button,
    Container,
    HtmlOutput,
    Message,
} from '@ifrc-go/ui';
import {
    isDefined,
} from '@togglecorp/fujs';
import {
    CopyLineIcon,
    RefreshLineIcon,
} from '@ifrc-go/icons';

import i18n from './i18n.json';
import styles from './styles.module.css';

interface Props {
    emergencyId: number;
}

interface LLMSummary {
    id: number;
    title: string;
    content: string;
    generated_at: string;
    confidence_score?: number;
}

function LLMSummaries(props: Props) {
    const { emergencyId } = props;
    const strings = useTranslation(i18n);

    const [apiMessage, setApiMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);

    const summaries: LLMSummary[] = [
        {
            id: 1,
            title: 'Learnings from the field reports',
            content: 'This emergency has affected multiple regions with significant humanitarian needs. The response has been coordinated across various sectors including shelter, health, and water/sanitation.',
            generated_at: new Date().toISOString(),
            confidence_score: 0.85,
        },
    ];

    const hasSummaries = summaries.length > 0;

    const handleCopy = useCallback(() => {
        if (isDefined(summaries[0]?.content)) {
            navigator.clipboard.writeText(summaries[0].content);
        }
    }, [summaries]);

    const handleRegenerate = async () => {
        setIsLoading(true);
        setHasError(false);
    
        try {
            const response = await fetch('http://localhost:8000/api/v2/how-are-you/', {
                method: 'GET',
            });
    
            const text = await response.text();
            console.log('Raw API response:', text);
    
            const data = JSON.parse(text);
            console.log('Parsed JSON:', data);
    
            if (!response.ok || !data.message) {
                throw new Error('Bad response or missing message');
            }
    
            setApiMessage(data.message || 'No message');
        } catch (error) {
            console.error('Failed to sync:', error);
            setHasError(true);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <Container
                className={styles.llmSummariesContainer}
                heading={strings.llmSummariesTitle}
                withHeaderBorder
            >
                <Message
                    pending
                    title="Regenerating summary..."
                />
            </Container>
        );
    }

    if (hasError) {
        return (
            <Container
                className={styles.llmSummariesContainer}
                heading={strings.llmSummariesTitle}
                withHeaderBorder
            >
                <Message
                    title="Failed to regenerate summary."
                    variant="error"
                />
            </Container>
        );
    }

    if (!hasSummaries) {
        return (
            <Container
                className={styles.llmSummariesContainer}
                heading={strings.llmSummariesTitle}
                withHeaderBorder
            >
                <Message
                    title={strings.llmSummariesEmpty}
                    variant="info"
                />
            </Container>
        );
    }

    return (
        <Container
            className={styles.llmSummariesContainer}
            heading={strings.llmSummariesTitle}
            withHeaderBorder
            childrenContainerClassName={styles.summariesContent}
            actions={(
                <div className={styles.actions}>
                    <Button
                        name="copy"
                        onClick={handleCopy}
                        variant="tertiary"
                        icons={<CopyLineIcon />}
                    >
                        Copy
                    </Button>
                    <Button
                        name="sync"
                        onClick={handleRegenerate}
                        variant="tertiary"
                        icons={<RefreshLineIcon />}
                        disabled={isLoading}
                    >
                        Sync
                    </Button>
                </div>
            )}
        >
            {summaries.map((summary: LLMSummary) => (
                <div
                    key={summary.id}
                    className={styles.summaryItem}
                >
                    <div className={styles.summaryHeader}>
                        <h4 className={styles.summaryTitle}>
                            {summary.title}
                        </h4>
                        {summary.generated_at && (
                            <span className={styles.summaryDate}>
                                {new Date(summary.generated_at).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                    <div className={styles.summaryContent}>
                        <HtmlOutput value={summary.content} />
                    </div>
                    {summary.confidence_score && (
                        <div className={styles.confidenceScore}>
                            Confidence: {Math.round(summary.confidence_score * 100)}%
                        </div>
                    )}
                </div>
            ))}

            {apiMessage && (
                <Message
                    title={apiMessage}
                    variant="info"
                />
            )}
        </Container>
    );
}

export default LLMSummaries;
