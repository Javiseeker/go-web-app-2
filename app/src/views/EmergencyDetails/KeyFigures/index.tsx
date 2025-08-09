import {
    Container,
    KeyFigure,
} from '@ifrc-go/ui';
import { useTranslation } from '@ifrc-go/ui/hooks';
import { resolveToString } from '@ifrc-go/ui/utils';

import i18n from './i18n.json';
import styles from './styles.module.css';

type KeyFigureItem = {
    id: number;
    number: string;
    deck: string;
    source: string;
};

interface Props {
    keyFigures: KeyFigureItem[];
}

function KeyFigures(props: Props) {
    const { keyFigures } = props;
    const strings = useTranslation(i18n);

    return (
        <Container
            className={styles.keyFigureContainer}
            heading={strings.emergencyKeyFiguresTitle}
            childrenContainerClassName={styles.keyFigureList}
            withHeaderBorder
        >
            {keyFigures.map((keyFigure) => (
                <KeyFigure
                    key={keyFigure.id}
                    className={styles.keyFigure}
                    value={Math.round(
                        Number.parseInt(
                            keyFigure.number.replace(/[^\d.-]/g, ''),
                            10,
                        ),
                    )}
                    label={keyFigure.deck}
                    description={resolveToString(
                        strings.sourceLabel,
                        { source: keyFigure.source },
                    )}
                />
            ))}
        </Container>
    );
}

export default KeyFigures;
