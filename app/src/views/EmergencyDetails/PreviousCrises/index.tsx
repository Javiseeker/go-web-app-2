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

    // Parse lessons
    const getLessons = () => {
        if (!ifrcEvents?.ai_structured_summary) return [];

        if (Array.isArray(ifrcEvents.ai_structured_summary)) {
            return ifrcEvents.ai_structured_summary.map((lesson) => ({
                ...lesson,
                sources: lesson.sources.map((source) =>
                    typeof source === 'string' ? { PAN: source } : source
                ),
            }));
        }

        if (typeof ifrcEvents.ai_structured_summary === 'object') {
            return ifrcEvents.ai_structured_summary.lessons || [];
        }

        return [];
    };

    const lessons = getLessons();

    const fallbackNote =
        ifrcEvents?.fallback_note ||
        (typeof ifrcEvents?.ai_structured_summary === 'object' &&
        !Array.isArray(ifrcEvents.ai_structured_summary)
            ? ifrcEvents.ai_structured_summary.fallback_note
            : undefined);

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
                                    return (
                                        <div key={lessonKey} className={styles.lessonCard}>
                                            <h3 className={styles.lessonTitle}>{lesson.title}</h3>
                                            <p className={styles.lessonInsight}>{lesson.insight}</p>
                                            <div className={styles.lessonSources}>
                                                {lesson.sources?.map((source, sourceIndex) => (
                                                    <span
                                                        key={`${source.PAN}-${sourceIndex}`}
                                                        className={styles.lessonSource}
                                                    >
                                                        {source.PAN}
                                                    </span>
                                                ))}
                                            </div>
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
