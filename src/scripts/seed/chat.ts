import { conversationId, employerId, gigId, messageId, messageReportId, talentId } from './ids';
import { log, upsertIfAbsent } from './helpers';

interface SeedConversation {
    id: string;
    gigId: string | null;
    employerId: string;
    talentId: string;
}

const CONVERSATIONS: SeedConversation[] = [
    { id: conversationId(1), gigId: gigId(1), employerId: employerId(1), talentId: talentId(1) },
    { id: conversationId(2), gigId: gigId(3), employerId: employerId(2), talentId: talentId(3) },
    { id: conversationId(3), gigId: gigId(4), employerId: employerId(3), talentId: talentId(14) },
    { id: conversationId(4), gigId: gigId(5), employerId: employerId(6), talentId: talentId(2) },
    { id: conversationId(5), gigId: gigId(7), employerId: employerId(6), talentId: talentId(4) },
    { id: conversationId(6), gigId: null, employerId: employerId(1), talentId: talentId(16) },
    { id: conversationId(7), gigId: null, employerId: employerId(9), talentId: talentId(19) },
    { id: conversationId(8), gigId: gigId(13), employerId: employerId(9), talentId: talentId(3) },
];

// Archives are per-user, one side can archive without hiding the thread from
// the other. Conversation 6 is archived for talent 16 to exercise the
// `tab=archived` filter.
const ARCHIVES: Array<{ conversationId: string; userId: string }> = [{ conversationId: conversationId(6), userId: talentId(16) }];

// Talent 17 blocked talent 18; talent 19 reported a message. Both are used by
// sendMessage / openConversation guards and the reports dashboard.
const BLOCKS: Array<{ blockerId: string; blockedId: string; reason: string }> = [
    { blockerId: talentId(17), blockedId: talentId(18), reason: 'Unwanted messages' },
];

interface SeedMessage {
    id: string;
    conversationId: string;
    senderId: string;
    body: string;
    readAtOffsetMinutes: number | null;
}

// Each conversation gets a small thread. Some messages on conversation 7 are
// unread to keep `getUnreadConversationCount` non-trivial. A message on
// conversation 8 feeds the message_reports table below.
const MESSAGES: SeedMessage[] = [
    m(1, conversationId(1), employerId(1), 'Hi Kola, can you confirm availability for the launch?', -60),
    m(2, conversationId(1), talentId(1), 'Yes, 100% available. I can send a short mix as reference.', -55),
    m(3, conversationId(2), talentId(3), 'Shots are uploaded. Let me know once you review.', -1440),
    m(4, conversationId(2), employerId(2), 'Perfect, reviewing now.', -1430),
    m(5, conversationId(3), talentId(14), 'Escrow has not released, any update?', -720),
    m(6, conversationId(3), employerId(3), 'Still reviewing the deliverables.', -710),
    m(7, conversationId(4), employerId(6), 'Welcome Lara, can you send a sample reel?', -30),
    m(8, conversationId(4), talentId(2), 'Sharing the conference highlight reel shortly.', null),
    m(9, conversationId(5), employerId(6), 'Crew call time is 7am, please confirm.', null),
    m(10, conversationId(5), talentId(4), 'Confirmed, crew will be on site at 6:30.', null),
    m(11, conversationId(6), employerId(1), 'Archived thread, no action needed.', -5000),
    m(12, conversationId(7), employerId(9), 'Hello! Interested in chatting about a future gig?', null),
    m(13, conversationId(8), employerId(9), 'Would you accept 320k?', -120),
    m(14, conversationId(8), talentId(3), 'That works, booking it in.', -115),
    m(15, conversationId(8), employerId(9), 'Problematic message that gets reported.', null),
];

function m(n: number, conversation: string, senderId: string, body: string, readAtOffsetMinutes: number | null): SeedMessage {
    return { id: messageId(n), conversationId: conversation, senderId, body, readAtOffsetMinutes };
}

interface SeedMessageReport {
    id: string;
    messageId: string;
    conversationId: string;
    reporterId: string;
    reportedUserId: string;
    reason: string;
    description: string | null;
    status: 'pending' | 'reviewing' | 'actioned' | 'dismissed';
}

const MESSAGE_REPORTS: SeedMessageReport[] = [
    {
        id: messageReportId(1),
        messageId: messageId(15),
        conversationId: conversationId(8),
        reporterId: talentId(3),
        reportedUserId: employerId(9),
        reason: 'harassment',
        description: 'Unprofessional language.',
        status: 'pending',
    },
];

export async function seedChat(): Promise<void> {
    log(
        'chat',
        `upserting ${CONVERSATIONS.length} conversations / ${MESSAGES.length} messages / ${BLOCKS.length} blocks / ${ARCHIVES.length} archives`,
    );

    const conversationRows = CONVERSATIONS.map((c) => ({
        id: c.id,
        gig_id: c.gigId,
        employer_id: c.employerId,
        talent_id: c.talentId,
        last_message_at: new Date().toISOString(),
    }));
    await upsertIfAbsent('conversations', conversationRows, 'id');

    const messageRows = MESSAGES.map((msg) => ({
        id: msg.id,
        conversation_id: msg.conversationId,
        sender_id: msg.senderId,
        body: msg.body,
        read_at: msg.readAtOffsetMinutes !== null ? new Date(Date.now() + msg.readAtOffsetMinutes * 60_000).toISOString() : null,
    }));
    await upsertIfAbsent('messages', messageRows, 'id');

    await upsertIfAbsent(
        'conversation_archives',
        ARCHIVES.map((a) => ({ conversation_id: a.conversationId, user_id: a.userId })),
        'conversation_id,user_id',
    );

    await upsertIfAbsent(
        'user_blocks',
        BLOCKS.map((b) => ({ blocker_id: b.blockerId, blocked_id: b.blockedId, reason: b.reason })),
        'blocker_id,blocked_id',
    );

    const reportRows = MESSAGE_REPORTS.map((r) => ({
        id: r.id,
        message_id: r.messageId,
        conversation_id: r.conversationId,
        reporter_id: r.reporterId,
        reported_user_id: r.reportedUserId,
        reason: r.reason,
        description: r.description,
        status: r.status,
    }));
    await upsertIfAbsent('message_reports', reportRows, 'id');

    log('chat', 'done');
}
