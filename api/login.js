const crypto = require("node:crypto");

function getSecret() {
  return process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || "";
}

function sign(payload) {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function createSession(email) {
  const payload = Buffer.from(
    JSON.stringify({
      email,
      exp: Date.now() + 1000 * 60 * 60 * 8,
    }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "Sadece POST desteklenir" });
    return;
  }

  const adminEmail = process.env.ADMIN_EMAIL || "sayedarman1352@gmail.com";
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || !getSecret()) {
    response.status(500).json({
      error: "Giriş ayarı eksik: Vercel'de ADMIN_PASSWORD ve ADMIN_SECRET eklenmeli.",
    });
    return;
  }

  const { email, password } = request.body || {};

  if (String(email).toLowerCase() !== adminEmail.toLowerCase() || password !== adminPassword) {
    response.status(401).json({ error: "E-posta veya şifre yanlış" });
    return;
  }

  response.setHeader(
    "Set-Cookie",
    `quagame_admin=${createSession(adminEmail)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=28800`,
  );
  response.status(200).json({ ok: true, email: adminEmail });
};
