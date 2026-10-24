"use strict";

/* ============ Data ============ */
let GUIDES = [
  { id: 1, topic: "html",   icon: "🏗️", title: "Semantic Landmarks", text: "Use header, nav, main, article and footer so assistive tech can navigate your page." },
  { id: 2, topic: "html",   icon: "♿", title: "Accessible Forms",   text: "Pair every input with a label and announce errors with ARIA live regions." },
  { id: 3, topic: "css",    icon: "🧱", title: "CSS Grid Layouts",   text: "Plan the whole page as a strict 2D floor plan, then let it reflow by breakpoint." },
  { id: 4, topic: "css",    icon: "📐", title: "Flexbox Components", text: "Micro layouts such as navbars, button rows and card footers." },
  { id: 5, topic: "css",    icon: "🔤", title: "Fluid Type with clamp()", text: "Scale text smoothly between a minimum and maximum without extra media queries." },
  { id: 6, topic: "js",     icon: "🔁", title: "Basic State",        text: "Keep UI state in one place and render from it: filters, favourites, toggles." },
  { id: 7, topic: "js",     icon: "💾", title: "localStorage",       text: "Remember theme and saved guides between visits, safely wrapped in try/catch." },
  { id: 8, topic: "design", icon: "🎨", title: "Mocha Mousse Palette", text: "Warm, grounded colour with Ethereal Blue for trust and Moonlit Grey for refinement." },
  { id: 9, topic: "design", icon: "✏️", title: "Grayscale Wireframes", text: "If it does not work in grayscale, colour will not fix it. Start low-fidelity." }
];

/* ============ State ============ */
function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
}

const state = {
  filter: "all",
  saved: new Set(load("cs-saved", [])),
  theme: load("cs-theme", window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
};

/* ============ DOM refs ============ */
const grid = document.getElementById("cardGrid");
const emptyMsg = document.getElementById("emptyMsg");
const savedCount = document.getElementById("savedCount");
const chips = document.querySelectorAll(".chip");
const navToggle = document.getElementById("navToggle");
const primaryNav = document.getElementById("primaryNav");
const themeToggle = document.getElementById("themeToggle");

/* ============ Rendering ============ */
function render() {
  const items = GUIDES.filter(g => state.filter === "all" || g.topic === state.filter);
  grid.innerHTML = "";

  items.forEach(g => {
    const isSaved = state.saved.has(g.id);
    const wrap = document.createElement("div");
    wrap.className = "card-wrap";
    wrap.innerHTML = `
      <article class="card">
        <div class="card-top">
          <span class="card-icon" aria-hidden="true">${g.icon}</span>
          <span class="tag">${g.topic}</span>
        </div>
        <div>
          <h3></h3>
          <p></p>
        </div>
        <div class="card-foot">
          <button class="bookmark" data-id="${g.id}" aria-pressed="${isSaved}">
            ${isSaved ? "Saved ✓" : "Save"}
          </button>
        </div>
      </article>`;
    // textContent avoids injecting markup from data
    wrap.querySelector("h3").textContent = g.title;
    wrap.querySelector("p").textContent = g.text;
    grid.appendChild(wrap);
  });

  emptyMsg.hidden = items.length > 0;
  savedCount.textContent = state.saved.size;
}

/* ============ Events ============ */
chips.forEach(chip => {
  chip.addEventListener("click", () => {
    state.filter = chip.dataset.filter;
    chips.forEach(c => {
      const active = c === chip;
      c.classList.toggle("is-active", active);
      c.setAttribute("aria-pressed", String(active));
    });
    render();
  });
});

grid.addEventListener("click", e => {
  const btn = e.target.closest(".bookmark");
  if (!btn) return;
  const id = Number(btn.dataset.id);
  state.saved.has(id) ? state.saved.delete(id) : state.saved.add(id);
  save("cs-saved", [...state.saved]);
  render();
  // restore keyboard focus after re-render
  grid.querySelector(`.bookmark[data-id="${id}"]`)?.focus();
});

/* Mobile navigation */
navToggle.addEventListener("click", () => {
  const open = navToggle.getAttribute("aria-expanded") === "true";
  navToggle.setAttribute("aria-expanded", String(!open));
  primaryNav.classList.toggle("is-open", !open);
});
primaryNav.addEventListener("click", e => {
  if (e.target.closest("a")) {
    navToggle.setAttribute("aria-expanded", "false");
    primaryNav.classList.remove("is-open");
  }
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && primaryNav.classList.contains("is-open")) {
    navToggle.setAttribute("aria-expanded", "false");
    primaryNav.classList.remove("is-open");
    navToggle.focus();
  }
});

/* Theme */
function applyTheme() {
  document.documentElement.dataset.theme = state.theme;
  const dark = state.theme === "dark";
  themeToggle.setAttribute("aria-pressed", String(dark));
  themeToggle.textContent = dark ? "Light mode" : "Dark mode";
}
themeToggle.addEventListener("click", () => {
  state.theme = state.theme === "dark" ? "light" : "dark";
  save("cs-theme", state.theme);
  applyTheme();
});

/* ============ Form validation ============ */
const form = document.getElementById("contactForm");
const status = document.getElementById("formStatus");

const rules = {
  name:    v => v.trim().length >= 2 ? "" : "Please enter your name (at least 2 characters).",
  email:   v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : "Please enter a valid email address.",
  message: v => v.trim().length >= 10 ? "" : "Your message should be at least 10 characters."
};

function validateField(name) {
  const input = form.elements[name];
  const msg = rules[name](input.value);
  document.getElementById(name + "Error").textContent = msg;
  input.setAttribute("aria-invalid", msg ? "true" : "false");
  input.setAttribute("aria-describedby", name + "Error");
  return !msg;
}

Object.keys(rules).forEach(name => {
  form.elements[name].addEventListener("blur", () => validateField(name));
});

form.addEventListener("submit", async e => {
  e.preventDefault();
  status.textContent = "";
  const results = Object.keys(rules).map(validateField);
  if (!results.every(Boolean)) {
    form.querySelector('[aria-invalid="true"]')?.focus();
    return;
  }

  const payload = {
    name: form.elements.name.value,
    email: form.elements.email.value,
    message: form.elements.message.value
  };

  try {
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const body = await res.json().catch(() => ({}));

    if (res.status === 201) {
      status.textContent = body.message || "Thanks! Your message was received.";
      form.reset();
    } else if (res.status === 400 && body.error?.details) {
      // show server-side validation errors next to the fields
      body.error.details.forEach(d => {
        const el = document.getElementById(d.field + "Error");
        if (el) el.textContent = d.message;
      });
      status.textContent = "Please fix the highlighted fields.";
    } else if (res.status === 429) {
      status.textContent = "Too many requests. Please wait a moment and try again.";
    } else {
      status.textContent = "Something went wrong on the server. Please try again later.";
    }
  } catch {
    status.textContent = "Could not reach the server. Check your connection and try again.";
  }
});

/* ============ Init ============ */
async function loadGuides() {
  try {
    const res = await fetch("/api/guides");
    if (!res.ok) throw new Error("HTTP " + res.status);
    GUIDES = (await res.json()).data;
  } catch (err) {
    console.warn("API unavailable, using built-in guides:", err.message);
  }
  render();
}

document.getElementById("year").textContent = new Date().getFullYear();
applyTheme();
render();
loadGuides();
