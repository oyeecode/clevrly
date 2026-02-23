// Lightweight, static-hosting friendly behaviors (no build step).
(() => {
  const CONFIG = {
    whatsappPhoneE164: "+910000000000", // TODO: change to your WhatsApp number
    whatsappDefaultMessage: "Hi Clevrly — I’d like to learn more about your services.",
    contactEmailTo: "hello@clevrly.com",
    contactEmailSubject: "New inquiry from website",
    // Optional analytics (only loads after consent)
    // Example: "G-XXXXXXXXXX"
    gaMeasurementId: "",
  };

  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Cookie consent (static-friendly)
  const CONSENT_COOKIE = "clevrly_cookie_consent_v1";
  const getCookie = (name) => {
    const parts = document.cookie.split(";").map((p) => p.trim());
    const hit = parts.find((p) => p.startsWith(`${name}=`));
    if (!hit) return null;
    return decodeURIComponent(hit.split("=").slice(1).join("="));
  };
  const setCookie = (name, value, days = 180) => {
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
  };
  const parseConsent = () => {
    const raw = getCookie(CONSENT_COOKIE);
    if (!raw) return null;
    try {
      const obj = JSON.parse(raw);
      if (!obj || typeof obj !== "object") return null;
      return {
        necessary: true,
        analytics: Boolean(obj.analytics),
      };
    } catch {
      return null;
    }
  };
  const saveConsent = (consent) => {
    const payload = JSON.stringify({ analytics: Boolean(consent.analytics), t: Date.now() });
    setCookie(CONSENT_COOKIE, payload);
  };

  const loadScriptOnce = (src) =>
    new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(s);
    });

  const enableAnalyticsIfConfigured = async () => {
    const id = String(CONFIG.gaMeasurementId || "").trim();
    if (!id) return;
    // Google tag (gtag.js)
    await loadScriptOnce(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`);
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    gtag("js", new Date());
    gtag("config", id, { anonymize_ip: true });
  };

  // Footer year
  const yearEl = qs("[data-year]");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Mobile nav
  const nav = qs("[data-nav]");
  const navToggle = qs("[data-nav-toggle]");
  if (nav && navToggle) {
    const closeNav = () => {
      nav.dataset.open = "false";
      navToggle.setAttribute("aria-expanded", "false");
    };
    const openNav = () => {
      nav.dataset.open = "true";
      navToggle.setAttribute("aria-expanded", "true");
    };

    navToggle.addEventListener("click", () => {
      const isOpen = nav.dataset.open === "true";
      if (isOpen) closeNav();
      else openNav();
    });

    qsa("a.nav-link", nav).forEach((a) => a.addEventListener("click", closeNav));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeNav();
    });
  }

  // Ticker duplication for smooth loop
  const ticker = qs("[data-ticker]");
  if (ticker && ticker.children.length > 0) {
    const clone = ticker.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    ticker.parentElement?.appendChild(clone);
  }

  // WhatsApp link wiring
  const normalizePhone = (p) => (p || "").replace(/[^\d+]/g, "");
  const buildWhatsAppUrl = (message) => {
    const phone = normalizePhone(CONFIG.whatsappPhoneE164);
    const text = encodeURIComponent(message || CONFIG.whatsappDefaultMessage);
    // wa.me expects digits (no +) but works with plus stripped in most cases; we force digits.
    const digits = phone.replace(/^\+/, "");
    return `https://wa.me/${digits}?text=${text}`;
  };

  const applyWhatsAppLinks = (message) => {
    const url = buildWhatsAppUrl(message);
    qsa("[data-whatsapp-link]").forEach((a) => {
      a.setAttribute("href", url);
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
    });
  };
  applyWhatsAppLinks();

  // Modal handling
  const openModalButtons = qsa("[data-open-modal]");
  const closeModalEls = qsa("[data-close-modal]");
  const modalFor = (name) => qs(`[data-modal="${CSS.escape(name)}"]`);

  const openModal = (name) => {
    const modal = modalFor(name);
    if (!modal) return;
    modal.hidden = false;
    document.documentElement.style.overflow = "hidden";
    // Focus first input for accessibility
    const input = qs("input, select, textarea, button", modal);
    input?.focus?.();
  };

  const closeAllModals = () => {
    qsa("[data-modal]").forEach((m) => (m.hidden = true));
    document.documentElement.style.overflow = "";
  };

  openModalButtons.forEach((btn) =>
    btn.addEventListener("click", () => {
      const name = btn.getAttribute("data-open-modal");
      if (name) openModal(name);
    }),
  );
  closeModalEls.forEach((el) => el.addEventListener("click", closeAllModals));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAllModals();
  });

  // Cookie banner + preferences
  const cookieBanner = qs("[data-cookie-banner]");
  const cookieAccept = qs("[data-cookie-accept]");
  const cookieReject = qs("[data-cookie-reject]");
  const cookieForm = qs("[data-cookie-form]");
  const cookieAcceptAll = qs("[data-cookie-accept-all]");
  const analyticsCheckbox = qs('input[name="analytics"]', cookieForm || undefined);

  const applyConsent = async (consent) => {
    if (consent?.analytics) {
      try {
        await enableAnalyticsIfConfigured();
      } catch {
        // If analytics fails to load, keep site functional.
      }
    }
  };

  const currentConsent = parseConsent();
  if (!currentConsent && cookieBanner) {
    cookieBanner.hidden = false;
  } else if (currentConsent) {
    // Sync UI state
    if (analyticsCheckbox) analyticsCheckbox.checked = Boolean(currentConsent.analytics);
    applyConsent(currentConsent);
  }

  const hideCookieBanner = () => {
    if (cookieBanner) cookieBanner.hidden = true;
  };

  cookieAccept?.addEventListener("click", async () => {
    const consent = { necessary: true, analytics: true };
    saveConsent(consent);
    hideCookieBanner();
    if (analyticsCheckbox) analyticsCheckbox.checked = true;
    await applyConsent(consent);
  });

  cookieReject?.addEventListener("click", () => {
    const consent = { necessary: true, analytics: false };
    saveConsent(consent);
    hideCookieBanner();
    if (analyticsCheckbox) analyticsCheckbox.checked = false;
  });

  cookieAcceptAll?.addEventListener("click", async () => {
    const consent = { necessary: true, analytics: true };
    saveConsent(consent);
    hideCookieBanner();
    if (analyticsCheckbox) analyticsCheckbox.checked = true;
    closeAllModals();
    await applyConsent(consent);
  });

  cookieForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const analytics = Boolean(analyticsCheckbox?.checked);
    const consent = { necessary: true, analytics };
    saveConsent(consent);
    hideCookieBanner();
    closeAllModals();
    await applyConsent(consent);
  });

  // Contact form: open mailto (static friendly)
  const contactForm = qs("[data-contact-form]");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(contactForm);
      const name = String(fd.get("name") || "").trim();
      const email = String(fd.get("email") || "").trim();
      const need = String(fd.get("need") || "").trim();
      const message = String(fd.get("message") || "").trim();

      const body = [
        `Name: ${name}`,
        `Email: ${email}`,
        `Need: ${need}`,
        "",
        message,
        "",
        `Sent from: ${location.href}`,
      ].join("\n");

      const to = encodeURIComponent(CONFIG.contactEmailTo);
      const subject = encodeURIComponent(CONFIG.contactEmailSubject);
      const bodyEnc = encodeURIComponent(body);
      window.location.href = `mailto:${to}?subject=${subject}&body=${bodyEnc}`;
    });
  }

  // Schedule modal: WhatsApp confirmation + email fallback
  const scheduleForm = qs("[data-schedule-form]");
  if (scheduleForm) {
    const buildScheduleMessage = () => {
      const fd = new FormData(scheduleForm);
      const name = String(fd.get("name") || "").trim();
      const phone = String(fd.get("phone") || "").trim();
      const date = String(fd.get("date") || "").trim();
      const time = String(fd.get("time") || "").trim();
      const goal = String(fd.get("goal") || "").trim();

      return [
        "Hi Clevrly — I’d like to schedule a call.",
        "",
        `Name: ${name}`,
        phone ? `Phone: ${phone}` : null,
        `Preferred date: ${date}`,
        `Preferred time: ${time}`,
        `Goal: ${goal}`,
      ]
        .filter(Boolean)
        .join("\n");
    };

    scheduleForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const msg = buildScheduleMessage();
      applyWhatsAppLinks(msg);
      window.open(buildWhatsAppUrl(msg), "_blank", "noopener,noreferrer");
      closeAllModals();
    });

    const emailBtn = qs("[data-email-schedule]");
    emailBtn?.addEventListener("click", () => {
      const msg = buildScheduleMessage();
      const to = encodeURIComponent(CONFIG.contactEmailTo);
      const subject = encodeURIComponent("Schedule a call");
      const bodyEnc = encodeURIComponent(msg);
      window.location.href = `mailto:${to}?subject=${subject}&body=${bodyEnc}`;
      closeAllModals();
    });
  }
})();

