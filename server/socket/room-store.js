const rooms = new Map();
const pendingLeaves = new Map();

const EMPTY_ROOM_TIMEOUT_MS = 5 * 60 * 1000;
export const DISCONNECT_GRACE_MS = 20_000;

export function getOrCreateMemoryRoom(roomId) {
  let room = rooms.get(roomId);
  if (!room) {
    room = {
      roomId,
      messages: [],
      participants: new Map(),
      typing: new Map(),
      lastActivity: Date.now(),
    };
    rooms.set(roomId, room);
  }
  room.lastActivity = Date.now();
  return room;
}

export function getMemoryRoom(roomId) {
  return rooms.get(roomId);
}

export function deleteMemoryRoom(roomId) {
  rooms.delete(roomId);
}

export function clearRoomState(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  room.messages = [];
  room.participants.clear();
  room.typing.clear();
}

export function getParticipantsList(room) {
  return Array.from(room.participants.values());
}

export function getTypingList(room) {
  return Array.from(room.typing.values());
}

export function pendingLeaveKey(roomId, userId) {
  return `${roomId}:${userId}`;
}

export function schedulePendingLeave(roomId, userId, callback) {
  const key = pendingLeaveKey(roomId, userId);
  cancelPendingLeave(roomId, userId);
  const timeoutId = setTimeout(callback, DISCONNECT_GRACE_MS);
  pendingLeaves.set(key, timeoutId);
  return timeoutId;
}

export function cancelPendingLeave(roomId, userId) {
  const key = pendingLeaveKey(roomId, userId);
  const timeoutId = pendingLeaves.get(key);
  if (timeoutId) {
    clearTimeout(timeoutId);
    pendingLeaves.delete(key);
  }
}

export function cleanupInactiveRooms() {
  const now = Date.now();
  const deleted = [];

  for (const [roomId, room] of rooms.entries()) {
    if (
      room.participants.size === 0 &&
      now - room.lastActivity > EMPTY_ROOM_TIMEOUT_MS
    ) {
      rooms.delete(roomId);
      deleted.push(roomId);
    }
  }

  return deleted;
}
