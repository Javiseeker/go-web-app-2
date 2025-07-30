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
                            <div className={styles.lessonsGrid}>
                                {displayedLessons.map((lesson, index) => {
                                    const lessonKey = `${lesson.title}-${index}` || `${lesson.insight}-${index}`;
                                    const eventIds = lesson.metadata?.eventID || [];
                                    const operationalLearningSource = lesson.metadata?.operational_learning_source?.[0];
                                    
                                    return (
                                        <div key={lessonKey} className={styles.lessonCard}>
                                            <h3 className={styles.lessonTitle}>{lesson.title}</h3>
                                            <p className={styles.lessonInsight}>{lesson.insight}</p>
                                            
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

                                            {/* Emergency link section */}
                                            {operationalLearningSource && eventIds.length > 0 && (
                                                <div className={styles.lessonSources}>
                                                    {eventIds.map((eventId, eventIndex) => (
                                                        <span
                                                            key={`${eventId}-${eventIndex}`}
                                                            className={styles.lessonSource}
                                                            onClick={() => handleEmergencyClick(eventId)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' || e.key === ' ') {
                                                                    e.preventDefault();
                                                                    handleEmergencyClick(eventId);
                                                                }
                                                            }}
                                                            role="button"
                                                            tabIndex={0}
                                                            title={`View emergency details for ${operationalLearningSource} #${eventId}`}
                                                        >
                                                            {operationalLearningSource} #{eventId}
                                                        </span>
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
                    ) : (
                        <p>{strings.noLessonsLearnedData}</p>
                    )}

                    {fallbackNote && (
                        <div className={styles.fallbackNote}>
                            <p>{fallbackNote}</p>
                        </div>
                    )}
                </>
            )}
        </Container>
    );
}

export default PreviousCrises;