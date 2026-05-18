module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "Sadece POST desteklenir" });
    return;
  }

  response.setHeader(
    "Set-Cookie",
    "quagame_admin=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0",
  );
  response.status(200).json({ ok: true });
};
