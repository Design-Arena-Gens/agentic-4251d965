import { Redis } from "@upstash/redis";

export type SessionState = "idle" | "collecting" | "generating";

export interface PhotoReference {
  fileId: string;
  fileUrl?: string;
}

export interface ChatSession {
  chatId: number;
  state: SessionState;
  photos: PhotoReference[];
  startedAt: number;
  updatedAt: number;
}

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN
      })
    : null;

type MemoryStore = Map<number, ChatSession>;

declare global {
  // eslint-disable-next-line no-var
  var __SHAADIFRAME_SESSION_STORE__: MemoryStore | undefined;
}

const memoryStore: MemoryStore =
  globalThis.__SHAADIFRAME_SESSION_STORE__ ??
  (globalThis.__SHAADIFRAME_SESSION_STORE__ = new Map());

function sessionKey(chatId: number) {
  return `session:${chatId}`;
}

export async function getSession(chatId: number): Promise<ChatSession> {
  if (!redis) {
    const existing = memoryStore.get(chatId);
    if (existing) {
      return existing;
    }

    const session: ChatSession = {
      chatId,
      state: "idle",
      photos: [],
      startedAt: Date.now(),
      updatedAt: Date.now()
    };
    memoryStore.set(chatId, session);
    return session;
  }

  const raw = await redis.get<ChatSession>(sessionKey(chatId));

  if (!raw) {
    const session: ChatSession = {
      chatId,
      state: "idle",
      photos: [],
      startedAt: Date.now(),
      updatedAt: Date.now()
    };

    await saveSession(session);
    return session;
  }

  return raw;
}

export async function saveSession(session: ChatSession) {
  const ttlSeconds = Number(process.env.SESSION_TTL_SECONDS ?? 3600);
  const nextSession: ChatSession = {
    ...session,
    updatedAt: Date.now()
  };

  if (!redis) {
    memoryStore.set(session.chatId, nextSession);
    return;
  }

  await redis.set(sessionKey(session.chatId), nextSession, {
    ex: ttlSeconds
  });
}

export async function resetSession(chatId: number) {
  if (!redis) {
    memoryStore.delete(chatId);
    return;
  }

  await redis.del(sessionKey(chatId));
}
