let siteContent = null;
let activeSlide = 0;
let activeAdmin = null;
let hasUnsavedChanges = false;
let pendingImagePath = null;

function getValue(source, path) {
  return path.split(".").reduce((value, key) => value?.[key], source);
}

function setValue(source, path, nextValue) {
  const keys = path.split(".");
  const lastKey = keys.pop();
  const target = keys.reduce((value, key) => value?.[key], source);
  if (target && lastKey) {
    target[lastKey] = nextValue;
  }
}

function setInlineStatus(message, isError = false) {
  const status = document.querySelector("[data-inline-status]");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("is-error", isError);
}

function markDirty(message = "Kaydedilmemiş değişiklik var.") {
  hasUnsavedChanges = true;
  setInlineStatus(message);
}

function setTextContent(content) {
  document.querySelectorAll("[data-content]").forEach((element) => {
    const value = getValue(content, element.dataset.content);
    if (typeof value === "string") {
      if (element.tagName === "META") {
        element.setAttribute("content", value);
      } else {
        element.textContent = value;
      }
    }
  });

  document.querySelectorAll("[data-content-image]").forEach((element) => {
    const value = getValue(content, element.dataset.contentImage);
    if (typeof value === "string") {
      element.setAttribute("src", value);
    }
  });

  document.querySelectorAll("[data-content-background]").forEach((element) => {
    const value = getValue(content, element.dataset.contentBackground);
    if (typeof value === "string") {
      element.style.setProperty("--story-image", `url("${value}")`);
    }
  });

  document.title = `${content.brandName} | ${document.body.dataset.pageTitle || content.hero.title}`;
  updateContactLinks();
}

function updateContactLinks() {
  const emailLink = document.querySelector("[data-contact-email]");
  const instagramLink = document.querySelector("[data-contact-instagram]");
  const email = siteContent?.contact?.email;
  const instagram = siteContent?.contact?.instagram;
  const instagramUrl =
    siteContent?.contact?.instagramUrl ||
    `https://www.instagram.com/${String(instagram || "quagame").replace("@", "")}/`;

  if (emailLink && email) {
    emailLink.href = `mailto:${email}`;
  }
  if (instagramLink) {
    instagramLink.href = instagramUrl;
  }
}

function renderTicker(content) {
  const ticker = document.querySelector('[data-render="ticker"]');
  if (!ticker) return;

  ticker.replaceChildren(
    ...content.ticker.map((item, index) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = item;
      paragraph.dataset.editPath = `ticker.${index}`;
      return paragraph;
    }),
  );
}

function renderGameCards(content) {
  const list = document.querySelector('[data-render="gameCards"]');
  if (!list) return;

  list.replaceChildren(
    ...content.games.items.map((game, index) => {
      const article = document.createElement("article");
      article.className = "studio-game-card";

      const imageWrap = document.createElement("div");
      imageWrap.className = "studio-game-media";
      const image = document.createElement("img");
      image.src = game.image;
      image.alt = `${game.name} oyun görseli`;
      image.dataset.inlineImagePath = `games.items.${index}.image`;
      imageWrap.append(image);

      const body = document.createElement("div");
      body.className = "studio-game-body";

      const meta = document.createElement("p");
      meta.className = "tag";
      const status = document.createElement("span");
      const genre = document.createElement("span");
      status.textContent = game.status;
      genre.textContent = game.genre;
      status.dataset.editPath = `games.items.${index}.status`;
      genre.dataset.editPath = `games.items.${index}.genre`;
      meta.append(status, document.createTextNode(" / "), genre);

      const title = document.createElement("h3");
      title.textContent = game.name;
      title.dataset.editPath = `games.items.${index}.name`;

      const copy = document.createElement("p");
      copy.textContent = game.copy;
      copy.dataset.editPath = `games.items.${index}.copy`;

      const link = document.createElement("a");
      link.href = "american-icecream-simulator.html";
      link.className = "button secondary";
      link.textContent = game.linkLabel;
      link.dataset.editPath = `games.items.${index}.linkLabel`;

      body.append(meta, title, copy, link);
      article.append(imageWrap, body);
      return article;
    }),
  );
}

function renderSlides(content) {
  const track = document.querySelector('[data-render="slides"]');
  const dots = document.querySelector('[data-render="dots"]');
  if (!track || !dots) return;

  track.replaceChildren(
    ...content.game.slides.map((slide, index) => {
      const figure = document.createElement("figure");
      figure.className = `slide${index === 0 ? " active" : ""}`;

      const image = document.createElement("img");
      image.src = slide.image;
      image.alt = slide.alt || "";
      image.dataset.inlineImagePath = `game.slides.${index}.image`;

      const caption = document.createElement("figcaption");
      caption.textContent = slide.caption;
      caption.dataset.editPath = `game.slides.${index}.caption`;

      figure.append(image, caption);
      return figure;
    }),
  );

  dots.replaceChildren(
    ...content.game.slides.map((_, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.slide = String(index);
      button.className = index === 0 ? "active" : "";
      button.setAttribute("aria-label", `${index + 1}. görsel`);
      button.addEventListener("click", () => showSlide(index));
      return button;
    }),
  );
}

function renderGameDetails(content) {
  const paragraphs = document.querySelector('[data-render="gameParagraphs"]');
  const facts = document.querySelector('[data-render="facts"]');
  if (paragraphs) {
    paragraphs.replaceChildren(
      ...content.game.paragraphs.map((copy, index) => {
        const paragraph = document.createElement("p");
        paragraph.textContent = copy;
        paragraph.dataset.editPath = `game.paragraphs.${index}`;
        return paragraph;
      }),
    );
  }

  if (facts) {
    facts.replaceChildren(
      ...content.game.facts.map((fact, index) => {
        const wrapper = document.createElement("div");
        const label = document.createElement("dt");
        const value = document.createElement("dd");
        label.textContent = fact.label;
        value.textContent = fact.value;
        label.dataset.editPath = `game.facts.${index}.label`;
        value.dataset.editPath = `game.facts.${index}.value`;
        wrapper.append(label, value);
        return wrapper;
      }),
    );
  }
}

function renderNews(content) {
  const list = document.querySelector('[data-render="newsItems"]');
  if (!list) return;

  list.replaceChildren(
    ...content.news.items.map((item, index) => {
      const article = document.createElement("article");
      const time = document.createElement("time");
      const title = document.createElement("h3");
      time.dateTime = item.date;
      time.textContent = item.dateLabel;
      time.dataset.editPath = `news.items.${index}.dateLabel`;
      title.textContent = item.title;
      title.dataset.editPath = `news.items.${index}.title`;
      article.append(time, title);
      return article;
    }),
  );
}

function renderSite(content) {
  setTextContent(content);
  renderTicker(content);
  renderGameCards(content);
  renderSlides(content);
  renderGameDetails(content);
  renderNews(content);
  showSlide(Math.min(activeSlide, content.game.slides.length - 1));
  applyInlineEditorState();
}

function showSlide(index) {
  const slides = Array.from(document.querySelectorAll(".slide"));
  const dots = Array.from(document.querySelectorAll("[data-slide]"));
  if (!slides.length) return;

  activeSlide = (index + slides.length) % slides.length;

  slides.forEach((slide, slideIndex) => {
    slide.classList.toggle("active", slideIndex === activeSlide);
  });

  dots.forEach((dot, dotIndex) => {
    dot.classList.toggle("active", dotIndex === activeSlide);
  });
}

function setupCarousel() {
  document
    .querySelector('[data-carousel="prev"]')
    ?.addEventListener("click", () => showSlide(activeSlide - 1));
  document
    .querySelector('[data-carousel="next"]')
    ?.addEventListener("click", () => showSlide(activeSlide + 1));
}

function setupNewsletter(content) {
  const form = document.querySelector(".newsletter form");
  const note = document.querySelector(".form-note");

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const email = String(data.get("email") || "").trim();

    if (!email) {
      note.textContent = "E-posta adresini yazman gerekiyor.";
      return;
    }

    note.textContent = content.newsletter.successMessage;
    form.reset();
  });
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || "İşlem başarısız oldu");
  }
  return body;
}

function fileToPayload(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const [, data = ""] = dataUrl.split(",");
      resolve({
        data,
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
      });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function syncInlineText(element) {
  const path = element.dataset.editPath;
  if (!path || !siteContent) return;

  const nextValue = element.innerText.replace(/\n{3,}/g, "\n\n").trim();
  setValue(siteContent, path, nextValue);
  if (path === "contact.email") {
    updateContactLinks();
  }
  if (path === "contact.instagram") {
    const handle = nextValue.replace("@", "").trim();
    siteContent.contact.instagramUrl = `https://www.instagram.com/${handle || "quagame"}/`;
    updateContactLinks();
  }
  markDirty();
}

function prepareEditableText() {
  document.querySelectorAll("[data-content]").forEach((element) => {
    if (element.tagName !== "META") {
      element.dataset.editPath = element.dataset.content;
    }
  });

  document.querySelectorAll("[data-edit-path]").forEach((element) => {
    const editable = Boolean(activeAdmin);
    element.contentEditable = String(editable);
    element.spellcheck = editable;
    element.classList.toggle("inline-editable", editable);

    if (!element.dataset.inlineBound) {
      element.dataset.inlineBound = "true";
      element.addEventListener("input", () => syncInlineText(element));
      element.addEventListener("click", (event) => {
        if (activeAdmin && element.closest("a")) {
          event.preventDefault();
          event.stopPropagation();
        }
      });
    }
  });
}

function createImageButton(targetElement, path) {
  if (!activeAdmin || !path) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "inline-image-edit-button";
  button.textContent = "Fotoğrafı Değiştir";
  button.dataset.targetPath = path;
  button.addEventListener("click", (event) => {
    event.preventDefault();
    pendingImagePath = path;
    document.querySelector("[data-inline-image-input]")?.click();
  });

  const parentLink = targetElement.closest("a");

  if (targetElement.matches("[data-content-background]")) {
    targetElement.append(button);
  } else if (parentLink) {
    parentLink.insertAdjacentElement("afterend", button);
  } else {
    targetElement.insertAdjacentElement("afterend", button);
  }
}

function prepareEditableImages() {
  document.querySelectorAll(".inline-image-edit-button").forEach((button) => button.remove());
  if (!activeAdmin) return;

  document.querySelectorAll("[data-content-image]").forEach((element) => {
    createImageButton(element, element.dataset.contentImage);
  });

  document.querySelectorAll("[data-content-background]").forEach((element) => {
    createImageButton(element, element.dataset.contentBackground);
  });

  document.querySelectorAll("[data-inline-image-path]").forEach((element) => {
    createImageButton(element, element.dataset.inlineImagePath);
  });
}

function applyInlineEditorState() {
  document.body.classList.toggle("is-inline-editing", Boolean(activeAdmin));
  prepareEditableText();
  prepareEditableImages();
}

async function uploadInlineImage(file) {
  if (!pendingImagePath || !file || !siteContent) return;

  setInlineStatus("Fotoğraf yükleniyor...");
  const upload = await fileToPayload(file);
  const body = await apiRequest("/api/content", {
    method: "POST",
    body: JSON.stringify({
      content: siteContent,
      upload,
      targetPath: pendingImagePath,
    }),
  });

  siteContent = body.content;
  hasUnsavedChanges = false;
  renderSite(siteContent);
  setInlineStatus("Fotoğraf kaydedildi. Vercel yayını birkaç saniye içinde yeniler.");
}

async function saveInlineContent() {
  if (!activeAdmin || !siteContent) return;

  setInlineStatus("Kaydediliyor...");
  const body = await apiRequest("/api/content", {
    method: "POST",
    body: JSON.stringify({ content: siteContent }),
  });

  siteContent = body.content;
  hasUnsavedChanges = false;
  renderSite(siteContent);
  setInlineStatus("Kaydedildi. Vercel yayını birkaç saniye içinde yeniler.");
}

function setupInlineEditorActions() {
  document.querySelector("[data-edit-save]")?.addEventListener("click", () => {
    saveInlineContent().catch((error) => setInlineStatus(error.message, true));
  });

  document.querySelector("[data-edit-reset]")?.addEventListener("click", () => {
    if (!hasUnsavedChanges || confirm("Kaydedilmemiş değişiklikler silinsin mi?")) {
      location.reload();
    }
  });

  document.querySelector("[data-inline-image-input]")?.addEventListener("change", (event) => {
    const [file] = event.target.files || [];
    uploadInlineImage(file)
      .catch((error) => setInlineStatus(error.message, true))
      .finally(() => {
        event.target.value = "";
        pendingImagePath = null;
      });
  });
}

function setAuthUi(user) {
  activeAdmin = user || null;
  const toolbar = document.querySelector("[data-edit-toolbar]");
  const loginButton = document.querySelector("[data-auth-open]");
  const emailLabel = document.querySelector("[data-admin-email]");

  toolbar?.classList.toggle("is-hidden", !activeAdmin);
  if (loginButton) {
    loginButton.textContent = activeAdmin ? "Edit Modu Açık" : "Admin Girişi";
  }
  if (emailLabel) {
    emailLabel.textContent = activeAdmin?.email || "";
  }
  document.body.classList.toggle("has-edit-toolbar", Boolean(activeAdmin));
  applyInlineEditorState();
  if (activeAdmin) {
    setInlineStatus("Metinlere tıklayıp düzenle, fotoğrafları kendi üzerinde değiştir.");
  }
}

function openAuthModal() {
  document.querySelector("[data-auth-modal]")?.classList.remove("is-hidden");
  document.querySelector("#site-login-password")?.focus();
}

function closeAuthModal() {
  document.querySelector("[data-auth-modal]")?.classList.add("is-hidden");
}

function setupAuth() {
  const form = document.querySelector("[data-auth-form]");
  const message = document.querySelector("[data-auth-message]");

  document.querySelectorAll("[data-auth-open]").forEach((button) => {
    button.addEventListener("click", () => {
      if (activeAdmin) {
        setInlineStatus("Edit modu açık. Sayfadaki yazıların üstüne tıklayıp düzenle.");
      } else {
        openAuthModal();
      }
    });
  });

  document.querySelectorAll("[data-auth-close]").forEach((button) => {
    button.addEventListener("click", closeAuthModal);
  });

  document.querySelector("[data-auth-logout]")?.addEventListener("click", async () => {
    if (hasUnsavedChanges && !confirm("Kaydedilmemiş değişiklikler var. Çıkış yapılsın mı?")) return;
    await apiRequest("/api/logout", { method: "POST", body: "{}" });
    setAuthUi(null);
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    message.textContent = "Giriş kontrol ediliyor...";
    message.classList.remove("is-error");

    try {
      const body = await apiRequest("/api/login", {
        method: "POST",
        body: JSON.stringify({
          email: String(data.get("email") || ""),
          password: String(data.get("password") || ""),
        }),
      });
      setAuthUi({ email: body.email || String(data.get("email") || "") });
      message.textContent = "";
      closeAuthModal();
      form.reset();
    } catch (error) {
      message.textContent = error.message;
      message.classList.add("is-error");
    }
  });

  apiRequest("/api/me")
    .then((body) => setAuthUi(body.user))
    .catch(() => setAuthUi(null));
}

async function loadContent() {
  const response = await fetch("content.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("content.json okunamadı");
  }
  return response.json();
}

async function init() {
  try {
    siteContent = await loadContent();
    renderSite(siteContent);
    setupCarousel();
    setupNewsletter(siteContent);
    setupInlineEditorActions();
    setupAuth();
  } catch (error) {
    console.error(error);
  }
}

window.addEventListener("beforeunload", (event) => {
  if (!hasUnsavedChanges) return;
  event.preventDefault();
  event.returnValue = "";
});

init();
