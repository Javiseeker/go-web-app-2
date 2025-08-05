// PreviousCrises.tsx
// -------------------------------------------------------
// 3-column grid – shows 3 cards initially.
// Collapsed card: title + full insight + “View details ↓”.
// -------------------------------------------------------

import { useState, useMemo } from 'react';
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

const DESKTOP_COLUMNS = 3;
const INITIAL_DISPLAY_COUNT = 3; // one single row

function PreviousCrises(props: Props) {
    const { ifrcEvents, ifrcEventsPending, ifrcEventsError } = props;
    const strings = useTranslation(i18n);

    const [showAll, setShowAll] = useState(false);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    /* ------------------------------------------------- */
    /* Data                                              */
    /* ------------------------------------------------- */
    const lessons = ifrcEvents?.ai_structured_summary ?? [];
    const fallbackNote = ifrcEvents?.fallback_note;

    const visible = showAll ? lessons : lessons.slice(0, INITIAL_DISPLAY_COUNT);
    const hasMore = lessons.length > INITIAL_DISPLAY_COUNT;

    /* distribute 0,3,6… → col-0 | 1,4,7… → col-1 | 2,5,8… → col-2 */
    const columns = useMemo(() => {
        const cols: typeof lessons[][] = Array.from({ length: DESKTOP_COLUMNS }, () => []);
        visible.forEach((l, i) => cols[i % DESKTOP_COLUMNS].push(l));
        return cols;
    }, [visible]);

    const toggle = (key: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setExpanded(prev => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };

    const openEvent = (id: number) =>
        window.open(`https://go.ifrc.org/emergencies/${id}/details`, '_blank');

    /* ------------------------------------------------- */
    /* Render                                            */
    /* ------------------------------------------------- */
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
                    {lessons.length > 0 && (
                        <>
                            {/* AI disclaimer */}
                            <div className={styles.fallbackNote}>
                                <p className={styles.fallbackText}>{strings.aiDisclaimerText}</p>
                            </div>

                            {/* three flex-columns */}
                            <div className={styles.columnsWrapper}>
                                {columns.map((col, cIdx) => (
                                    <div key={cIdx} className={styles.column}>
                                        {col.map((lesson, rIdx) => {
                                            const key = `c${cIdx}r${rIdx}`;
                                            const isOpen = expanded.has(key);
                                            const sources =
                                                lesson?.metadata?.operational_learning_source ?? [];

                                            return (
                                                <div
                                                    key={key}
                                                    className={`${styles.card} ${
                                                        isOpen ? styles.open : ''
                                                    }`}
                                                    onClick={(e) => toggle(key, e)}
                                                    role="button"
                                                    tabIndex={0}
                                                >
                                                    <h3 className={styles.title}>{lesson.title}</h3>

                                                    {/* full insight always visible */}
                                                    <p className={styles.insight}>{lesson.insight}</p>

                                                    <div className={styles.expandHint}>
                                                        {isOpen ? 'Hide details ↑' : 'View details ↓'}
                                                    </div>

                                                    {isOpen && (
                                                        <>
                                                            {lesson.source_note && (
                                                                <div className={styles.sourceNote}>
                                                                    <p className={styles.sourceNoteText}>
                                                                        {lesson.source_note}
                                                                    </p>
                                                                </div>
                                                            )}

                                                            {lesson.rr_questions?.length > 0 && (
                                                                <div className={styles.rrSection}>
                                                                    <div className={styles.rrHeader}>
                                                                        <h4 className={styles.rrHeading}>
                                                                            Readiness and Response Questions
                                                                        </h4>
                                                                        {lesson.area && (
                                                                            <span className={styles.areaTag}>
                                                                                {lesson.area}
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    <ul className={styles.rrList}>
                                                                        {lesson.rr_questions.map((q, i) => (
                                                                            <li key={i} className={styles.rrItem}>
                                                                                {q}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}

                                                            {!lesson.rr_questions?.length && lesson.area && (
                                                                <div className={styles.areaOnlySection}>
                                                                    <span className={styles.areaTag}>{lesson.area}</span>
                                                                </div>
                                                            )}

                                                            {sources.length > 0 && (
                                                                <div className={styles.sourcesBlock}>
                                                                    <h4 className={styles.sourcesHeading}>Related Events</h4>
                                                                    {sources.map((src: any) => (
                                                                        <div key={src.id} className={styles.sourceRow}>
                                                                            <div className={styles.sourceDetails}>
                                                                                <div className={styles.sourceNameCode}>
                                                                                    {src.name} ({src.code})
                                                                                </div>
                                                                                <div className={styles.learningId}>
                                                                                    Learning&nbsp;ID:&nbsp;{src.id}
                                                                                </div>
                                                                            </div>
                                                                            <span
                                                                                className={styles.eventLink}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    openEvent(src.event_id);
                                                                                }}
                                                                                role="button"
                                                                                tabIndex={0}
                                                                            >
                                                                                View Event
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>

                            {hasMore && (
                                <div className={styles.seeMoreContainer}>
                                    <button
                                        type="button"
                                        className={styles.seeMoreButton}
                                        onClick={() => setShowAll((s) => !s)}
                                    >
                                        {showAll ? strings.showLess : strings.seeMore}
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {fallbackNote && (
                        <div className={styles.fallbackNote}>
                            <p className={styles.fallbackText}>
                                No operational learnings have been recorded in the system for this
                                context yet. You’re welcome to check the&nbsp;
                                <a
                                    href="https://go.ifrc.org/operational-learning"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.fallbackLink}
                                >
                                    Ops Learning dashboard
                                </a>
                                &nbsp;and the&nbsp;
                                <a
                                    href="https://www.ifrc.org/evaluations"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.fallbackLink}
                                >
                                    IFRC evaluations database
                                </a>
                                &nbsp;to learn more.
                            </p>
                        </div>
                    )}
                </>
            )}
        </Container>
    );
}

export default PreviousCrises;
