import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import styled, { keyframes } from 'styled-components';
import {
  FaComments,
  FaPaperPlane,
  FaSearch,
  FaTimes,
  FaCircle,
  FaUserCircle,
  FaStore,
  FaLockOpen,
  FaLock,
  FaInbox,
  FaEnvelope,
  FaPhone,
} from 'react-icons/fa';
import { useAdminChatSocket } from './useAdminChatSocket';
import { toast } from 'react-toastify';
import useAuth from '../../shared/hooks/useAuth';
import api from '../../shared/services/api';

// ── Animations ────────────────────────────────────────────
const dotBounce = keyframes`
  0%, 80%, 100% { transform: translateY(0); }
  40%            { transform: translateY(-5px); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
`;

// ── Palette ───────────────────────────────────────────────
const GOLD = '#D4882A';
const DARK = '#1a1f2e';

// ── Page shell ────────────────────────────────────────────
const PageWrap = styled.div`
  display: grid;
  grid-template-columns: 32rem 1fr;
  height: calc(100vh - var(--header-height, 6rem));
  background: var(--color-grey-50);

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

// ── Sidebar ───────────────────────────────────────────────
const Sidebar = styled.aside`
  border-right: 1px solid var(--color-grey-200);
  background: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const SidebarHeader = styled.div`
  padding: 2rem 1.8rem 1.4rem;
  border-bottom: 1px solid var(--color-grey-100);
`;

const SideTitle = styled.h2`
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-grey-900);
  margin: 0 0 1.2rem;
  display: flex;
  align-items: center;
  gap: 0.8rem;

  svg { color: ${GOLD}; }
`;

const ConnBadge = styled.span`
  font-size: 1.1rem;
  padding: 0.3rem 0.8rem;
  border-radius: 1rem;
  background: ${({ $on }) => ($on ? '#c6f6d5' : '#fed7d7')};
  color: ${({ $on }) => ($on ? '#22543d' : '#742a2a')};
  font-weight: 600;
  margin-left: auto;
`;

const SearchBox = styled.div`
  position: relative;
  svg {
    position: absolute;
    left: 1.2rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-grey-400);
    font-size: 1.3rem;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.9rem 1.2rem 0.9rem 3.4rem;
  border: 1.5px solid var(--color-grey-200);
  border-radius: 0.8rem;
  font-size: var(--font-size-sm);
  color: var(--color-grey-800);
  background: var(--color-grey-50);
  outline: none;
  transition: border-color 0.15s;

  &:focus { border-color: ${GOLD}; }
  &::placeholder { color: var(--color-grey-400); }
`;

const FilterRow = styled.div`
  display: flex;
  gap: 0.6rem;
  margin-top: 1rem;
`;

const FilterBtn = styled.button`
  flex: 1;
  padding: 0.6rem 0;
  border-radius: 0.6rem;
  border: 1.5px solid ${({ $active }) => ($active ? GOLD : 'var(--color-grey-200)')};
  background: ${({ $active }) => ($active ? `${GOLD}15` : 'transparent')};
  color: ${({ $active }) => ($active ? GOLD : 'var(--color-grey-600)')};
  font-size: var(--font-size-sm);
  font-weight: ${({ $active }) => ($active ? '700' : '500')};
  cursor: pointer;
  transition: all 0.15s;

  &:hover { border-color: ${GOLD}; color: ${GOLD}; }
`;

const ConvList = styled.ul`
  flex: 1;
  overflow-y: auto;
  list-style: none;
  margin: 0;
  padding: 0;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: var(--color-grey-200); border-radius: 2px; }
`;

const ConvItem = styled.li`
  display: flex;
  align-items: center;
  gap: 1.2rem;
  padding: 1.4rem 1.8rem;
  cursor: pointer;
  border-bottom: 1px solid var(--color-grey-100);
  background: ${({ $active }) => ($active ? `${GOLD}0d` : 'transparent')};
  border-left: 3px solid ${({ $active }) => ($active ? GOLD : 'transparent')};
  transition: background 0.15s;

  &:hover { background: var(--color-grey-50); }
`;

const ConvAvatar = styled.div`
  position: relative;
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  background: ${({ $role }) => ($role === 'seller' ? '#e9d8fd' : '#bee3f8')};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    color: ${({ $role }) => ($role === 'seller' ? '#6b46c1' : '#2b6cb0')};
    font-size: 1.8rem;
  }
`;

const UnreadDot = styled.span`
  position: absolute;
  top: -2px;
  right: -2px;
  min-width: 1.8rem;
  height: 1.8rem;
  border-radius: 0.9rem;
  background: ${GOLD};
  color: #fff;
  font-size: 1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #fff;
  padding: 0 0.3rem;
`;

const ConvMeta = styled.div`
  flex: 1;
  min-width: 0;
`;

const ConvName = styled.p`
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-grey-900);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ConvPreview = styled.p`
  font-size: 1.2rem;
  color: var(--color-grey-500);
  margin: 0.2rem 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ConvNameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
`;

const RolePill = styled.span`
  flex-shrink: 0;
  font-size: 1rem;
  font-weight: 700;
  padding: 0.15rem 0.45rem;
  border-radius: 0.4rem;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  background: ${({ $role }) =>
    $role === 'seller' ? '#ede9fe' : $role === 'guest' ? '#e6fffa' : '#ebf8ff'};
  color: ${({ $role }) =>
    $role === 'seller' ? '#5b21b6' : $role === 'guest' ? '#234e52' : '#2c5282'};
`;

const ConvTime = styled.span`
  font-size: 1.1rem;
  color: var(--color-grey-400);
  white-space: nowrap;
  flex-shrink: 0;
`;

const VisitorPresence = styled.span`
  font-size: 1rem;
  font-weight: 600;
  color: ${({ $online }) => ($online ? '#276749' : '#718096')};
  white-space: nowrap;
`;

const ClosedTag = styled.span`
  font-size: 1rem;
  padding: 0.2rem 0.6rem;
  border-radius: 0.4rem;
  background: #fed7d7;
  color: #e53e3e;
  font-weight: 600;
  flex-shrink: 0;
`;

/** Sidebar: remove idle buyer/seller chat (matches server inactivity close). */
const ListCancelBtn = styled.button`
  margin-top: 0.35rem;
  padding: 0.3rem 0.65rem;
  border-radius: 0.45rem;
  border: 1px solid #e53e3e;
  background: #fff5f5;
  color: #c53030;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: #feb2b2;
    color: #742a2a;
  }
`;

const EmptySide = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: var(--color-grey-400);
  padding: 3rem;
  text-align: center;

  svg { font-size: 3.2rem; }
  p { font-size: var(--font-size-sm); margin: 0; }
`;

// ── Chat pane ─────────────────────────────────────────────
const ChatPane = styled.div`
  display: flex;
  flex-direction: column;
  background: var(--color-grey-50);
`;

const ChatHeader = styled.div`
  background: #fff;
  border-bottom: 1px solid var(--color-grey-200);
  padding: 1.4rem 2rem;
  display: flex;
  align-items: center;
  gap: 1.2rem;
`;

const ChatHeaderInfo = styled.div`
  flex: 1;
`;

const ChatHeaderName = styled.p`
  font-size: var(--font-size-md);
  font-weight: 700;
  color: var(--color-grey-900);
  margin: 0;
`;

const ChatHeaderSub = styled.p`
  font-size: var(--font-size-sm);
  color: var(--color-grey-500);
  margin: 0.2rem 0 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ParticipantCredentials = styled.div`
  margin-top: 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: var(--font-size-sm);
  color: var(--color-grey-600);

  span {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  svg {
    flex-shrink: 0;
    color: var(--color-grey-400);
    font-size: 1.2rem;
  }
`;

const ActionBtn = styled.button`
  padding: 0.7rem 1.4rem;
  border-radius: 0.8rem;
  border: 1.5px solid ${({ $danger }) => ($danger ? '#e53e3e' : GOLD)};
  background: ${({ $danger }) => ($danger ? '#fff5f5' : `${GOLD}15`)};
  color: ${({ $danger }) => ($danger ? '#e53e3e' : GOLD)};
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.15s;

  &:hover {
    background: ${({ $danger }) => ($danger ? '#fed7d7' : `${GOLD}25`)};
  }
`;

const Messages = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-thumb { background: var(--color-grey-200); border-radius: 3px; }
`;

const MsgBubble = styled.div`
  max-width: 72%;
  padding: 1.1rem 1.5rem;
  border-radius: ${({ $fromAdmin }) =>
    $fromAdmin ? '1.4rem 1.4rem 0.4rem 1.4rem' : '1.4rem 1.4rem 1.4rem 0.4rem'};
  background: ${({ $fromAdmin }) =>
    $fromAdmin ? `linear-gradient(135deg, ${GOLD}, #f0a845)` : '#fff'};
  color: ${({ $fromAdmin }) => ($fromAdmin ? '#fff' : 'var(--color-grey-800)')};
  font-size: var(--font-size-sm);
  line-height: 1.6;
  align-self: ${({ $fromAdmin }) => ($fromAdmin ? 'flex-end' : 'flex-start')};
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  word-break: break-word;
  animation: ${fadeIn} 0.15s ease;
`;

const MsgMeta = styled.p`
  font-size: 1.1rem;
  margin: 0.3rem 0 0;
  color: ${({ $fromAdmin }) => ($fromAdmin ? 'rgba(255,255,255,0.75)' : 'var(--color-grey-400)')};
  text-align: ${({ $fromAdmin }) => ($fromAdmin ? 'right' : 'left')};
`;

const TypingDots = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 1rem 1.4rem;
  background: #fff;
  border-radius: 1.4rem 1.4rem 1.4rem 0.4rem;
  align-self: flex-start;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);

  span {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: var(--color-grey-400);
    animation: ${dotBounce} 1.2s ease-in-out infinite;
    &:nth-child(2) { animation-delay: 0.15s; }
    &:nth-child(3) { animation-delay: 0.30s; }
  }
`;

const ClosedBanner = styled.div`
  background: #fff5f5;
  border-top: 1px solid #feb2b2;
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--font-size-sm);
  color: #e53e3e;
  font-weight: 600;
`;

const InputRow = styled.form`
  display: flex;
  gap: 1rem;
  padding: 1.4rem 2rem;
  border-top: 1px solid var(--color-grey-200);
  background: #fff;
`;

const TextInput = styled.input`
  flex: 1;
  padding: 1.1rem 1.6rem;
  border: 1.5px solid var(--color-grey-200);
  border-radius: 2.4rem;
  font-size: var(--font-size-sm);
  outline: none;
  color: var(--color-grey-800);
  transition: border-color 0.15s;

  &:focus { border-color: ${GOLD}; }
  &::placeholder { color: var(--color-grey-400); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const SendBtn = styled.button`
  width: 4.4rem;
  height: 4.4rem;
  border-radius: 50%;
  background: linear-gradient(135deg, ${GOLD}, #f0a845);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.15s, opacity 0.15s;
  svg { color: #fff; font-size: 1.6rem; }

  &:hover:not(:disabled) { transform: scale(1.08); }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const NoneSelected = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.2rem;
  color: var(--color-grey-400);
  text-align: center;

  svg { font-size: 4.8rem; }
  p { font-size: var(--font-size-sm); margin: 0; }
`;

// ── Helpers ───────────────────────────────────────────────
const fmtTime = (d) => {
  if (!d) return '';
  const date = new Date(d);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

/** Seller dashboard or legacy rows tagged as Seller model even if role string was wrong. */
const isSellerLikeVisitor = (c) => {
  if (!c) return false;
  const r = String(c.participantRole || '').toLowerCase();
  if (r === 'seller') return true;
  return String(c.participantModel || '') === 'Seller';
};

/** Buyer site user, guest widget, or legacy rows with empty role (treated like buyer for filtering). */
const isBuyerOrGuestVisitor = (c) => {
  if (!c) return false;
  if (isSellerLikeVisitor(c)) return false;
  const r = c.participantRole != null ? String(c.participantRole).toLowerCase() : '';
  return r === 'buyer' || r === 'guest' || r === '';
};

const visitorTypeLabel = (c) => {
  if (isSellerLikeVisitor(c)) return 'Seller';
  const r = String(c?.participantRole || '').toLowerCase();
  if (r === 'guest') return 'Guest';
  return 'Buyer';
};

const isSellerVisitor = isSellerLikeVisitor;

/**
 * True when this row is waiting in the human queue (buyer/guest/seller).
 * Matches server queue semantics; allows stale `chatPhase: active` when `supportRequestedAt` is set.
 */
const isConversationQueuedForAdmin = (c) => {
  if (!c || !c.supportRequestedAt) return false;
  if ((c.status || 'open') === 'closed') return false;
  const a = c.assignedTo;
  if (a != null && a !== '' && String(a) !== 'null') return false;
  const phase = c.chatPhase ? String(c.chatPhase) : 'active';
  if (phase === 'faq_bot' || phase === 'await_human_choice') return false;
  return phase === 'awaiting_admin' || (phase === 'active' && Boolean(c.supportRequestedAt));
};

function extractMongoObjectIdHex(input) {
  if (input == null || input === '') return '';
  const s = String(input).trim();
  if (/^[a-fA-F0-9]{24}$/i.test(s)) return s.toLowerCase();
  const m = s.match(/[a-fA-F0-9]{24}/i);
  return m ? m[0].toLowerCase() : '';
}

function preferHexOrTrimmed(rough) {
  if (rough == null || rough === '') return '';
  const s = String(rough).trim();
  if (!s || s === '[object Object]') return '';
  const hex = extractMongoObjectIdHex(s);
  if (hex) return hex;
  if (/^[a-fA-F0-9]{24}$/i.test(s)) return s.toLowerCase();
  return '';
}

const conversationListId = (c) => {
  if (!c || typeof c !== 'object') return '';
  const raw = c._id ?? c.id ?? c.conversationId;
  if (raw == null || raw === '') return '';

  let rough = '';
  if (typeof raw === 'object' && raw !== null) {
    if (raw.$oid) rough = String(raw.$oid);
    else if (raw['$oid']) rough = String(raw['$oid']);
    else if (typeof raw.toHexString === 'function') rough = raw.toHexString();
    else if (typeof raw.toString === 'function') {
      const s = raw.toString();
      if (s && s !== '[object Object]') rough = s;
    }
    if (!rough) {
      const nested = raw._id ?? raw.id;
      if (nested && typeof nested === 'string') rough = nested;
      else if (nested != null && typeof nested === 'object' && typeof nested.toHexString === 'function') {
        try {
          rough = nested.toHexString();
        } catch {
          rough = '';
        }
      }
    }
  } else {
    rough = String(raw);
  }
  return preferHexOrTrimmed(rough);
};

const parseTimeMs = (value) => {
  if (!value) return 0;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : 0;
};

/** Prefer the row whose support / message timeline is newest (socket vs REST). */
const conversationFreshnessMs = (c) => {
  if (!c || typeof c !== 'object') return 0;
  return Math.max(
    parseTimeMs(c.lastMessageAt),
    parseTimeMs(c.supportRequestedAt),
    parseTimeMs(c.supportAcceptedAt),
    parseTimeMs(c.lastParticipantMessageAt)
  );
};

const mergeConversationList = (currentList, incomingList) => {
  const currentById = new Map(
    (Array.isArray(currentList) ? currentList : [])
      .map((conv) => [conversationListId(conv), conv])
      .filter(([id]) => id)
  );
  const merged = [];
  const seen = new Set();

  (Array.isArray(incomingList) ? incomingList : []).forEach((incoming) => {
    const id = conversationListId(incoming);
    if (!id) return;
    seen.add(id);

    const current = currentById.get(id);
    if (!current) {
      merged.push(incoming);
      return;
    }

    const incomingFresh = conversationFreshnessMs(incoming);
    const currentFresh = conversationFreshnessMs(current);
    const currentLastMessageAtMs = parseTimeMs(current.lastMessageAt);
    const incomingLastMessageAtMs = parseTimeMs(incoming.lastMessageAt);
    const keepRealtimeMessageOnly =
      currentLastMessageAtMs > 0 &&
      incomingLastMessageAtMs > 0 &&
      currentLastMessageAtMs > incomingLastMessageAtMs;

    // Stale REST can overwrite a just-received socket `awaiting_admin` row because spread order
    // favors `incoming`. Prefer realtime when its support/message timeline is newer, or when only
    // the socket has moved to the queue (fixes seller/buyer requests disappearing from Pending).
    const currentQueued = isConversationQueuedForAdmin(current);
    const incomingQueued = isConversationQueuedForAdmin(incoming);
    /**
     * Prefer socket/list state when it is at least as fresh as REST. If REST has a newer timeline
     * (e.g. another admin accepted), do not overwrite with stale realtime.
     */
    const preferRealtimeSnapshot =
      currentFresh > incomingFresh ||
      (currentQueued &&
        !incomingQueued &&
        currentFresh >= incomingFresh);

    const enrichedParticipant = {
      participantName:
        (incoming.participantName && String(incoming.participantName).trim()) ||
        current.participantName,
      participantEmail:
        (incoming.participantEmail && String(incoming.participantEmail).trim()) ||
        current.participantEmail,
      participantPhone:
        (incoming.participantPhone && String(incoming.participantPhone).trim()) ||
        current.participantPhone,
    };

    merged.push({
      ...current,
      ...incoming,
      ...(preferRealtimeSnapshot
        ? {
            chatPhase: current.chatPhase,
            supportRequestedAt: current.supportRequestedAt,
            supportRequestNote: current.supportRequestNote,
            assignedTo: current.assignedTo,
            supportAcceptedAt: current.supportAcceptedAt,
            status: current.status,
            lastMessage: current.lastMessage,
            lastMessageAt: current.lastMessageAt,
            unreadByAdmin: current.unreadByAdmin,
            unreadByUser: current.unreadByUser,
            ...enrichedParticipant,
          }
        : keepRealtimeMessageOnly
          ? {
              lastMessage: current.lastMessage,
              lastMessageAt: current.lastMessageAt,
              unreadByAdmin: current.unreadByAdmin,
              unreadByUser: current.unreadByUser,
            }
          : {}),
    });
  });

  currentById.forEach((conv, id) => {
    if (!seen.has(id)) merged.push(conv);
  });

  return merged;
};

const isPendingHumanSupportRequest = (c) => {
  if (!c) return false;
  const role = c.participantRole != null ? String(c.participantRole).toLowerCase() : '';
  const roleOk =
    !c.participantRole ||
    ['buyer', 'guest', 'seller'].includes(role) ||
    String(c.participantModel || '') === 'Seller';
  if (!roleOk) return false;
  return isConversationQueuedForAdmin(c);
};

const CHAT_USER_INACTIVITY_MS = parseInt(
  import.meta.env.VITE_CHAT_USER_INACTIVITY_MS || String(10 * 60 * 1000),
  10
);

const participantIdleMs = (c) => {
  if (!c) return 0;
  const t =
    c.lastParticipantMessageAt ||
    c.supportAcceptedAt ||
    c.lastMessageAt;
  if (!t) return 0;
  return Date.now() - new Date(t).getTime();
};

/** Buyer/seller rows only; same rules as server `chat:admin_end_inactive` + list UX. */
function canShowSidebarCancelForConv(conv, adminId) {
  if (!conv || !adminId) return false;
  if (conv.status === 'closed') return false;
  const role = String(conv.participantRole || '').toLowerCase();
  if (role !== 'buyer' && role !== 'seller') return false;
  if (isPendingHumanSupportRequest(conv)) return false;
  const eff = conv.chatPhase ? String(conv.chatPhase) : 'active';
  if (eff !== 'active') return false;
  if (conv.assignedTo && String(conv.assignedTo) !== String(adminId)) return false;
  return participantIdleMs(conv) >= CHAT_USER_INACTIVITY_MS;
}

// ── Component ─────────────────────────────────────────────
const AdminLiveChatPage = () => {
  const { adminData } = useAuth();
  const [search, setSearch] = useState('');
  /** Debounced so list API search does not fire every keystroke. */
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('open');
  const [assignmentFilter, setAssignmentFilter] = useState('all');
  /** `all` — everyone; `buyers` — buyers + guests only; `sellers` — seller dashboard only */
  const [visitorFilter, setVisitorFilter] = useState('all');
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);

  const admin = adminData?.data?.data?.data || adminData?.data?.data || adminData?.data || adminData;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  const {
    data: conversationsFromApi,
    isSuccess: conversationsQuerySuccess,
  } = useQuery({
    queryKey: ['adminChatConversations', statusFilter, debouncedSearch],
    queryFn: async () => {
      // Use shared axios `api` (same base URL as /admin/me). `fetch` + getEazadminBackendOrigin()
      // can hit the Vite dev origin while axios targets :4000 — list stayed empty or stale.
      const { data: body } = await api.get('/admin/chat/conversations', {
        params: {
          status: statusFilter,
          assignment: 'all',
          limit: 500,
          ...(debouncedSearch ? { search: debouncedSearch } : {}),
        },
      });
      const inner = body?.data;
      const list = inner?.conversations;
      return Array.isArray(list) ? list : [];
    },
    enabled: Boolean(admin),
    staleTime: 0,
    refetchInterval: 20 * 1000,
  });

  const {
    connected,
    unreadCount,
    conversations,
    setConversations,
    activeMessages,
    activeConvId,
    peerTyping,
    participantOnlineByConvId,
    joinConversation,
    acceptSupportRequest,
    sendMessage,
    emitTyping,
    closeConversation,
    reopenConversation,
    adminEndInactiveConversation,
  } = useAdminChatSocket(!!admin, {});

  // Merge REST list with realtime socket updates (useAdminChatSocket state).
  useEffect(() => {
    if (!conversationsQuerySuccess || !Array.isArray(conversationsFromApi)) return;
    setConversations((prev) => mergeConversationList(prev, conversationsFromApi));
  }, [conversationsQuerySuccess, conversationsFromApi, setConversations]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages, activeConvId, peerTyping]);

  const activeConvIdNorm = preferHexOrTrimmed(String(activeConvId ?? ''));
  const activeConv = conversations.find(
    (c) => conversationListId(c) === activeConvIdNorm
  );
  const adminId = admin?._id || admin?.id;

  /** Re-render the list so the Cancel control appears once idle ≥ threshold. */
  const [listActivityTick, setListActivityTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setListActivityTick((n) => n + 1), 15000);
    return () => clearInterval(id);
  }, []);

  const acceptAndOpen = useCallback(
    async (convOrId) => {
      const id =
        convOrId != null &&
        typeof convOrId === 'object' &&
        !Array.isArray(convOrId) &&
        typeof convOrId.toHexString !== 'function' &&
        (convOrId._id != null ||
          convOrId.id != null ||
          convOrId.conversationId != null)
          ? conversationListId(convOrId)
          : convOrId;
      try {
        await acceptSupportRequest(id);
        await joinConversation(id, { skipSocketJoin: false });
      } catch (err) {
        const msg = err?.message || err?.data?.message || JSON.stringify(err) || 'Could not accept this request';
        window.alert(`Accept failed: ${msg}`);
        console.error('[Chat] acceptAndOpen error:', err);
      }
    },
    [acceptSupportRequest, joinConversation]
  );

  const filteredConvs = conversations.filter((c) => {
    void listActivityTick;
    const convStatus = c.status || 'open';
    const matchStatus = statusFilter === 'all' || convStatus === statusFilter;
    const q = search.trim().toLowerCase();
    const idStr = conversationListId(c);
    const matchSearch =
      !q ||
      // Queued support requests stay visible even when search text doesn't match (API can exclude them).
      isPendingHumanSupportRequest(c) ||
      String(c.participantName || '')
        .toLowerCase()
        .includes(q) ||
      String(c.participantEmail || '')
        .toLowerCase()
        .includes(q) ||
      String(c.participantPhone || '')
        .toLowerCase()
        .includes(q) ||
      String(c.lastMessage || '')
        .toLowerCase()
        .includes(q) ||
      String(c.supportRequestNote || '')
        .toLowerCase()
        .includes(q) ||
      (idStr && idStr.includes(q.replace(/\s/g, '')));
    let matchAssignment = true;
    if (assignmentFilter === 'pending') {
      matchAssignment = isPendingHumanSupportRequest(c);
    } else if (assignmentFilter === 'mine') {
      matchAssignment =
        !!(adminId && c.assignedTo && String(c.assignedTo) === String(adminId));
    }
    // Requests tab: show full queue (ignore visitor row). Other tabs: apply visitor filter.
    let matchVisitor = true;
    if (assignmentFilter !== 'pending') {
      if (visitorFilter === 'buyers') {
        matchVisitor = isBuyerOrGuestVisitor(c);
      } else if (visitorFilter === 'sellers') {
        matchVisitor = isSellerVisitor(c);
      }
    }
    return matchStatus && matchSearch && matchAssignment && matchVisitor;
  });

  const handleSend = useCallback(
    (e) => {
      e.preventDefault();
      const text = input.trim();
      if (!text || !activeConvId) return;
      sendMessage(text);
      setInput('');
      emitTyping(false);
      clearTimeout(typingTimerRef.current);
    },
    [input, activeConvId, sendMessage, emitTyping]
  );

  const handleInputChange = useCallback(
    (e) => {
      setInput(e.target.value);
      emitTyping(true);
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => emitTyping(false), 1500);
    },
    [emitTyping]
  );

  const isClosed = activeConv?.status === 'closed';
  const userTyping = activeConvId ? peerTyping[activeConvId] : false;
  const visitorOnline = Boolean(
    activeConvId && participantOnlineByConvId[String(activeConvId)]
  );

  const effectivePhase = activeConv?.chatPhase || 'active';
  const canAdminReply =
    connected &&
    !isClosed &&
    activeConv &&
    !isPendingHumanSupportRequest(activeConv) &&
    (!activeConv.assignedTo || String(activeConv.assignedTo) === String(adminId));

  const canEndForInactivity =
    canAdminReply &&
    effectivePhase === 'active' &&
    participantIdleMs(activeConv) >= CHAT_USER_INACTIVITY_MS;

  return (
    <PageWrap>
      {/* ── Conversation list ── */}
      <Sidebar>
        <SidebarHeader>
          <SideTitle>
            <FaComments />
            Live Chat
            <ConnBadge $on={connected}>{connected ? 'Live' : 'Offline'}</ConnBadge>
          </SideTitle>
          <SearchBox>
            <FaSearch />
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
            />
          </SearchBox>
          <FilterRow>
            {['open', 'closed', 'all'].map((s) => (
              <FilterBtn key={s} $active={statusFilter === s} onClick={() => setStatusFilter(s)}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </FilterBtn>
            ))}
          </FilterRow>
          <FilterRow style={{ marginTop: '0.8rem' }}>
            {[
              { id: 'all', label: 'All chats' },
              { id: 'pending', label: 'Requests' },
              { id: 'mine', label: 'Assigned to me' },
            ].map(({ id, label }) => (
              <FilterBtn
                key={id}
                $active={assignmentFilter === id}
                onClick={() => setAssignmentFilter(id)}
              >
                {label}
              </FilterBtn>
            ))}
          </FilterRow>
          <FilterRow style={{ marginTop: '0.8rem' }}>
            {[
              { id: 'all', label: 'Everyone' },
              { id: 'buyers', label: 'Buyers & guests only' },
              { id: 'sellers', label: 'Sellers only' },
            ].map(({ id, label }) => (
              <FilterBtn
                key={id}
                $active={visitorFilter === id}
                onClick={() => setVisitorFilter(id)}
              >
                {label}
              </FilterBtn>
            ))}
          </FilterRow>
        </SidebarHeader>

        <ConvList>
          {filteredConvs.length === 0 ? (
            <EmptySide>
              <FaInbox />
              <p>No conversations yet</p>
            </EmptySide>
          ) : (
            filteredConvs.map((conv) => {
              const id = conversationListId(conv);
              return (
                <ConvItem
                  key={id}
                  $active={String(id) === String(activeConvId)}
                  onClick={() =>
                    joinConversation(id, {
                      skipSocketJoin: isPendingHumanSupportRequest(conv),
                    })
                  }
                >
                <ConvAvatar $role={conv.participantRole}>
                  {isSellerLikeVisitor(conv) ? <FaStore /> : <FaUserCircle />}
                  {conv.unreadByAdmin > 0 && (
                    <UnreadDot>{conv.unreadByAdmin > 9 ? '9+' : conv.unreadByAdmin}</UnreadDot>
                  )}
                </ConvAvatar>
                <ConvMeta>
                  <ConvNameRow>
                    <RolePill $role={String(conv.participantRole || '').toLowerCase()}>
                      {visitorTypeLabel(conv)}
                    </RolePill>
                    <ConvName style={{ margin: 0, flex: 1, minWidth: 0 }}>{conv.participantName}</ConvName>
                  </ConvNameRow>
                  <ConvPreview>
                    {isPendingHumanSupportRequest(conv)
                      ? conv.supportRequestNote?.trim() || 'Waiting for an agent to accept'
                      : conv.lastMessage || 'No messages yet'}
                  </ConvPreview>
                </ConvMeta>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                  <ConvTime>{fmtTime(conv.lastMessageAt)}</ConvTime>
                  <VisitorPresence $online={Boolean(participantOnlineByConvId[String(conv._id)])}>
                    {participantOnlineByConvId[String(conv._id)] ? 'Online' : 'Offline'}
                  </VisitorPresence>
                  {isPendingHumanSupportRequest(conv) && (
                    <ClosedTag style={{ background: `${GOLD}22`, color: GOLD, borderColor: GOLD }}>
                      Request
                    </ClosedTag>
                  )}
                  {conv.status === 'closed' && <ClosedTag>Closed</ClosedTag>}
                  {isPendingHumanSupportRequest(conv) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        acceptAndOpen(id);
                      }}
                      style={{
                        marginTop: '0.4rem',
                        padding: '0.35rem 0.7rem',
                        borderRadius: '0.5rem',
                        border: `1px solid ${GOLD}`,
                        background: `${GOLD}18`,
                        color: GOLD,
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        cursor: 'pointer',
                      }}
                    >
                      Accept
                    </button>
                  )}
                  {canShowSidebarCancelForConv(conv, adminId) && (
                    <ListCancelBtn
                      type="button"
                      title="Close this chat and remove it from the open list (visitor inactive for at least 10 minutes)"
                      onClick={async (e) => {
                        e.stopPropagation();
                        const ok = window.confirm(
                          'Remove this buyer/seller from the chat list? The conversation will be closed because they have been inactive for at least 10 minutes.',
                        );
                        if (!ok) return;
                        try {
                          await adminEndInactiveConversation(id);
                          toast.success('Chat closed and removed from the open list.');
                        } catch (err) {
                          toast.error(
                            err?.message ||
                              'Could not close this chat. The visitor may have been active recently.',
                          );
                        }
                      }}
                    >
                      Cancel
                    </ListCancelBtn>
                  )}
                </div>
                </ConvItem>
              );
            })
          )}
        </ConvList>
      </Sidebar>

      {/* ── Chat pane ── */}
      <ChatPane>
        {!activeConvId ? (
          <NoneSelected>
            <FaComments />
            <p>Select a conversation to start chatting</p>
          </NoneSelected>
        ) : (
          <>
            <ChatHeader>
              <ConvAvatar $role={activeConv?.participantRole} style={{ width: '4.4rem', height: '4.4rem' }}>
                {activeConv?.participantRole === 'seller' ? <FaStore /> : <FaUserCircle />}
              </ConvAvatar>
              <ChatHeaderInfo>
                <ChatHeaderName>{activeConv?.participantName || 'User'}</ChatHeaderName>
                <ChatHeaderSub>
                  <FaCircle
                    style={{
                      color: visitorOnline ? '#48bb78' : '#a0aec0',
                      fontSize: '0.8rem',
                    }}
                    aria-hidden
                  />
                  <span>{visitorOnline ? 'Online' : 'Offline'}</span>
                  <span aria-hidden> · </span>
                  <span>
                    {activeConv?.participantRole === 'seller'
                      ? 'Seller'
                      : activeConv?.participantRole === 'guest'
                        ? 'Guest'
                        : 'Buyer'}
                  </span>
                </ChatHeaderSub>
                {(activeConv?.participantEmail || activeConv?.participantPhone) && (
                  <ParticipantCredentials>
                    {activeConv.participantEmail ? (
                      <span>
                        <FaEnvelope aria-hidden />
                        {activeConv.participantEmail}
                      </span>
                    ) : null}
                    {activeConv.participantPhone ? (
                      <span>
                        <FaPhone aria-hidden />
                        {activeConv.participantPhone}
                      </span>
                    ) : null}
                  </ParticipantCredentials>
                )}
              </ChatHeaderInfo>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                {isPendingHumanSupportRequest(activeConv) && (
                  <ActionBtn type="button" onClick={() => acceptAndOpen(activeConvId)}>
                    Accept request
                  </ActionBtn>
                )}
                {isClosed ? (
                  <ActionBtn onClick={() => reopenConversation(activeConvId)}>
                    <FaLockOpen />
                    Reopen
                  </ActionBtn>
                ) : (
                  <>
                    {canEndForInactivity && (
                      <ActionBtn
                        type="button"
                        title="Close because the visitor has been idle past the platform threshold"
                        onClick={async () => {
                          try {
                            await adminEndInactiveConversation(activeConvId);
                          } catch (err) {
                            window.alert(err?.message || 'Could not end chat for inactivity');
                          }
                        }}
                      >
                        End (inactive)
                      </ActionBtn>
                    )}
                    <ActionBtn $danger onClick={() => closeConversation(activeConvId)}>
                      <FaLock />
                      Close
                    </ActionBtn>
                  </>
                )}
              </div>
            </ChatHeader>

            {isPendingHumanSupportRequest(activeConv) && activeConv.supportRequestNote?.trim() && (
              <div
                style={{
                  padding: '1rem 2rem',
                  background: 'var(--color-grey-50)',
                  borderBottom: '1px solid var(--color-grey-200)',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-grey-700)',
                }}
              >
                <strong>Request note:</strong> {activeConv.supportRequestNote}
              </div>
            )}

            <Messages>
              {activeMessages.map((msg) => {
                const fromAdmin = msg.senderRole === 'admin';
                return (
                  <MsgBubble key={msg._id} $fromAdmin={fromAdmin}>
                    {msg.content}
                    <MsgMeta $fromAdmin={fromAdmin}>
                      {msg.senderName} · {fmtTime(msg.createdAt)}
                    </MsgMeta>
                  </MsgBubble>
                );
              })}

              {userTyping && (
                <TypingDots>
                  <span /><span /><span />
                </TypingDots>
              )}

              <div ref={messagesEndRef} />
            </Messages>

            {isClosed && (
              <ClosedBanner>
                <span>This conversation is closed.</span>
                <ActionBtn onClick={() => reopenConversation(activeConvId)} style={{ padding: '0.5rem 1rem' }}>
                  <FaLockOpen /> Reopen
                </ActionBtn>
              </ClosedBanner>
            )}

            <InputRow onSubmit={handleSend}>
              <TextInput
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder={
                  isClosed
                    ? 'Conversation closed'
                    : isPendingHumanSupportRequest(activeConv)
                      ? 'Accept the request to reply'
                      : !canAdminReply
                        ? 'Only the assigned admin can reply'
                        : 'Type a reply…'
                }
                disabled={
                  isClosed ||
                  !connected ||
                  !canAdminReply ||
                  isPendingHumanSupportRequest(activeConv)
                }
                maxLength={2000}
                autoComplete="off"
              />
              <SendBtn
                type="submit"
                disabled={
                  isClosed ||
                  !connected ||
                  !canAdminReply ||
                  isPendingHumanSupportRequest(activeConv) ||
                  !input.trim()
                }
              >
                <FaPaperPlane />
              </SendBtn>
            </InputRow>
          </>
        )}
      </ChatPane>
    </PageWrap>
  );
};

export default AdminLiveChatPage;
