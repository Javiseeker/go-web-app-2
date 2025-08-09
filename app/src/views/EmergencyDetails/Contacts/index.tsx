import {
    Container,
    TextOutput,
} from '@ifrc-go/ui';
import { useTranslation } from '@ifrc-go/ui/hooks';
import { isTruthyString } from '@togglecorp/fujs';

import Link from '#components/Link';

import i18n from './i18n.json';
import styles from './styles.module.css';

type Contact = {
    id: number;
    name: string;
    title: string;
    ctype: string;
    email?: string;
    phone?: string;
};

interface Props {
    groupedContacts: Record<string, Contact[]>;
}

function Contacts(props: Props) {
    const { groupedContacts } = props;
    const strings = useTranslation(i18n);

    return (
        <Container
            heading={strings.contactsTitle}
            childrenContainerClassName={styles.contactsContent}
            withHeaderBorder
        >
            {Object.entries(groupedContacts).map(([contactGroup, contacts]) => (
                <Container
                    key={contactGroup}
                    heading={contactGroup}
                    childrenContainerClassName={styles.contactList}
                    headingLevel={4}
                >
                    {contacts.map((contact) => (
                        <div key={contact.id} className={styles.contact}>
                            <div className={styles.details}>
                                <div className={styles.name}>{contact.name}</div>
                                <div className={styles.title}>{contact.title}</div>
                            </div>
                            <div className={styles.contactMechanisms}>
                                <div className={styles.type}>{contact.ctype}</div>
                                {isTruthyString(contact.email) && (
                                    <TextOutput
                                        value={(
                                            <Link href={`mailto:${contact.email}`} external withLinkIcon>
                                                {contact.email}
                                            </Link>
                                        )}
                                    />
                                )}
                                {isTruthyString(contact.phone) && (
                                    <TextOutput
                                        value={(
                                            <Link href={`tel:${contact.phone}`} withLinkIcon external>
                                                {contact.phone}
                                            </Link>
                                        )}
                                    />
                                )}
                            </div>
                        </div>
                    ))}
                </Container>
            ))}
        </Container>
    );
}

export default Contacts;
