/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    useMemo,
    useState,
} from 'react';
import { Container } from '@ifrc-go/ui';
import { useTranslation } from '@ifrc-go/ui/hooks';

import LessonCard from '#components/LessonCard';
import type { IfrcEvent } from '#hooks/domain/useIfrcEvents';

import i18n from './i18n.json';
import styles from './styles.module.css';

interface Props {
    ifrcEvents?: IfrcEvent;
    ifrcEventsPending: boolean;
    ifrcEventsError?: unknown;
}

// Updated to match the actual API response structure
type Lesson = {
    title: string;
    insight: string;
    recommendations?: string[];
    source_note?: string;
    area?: string;
    rr_questions?: string[];
    metadata?: {
        eventID?: number[];
        operational_learning_source?: Array<{
            id: number;
            code: string;
            name: string;
            event_id: number;
        }>;
    };
};

const DESKTOP_COLUMNS = 3;
const INITIAL_DISPLAY_COUNT = 3;

function makeKey(lesson: Lesson, index: number): string {
    // Build a deterministic key using stable fields
    const base = lesson.title
      || lesson.insight
      // fallback if both missing
      || `idx-${index}`;

    return `lesson-${String(base)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 50)}`;
}

function PreviousCrises(props: Props) {
    const { ifrcEvents, ifrcEventsPending, ifrcEventsError } = props;
    const strings = useTranslation(i18n);

    const [showAll, setShowAll] = useState(false);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    // Handle the nested API structure properly
    const lessons: Lesson[] = useMemo(() => {
        if (!ifrcEvents?.ai_structured_summary) {
            return [];
        }

        const summary = ifrcEvents.ai_structured_summary;

        // Handle nested structure: ai_structured_summary.ai_structured_summary
        if (typeof summary === 'object' && 'ai_structured_summary' in summary) {
            const nestedSummary = (summary as any).ai_structured_summary;
            return Array.isArray(nestedSummary) ? nestedSummary : [];
        }

        // Handle direct array structure (fallback for different API versions)
        if (Array.isArray(summary)) {
            return summary;
        }

        return [];
    }, [ifrcEvents?.ai_structured_summary]);

    // Handle 404 errors - simplified version without complex type checking
    const hasRealError = ifrcEventsError && !String(ifrcEventsError).includes('404');

    const fallbackNote = ifrcEvents?.fallback_note;
    const visible = showAll
        ? lessons
        : lessons.slice(0, INITIAL_DISPLAY_COUNT);
    const hasMore = lessons.length > INITIAL_DISPLAY_COUNT;

    // Precompute stable keys
    const keyed = useMemo(
        () => visible.map((l, i) => ({
            lesson: l,
            key: makeKey(l, i),
        })),
        [visible],
    );

    // Fixed column distribution (use the item key for column key too)
    type ColumnItem = { lesson: Lesson; key: string };
    const columns = useMemo(() => {
        const cols: Array<ColumnItem[]> = Array.from(
            { length: DESKTOP_COLUMNS },
            () => [],
        );
        keyed.forEach((item, index) => {
            cols[index % DESKTOP_COLUMNS].push(item);
        });
        return cols;
    }, [keyed]);

    const handleToggle = (key: string) => {
        setExpanded((previous) => {
            const next = new Set(previous);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const renderFallbackContent = () => {
        if (fallbackNote) {
            return (
                <div className={styles.fallbackNote}>
                    <p className={styles.fallbackText}>
                        No operational learnings recorded yet. Check the
                        {' '}
                        <a
                            href="https://go.ifrc.org/operational-learning"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.fallbackLink}
                        >
                            Ops Learning dashboard
                        </a>
                        {' '}
                        or the
                        {' '}
                        <a
                            href="https://www.ifrc.org/evaluations"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.fallbackLink}
                        >
                            IFRC evaluations database
                        </a>
                        {' '}
                        for more.
                    </p>
                </div>
            );
        }

        return (
            <p>
                {strings.noPreviousCrisesData
                    || 'No previous crises data available.'}
            </p>
        );
    };

    return (
        <Container
            heading={strings.lessonsLearnedTitle}
            withHeaderBorder
            childrenContainerClassName={styles.previousCrisesContent}
        >
            {ifrcEventsPending && (
                <p>{strings.loadingPreviousCrises || 'Loading previous crises...'}</p>
            )}

            {hasRealError && !ifrcEventsPending && (
                <p>
                    {strings.errorLoadingPreviousCrises
                    || 'Error loading previous crises'}
                </p>
            )}

            {!ifrcEventsPending && !hasRealError && (
                <div>
                    {keyed.length > 0 ? (
                        <div>
                            <div className={styles.fallbackNote}>
                                <p className={styles.fallbackText}>
                                    {strings.aiDisclaimerText
                                        || 'AI-generated insights from operational learning data.'}
                                </p>
                            </div>

                            <div className={styles.columnsWrapper}>
                                {columns.map((column) => {
                                    const columnKey = column[0]?.key
                                        ?? 'empty-column';
                                    return (
                                        <div
                                            key={columnKey}
                                            className={styles.column}
                                        >
                                            {column.map(({ lesson, key }) => {
                                                const isOpen = expanded.has(key);
                                                return (
                                                    <LessonCard
                                                        key={key}
                                                        lesson={lesson}
                                                        cardKey={key}
                                                        isOpen={isOpen}
                                                        onToggle={handleToggle}
                                                        styles={styles}
                                                    />
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>

                            {hasMore && (
                                <div className={styles.seeMoreContainer}>
                                    <button
                                        type="button"
                                        className={styles.seeMoreButton}
                                        onClick={() => setShowAll(
                                            (show) => !show,
                                        )}
                                    >
                                        {showAll
                                            ? (strings.showLess || 'Show Less')
                                            : (strings.seeMore || 'See More')}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        renderFallbackContent()
                    )}
                </div>
            )}
        </Container>
    );
}

export default PreviousCrises;
