import { z } from "zod";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN) {
  console.warn(
    "Missing TELEGRAM_BOT_TOKEN environment variable. Telegram API calls will fail."
  );
}

const telegramUpdateSchema = z.object({
  update_id: z.number(),
  message: z
    .object({
      message_id: z.number(),
      date: z.number(),
      chat: z.object({
        id: z.number(),
        type: z.string(),
        title: z.string().optional(),
        username: z.string().optional(),
        first_name: z.string().optional(),
        last_name: z.string().optional()
      }),
      from: z
        .object({
          id: z.number(),
          is_bot: z.boolean(),
          first_name: z.string().optional(),
          last_name: z.string().optional(),
          username: z.string().optional(),
          language_code: z.string().optional()
        })
        .optional(),
      text: z.string().optional(),
      caption: z.string().optional(),
      media_group_id: z.string().optional(),
      photo: z
        .array(
          z.object({
            file_id: z.string(),
            file_unique_id: z.string(),
            width: z.number(),
            height: z.number(),
            file_size: z.number().optional()
          })
        )
        .optional(),
      document: z
        .object({
          file_id: z.string(),
          file_unique_id: z.string(),
          file_name: z.string().optional(),
          mime_type: z.string().optional(),
          file_size: z.number().optional(),
          thumbnail: z
            .object({
              file_id: z.string(),
              file_unique_id: z.string(),
              width: z.number(),
              height: z.number(),
              file_size: z.number().optional()
            })
            .optional()
        })
        .optional()
    })
    .optional()
});

export type TelegramUpdate = z.infer<typeof telegramUpdateSchema>;
export type TelegramMessage = NonNullable<TelegramUpdate["message"]>;

function telegramApiUrl(method: string) {
  if (!TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured.");
  }

  return `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`;
}

export function parseTelegramUpdate(payload: unknown): TelegramUpdate {
  return telegramUpdateSchema.parse(payload);
}

export async function sendTelegramMessage(
  chatId: number,
  text: string,
  extra?: Record<string, unknown>
) {
  const response = await fetch(telegramApiUrl("sendMessage"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
      ...extra
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Failed to send Telegram message: ${response.status} ${detail}`);
  }
}

export async function sendTelegramPhoto(
  chatId: number,
  photoUrl: string,
  caption?: string
) {
  const response = await fetch(telegramApiUrl("sendPhoto"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: chatId,
      photo: photoUrl,
      caption,
      parse_mode: "Markdown"
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Failed to send Telegram photo: ${response.status} ${detail}`);
  }
}

export async function sendChatAction(chatId: number, action: string) {
  const response = await fetch(telegramApiUrl("sendChatAction"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: chatId,
      action
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Failed to send chat action: ${response.status} ${detail}`);
  }
}

export async function getBestPhotoFileId(message: TelegramMessage): Promise<string> {
  if (!message.photo || message.photo.length === 0) {
    throw new Error("Message does not contain photos.");
  }

  const sorted = [...message.photo].sort((a, b) => {
    const sizeA = (a.file_size ?? a.width * a.height) ?? 0;
    const sizeB = (b.file_size ?? b.width * b.height) ?? 0;
    return sizeB - sizeA;
  });

  return sorted[0].file_id;
}

export async function resolveFileUrl(fileId: string): Promise<string> {
  if (!TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured.");
  }

  const fileResponse = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${encodeURIComponent(
      fileId
    )}`
  );

  if (!fileResponse.ok) {
    const detail = await fileResponse.text();
    throw new Error(`Failed to resolve Telegram file: ${fileResponse.status} ${detail}`);
  }

  const json = await fileResponse.json();
  if (!json.ok) {
    throw new Error(`Telegram getFile returned error: ${JSON.stringify(json)}`);
  }

  const { file_path: filePath } = json.result as { file_path: string };

  return `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;
}
