import type {
    KeyboardEvent,
    MouseEvent,
} from 'react';

interface OperationalLearningSource {
  id: number;
  code: string;
  name: string;
  event_id: number;
}

interface Lesson {
  title?: string;
  insight?: string;
  source_note?: string;
  area?: string;
  rr_questions?: string[];
  metadata?: {
    operational_learning_source?: OperationalLearningSource[];
  };
  // Allow extra fields without using `any`
  [key: string]: unknown;
}

interface LessonCardProps {
  lesson: Lesson;
  cardKey: string;
  isOpen: boolean;
  onToggle: (key: string) => void;
  styles: Record<string, string>;
}

export default function LessonCard({
    lesson,
    cardKey,
    isOpen,
    onToggle,
    styles,
}: LessonCardProps) {
    const handleClick = (): void => {
        onToggle(cardKey);
    };

    const handleKeyDown = (e: KeyboardEvent): void => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle(cardKey);
        }
    };

    const sources = lesson?.metadata?.operational_learning_source ?? [];

    const hasQuestions = Array.isArray(lesson.rr_questions)
    && lesson.rr_questions.length > 0;

    const hasAreaOnly = !hasQuestions && !!lesson.area;

    const getAreaTagStyle = (area: string) => ({
        fontSize: area.length > 15 ? '8px' : '10px',
    });

    const makeEventUrl = (id: number) => `https://go.ifrc.org/emergencies/${id}/details`;

    return (
        <div
            className={`${styles.card} ${isOpen ? styles.open : ''}`}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
            aria-expanded={isOpen}
            aria-controls={`details-${cardKey}`}
        >
            <h3 className={styles.title}>{lesson.title}</h3>

            {lesson.insight && (
                <p className={styles.insight}>{lesson.insight}</p>
            )}

            <div className={styles.expandHint}>
                {isOpen ? 'Hide details ↑' : 'View details ↓'}
            </div>

            {isOpen && (
                <div id={`details-${cardKey}`}>
                    {lesson.source_note && (
                        <div className={styles.sourceNote}>
                            <p className={styles.sourceNoteText}>
                                {lesson.source_note}
                            </p>
                        </div>
                    )}

                    {hasQuestions && (
                        <div className={styles.rrSection}>
                            <div className={styles.rrHeader}>
                                <h4 className={styles.rrHeading}>
                                    Rapid Response Questions
                                </h4>
                                {lesson.area && (
                                    <span
                                        className={styles.areaTag}
                                        style={getAreaTagStyle(lesson.area)}
                                    >
                                        {lesson.area}
                                    </span>
                                )}
                            </div>
                            <ul className={styles.rrList}>
                                {lesson.rr_questions!.map((q) => (
                                    <li
                                        key={`question-${cardKey}-${q.slice(0, 24)}`}
                                        className={styles.rrItem}
                                    >
                                        {q}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {hasAreaOnly && (
                        <div className={styles.areaOnlySection}>
                            <span
                                className={styles.areaTag}
                                style={getAreaTagStyle(lesson.area!)}
                            >
                                {lesson.area}
                            </span>
                        </div>
                    )}

                    {sources.length > 0 && (
                        <div className={styles.sourcesBlock}>
                            <h4 className={styles.sourcesHeading}>
                                Operational Learning Resources
                            </h4>

                            {sources.map((source) => (
                                <div
                                    key={`source-${source.id}`}
                                    className={styles.sourceRow}
                                >
                                    <div className={styles.sourceDetails}>
                                        <div className={styles.sourceNameCode}>
                                            {source.name}
                                            {' '}
                                            (
                                            {source.code}
                                            )
                                        </div>

                                        <div className={styles.learningId}>
                                            Learning ID:
                                            {' '}
                                            {source.id}
                                        </div>
                                    </div>

                                    {/* Use a real link; stop propagation so it doesn't toggle */}
                                    <a
                                        href={makeEventUrl(source.event_id)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.eventLink}
                                        onClick={(e: MouseEvent) => {
                                            e.stopPropagation();
                                        }}
                                    >
                                        View Event
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
