let siteContent = null;
let activeSlide = 0;
let activeAdmin = null;

function getValue(source, path) {
  return path.split(".").reduce((value, key) => value?.[key], source);
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

  document.title = `${content.brandName} | ${content.hero.title}`;
}

function renderTicker(content) {
  const ticker = document.querySelector('[data-render="ticker"]');
  if (!ticker) return;

  ticker.replaceChildren(
    ...content.ticker.map((item) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = item;
      return paragraph;
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

      const caption = document.createElement("figcaption");
      caption.textContent = slide.caption;

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
      ...content.game.paragraphs.map((copy) => {
        const paragraph = document.createElement("p");
        paragraph.textContent = copy;
        return paragraph;
      }),
    );
  }

  if (facts) {
    facts.replaceChildren(
      ...content.game.facts.map((fact) => {
        const wrapper = document.createElement("div");
        const label = document.createElement("dt");
        const value = document.createElement("dd");
        label.textContent = fact.label;
        value.textContent = fact.value;
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
    ...content.news.items.map((item) => {
      const article = document.createElement("article");
      const time = document.createElement("time");
      const title = document.createElement("h3");
      time.dateTime = item.date;
      time.textContent = item.dateLabel;
      title.textContent = item.title;
      article.append(time, title);
      return article;
    }),
  );
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
        document.querySelector("[data-edit-toolbar]")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      } else {
        openAuthModal();
      }
    });
  });

  document.querySelectorAll("[data-auth-close]").forEach((button) => {
    button.addEventListener("click", closeAuthModal);
  });

  document.querySelector("[data-auth-logout]")?.addEventListener("click", async () => {
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
    setTextContent(siteContent);
    renderTicker(siteContent);
    renderSlides(siteContent);
    renderGameDetails(siteContent);
    renderNews(siteContent);
    setupCarousel();
    setupNewsletter(siteContent);
    setupAuth();
  } catch (error) {
    console.error(error);
  }
}

init();
