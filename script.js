const form = document.querySelector(".newsletter form");
const note = document.querySelector(".form-note");
const slides = Array.from(document.querySelectorAll(".slide"));
const dots = Array.from(document.querySelectorAll("[data-slide]"));
const prevButton = document.querySelector('[data-carousel="prev"]');
const nextButton = document.querySelector('[data-carousel="next"]');

let activeSlide = 0;

function showSlide(index) {
  if (!slides.length) return;

  activeSlide = (index + slides.length) % slides.length;

  slides.forEach((slide, slideIndex) => {
    slide.classList.toggle("active", slideIndex === activeSlide);
  });

  dots.forEach((dot, dotIndex) => {
    dot.classList.toggle("active", dotIndex === activeSlide);
  });
}

prevButton?.addEventListener("click", () => showSlide(activeSlide - 1));
nextButton?.addEventListener("click", () => showSlide(activeSlide + 1));

dots.forEach((dot) => {
  dot.addEventListener("click", () => {
    showSlide(Number(dot.dataset.slide || 0));
  });
});

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const email = String(data.get("email") || "").trim();

  if (!email) {
    note.textContent = "E-posta adresini yazman gerekiyor.";
    return;
  }

  note.textContent = "Tamamdır, Quagame haberleri için listeye eklendin.";
  form.reset();
});
