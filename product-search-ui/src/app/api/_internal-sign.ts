import crypto from "crypto";

/** Keep identical between FE and server */
export function sha256Hex(input: string | Buffer): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function hmacHex(secret: string, input: string): string {
  return crypto.createHmac("sha256", secret).update(input).digest("hex");
}

/**
 * Builds signature headers for a proxied request.
 * methodAndPath should match what server sees, including any global prefix (/api if used on Nest).
 */
export function buildInternalSignatureHeaders(options: {
  method: string; // "GET" | "POST" etc.
  path: string; // e.g., "/profile/<id>/preferences"
  body: Record<string, unknown> | string | Buffer | undefined;
  userId: string;
  sharedSecret: string;
}) {
  const method = options.method.toUpperCase();
  const timestampMs = Date.now();
  const bodyString =
    typeof options.body === "string" || options.body instanceof Buffer
      ? options.body
      : JSON.stringify(options.body ?? "");
  const bodyHash = sha256Hex(bodyString);

  const toSign = `${method}:${options.path}:${timestampMs}:${options.userId}:${bodyHash}`;
  const signature = hmacHex(options.sharedSecret, toSign);

  return {
    "x-internal-signature": signature,
    "x-internal-timestamp": String(timestampMs),
    "x-internal-user-id": options.userId,
  };
}
