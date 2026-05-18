const crypto = require("node:crypto");

function getSecret() {
  return process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || "";
}

function sign(payload) {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function parseCookies(header = "") {
  return Object.fromEntries(
    header
      .split(";")
      .map((cookie) => cookie.trim().split("="))
      .filter(([key, value]) => key && value),
  );
}

function readSession(request) {
  const cookie = parseCookies(request.headers.cookie || "").quagame_admin;
  if (!cookie || !getSecret()) return null;

  const [payload, signature] = cookie.split(".");
  if (!payload || !signature || sign(payload) !== signature) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!session.email || session.exp <= Date.now()) return null;
    return { email: session.email };
  } catch {
    return null;
  }
}

module.exports = async function handler(request, response) {
  if (request.method !== "GET") {
    response.status(405).json({ error: "Sadece GET desteklenir" });
    return;
  }

  const user = readSession(request);
  if (!user) {
    response.status(401).json({ error: "Giriş yapılmamış" });
    return;
  }

  response.status(200).json({ user });
};
