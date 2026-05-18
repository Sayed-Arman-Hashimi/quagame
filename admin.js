const loginView = document.querySelector('[data-view="login"]');
const editorView = document.querySelector('[data-view="editor"]');
const loginForm = document.querySelector(".admin-login-form");
const jsonForm = document.querySelector(".admin-json-form");
const uploadForm = document.querySelector(".admin-upload-form");
const jsonEditor = document.querySelector("#content-json");
const loginMessage = document.querySelector('[data-message="login"]');
const editorMessage = document.querySelector('[data-message="editor"]');

let currentContent = null;

function setMessage(element, text, isError = false) {
  element.textContent = text;
  element.classList.toggle("is-error", isError);
}

function showEditor() {
  loginView.classList.add("is-hidden");
  editorView.classList.remove("is-hidden");
}

function showLogin() {
  loginView.classList.remove("is-hidden");
  editorView.classList.add("is-hidden");
}

function setByPath(source, path, value) {
  const keys = path.split(".");
  const lastKey = keys.pop();
  const target = keys.reduce((object, key) => object[key], source);
  target[lastKey] = value;
}

function fileToPayload(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const [, base64 = ""] = dataUrl.split(",");
      resolve({
        data: base64,
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
      });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    ...options,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || "İşlem başarısız oldu");
  }
  return body;
}

function loadEditor(content) {
  currentContent = content;
  jsonEditor.value = JSON.stringify(content, null, 2);
}

async function loadContent() {
  const body = await requestJson("/api/content");
  loadEditor(body.content);
  showEditor();
}

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(loginForm);
  setMessage(loginMessage, "Giriş kontrol ediliyor...");

  try {
    await requestJson("/api/login", {
      method: "POST",
      body: JSON.stringify({
        email: String(data.get("email") || ""),
        password: String(data.get("password") || ""),
      }),
    });
    setMessage(loginMessage, "");
    await loadContent();
  } catch (error) {
    setMessage(loginMessage, error.message, true);
  }
});

jsonForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage(editorMessage, "İçerik kaydediliyor...");

  try {
    const content = JSON.parse(jsonEditor.value);
    const body = await requestJson("/api/content", {
      method: "POST",
      body: JSON.stringify({ content }),
    });
    loadEditor(body.content);
    setMessage(editorMessage, "Kaydedildi. Vercel birkaç saniye içinde siteyi yeniler.");
  } catch (error) {
    setMessage(editorMessage, error.message, true);
  }
});

uploadForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage(editorMessage, "Fotoğraf yükleniyor...");

  try {
    const data = new FormData(uploadForm);
    const file = data.get("image");
    const targetPath = String(data.get("target") || "");
    const caption = String(data.get("caption") || "").trim();
    const content = JSON.parse(jsonEditor.value);
    const upload = await fileToPayload(file);

    if (caption && targetPath.startsWith("game.slides.")) {
      const slideIndex = Number(targetPath.split(".")[2]);
      content.game.slides[slideIndex].caption = caption;
    }

    const body = await requestJson("/api/content", {
      method: "POST",
      body: JSON.stringify({ content, upload, targetPath }),
    });

    loadEditor(body.content);
    uploadForm.reset();
    setMessage(editorMessage, `Fotoğraf kaydedildi: ${body.uploadedPath}`);
  } catch (error) {
    setMessage(editorMessage, error.message, true);
  }
});

loadContent().catch(() => showLogin());
