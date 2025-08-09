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
const INITIAL_DISPLAY_COUNT = 3;

function PreviousCrises(props: Props) {
  const { ifrcEvents, ifrcEventsPending, ifrcEventsError } = props;
  const strings = useTranslation(i18n);

  const [showAll, setShowAll]   = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  /* ---------- normalize backend payload ---------- */
  const rawLessons = ifrcEvents?.ai_structured_summary;
  const lessons = Array.isArray(rawLessons)
    ? rawLessons
    : rawLessons
      ? Object.values(rawLessons as Record<string, unknown>)
      : [];

  const fallbackNote = ifrcEvents?.fallback_note;

  const visible = showAll ? lessons : lessons.slice(0, INITIAL_DISPLAY_COUNT);
  const hasMore = lessons.length > INITIAL_DISPLAY_COUNT;

  /* fixed column distribution */
  const columns = useMemo(() => {
    const cols: typeof lessons[][] = Array.from({ length: DESKTOP_COLUMNS }, () => []);
    visible.forEach((l, i) => cols[i % DESKTOP_COLUMNS].push(l));
    return cols;
  }, [visible]);

  const toggle = (k: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setExpanded(p => {
      const n = new Set(p);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });
  };

  const openEvent = (id: number) =>
    window.open(`https://go.ifrc.org/emergencies/${id}/details`, '_blank');

  /* ---------------- render ---------------- */
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
              {/* AI disclaimer */}
              <div className={styles.fallbackNote}>
                <p className={styles.fallbackText}>{strings.aiDisclaimerText}</p>
              </div>

              {/* column grid */}
              <div className={styles.columnsWrapper}>
                {columns.map((col, cIdx) => (
                  <div key={cIdx} className={styles.column}>
                    {col.map((lesson, rIdx) => {
                      const k = `c${cIdx}r${rIdx}`;
                      const isOpen = expanded.has(k);
                      const sources = lesson?.metadata?.operational_learning_source ?? [];

                      return (
                        <div
                          key={k}
                          className={`${styles.card} ${isOpen ? styles.open : ''}`}
                          onClick={(e) => toggle(k, e)}
                          role="button"
                          tabIndex={0}
                        >
                          <h3 className={styles.title}>{lesson.title}</h3>

                          {/* always-visible insight */}
                          <p className={styles.insight}>{lesson.insight}</p>

                          <div className={styles.expandHint}>
                            {isOpen ? 'Hide details ↑' : 'View details ↓'}
                          </div>

                          {isOpen && (
                            <>
                              {lesson.source_note && (
                                <div className={styles.sourceNote}>
                                  <p className={styles.sourceNoteText}>{lesson.source_note}</p>
                                </div>
                              )}

                              {lesson.rr_questions?.length > 0 && (
                                <div className={styles.rrSection}>
                                  <div className={styles.rrHeader}>
                                    <h4 className={styles.rrHeading}>Rapid Response Questions</h4>
                                    {lesson.area && (
                                      <span
                                        className={styles.areaTag}
                                        style={{ fontSize: lesson.area.length > 15 ? '8px' : '10px' }}
                                      >
                                        {lesson.area}
                                      </span>
                                    )}
                                  </div>

                                  <ul className={styles.rrList}>
                                    {lesson.rr_questions.map((q: string, i: number) => (
                                      <li key={i} className={styles.rrItem}>{q}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {!lesson.rr_questions?.length && lesson.area && (
                                <div className={styles.areaOnlySection}>
                                  <span
                                    className={styles.areaTag}
                                    style={{ fontSize: lesson.area.length > 15 ? '8px' : '10px' }}
                                  >
                                    {lesson.area}
                                  </span>
                                </div>
                              )}

                              {sources.length > 0 && (
                                <div className={styles.sourcesBlock}>
                                  <h4 className={styles.sourcesHeading}>Operational Learning Resources</h4>
                                  {sources.map((src: any) => (
                                    <div key={src.id} className={styles.sourceRow}>
                                      <div className={styles.sourceDetails}>
                                        <div className={styles.sourceNameCode}>{src.name} ({src.code})</div>
                                        <div className={styles.learningId}>Learning&nbsp;ID:&nbsp;{src.id}</div>
                                      </div>
                                      <span
                                        className={styles.eventLink}
                                        onClick={(e) => { e.stopPropagation(); openEvent(src.event_id); }}
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
                    onClick={() => setShowAll(s => !s)}
                  >
                    {showAll ? strings.showLess : strings.seeMore}
                  </button>
                </div>
              )}
            </>
          ) : (
            fallbackNote ? (
              <div className={styles.fallbackNote}>
                <p className={styles.fallbackText}>
                  No operational learnings recorded yet. Check the&nbsp;
                  <a href="https://go.ifrc.org/operational-learning" target="_blank" rel="noopener noreferrer" className={styles.fallbackLink}>Ops Learning dashboard</a>
                  &nbsp;or the&nbsp;
                  <a href="https://www.ifrc.org/evaluations" target="_blank" rel="noopener noreferrer" className={styles.fallbackLink}>IFRC evaluations database</a>
                  &nbsp;for more.
                </p>
              </div>
            ) : (
              <p>{strings.noPreviousCrisesData || 'No previous crises data available.'}</p>
            )
          )}
        </>
      )}
    </Container>
  );
}

export default PreviousCrises;
