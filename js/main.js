/* -------------------- Menu + Drawer -------------------- */
let menu = document.querySelector("#menu-button");
let overlay = document.querySelector(".overlay");

menu.addEventListener("click", (e) => {
  overlay.classList.toggle("opened");
  menu.classList.toggle("cross");
  menu.nextElementSibling.classList.toggle("opened");
});

overlay.addEventListener("click", (e) => {
  overlay.classList.toggle("opened");
  menu.classList.toggle("cross");
  menu.nextElementSibling.classList.toggle("opened");
});

/* -------------------- Back to top -------------------- */
const backToTopBtn = document.getElementById("backToTop");

// Show/hide button on scroll
window.addEventListener("scroll", () => {
  if (window.scrollY > 200) {
    backToTopBtn.classList.add("show");
  } else {
    backToTopBtn.classList.remove("show");
  }
});

// Scroll to top smoothly on click
backToTopBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

/* -------------------- Popups using Popper -------------------- */
const boxes = Array.from(document.querySelectorAll(".pharmaz__box"));
let headerEl = document.getElementById("pageHeader");
let headerHeight = headerEl ? headerEl.offsetHeight : 0;

function computeHeaderHeight() {
  headerEl = document.getElementById("pageHeader");
  headerHeight = headerEl ? headerEl.offsetHeight : 0;
}

// Map popupElement => popperInstance
const popperMap = new Map();

// Make popups focusable and boxes keyboard-accessible
boxes.forEach((box) => {
  const popupId = box.dataset.popup;
  if (!popupId) return;
  const popup = document.getElementById(popupId);
  if (!popup) return;

  // ensure popup is focusable for accessibility
  if (!popup.hasAttribute("tabindex")) {
    popup.setAttribute("tabindex", "-1");
  }

  // make box keyboard friendly (if not already a button)
  if (!box.hasAttribute("tabindex")) box.setAttribute("tabindex", "0");
  if (!box.hasAttribute("role")) box.setAttribute("role", "button");
  box.setAttribute("aria-expanded", "false");

  // create Popper instance
  const instance = Popper.createPopper(box, popup, {
    placement: "top",
    modifiers: [
      { name: "offset", options: { offset: [0, 10] } },
      {
        name: "preventOverflow",
        options: {
          boundary: "viewport",
          padding: {
            top: headerHeight + 10,
            bottom: 10,
            left: 10,
            right: 10,
          },
        },
      },
      { name: "flip", options: { fallbackPlacements: ["bottom"] } },
      { name: "computeStyles", options: { gpuAcceleration: false } },
    ],
  });

  popperMap.set(popup, { instance, box });

  // Click toggles popup
  function toggle(e) {
    e.preventDefault();
    e.stopPropagation();

    const visible = popup.classList.contains("visible");
    closeAllPopups();
    if (!visible) {
      // update headerHeight/poppers then show
      computeHeaderHeight();
      // update preventOverflow padding dynamically
      instance.setOptions((opts) => {
        if (opts && opts.modifiers) {
          opts.modifiers = opts.modifiers.map((m) => {
            if (m.name === "preventOverflow") {
              m.options = m.options || {};
              m.options.padding = {
                top: headerHeight + 10,
                bottom: 10,
                left: 10,
                right: 10,
              };
            }
            return m;
          });
        }
        return opts;
      });
      instance.update();
      popup.classList.add("visible");
      box.setAttribute("aria-expanded", "true");
      // focus for keyboard users
      popup.focus();
    } else {
      popup.classList.remove("visible");
      box.setAttribute("aria-expanded", "false");
    }
  }

  box.addEventListener("click", toggle);
  box.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter" || ev.key === " ") {
      toggle(ev);
    }
  });
});

// Close all popups helper
function closeAllPopups() {
  popperMap.forEach(({ instance, box }, popup) => {
    popup.classList.remove("visible");
    if (box) box.setAttribute("aria-expanded", "false");
  });
}

// single global click listener to close popups when clicking outside
document.addEventListener("click", (ev) => {
  let clickedInsideAnyPopup = false;
  popperMap.forEach(({ instance, box }, popup) => {
    if (popup.contains(ev.target) || box.contains(ev.target)) {
      clickedInsideAnyPopup = true;
    }
  });
  if (!clickedInsideAnyPopup) closeAllPopups();
});

// escape key closes all popups
document.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape") closeAllPopups();
});

// update Popper instances on resize (debounced)
let resizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    computeHeaderHeight();
    popperMap.forEach(({ instance }, popup) => {
      // update options if needed and force update
      instance.update();
    });
  }, 120);
});

/* -------------------- Form validation & submission -------------------- */
const GOOGLE_SHEETS_WEBAPP_URL =
  "https://script.google.com/macros/s/AKfycby15Ov2Jsg4whAi6lYoudL9hgOyOjKw1_EM1svTIqn53HKA1WPNoCluLz5m1R8hJ2zKkg/exec";

const form = document.getElementById("contactForm");

// Regex patterns
const namePattern = /^[A-Za-z\u0600-\u06FF\s]{3,}$/;
const phonePattern = /^(?:\+?20\s?(?:10|11|12|15)\d{8}|01[0125]\d{8})$/;
const emailPattern =
  /^[A-Za-z0-9._%+-]+@((gmail|yahoo|outlook|hotmail|icloud|live|aol)\.com|edu\.eg|gov\.eg)$/;

/* --- helper function to validate one input --- */
function validateInput(input, error) {
  const value = input.value.trim();
  let isValid = false;

  if (input.id === "name") {
    isValid = namePattern.test(value);
    error.textContent = "Please enter a valid name (at least 3 letters).";
  } else if (input.id === "phone") {
    isValid = phonePattern.test(value);
    error.textContent = "Please enter a valid phone number (+20 1234567890).";
  } else if (input.id === "email") {
    if (value === "") {
      input.classList.remove("valid", "invalid");
      error.style.display = "none";
      return;
    }
    isValid = emailPattern.test(value);
    error.textContent = "Please enter a valid email (e.g. name@gmail.com).";
  }

  if (isValid) {
    input.classList.add("valid");
    input.classList.remove("invalid");
    error.style.display = "none";
  } else if (value !== "") {
    input.classList.add("invalid");
    input.classList.remove("valid");
    error.style.display = "block";
  } else {
    error.style.display = "none";
    input.classList.remove("invalid", "valid");
  }
}

/* --- attach event listeners --- */
form.querySelectorAll(".req").forEach((input) => {
  const error = document.createElement("small");
  error.className = "error-msg";
  error.style.display = "none";
  error.style.color = "var(--error)";
  error.style.fontSize = "0.85rem";
  error.style.marginTop = "-1rem";
  form.insertBefore(error, input.nextSibling);

  input.addEventListener("input", () => {
    input.classList.add("user-touched");
    validateInput(input, error);
  });

  input.addEventListener("blur", () => {
    input.classList.add("user-touched");
    validateInput(input, error);
  });
});

/* --- 🧠 NEW: validate autofilled inputs on page load --- */
window.addEventListener("load", () => {
  form.querySelectorAll(".req").forEach((input) => {
    const error = input.nextElementSibling;
    if (input.value.trim() !== "") {
      input.classList.add("user-touched");
      validateInput(input, error);
    }
  });
});

const submitBtn = form.querySelector('button[type="submit"]');
let isSubmitting = false;

/* --- submit handler --- */
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (isSubmitting) return; // prevent multiple submits

  let valid = true;

  form.querySelectorAll(".req").forEach((input) => {
    const error = input.nextElementSibling;
    validateInput(input, error); // ensure revalidation on submit

    // check if any invalid remain
    if (input.classList.contains("invalid")) valid = false;
  });

  if (!valid) return; // stop submission if errors exist

  isSubmitting = true;
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";

  const formData = new FormData(form);

  try {
    await fetch(GOOGLE_SHEETS_WEBAPP_URL, {
      method: "POST",
      body: formData,
      mode: "no-cors",
    });

    alert("✅ Form submitted successfully!");

    // Track lead with hashed email
    const email = form.querySelector("#email").value;
    await trackLeadWithEmail(email);

    form.reset();

    // reset visuals
    form.querySelectorAll(".req").forEach((input) => {
      input.classList.remove("user-touched", "valid", "invalid");
      const error = input.nextElementSibling;
      if (error) error.style.display = "none";
    });
  } catch (error) {
    console.error("Error submitting form:", error);
    alert("❌ Error submitting form. Please try again later.");
  } finally {
    isSubmitting = false;
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit";
  }
});

// Meta Pixel

// SHA-256 hashing function using Web Crypto API
async function sha256(str) {
  const buf = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Call this after your form submits successfully
async function trackLeadWithEmail(email) {
  if (!email) return; // skip if empty

  const hashedEmail = await sha256(email.trim().toLowerCase());
  fbq("init", "1641117653248679", {
    em: hashedEmail,
  });
  fbq("track", "Lead");
}
