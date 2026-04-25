/**
 * QR Kod Üretici — Ed25519 İmzalama
 * 
 * generate_user_qr.py'deki mantığın React Native karşılığı.
 * Format: user_id|timestamp|SIG|base64(Ed25519_signature)
 * İmzalanan mesaj: "user_id|timestamp" (UTF-8 encoded)
 */

import nacl from 'tweetnacl';
import { decodeBase64, encodeBase64 } from 'tweetnacl-util';

// AkilliKapiSistemi private_key.pem dosyasından alınan Ed25519 private key (32 byte seed)
const PRIVATE_KEY_BASE64 = 'NyikzavV/uuaduRXs1sUvGv+QZgR/S2Za47agGefr/I=';

/**
 * Kullanıcı için imzalı QR payload oluşturur.
 * @param {number|string} userId - Kullanıcı ID
 * @returns {{ payload: string, expiresIn: number, generatedAt: number }}
 */
export function generateQRPayload(userId) {
  // 1. Private key seed'den tam keypair oluştur
  const seedBytes = decodeBase64(PRIVATE_KEY_BASE64);
  const keyPair = nacl.sign.keyPair.fromSeed(seedBytes);

  // 2. Zaman damgası (Unix epoch saniye)
  const timestamp = Math.floor(Date.now() / 1000).toString();

  // 3. İmzalanacak mesaj: "user_id|timestamp"
  const message = `${userId}|${timestamp}`;
  const messageBytes = new TextEncoder().encode(message);

  // 4. Ed25519 ile imzala
  const signature = nacl.sign.detached(messageBytes, keyPair.secretKey);
  const sigBase64 = encodeBase64(signature);

  // 5. QR içeriği: "user_id|timestamp|SIG|base64_signature"
  const payload = `${userId}|${timestamp}|SIG|${sigBase64}`;

  return {
    payload,
    expiresIn: 300, // 5 dakika
    generatedAt: parseInt(timestamp, 10),
  };
}
