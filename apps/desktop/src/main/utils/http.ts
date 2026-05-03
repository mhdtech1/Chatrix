/**
 * Read a response body as text with a hard byte cap, so a hostile or
 * mis-redirected endpoint cannot balloon main-process memory.
 */
export async function readResponseTextCapped(
  response: Response,
  maxBytes: number,
  source: string,
): Promise<string> {
  if (!response.body) return await response.text();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      received += value.byteLength;
      if (received > maxBytes) {
        try {
          await reader.cancel();
        } catch {
          /* ignore */
        }
        throw new Error(
          `${source} response exceeded ${maxBytes} bytes; aborted.`,
        );
      }
      chunks.push(value);
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      /* ignore */
    }
  }
  const buffer = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder("utf-8").decode(buffer);
}

export const DEFAULT_JSON_MAX_BYTES = 2 * 1024 * 1024; // 2 MiB
export const DEFAULT_HTML_MAX_BYTES = 5 * 1024 * 1024; // 5 MiB

export async function fetchJsonOrThrow<T>(
  response: Response,
  source: string,
  options?: { maxBytes?: number },
): Promise<T> {
  const maxBytes = options?.maxBytes ?? DEFAULT_JSON_MAX_BYTES;
  const text = await readResponseTextCapped(response, maxBytes, source);
  let parsed: unknown = {};

  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = {};
    }
  }

  if (!response.ok) {
    const payload = parsed as Record<string, unknown>;
    const nested = payload.error as Record<string, unknown> | undefined;
    const rawText = text.trim();
    const payloadError = payload.error;
    const explicitError =
      typeof payloadError === "string"
        ? payloadError
        : Array.isArray(payloadError)
          ? payloadError.find(
              (entry): entry is string =>
                typeof entry === "string" && entry.trim().length > 0,
            )
          : undefined;
    const errorsField = payload.errors;
    const topLevelError =
      typeof errorsField === "string"
        ? errorsField
        : Array.isArray(errorsField)
          ? errorsField.find(
              (entry): entry is string =>
                typeof entry === "string" && entry.trim().length > 0,
            )
          : undefined;
    const message =
      (typeof payload.message === "string" && payload.message) ||
      (typeof nested?.message === "string" && nested.message) ||
      (typeof payload.error_description === "string" &&
        payload.error_description) ||
      explicitError ||
      topLevelError ||
      (rawText ? rawText.slice(0, 300) : "") ||
      `${source} request failed (${response.status}).`;
    throw new Error(message);
  }

  return parsed as T;
}
