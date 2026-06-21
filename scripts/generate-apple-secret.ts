// scripts/generate-apple-secret.ts

import { importPKCS8, SignJWT } from "jose";

const teamId = process.env.APPLE_TEAM_ID || "";
const clientId = process.env.APPLE_CLIENT_ID || "";
const keyId = process.env.APPLE_KEY_ID || "";
const privateKey = process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, "\n") || "";

async function main() {
  const alg = "ES256";
  const key = await importPKCS8(privateKey, alg);

  const now = Math.floor(Date.now() / 1000);

  const token = await new SignJWT({})
    .setProtectedHeader({
      alg,
      kid: keyId,
    })
    .setIssuer(teamId)
    .setIssuedAt(now)
    .setExpirationTime(now + 60 * 60 * 24 * 180)
    .setAudience("https://appleid.apple.com")
    .setSubject(clientId)
    .sign(key);

  console.log(token);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
