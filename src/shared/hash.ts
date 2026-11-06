/**
 * @module hash
 * @description Stable Web Crypto hashing helper for snapshot identifiers.
 */

/** Creates a SHA-256 hex digest. @param value Text to hash. @returns Hex digest. */
export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
