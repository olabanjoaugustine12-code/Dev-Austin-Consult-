// ── HAMBURGER ──────────────────────────────
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("navLinks");
if (hamburger && navLinks) {
  hamburger.addEventListener("click", () => {
    navLinks.classList.toggle("active");
    hamburger.classList.toggle("active");
  });
}

// ── MULTI-STEP FORM ────────────────────────
const steps = document.querySelectorAll(".form-step");
const nextBtns = document.querySelectorAll(".next-btn");
const prevBtns = document.querySelectorAll(".prev-btn");
const progress = document.getElementById("progress");
const stepText = document.getElementById("stepText");
const labels = document.querySelectorAll(".step-label");
let currentStep = 0;

function updateForm() {
  steps.forEach((s, i) => s.classList.toggle("active", i === currentStep));
  const percent = ((currentStep + 1) / steps.length) * 100;
  if (progress) progress.style.width = percent + "%";
  if (stepText) stepText.innerText = `Step ${currentStep + 1} of ${steps.length}`;
  labels.forEach((l, i) => l.classList.toggle("done", i <= currentStep));
}

// ── VALIDATION RULES PER STEP ──────────────
// Each step has a list of required fields with friendly error messages
const stepValidations = [
  // Step 1 — Contact Info
  [
    { name: "full_name", message: "⚠ Full name must be filled in" },
    { name: "business_name", message: "⚠ Business / Brand name is required" },
    { name: "phone_number", message: "⚠ Please enter your phone number" },
  ],
  // Step 2 — Business Details
  [
    { name: "business_type", message: "⚠ Please tell us what your business does" },
  ],
  // Step 3 — Goals & Features
  [
    { name: "website_goal", message: "⚠ Please select the primary goal for your website", type: "select" },
  ],
  // Step 4 — Assets (no hard required fields — uploads optional)
  [],
  // Step 5 — Design & Budget
  [
    { name: "budget", message: "⚠ Please select a budget range", type: "radio" },
  ],
  // Step 6 — Final
  [
    { name: "contact_preference", message: "⚠ Please choose your preferred contact method", type: "radio" },
  ],
];

function clearErrors(stepEl) {
  stepEl.querySelectorAll(".field-error, .group-error").forEach(e => e.remove());
  stepEl.querySelectorAll(".invalid, .invalid-group").forEach(e => {
    e.classList.remove("invalid", "invalid-group");
  });
}

function showError(el, message, afterEl) {
  const err = document.createElement("div");
  err.className = el ? "field-error" : "group-error";
  err.textContent = message;
  if (el) {
    el.classList.add("invalid");
    el.parentNode.insertBefore(err, el.nextSibling);
    // Auto-clear on user input
    el.addEventListener("input", () => {
      el.classList.remove("invalid");
      if (err.parentNode) err.remove();
    }, { once: true });
    el.addEventListener("change", () => {
      el.classList.remove("invalid");
      if (err.parentNode) err.remove();
    }, { once: true });
  } else {
    // For radio groups — insert after the options grid
    afterEl.insertAdjacentElement("afterend", err);
  }
}

function validateStep(stepIndex) {
  const stepEl = steps[stepIndex];
  clearErrors(stepEl);

  const rules = stepValidations[stepIndex] || [];
  let isValid = true;

  rules.forEach(rule => {
    if (rule.type === "radio") {
      // Check if any radio with this name is checked
      const radios = stepEl.querySelectorAll(`input[name="${rule.name}"]`);
      const checked = Array.from(radios).some(r => r.checked);
      if (!checked) {
        isValid = false;
        // Find the options grid to insert error after
        const grid = stepEl.querySelector(`input[name="${rule.name}"]`)?.closest(".options-grid, .budget-grid, .timeline-grid");
        if (grid) {
          // Highlight all cards
          grid.querySelectorAll(".option-card, .budget-card, .timeline-card").forEach(c => c.classList.add("invalid-group"));
          showError(null, rule.message, grid);
          // Auto-clear when any radio is picked
          radios.forEach(r => {
            r.addEventListener("change", () => {
              grid.querySelectorAll(".option-card, .budget-card, .timeline-card").forEach(c => c.classList.remove("invalid-group"));
              stepEl.querySelectorAll(".group-error").forEach(e => {
                if (e.textContent === rule.message) e.remove();
              });
            }, { once: true });
          });
        }
      }
    } else if (rule.type === "select") {
      const el = stepEl.querySelector(`select[name="${rule.name}"]`);
      if (el && !el.value) {
        isValid = false;
        showError(el, rule.message);
      }
    } else {
      // Default: text / tel / email input
      const el = stepEl.querySelector(`input[name="${rule.name}"], textarea[name="${rule.name}"]`);
      if (el && !el.value.trim()) {
        isValid = false;
        showError(el, rule.message);
      }
    }
  });

  return isValid;
}

nextBtns.forEach(btn => btn.addEventListener("click", () => {
  if (!validateStep(currentStep)) {
    // Shake the button to signal error
    btn.style.transform = "translateX(-6px)";
    setTimeout(() => btn.style.transform = "translateX(6px)", 80);
    setTimeout(() => btn.style.transform = "translateX(0)", 160);
    return;
  }
  if (currentStep < steps.length - 1) {
    currentStep++;
    updateForm();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}));

prevBtns.forEach(btn => btn.addEventListener("click", () => {
  if (currentStep > 0) { currentStep--; updateForm(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
}));

updateForm();

// Handle form submit — Netlify native (no fetch needed)
const form = document.getElementById("multiStepForm");
const successScreen = document.getElementById("successScreen");
if (form) {
  form.addEventListener("submit", (e) => {
    // Validate the last step before allowing submission
    if (!validateStep(currentStep)) {
      e.preventDefault(); // Block submission only if invalid
      return;
    }
    // Valid — let the browser submit normally.
    // Netlify intercepts the POST, saves the data, then
    // redirects the user to the form's action="thank-you.html"
  });
}

// ── PWA SERVICE WORKER ─────────────────────
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js")
      .then(reg => console.log("[PWA] SW registered:", reg.scope))
      .catch(err => console.error("[PWA] SW failed:", err));
  });
}

let deferredPrompt;
const installBtn = document.getElementById("installBtn");
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault(); deferredPrompt = e;
  if (installBtn) installBtn.style.display = "block";
});
if (installBtn) {
  installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null; installBtn.style.display = "none";
  });
}
window.addEventListener("appinstalled", () => { if (installBtn) installBtn.style.display = "none"; });

// ── AI CHAT ────────────────────────────────
const chatFab      = document.getElementById('chatFab');
const chatBubble   = document.getElementById('chatBubble');
const chatClose    = document.getElementById('chatClose');
const chatMessages = document.getElementById('chatMessages');
const chatInput    = document.getElementById('chatInput');
const sendBtn      = document.getElementById('sendBtn');
const quickReplies = document.getElementById('quickReplies');

// Open / Close chat
if (chatFab)    chatFab.addEventListener('click',   () => chatBubble.classList.add('open'));
if (chatClose)  chatClose.addEventListener('click', () => chatBubble.classList.remove('open'));

// Close on outside click
document.addEventListener('click', (e) => {
  if (chatBubble && chatFab &&
      !chatBubble.contains(e.target) &&
      !chatFab.contains(e.target)) {
    chatBubble.classList.remove('open');
  }
});


/* ── KNOWLEDGE BASE ─────────────────────────────────────── */
const KB = [
  {
    patterns: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'hii', 'helo'],
    reply: `Hey there! 👋 Welcome to **Dev Austin Consult**. I'm here to help you with anything — services, pricing, timelines, or how to get started. What can I do for you today?`
  },
  {
    patterns: ['what do you do', 'what you do', 'your services', 'what services', 'services offered', 'what can you do'],
    reply: `We offer a full range of digital services:\n\n🖥️ **Website Design** — modern, responsive sites\n🌐 **WordPress Development** — easy-to-manage sites\n🛒 **E-Commerce Stores** — with payment integration\n🎨 **Branding & Logo Design**\n⚙️ **Full Business Setup** — domain, hosting & more\n🔧 **Maintenance & Support** — monthly plans\n\nWhich one interests you? I can give you more details!`
  },
  {
    patterns: ['how much', 'price', 'pricing', 'cost', 'cost of', 'charges', 'fee', 'how much does', 'budget'],
    reply: `Great question! Pricing depends on what you need, but here's a rough idea:\n\n💡 **Simple landing page** — affordable starter package\n🌐 **Full business website** — mid-range, great value\n🛒 **E-Commerce store** — varies by features needed\n🎨 **Logo & Branding** — competitive rates\n\nEvery project is quoted individually so you only pay for what you actually need. 👉 [Start a project](start-project.html) and get a free custom quote!`
  },
  {
    patterns: ['how long', 'timeline', 'time', 'days', 'weeks', 'duration', 'how many days', 'delivery'],
    reply: `Timelines depend on the project size:\n\n⚡ **Landing page** — 3 to 5 days\n🖥️ **Full website** — 1 to 2 weeks\n🛒 **E-Commerce store** — 2 to 4 weeks\n🎨 **Branding package** — 3 to 7 days\n\nWe always give you a clear delivery date upfront — no surprises. Need it urgently? We also offer fast-track delivery! 🚀`
  },
  {
    patterns: ['wordpress', 'wp', 'wordpress or custom', 'which is better', 'wordpress vs custom', 'custom or wordpress'],
    reply: `Both are great — it depends on your needs:\n\n🌐 **WordPress** is best if:\n• You want to manage content yourself\n• You need a blog or news section\n• You want plugins like WooCommerce\n\n💻 **Custom HTML/CSS** is best if:\n• You want a super-fast, lightweight site\n• You need something very specific or unique\n• You don't need frequent content updates\n\nNot sure which to pick? Just [reach out](https://wa.me/234XXXXXXXXXX) and we'll recommend the best fit for your business!`
  },
  {
    patterns: ['ecommerce', 'e-commerce', 'online store', 'shop', 'sell online', 'payment', 'woocommerce'],
    reply: `Yes! We build complete e-commerce stores. 🛒\n\nOur e-commerce builds include:\n✅ Product listings & categories\n✅ Shopping cart & checkout\n✅ Payment gateway integration (Paystack, Flutterwave, etc.)\n✅ Inventory management\n✅ Mobile-optimised shopping experience\n\nReady to start selling online? 👉 [Let's talk](https://wa.me/234XXXXXXXXXX)`
  },
  {
    patterns: ['branding', 'logo', 'brand', 'design', 'identity', 'colors', 'brand identity'],
    reply: `We create brand identities that make your business unforgettable! 🎨\n\nOur branding package includes:\n✅ Professional logo design\n✅ Brand colour palette\n✅ Typography selection\n✅ Business card design\n✅ Brand style guide\n\nA strong brand builds trust — and trust converts visitors into paying customers. [Start your branding project →](start-project.html)`
  },
  {
    patterns: ['maintenance', 'support', 'update', 'manage', 'monthly', 'after launch', 'after delivery'],
    reply: `We offer monthly maintenance plans to keep your site safe and running perfectly. 🔧\n\nWhat's included:\n✅ Regular plugin & security updates\n✅ Daily backups\n✅ Performance monitoring\n✅ Minor content changes\n✅ Priority support\n\nSo you can focus on running your business while we handle the tech. Want to know more? [Chat with us](https://wa.me/234XXXXXXXXXX)`
  },
  {
    patterns: ['contact', 'reach you', 'get in touch', 'talk to you', 'speak with', 'phone', 'email', 'whatsapp', 'message'],
    reply: `You can reach us through any of these:\n\n💬 **WhatsApp** (fastest) → [Chat Now](https://wa.me/234XXXXXXXXXX)\n📧 **Email** → your@email.com\n📸 **Instagram DM** → @devaustin\n\nWe typically respond within a few hours. We'd love to hear about your project!`
  },
  {
    patterns: ['location', 'where are you', 'where are you based', 'country', 'nigeria', 'based in'],
    reply: `We're based in **Nigeria** 🇳🇬 but we work with clients all over the world! All our consultations and project updates are done online, so location is never a barrier. We've worked with clients across Africa and beyond.`
  },
  {
    patterns: ['start', 'begin', 'how to start', 'get started', 'start a project', 'work with you', 'hire'],
    reply: `Getting started is simple! Here's how:\n\n1️⃣ Fill out our [project form](start-project.html) — takes 2 minutes\n2️⃣ We review your request & get back to you\n3️⃣ We hop on a quick call to discuss details\n4️⃣ We send you a proposal & timeline\n5️⃣ We build your dream project! 🚀\n\nOr just [WhatsApp us directly](https://wa.me/234XXXXXXXXXX) if you prefer to chat first!`
  },
  {
    patterns: ['portfolio', 'work', 'examples', 'previous', 'past projects', 'show me', 'what have you built'],
    reply: `We've built websites for businesses across various industries — from service businesses and coaches to e-commerce stores and corporate brands.\n\n📂 Check out our portfolio section on the website for examples of our work. Want to see something specific? [Send us a message](https://wa.me/234XXXXXXXXXX) and we'll share relevant samples!`
  },
  {
    patterns: ['payment', 'how do i pay', 'payment method', 'deposit', 'upfront'],
    reply: `We offer a simple payment structure:\n\n💰 **50% deposit** to start the project\n💰 **50% balance** on delivery\n\nWe accept bank transfer and mobile payments. We never request full payment before starting — your trust matters to us. 🤝`
  },
  {
    patterns: ['domain', 'hosting', 'server', 'host'],
    reply: `Yes, we handle domain registration and hosting setup for you! 🌐\n\nWe'll recommend the best hosting plan for your needs, register your domain, and configure everything — so your site is live and secure from day one. This is included in our **Full Business Setup** package or can be added to any project.`
  },
  {
    patterns: ['seo', 'google', 'search engine', 'rank', 'traffic'],
    reply: `Every website we build comes with basic **on-page SEO** — proper meta tags, fast loading speed, mobile optimisation, and clean code structure. These are the foundations Google loves. 📈\n\nFor advanced SEO campaigns (content strategy, backlinks, etc.), we can discuss that separately. [Let's talk](https://wa.me/234XXXXXXXXXX)!`
  },
  {
    patterns: ['thank', 'thanks', 'thank you', 'appreciate', 'great', 'awesome', 'nice'],
    reply: `You're very welcome! 😊 If you have any more questions or you're ready to kick off your project, we're right here. [Start your project →](start-project.html)`
  },
  {
    patterns: ['bye', 'goodbye', 'later', 'see you', 'cya'],
    reply: `Take care! 👋 Whenever you're ready to build something great, Dev Austin Consult is here for you. Have a wonderful day! 🌟`
  }
];

// Default fallback reply
const FALLBACK = `Hmm, I'm not sure I have the exact answer for that yet! 😅\n\nBut you can get a direct answer by:\n💬 [WhatsApp us](https://wa.me/234XXXXXXXXXX)\n📧 [Send an email](mailto:your@email.com)\n📋 [Start a project](start-project.html)\n\nWe'd love to hear from you!`;


/* ── FIND BEST REPLY ────────────────────────────────────── */
function getReply(userText) {
  const text = userText.toLowerCase().trim();

  for (const entry of KB) {
    for (const pattern of entry.patterns) {
      if (text.includes(pattern)) {
        return entry.reply;
      }
    }
  }
  return FALLBACK;
}


/* ── RENDER MARKDOWN-LIGHT (bold + links + newlines) ─────── */
function renderText(raw) {
  return raw
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\((.*?)\)/g, '<a href="$2" target="_blank" style="color:var(--accent);font-weight:700;text-decoration:none;">$1</a>')
    .replace(/\n/g, '<br>');
}


/* ── ADD MESSAGE TO CHAT ────────────────────────────────── */
function addMessage(text, role) {
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  div.innerHTML = renderText(text);
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}


/* ── TYPING INDICATOR ───────────────────────────────────── */
function showTyping() {
  const el = document.createElement('div');
  el.className = 'typing-indicator';
  el.id = 'typingIndicator';
  el.innerHTML = '<span></span><span></span><span></span>';
  chatMessages.appendChild(el);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTyping() {
  const el = document.getElementById('typingIndicator');
  if (el) el.remove();
}


/* ── PROCESS MESSAGE ────────────────────────────────────── */
function processMessage(text) {
  if (!text.trim()) return;

  // Hide quick replies after first user message
  if (quickReplies) quickReplies.style.display = 'none';

  addMessage(text, 'user');
  chatInput.value = '';

  // Simulate realistic typing delay
  const delay = Math.min(600 + text.length * 18, 2200);

  showTyping();
  setTimeout(() => {
    hideTyping();
    addMessage(getReply(text), 'bot');
  }, delay);
}


/* ── SEND BUTTON & ENTER KEY ────────────────────────────── */
if (sendBtn) {
  sendBtn.addEventListener('click', () => processMessage(chatInput.value));
}

if (chatInput) {
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') processMessage(chatInput.value);
  });
}


/* ── QUICK REPLY BUTTONS ────────────────────────────────── */
if (quickReplies) {
  quickReplies.querySelectorAll('.quick-reply').forEach(btn => {
    btn.addEventListener('click', () => {
      processMessage(btn.textContent);
    });
  });
}
