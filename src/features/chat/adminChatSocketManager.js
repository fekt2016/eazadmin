import { io } from 'socket.io-client';
import { getEazadminBackendOrigin } from '../../shared/config/chatSocketOrigin';
import queryClient from '../../api/queryClient';

let sharedSocket = null;
let refCount = 0;

/**
 * Live Chat page removes socket listeners on unmount; the shared socket stays connected
 * (DashboardLayout). Without this, seller `chat:new_support_request` events are missed
 * and the list never refetches. Invalidate the REST-backed query when admin-room updates.
 */
function attachAdminChatListInvalidation(socket) {
  if (socket.__eazadminChatListInvalidateAttached) return;
  socket.__eazadminChatListInvalidateAttached = true;
  const bump = () => {
    queryClient.invalidateQueries({ queryKey: ['adminChatConversations'] });
  };
  socket.on('connect', bump);
  socket.on('chat:new_support_request', bump);
  socket.on('chat:new_conversation', bump);
  socket.on('chat:conversation_updated', bump);
}

/**
 * Reference-counted Socket.io client for admin chat.
 * Keeps a single connection while any dashboard consumer (layout + live chat page) is mounted,
 * so the server can join `admin-room` and deliver `chat:new_support_request` reliably.
 */
export function retainAdminChatSocket() {
  refCount += 1;
  if (!sharedSocket) {
    // Authentication via HttpOnly cookie (admin_jwt) — no token in localStorage
    sharedSocket = io(getEazadminBackendOrigin(), {
      withCredentials: true,
      auth: { chatAs: 'admin' },
      path: '/socket.io',
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
    attachAdminChatListInvalidation(sharedSocket);
  }
  return sharedSocket;
}

export function releaseAdminChatSocket() {
  refCount = Math.max(0, refCount - 1);
  if (refCount === 0 && sharedSocket) {
    sharedSocket.disconnect();
    sharedSocket = null;
  }
}
