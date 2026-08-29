(function () {
  const ENDPOINT = "https://raspy-term-73df.aristiak1994.workers.dev/";
  const STORAGE_KEY = "gothon.contact.submitted";
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const markup = `
<div class="gothon-modal" id="gothonContact" hidden>
  <div class="gothon-modal-backdrop" data-gothon-close></div>
  <div class="gothon-modal-card" role="dialog" aria-modal="true" aria-labelledby="gothonContactTitle">
    <button class="gothon-modal-close" type="button" data-gothon-close aria-label="Close">×</button>
    <div class="gothon-modal-head">
      <span class="gothon-badge-mark" aria-hidden="true"></span>
      <div>
        <h2 id="gothonContactTitle">Contact us</h2>
        <p lang="bn">যোগাযোগ করুন</p>
      </div>
    </div>
    <form class="gothon-form" id="gothonContactForm" novalidate>
      <label>
        <span>Name <i>*</i></span>
        <input name="name" type="text" autocomplete="name" placeholder="Your name" required>
      </label>
      <div class="gothon-form-row">
        <label>
          <span>Email</span>
          <input name="email" type="email" autocomplete="email" placeholder="you@company.com">
        </label>
        <label>
          <span>Phone</span>
          <input name="phone" type="tel" autocomplete="tel" placeholder="+880 1XXX-XXXXXX">
        </label>
      </div>
      <p class="gothon-form-hint">Email or phone is required.</p>
      <label>
        <span>Message</span>
        <textarea name="message" rows="4" placeholder="What would you like to build?"></textarea>
      </label>
      <p class="gothon-form-status" id="gothonContactStatus" role="status" aria-live="polite"></p>
      <button class="gothon-form-submit" type="submit">Send message</button>
    </form>
    <div class="gothon-form-done" id="gothonContactDone" hidden>
      <span class="gothon-form-done-icon" aria-hidden="true">✓</span>
      <b id="gothonContactDoneTitle">Thank you</b>
      <span id="gothonContactDoneBody">We'll be in touch shortly.</span>
      <span class="gothon-form-done-bn" lang="bn" id="gothonContactDoneBn">ধন্যবাদ</span>
    </div>
  </div>
</div>`;

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function setStatus(el, msg, kind) {
    el.textContent = msg || "";
    el.dataset.kind = kind || "";
  }

  function setFieldError(input, msg) {
    const label = input.closest("label");
    label.classList.toggle("is-invalid", Boolean(msg));
    input.setAttribute("aria-invalid", msg ? "true" : "false");
    let err = label.querySelector(".gothon-field-err");
    if (msg) {
      if (!err) {
        err = document.createElement("em");
        err.className = "gothon-field-err";
        label.appendChild(err);
      }
      err.textContent = msg;
    } else if (err) {
      err.remove();
    }
  }

  function storageGet() {
    try {
      return localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    } catch (err) {
      return null;
    }
  }

  function wasSubmitted() {
    return Boolean(storageGet());
  }

  function markSubmitted() {
    const value = JSON.stringify({ at: Date.now() });
    try { localStorage.setItem(STORAGE_KEY, value); } catch (err) {}
    try { sessionStorage.setItem(STORAGE_KEY, value); } catch (err) {}
  }

  function digits(value) {
    return (value.match(/\d/g) || []).join("");
  }

  function validate(form) {
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const phone = form.phone.value.trim();
    let ok = true;

    setFieldError(form.name, "");
    setFieldError(form.email, "");
    setFieldError(form.phone, "");

    if (!name) {
      setFieldError(form.name, "Please enter your name.");
      ok = false;
    }

    if (!email && !phone) {
      setFieldError(form.email, "Enter an email or a phone number.");
      setFieldError(form.phone, "Enter an email or a phone number.");
      ok = false;
    } else {
      if (email && !EMAIL_RE.test(email)) {
        setFieldError(form.email, "That email doesn’t look right.");
        ok = false;
      }
      if (phone && digits(phone).length < 6) {
        setFieldError(form.phone, "That phone number looks too short.");
        ok = false;
      }
    }

    return ok;
  }

  function init() {
    const badge = $(".gothon-badge");
    if (!badge) return;

    document.body.insertAdjacentHTML("beforeend", markup);

    const modal = $("#gothonContact");
    const form = $("#gothonContactForm");
    const status = $("#gothonContactStatus");
    const done = $("#gothonContactDone");
    const doneTitle = $("#gothonContactDoneTitle");
    const doneBody = $("#gothonContactDoneBody");
    const doneBn = $("#gothonContactDoneBn");
    const headTitle = $("#gothonContactTitle");
    const headBn = $(".gothon-modal-head p", modal);
    const submit = $(".gothon-form-submit", form);
    let lastFocus = null;

    function showDone(kind) {
      const already = kind === "already";
      form.hidden = true;
      done.hidden = false;
      done.dataset.kind = kind;
      submit.disabled = false;
      submit.textContent = "Send message";
      headTitle.textContent = already ? "Already submitted" : "Thank you";
      headBn.textContent = already ? "ইতিমধ্যে পাঠানো হয়েছে" : "ধন্যবাদ";
      doneTitle.textContent = already ? "Already submitted" : "Thank you";
      doneBody.textContent = already
        ? "We already have your message. We'll be in touch."
        : "We'll be in touch shortly.";
      doneBn.textContent = already ? "আপনার বার্তা আমরা পেয়েছি। ধন্যবাদ।" : "ধন্যবাদ — আমরা শীঘ্রই যোগাযোগ করব।";
    }

    function showForm() {
      form.hidden = false;
      done.hidden = true;
      headTitle.textContent = "Contact us";
      headBn.textContent = "যোগাযোগ করুন";
      setStatus(status, "");
      submit.disabled = false;
      submit.textContent = "Send message";
    }

    function open() {
      lastFocus = document.activeElement;
      modal.hidden = false;
      document.body.classList.add("gothon-contact-open");
      if (wasSubmitted()) showDone("already");
      else showForm();
      requestAnimationFrame(() => {
        modal.classList.add("is-open");
        if (!wasSubmitted()) form.name.focus();
        else $(".gothon-modal-close", modal).focus();
      });
    }

    function close() {
      modal.classList.remove("is-open");
      document.body.classList.remove("gothon-contact-open");
      window.setTimeout(() => {
        if (!modal.classList.contains("is-open")) modal.hidden = true;
      }, 200);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    badge.addEventListener("click", (e) => {
      e.preventDefault();
      open();
    });

    modal.addEventListener("click", (e) => {
      if (e.target.closest("[data-gothon-close]")) close();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("is-open")) close();
    });

    ["input", "blur"].forEach((evt) => {
      form.addEventListener(evt, (e) => {
        if (!(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) return;
        if (e.target.closest("label.is-invalid")) validate(form);
      }, true);
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      setStatus(status, "");
      if (!validate(form)) return;

      const payload = {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim(),
        message: form.message.value.trim(),
      };

      submit.disabled = true;
      submit.textContent = "Sending…";

      try {
        const res = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("bad-status");
        markSubmitted();
        form.reset();
        showDone("thanks");
      } catch (err) {
        setStatus(status, "Couldn’t send just now. Please try again.", "error");
        submit.disabled = false;
        submit.textContent = "Send message";
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
