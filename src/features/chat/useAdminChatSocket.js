import { useEffect, useRef, useCallback, useState } from 'react';
import api from '../../shared/services/api';
import { retainAdminChatSocket, releaseAdminChatSocket } from './adminChatSocketManager';

/** 24-char hex string suitable for Mongo ObjectId queries (trim + extract from noisy strings). */
function extractMongoObjectIdHex(input) {
  if (input == null || input === '') return '';
  const s = String(input).trim();
  if (/^[a-fA-F0-9]{24}$/i.test(s)) return s.toLowerCase();
  const m = s.match(/[a-fA-F0-9]{24}/i);
  return m ? m[0].toLowerCase() : '';
}

/**
 * Prefer a strict 24-hex segment when present; otherwise only allow a full 24-hex id.
 * Never pass through `String(object)` garbage like "[object Object]" (15 chars).
 */
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

/**
 * Normalize conversation ids from strings, API docs, or BSON ObjectId-like values.
 * `conversationListId` alone returns '' for bare ObjectId instances (no `_id` field).
 */
function resolveConversationClientId(convId) {
  if (convId == null || convId === '') return '';
  if (Array.isArray(convId)) return '';
  const t = typeof convId;
  if (t === 'string' || t === 'number') {
    return preferHexOrTrimmed(convId);
  }
  if (t !== 'object') {
    return preferHexOrTrimmed(convId ?? '');
  }
  if (typeof convId.toHexString === 'function') {
    try {
      return preferHexOrTrimmed(convId.toHexString());
    } catch {
      /* ignore */
    }
  }
  const prim = typeof convId.valueOf === 'function' ? convId.valueOf() : convId;
  if (prim !== convId && (typeof prim === 'string' || typeof prim === 'number')) {
    return preferHexOrTrimmed(prim);
  }
  const fromShape = conversationListId(convId);
  const rough = fromShape || (String(convId) === '[object Object]' ? '' : String(convId).trim());
  return preferHexOrTrimmed(rough);
}

/** Match a list row to an id from socket/API (same hex normalization as conversationListId). */
function conversationIdMatchesRow(row, rawId) {
  const left = conversationListId(row);
  if (!left) return false;
  const right = resolveConversationClientId(rawId);
  if (right) return left === right;
  return left === preferHexOrTrimmed(String(rawId ?? ''));
}

/**
 * useAdminChatSocket — manages the Socket.io connection for the admin live-chat page.
 * @param {boolean} enabled
 * @param {{ onNewSupportRequest?: () => void }} [options]
 */
export const useAdminChatSocket = (enabled, options = {}) => {
  const { onNewSupportRequest } = options;
  const onNewSupportRequestRef = useRef(onNewSupportRequest);
  onNewSupportRequestRef.current = onNewSupportRequest;

  const socketRef = useRef(null);
  const activeConvIdRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [conversations, setConversations] = useState([]);
  const [activeMessages, setActiveMessages] = useState([]);
  const [activeConvId, setActiveConvIdState] = useState(null);
  const [peerTyping, setPeerTyping] = useState({}); // { [convId]: bool }
  const [participantOnlineByConvId, setParticipantOnlineByConvId] = useState({});

  useEffect(() => {
    if (!enabled) return;

    const socket = retainAdminChatSocket();
    socketRef.current = socket;

    const upsertConversation = (conversation) => {
      const id = conversationListId(conversation);
      if (!id) return;
      setConversations((prev) => {
        const exists = prev.some((c) => conversationListId(c) === id);
        if (exists) {
          return prev.map((c) =>
            conversationListId(c) === id ? { ...c, ...conversation } : c
          );
        }
        return [{ ...conversation }, ...prev];
      });
    };

    const onConnect = () => {
      setConnected(true);
      const convId = activeConvIdRef.current;
      if (convId) {
        socket.emit('chat:join_conversation', { conversationId: convId });
      }
    };
    const onDisconnect = () => setConnected(false);
    const onConnectError = () => setConnected(false);

    const onAdminUnread = ({ count }) => setUnreadCount(count);

    const onParticipantPresence = ({ conversationId, online }) => {
      if (conversationId == null || conversationId === '') return;
      const id = String(conversationId);
      setParticipantOnlineByConvId((prev) => {
        if (online) return { ...prev, [id]: true };
        const next = { ...prev };
        delete next[id];
        return next;
      });
    };

    const onParticipantPresenceSnapshot = ({ onlineByConversationId } = {}) => {
      if (!onlineByConversationId || typeof onlineByConversationId !== 'object') return;
      const next = {};
      Object.keys(onlineByConversationId).forEach((k) => {
        if (onlineByConversationId[k]) next[String(k)] = true;
      });
      setParticipantOnlineByConvId(next);
    };

    const onNewConversation = ({ conversation }) => {
      upsertConversation(conversation);
    };

    const onNewSupportRequest = ({ conversation }) => {
      upsertConversation(conversation);
      onNewSupportRequestRef.current?.();
    };

    const onConversationUpdated = ({ conversation }) => {
      upsertConversation(conversation);
    };

    const onSupportRequestClaimed = ({ conversationId, assignedTo }) => {
      if (conversationId == null || conversationId === '') return;
      setConversations((prev) =>
        prev.map((c) =>
          conversationIdMatchesRow(c, conversationId)
            ? { ...c, chatPhase: 'active', assignedTo, supportAcceptedAt: new Date() }
            : c
        )
      );
    };

    const onChatMessage = ({ message }) => {
      if (!message?.conversationId) return;
      const activeId = activeConvIdRef.current;
      const msgConvId =
        resolveConversationClientId(message.conversationId) ||
        preferHexOrTrimmed(String(message.conversationId));
      if (!msgConvId) return;
      const activeNorm =
        activeId != null
          ? resolveConversationClientId(activeId) ||
            preferHexOrTrimmed(String(activeId))
          : '';
      const isViewingThisChat =
        Boolean(activeNorm && msgConvId && activeNorm === msgConvId);

      if (isViewingThisChat) {
        setActiveMessages((prev) => {
          if (prev.some((m) => String(m._id) === String(message._id))) return prev;
          return [...prev, message];
        });
      }

      if (message.senderRole !== 'admin') {
        setConversations((prev) =>
          prev.map((c) =>
            conversationIdMatchesRow(c, message.conversationId)
              ? {
                  ...c,
                  lastMessage: message.content.substring(0, 80),
                  lastMessageAt: message.createdAt,
                  unreadByAdmin: isViewingThisChat
                    ? 0
                    : (c.unreadByAdmin || 0) + 1,
                }
              : c
          )
        );
      }
    };

    const onUserTyping = ({ role, typing }) => {
      // Backend emits 'chat:typing' with { role, typing } from the conv room.
      // We track per active conversation — if the admin is in the conv room, role is the participant.
      if (role !== 'admin') {
        const convId = activeConvIdRef.current;
        if (convId) {
          setPeerTyping((prev) => ({ ...prev, [String(convId)]: typing }));
        }
      }
    };

    const onConversationClosed = ({ conversationId }) => {
      setConversations((prev) =>
        prev.map((c) =>
          conversationIdMatchesRow(c, conversationId)
            ? { ...c, status: 'closed' }
            : c
        )
      );
    };

    const onConversationReopened = ({ conversationId }) => {
      setConversations((prev) =>
        prev.map((c) =>
          conversationIdMatchesRow(c, conversationId)
            ? { ...c, status: 'open' }
            : c
        )
      );
    };

    const onConversationReset = ({ conversation } = {}) => {
      const cid = conversation?.conversationId;
      if (cid == null || cid === '') return;
      const idNorm =
        resolveConversationClientId(cid) || preferHexOrTrimmed(String(cid));
      if (!idNorm) return;
      const activeNorm =
        activeConvIdRef.current != null
          ? resolveConversationClientId(activeConvIdRef.current) ||
            preferHexOrTrimmed(String(activeConvIdRef.current))
          : '';
      if (activeNorm && idNorm && activeNorm === idNorm) {
        setActiveMessages([]);
      }
      setConversations((prev) =>
        prev.map((c) =>
          conversationIdMatchesRow(c, cid)
            ? {
                ...c,
                status: conversation.status || 'open',
                chatPhase: conversation.chatPhase,
                faqBotStepId: conversation.faqBotStepId,
                lastParticipantMessageAt: conversation.lastParticipantMessageAt,
                supportRequestNote: conversation.supportRequestNote ?? '',
                supportRequestedAt: conversation.supportRequestedAt,
                assignedTo: conversation.assignedTo,
                supportAcceptedAt: conversation.supportAcceptedAt,
                lastMessage: conversation.lastMessage ?? '',
                lastMessageAt: conversation.lastMessageAt,
                unreadByAdmin: 0,
                unreadByUser: 0,
              }
            : c
        )
      );
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('chat:admin_unread_count', onAdminUnread);
    socket.on('chat:participant_presence', onParticipantPresence);
    socket.on('chat:participant_presence_snapshot', onParticipantPresenceSnapshot);
    socket.on('chat:new_conversation', onNewConversation);
    socket.on('chat:new_support_request', onNewSupportRequest);
    socket.on('chat:conversation_updated', onConversationUpdated);
    socket.on('chat:support_request_claimed', onSupportRequestClaimed);
    socket.on('chat:message', onChatMessage);
    socket.on('chat:typing', onUserTyping);
    socket.on('chat:conversation_closed', onConversationClosed);
    socket.on('chat:conversation_reopened', onConversationReopened);
    socket.on('chat:conversation_reset', onConversationReset);

    if (socket.connected) {
      setConnected(true);
      const convId = activeConvIdRef.current;
      if (convId) {
        socket.emit('chat:join_conversation', { conversationId: convId });
      }
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('chat:admin_unread_count', onAdminUnread);
      socket.off('chat:participant_presence', onParticipantPresence);
      socket.off('chat:participant_presence_snapshot', onParticipantPresenceSnapshot);
      socket.off('chat:new_conversation', onNewConversation);
      socket.off('chat:new_support_request', onNewSupportRequest);
      socket.off('chat:conversation_updated', onConversationUpdated);
      socket.off('chat:support_request_claimed', onSupportRequestClaimed);
      socket.off('chat:message', onChatMessage);
      socket.off('chat:typing', onUserTyping);
      socket.off('chat:conversation_closed', onConversationClosed);
      socket.off('chat:conversation_reopened', onConversationReopened);
      socket.off('chat:conversation_reset', onConversationReset);
      socketRef.current = null;
      releaseAdminChatSocket();
    };
  }, [enabled]);

  const joinConversation = useCallback(async (convId, options = {}) => {
    const { skipSocketJoin = false } = options;
    const cid = resolveConversationClientId(convId);
    if (!cid) return;
    activeConvIdRef.current = cid;
    setActiveConvIdState(cid);
    setActiveMessages([]);
    if (!skipSocketJoin) {
      socketRef.current?.emit('chat:join_conversation', { conversationId: cid });
    }
  
    const convKey = cid;
  
    setConversations((prev) =>
      prev.map((c) =>
        conversationListId(c) === convKey ? { ...c, unreadByAdmin: 0 } : c
      )
    );
  
    try {
      const { data: body } = await api.get(
        `/admin/chat/conversations/${cid}/messages`
      );
      if (body?.data?.messages) setActiveMessages(body.data.messages);
      if (body?.data?.conversation) {
        const merged = body.data.conversation;
        setConversations((prev) =>
          prev.map((c) =>
            conversationListId(c) === convKey ? { ...c, ...merged } : c
          )
        );
      }
    } catch {
      // ignore
    }
  }, []);

  const acceptSupportRequest = useCallback((convId) => {
    const s = socketRef.current;
    if (!s?.connected) {
      return Promise.reject(new Error('Not connected'));
    }
    const raw =
      convId != null &&
      typeof convId === 'object' &&
      !Array.isArray(convId) &&
      typeof convId.toHexString !== 'function' &&
      (convId._id != null ||
        convId.id != null ||
        convId.conversationId != null)
        ? conversationListId(convId)
        : convId;
    const cid = resolveConversationClientId(raw);
    if (!cid) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console -- dev-only accept id diagnostics
        console.warn('[Chat] accept_support_request: empty cid after resolve', {
          convIdType: typeof convId,
          rawType: typeof raw,
          rawIsObject: raw != null && typeof raw === 'object',
        });
      }
      return Promise.reject(new Error('Invalid conversation id'));
    }
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console -- dev-only accept id diagnostics
      console.info('[Chat] accept_support_request: emit', {
        cidLength: String(cid).length,
        cidPrefix: String(cid).slice(0, 4),
      });
    }
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error('Request timed out'));
      }, 12000);

      const cleanup = () => {
        clearTimeout(timer);
        s.off('chat:support_accepted', onAccept);
        s.off('chat:error', onErr);
      };

      const onAccept = (payload) => {
        if (String(payload?.conversationId) !== cid) return;
        cleanup();
        resolve(payload);
      };

      const onErr = (payload) => {
        if (payload?.code !== 'ACCEPT_FAILED') return;
        cleanup();
        reject(new Error(payload?.message || 'Could not accept'));
      };

      s.on('chat:support_accepted', onAccept);
      s.on('chat:error', onErr);
      s.emit('chat:accept_support_request', { conversationId: String(cid) });
    });
  }, []);

  const sendMessage = useCallback(
    (content) => {
      if (!socketRef.current?.connected || !content?.trim() || !activeConvId) return;
      socketRef.current.emit('chat:send', {
        content: content.trim(),
        conversationId: activeConvId,
      });
    },
    [activeConvId]
  );

  const emitTyping = useCallback(
    (isTyping) => {
      socketRef.current?.emit('chat:typing', {
        conversationId: activeConvId,
        typing: isTyping,
      });
    },
    [activeConvId]
  );

  const closeConversation = useCallback((convId) => {
    socketRef.current?.emit('chat:close_conversation', { conversationId: convId });
  }, []);

  const reopenConversation = useCallback((convId) => {
    socketRef.current?.emit('chat:reopen_conversation', { conversationId: convId });
  }, []);

  const adminEndInactiveConversation = useCallback((convId) => {
    const s = socketRef.current;
    if (!s?.connected) {
      return Promise.reject(new Error('Not connected'));
    }
    const cid = String(convId);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error('Request timed out'));
      }, 15000);

      const cleanup = () => {
        clearTimeout(timer);
        s.off('chat:conversation_closed', onClosed);
        s.off('chat:error', onErr);
      };

      const onClosed = (payload) => {
        if (String(payload?.conversationId) !== cid) return;
        cleanup();
        resolve(payload);
      };

      const onErr = (payload) => {
        const code = payload?.code;
        const msg = payload?.message || '';
        if (
          code === 'INACTIVITY_TOO_SOON' ||
          msg === 'You cannot end this chat.' ||
          msg === 'Could not end chat.'
        ) {
          cleanup();
          reject(new Error(msg || 'Could not end chat for inactivity'));
        }
      };

      s.on('chat:conversation_closed', onClosed);
      s.on('chat:error', onErr);
      s.emit('chat:admin_end_inactive', { conversationId: convId });
    });
  }, []);

  return {
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
  };
};
