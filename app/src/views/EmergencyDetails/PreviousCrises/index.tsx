import { useState, useEffect } from 'react';
import { Container } from '@ifrc-go/ui';
import { useTranslation } from '@ifrc-go/ui/hooks';

import type { IfrcEvent } from '#hooks/domain/useIfrcEvents';

import i18n from './i18n.json';
import styles from './styles.module.css';

interface Props {
    ifrcEvents?: IfrcEvent;
    ifrcEventsPending: boolean;
    ifrcEventsError?: unknown;
}

function PreviousCrises(props: Props) {
    const { ifrcEvents, ifrcEventsPending, ifrcEventsError } = props;
    const strings = useTranslation(i18n);
    const [showAll, setShowAll] = useState(false);

    // Debug logging for data changes
    useEffect(() => {
        console.log('[PreviousCrises] ifrcEvents updated:', ifrcEvents);
    }, [ifrcEvents]);

    const handleEmergencyClick = (eventId: number) => {
        // Open in new tab to production site
        window.open(`https://go.ifrc.org/emergencies/${eventId}/details`, '_blank');
    };

    // Parse lessons
    const getLessons = () => {
        if (!ifrcEvents?.ai_structured_summary) return [];

        // The API response always returns an array of lessons
        if (Array.isArray(ifrcEvents.ai_structured_summary)) {
            return ifrcEvents.ai_structured_summary.map((lesson) => ({
                ...lesson,
                // Handle sources if they exist, otherwise create empty array
                sources: lesson.sources?.map((source) =>
                    typeof source === 'string' ? { PAN: source } : source
                ) || [],
            }));
        }

        return [];
    };

    const lessons = getLessons();

    const fallbackNote = ifrcEvents?.fallback_note;

    const INITIAL_DISPLAY_COUNT = 3;
    const displayedLessons = showAll ? lessons : lessons.slice(0, INITIAL_DISPLAY_COUNT);
    const hasMoreLessons = lessons.length > INITIAL_DISPLAY_COUNT;

    return (
        <Container
            heading={strings.lessonsLearnedTitle}
            withHeaderBorder
            childrenContainerClassName={styles.previousCrisesContent}
        >
            {ifrcEventsPending && <p>{strings.loadingPreviousCrises}</p>}

            {ifrcEventsError && !ifrcEventsPending && <p>{strings.errorLoadingPreviousCrises}</p>}

            {!ifrcEventsPending && !ifrcEventsError && (
                <>
                    {lessons.length > 0 ? (
                        <>
                            {/* AI Disclaimer - show when we have lessons */}
                            <div className={styles.aiDisclaimer}>
                                <span className={styles.disclaimerText}>
                                    {strings.aiDisclaimerText}
                                </span>
                            </div>

                            <div className={styles.lessonsGrid}>
                                {displayedLessons.map((lesson, index) => {
                                    const lessonKey = `${lesson.title}-${index}` || `${lesson.insight}-${index}`;
                                    const operationalLearningSources = lesson.metadata?.operational_learning_source || [];
                                    
                                    return (
                                        <div key={lessonKey} className={styles.lessonCard}>
                                            <h3 className={styles.lessonTitle}>{lesson.title}</h3>
                                            <p className={styles.lessonInsight}>{lesson.insight}</p>
                                            
                                            {/* Recommendations section */}
                                            {lesson.recommendations && lesson.recommendations.length > 0 && (
                                                <div className={styles.recommendationsSection}>
                                                    <h4 className={styles.recommendationsTitle}>{strings.recommendations}</h4>
                                                    <ul className={styles.recommendationsList}>
                                                        {lesson.recommendations.map((recommendation, recIndex) => (
                                                            <li key={recIndex} className={styles.recommendationItem}>
                                                                {recommendation}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            
                                            {/* Source note section */}
                                            {lesson.source_note && (
                                                <div className={styles.sourceNote}>
                                                    <p className={styles.sourceNoteText}>{lesson.source_note}</p>
                                                </div>
                                            )}

                                            {/* Sources section - only show if sources exist */}
                                            {lesson.sources && lesson.sources.length > 0 && (
                                                <div className={styles.lessonSources}>
                                                    {lesson.sources.map((source, sourceIndex) => (
                                                        <span
                                                            key={`${source.PAN}-${sourceIndex}`}
                                                            className={styles.lessonSource}
                                                        >
                                                            {source.PAN}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Operational Learning Sources - show ops learning ID and clickable event link */}
                                            {operationalLearningSources.length > 0 && (
                                                <div className={styles.operationalSources}>
                                                    <h4 className={styles.operationalSourcesTitle}>{strings.operationalLearningSources}</h4>
                                                    {operationalLearningSources.map((source, sourceIndex) => (
                                                        <div
                                                            key={`${source.id}-${sourceIndex}`}
                                                            className={styles.operationalSourceItem}
                                                        >
                                                            <div className={styles.sourceDetails}>
                                                                <div className={styles.sourceNameCode}>
                                                                    {source.name} ({source.code})
                                                                </div>
                                                                <div className={styles.learningId}>
                                                                    Learning ID: {source.id}
                                                                </div>
                                                            </div>
                                                            <span
                                                                className={styles.eventLink}
                                                                onClick={() => handleEmergencyClick(source.event_id)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                                        e.preventDefault();
                                                                        handleEmergencyClick(source.event_id);
                                                                    }
                                                                }}
                                                                role="button"
                                                                tabIndex={0}
                                                                title={`View emergency details for ${source.name}`}
                                                            >
                                                                View Event
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {hasMoreLessons && (
                                <div className={styles.seeMoreContainer}>
                                    <button
                                        type="button"
                                        className={styles.seeMoreButton}
                                        onClick={() => setShowAll(!showAll)}
                                    >
                                        {showAll ? strings.showLess : strings.seeMore}
                                    </button>
                                </div>
                            )}
                        </>
                    ) : null}

                    {fallbackNote && (
                        <div className={styles.fallbackNote}>
                            <p className={styles.fallbackText}>
                                No operational learnings have been recorded in the system for this context yet. You're welcome to check the{' '}
                                <a
                                    href="https://go.ifrc.org/operational-learning"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.fallbackLink}
                                >
                                    Ops Learning dashboard
                                </a>
                                {' '}and the{' '}
                                <a
                                    href="https://www.ifrc.org/evaluations"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.fallbackLink}
                                >
                                    IFRC's evaluations database
                                </a>
                                {' '}to learn more.
                            </p>
                        </div>
                    )}
                </>
            )}
        </Container>
    );
}

export default PreviousCrises;