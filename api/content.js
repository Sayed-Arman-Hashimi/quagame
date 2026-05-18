const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_BRANCH = "main";

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

function verifySession(request) {
  const cookie = parseCookies(request.headers.cookie || "").quagame_admin;
  if (!cookie || !getSecret()) return false;

  const [payload, signature] = cookie.split(".");
  if (!payload || !signature || sign(payload) !== signature) return false;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return session.email && session.exp > Date.now();
  } catch {
    return false;
  }
}

function sanitizeFilename(filename) {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function setByPath(source, targetPath, value) {
  const keys = targetPath.split(".");
  const lastKey = keys.pop();
  const target = keys.reduce((object, key) => object[key], source);
  target[lastKey] = value;
}

function readLocalContent() {
  const file = path.join(process.cwd(), "content.json");
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

async function githubRequest(url, options = {}) {
  const token = process.env.GITHUB_TOKEN;
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.message || "GitHub API isteği başarısız oldu");
  }
  return body;
}

async function getFileSha(owner, repo, branch, filePath) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`;
  const body = await githubRequest(url);
  return body.sha;
}

async function putFile({ owner, repo, branch, filePath, contentBase64, message }) {
  let sha;
  try {
    sha = await getFileSha(owner, repo, branch, filePath);
  } catch {
    sha = undefined;
  }

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
  return githubRequest(url, {
    method: "PUT",
    body: JSON.stringify({
      branch,
      content: contentBase64,
      message,
      sha,
    }),
  });
}

module.exports = async function handler(request, response) {
  if (request.method === "GET") {
    if (!verifySession(request)) {
      response.status(401).json({ error: "Admin girişi gerekiyor" });
      return;
    }
    response.status(200).json({ content: readLocalContent() });
    return;
  }

  if (request.method !== "POST") {
    response.status(405).json({ error: "Sadece GET ve POST desteklenir" });
    return;
  }

  if (!verifySession(request)) {
    response.status(401).json({ error: "Admin girişi gerekiyor" });
    return;
  }

  const owner = process.env.GITHUB_OWNER || "Sayed-Arman-Hashimi";
  const repo = process.env.GITHUB_REPO || "quagame";
  const branch = process.env.GITHUB_BRANCH || DEFAULT_BRANCH;
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    response.status(500).json({
      error: "GITHUB_TOKEN eksik. Vercel Environment Variables icine repo yetkili token eklenmeli.",
    });
    return;
  }

  try {
    const { content, upload, targetPath } = request.body || {};
    if (!content || typeof content !== "object") {
      response.status(400).json({ error: "content objesi eksik" });
      return;
    }

    let uploadedPath = null;

    if (upload?.data && targetPath) {
      const filename = sanitizeFilename(upload.filename || "image.png");
      uploadedPath = `assets/uploads/${Date.now()}-${filename}`;
      setByPath(content, targetPath, uploadedPath);

      await putFile({
        owner,
        repo,
        branch,
        filePath: uploadedPath,
        contentBase64: upload.data,
        message: `Upload ${filename}`,
      });
    }

    const nextJson = `${JSON.stringify(content, null, 2)}\n`;
    await putFile({
      owner,
      repo,
      branch,
      filePath: "content.json",
      contentBase64: Buffer.from(nextJson, "utf8").toString("base64"),
      message: "Update site content",
    });

    response.status(200).json({ content, uploadedPath });
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
};
