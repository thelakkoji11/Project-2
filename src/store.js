"use strict";

/** In-memory data layer. Swap this module for a real database later (Project 3+). */
function createStore() {
  let nextGuideId = 10;
  let nextMessageId = 1;

  const guides = [
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
  const messages = [];

  return {
    listGuides: (topic) => (topic ? guides.filter(g => g.topic === topic) : [...guides]),
    getGuide: (id) => guides.find(g => g.id === id),
    addGuide(data) {
      const g = { id: nextGuideId++, icon: "📘", ...data };
      guides.push(g);
      return g;
    },
    updateGuide(id, data) {
      const g = guides.find(x => x.id === id);
      if (!g) return null;
      Object.assign(g, data);
      return g;
    },
    deleteGuide(id) {
      const i = guides.findIndex(x => x.id === id);
      if (i === -1) return false;
      guides.splice(i, 1);
      return true;
    },
    addMessage(data) {
      const m = { id: nextMessageId++, receivedAt: new Date().toISOString(), ...data };
      messages.push(m);
      return m;
    },
    countMessages: () => messages.length
  };
}

module.exports = createStore;
