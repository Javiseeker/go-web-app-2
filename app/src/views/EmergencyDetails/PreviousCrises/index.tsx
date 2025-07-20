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
    const {
        ifrcEvents,
        ifrcEventsPending,
        ifrcEventsError,
    } = props;

    const strings = useTranslation(i18n);

    const lessons = ifrcEvents?.ai_structured_summary?.lessons || [];
    const fallbackNote = ifrcEvents?.ai_structured_summary?.fallback_note;

    return (
        <Container
            heading={strings.lessonsLearnedTitle}
            withHeaderBorder
            childrenContainerClassName={styles.previousCrisesContent}
        >
            {ifrcEventsPending && (
                <p className={styles.placeholderText}>
                    {strings.loadingPreviousCrises}
                </p>
            )}

            {ifrcEventsError && !ifrcEventsPending && (
                <p className={styles.placeholderText}>
                    {strings.errorLoadingPreviousCrises}
                </p>
            )}

            {!ifrcEventsPending && !ifrcEventsError && (
                <>
                    {lessons.length > 0 ? (
                        <div className={styles.lessonsGrid}>
                            {lessons.map((lesson) => {
                                const lessonKey = lesson.title || lesson.insight;
                                return (
                                    <div key={lessonKey} className={styles.lessonCard}>
                                        <h3 className={styles.lessonTitle}>
                                            {lesson.title}
                                        </h3>
                                        <p className={styles.lessonInsight}>
                                            {lesson.insight}
                                        </p>
                                        <div className={styles.lessonSources}>
                                            {lesson.sources.map((source) => (
                                                <span
                                                    key={source.PAN}
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
                    ) : (
                        <p className={styles.placeholderText}>
                            {strings.noLessonsLearnedData}
                        </p>
                    )}

                    {fallbackNote && (
                        <div className={styles.fallbackNote}>
                            <p>
                                {fallbackNote}
                            </p>
                        </div>
                    )}
                </>
            )}
        </Container>
    );
}

export default PreviousCrises;
