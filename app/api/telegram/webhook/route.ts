import { NextRequest, NextResponse } from "next/server";
import {
  TelegramMessage,
  parseTelegramUpdate,
  sendChatAction,
  sendTelegramMessage,
  sendTelegramPhoto,
  getBestPhotoFileId,
  resolveFileUrl
} from "@/lib/telegram";
import {
  ChatSession,
  getSession,
  resetSession,
  saveSession
} from "@/lib/session";
import { generateWeddingPortfolio } from "@/lib/generation";

export const runtime = "nodejs";
export const preferredRegion = ["bom1", "sin1", "cdg1"];
export const maxDuration = 120;

const MIN_REFERENCE_PHOTOS = Number(process.env.MIN_REFERENCE_PHOTOS ?? 4);
const MAX_REFERENCE_PHOTOS = Number(process.env.MAX_REFERENCE_PHOTOS ?? 6);
const OUTPUT_SHOTS = Number(process.env.OUTPUT_GALLERY_SHOTS ?? 12);

export async function POST(request: NextRequest) {
  const secret = process.env.TELEGRAM_BOT_SECRET;
  if (secret) {
    const headerSecret = request.headers.get("x-telegram-bot-api-secret-token");
    if (headerSecret !== secret) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  }

  const body = await request.json();

  let update;
  try {
    update = parseTelegramUpdate(body);
  } catch (error) {
    console.error("Failed to parse update", error);
    return NextResponse.json({ ok: true });
  }

  if (!update.message) {
    return NextResponse.json({ ok: true });
  }

  try {
    await handleMessage(update.message);
  } catch (error) {
    console.error("Telegram webhook error", error);
  }

  return NextResponse.json({ ok: true });
}

async function handleMessage(message: TelegramMessage) {
  const chatId = message.chat.id;
  let session = await getSession(chatId);

  if (message.text) {
    const normalized = message.text.trim().toLowerCase();
    if (normalized.startsWith("/start")) {
      await sendStartMessage(chatId);
      return;
    }

    if (normalized.startsWith("/help")) {
      await sendHelpMessage(chatId);
      return;
    }

    if (normalized.startsWith("/new")) {
      session = await startNewSession(chatId);
      await sendTelegramMessage(
        chatId,
        [
          "📸 *New session started!*",
          `Send ${MIN_REFERENCE_PHOTOS}-${MAX_REFERENCE_PHOTOS} photos (face + waist + full body).`,
          "When you're done, use /generate to begin AI styling."
        ].join("\n")
      );
      return;
    }

    if (normalized.startsWith("/reset")) {
      await resetSession(chatId);
      await sendTelegramMessage(
        chatId,
        "🧹 Session cleared. Use /new to begin another shoot."
      );
      return;
    }

    if (normalized.startsWith("/status")) {
      await sendStatus(chatId, session);
      return;
    }

    if (normalized.startsWith("/generate")) {
      await attemptGeneration(message, session);
      return;
    }
  }

  if (message.photo) {
    await handlePhoto(message, session);
    return;
  }

  await sendTelegramMessage(
    chatId,
    "I can turn your photos into Indian wedding editorials. Use /new to start a capture session, then upload 4-6 reference photos."
  );
}

async function sendStartMessage(chatId: number) {
  await sendTelegramMessage(
    chatId,
    [
      "👋 *ShaadiFrame AI*",
      "",
      "I'll style you in cinematic Indian wedding looks.",
      "",
      "• Use /new to start a capture session.",
      "• Upload 4-6 photos (mix of close, waist, full body).",
      "• Send /generate once your gallery is ready.",
      "",
      "Pro-tip: great lighting + neutral background = best face lock!"
    ].join("\n")
  );
}

async function sendHelpMessage(chatId: number) {
  await sendTelegramMessage(
    chatId,
    [
      "*Help Menu*",
      "",
      "/new – start collecting new reference photos",
      "/generate – run the AI wedding shoot",
      "/status – see how many photos are saved",
      "/reset – clear everything",
      "",
      "Need support? Reply with details and the team will review."
    ].join("\n")
  );
}

async function startNewSession(chatId: number): Promise<ChatSession> {
  const session: ChatSession = {
    chatId,
    state: "collecting",
    photos: [],
    startedAt: Date.now(),
    updatedAt: Date.now()
  };
  await saveSession(session);
  return session;
}

async function sendStatus(chatId: number, session: ChatSession) {
  const stored = session.photos.length;
  await sendTelegramMessage(
    chatId,
    [
      `📊 *Status*`,
      `State: ${session.state}`,
      `Reference photos stored: ${stored}/${MAX_REFERENCE_PHOTOS}`,
      "",
      stored >= MIN_REFERENCE_PHOTOS
        ? "Ready to /generate your wedding images."
        : `Need ${MIN_REFERENCE_PHOTOS - stored} more reference photo(s).`
    ].join("\n")
  );
}

async function handlePhoto(message: TelegramMessage, session: ChatSession) {
  const chatId = message.chat.id;

  if (session.state === "idle") {
    await sendTelegramMessage(
      chatId,
      "Start a new session first. Use /new and then share your reference photos."
    );
    return;
  }

  if (session.state === "generating") {
    await sendTelegramMessage(
      chatId,
      "Hold tight! I'm already creating your wedding gallery. You'll get the results shortly."
    );
    return;
  }

  if (session.photos.length >= MAX_REFERENCE_PHOTOS) {
    await sendTelegramMessage(
      chatId,
      `You've already uploaded ${MAX_REFERENCE_PHOTOS} photos. Run /generate or /reset to start again.`
    );
    return;
  }

  try {
    const fileId = await getBestPhotoFileId(message);
    const fileUrl = await resolveFileUrl(fileId);

    const updatedSession: ChatSession = {
      ...session,
      state: "collecting",
      photos: [...session.photos, { fileId, fileUrl }],
      updatedAt: Date.now()
    };

    await saveSession(updatedSession);
    const count = updatedSession.photos.length;

    await sendTelegramMessage(
      chatId,
      [
        `✅ Photo ${count} saved.`,
        count >= MIN_REFERENCE_PHOTOS
          ? `You can /generate now or add up to ${
              MAX_REFERENCE_PHOTOS - count
            } more photo(s).`
          : `Need at least ${MIN_REFERENCE_PHOTOS} to start.`
      ].join("\n")
    );
  } catch (error) {
    console.error("Photo handling error", error);
    await sendTelegramMessage(
      chatId,
      "Couldn't process that photo. Ensure it's a standard JPEG/PNG image."
    );
  }
}

async function attemptGeneration(message: TelegramMessage, session: ChatSession) {
  const chatId = message.chat.id;
  if (session.state === "idle" || session.state === "collecting") {
    if (session.photos.length < MIN_REFERENCE_PHOTOS) {
      await sendTelegramMessage(
        chatId,
        `Need at least ${MIN_REFERENCE_PHOTOS} reference photos before generating.`
      );
      return;
    }
  }

  if (session.state === "generating") {
    await sendTelegramMessage(
      chatId,
      "Already generating your wedding images. They'll arrive shortly."
    );
    return;
  }

  const referenceUrls = session.photos
    .map((photo) => photo.fileUrl)
    .filter((url): url is string => Boolean(url));

  if (referenceUrls.length < MIN_REFERENCE_PHOTOS) {
    await sendTelegramMessage(
      chatId,
      "One or more stored photos expired. Please restart with /new and resend them."
    );
    await resetSession(chatId);
    return;
  }

  const generatingSession: ChatSession = {
    ...session,
    state: "generating",
    updatedAt: Date.now()
  };

  await saveSession(generatingSession);
  await sendTelegramMessage(
    chatId,
    "🎨 Generating your ShaadiFrame portfolio. This takes about a minute."
  );
  await sendChatAction(chatId, "upload_photo");

  try {
    const outputs = await generateWeddingPortfolio(referenceUrls, {
      shots: OUTPUT_SHOTS
    });

    const limited = outputs.slice(0, OUTPUT_SHOTS);
    for (const [index, url] of limited.entries()) {
      await sendChatAction(chatId, "upload_photo");
      await sendTelegramPhoto(
        chatId,
        url,
        `ShaadiFrame look ${index + 1}/${limited.length}`
      );
    }

    await sendTelegramMessage(
      chatId,
      "✨ Wedding gallery delivered! Use /new whenever you want fresh looks."
    );
  } catch (error) {
    console.error("Generation failure", error);
    await sendTelegramMessage(
      chatId,
      "Generation failed. Please try again in a few minutes or /new to restart."
    );
  } finally {
    await resetSession(chatId);
  }
}
