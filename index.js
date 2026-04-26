/*
  Max Maehara
  April 25, 2026

  Script TL;DR:
  Handles Locomotive Scroll, smooth anchor navigation, animated hero signature,
  gallery lightbox behavior, basic image protection, contact form validation,
  and scroll refresh updates.
*/

const scrollContainer = document.querySelector("[data-scroll-container]");
const isMobileLike = window.matchMedia("(max-width: 1024px)").matches;
const supportsHover = window.matchMedia(
  "(hover: hover) and (pointer: fine)"
).matches;

let locoScroll = null;
let refreshScheduled = false;

/* -------------------------------------------------------------------------- */
/* Locomotive Scroll                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Initializes Locomotive Scroll on desktop-sized screens only.
 * Mobile/tablet smooth scrolling is disabled to avoid lag and scroll bugs.
 */
function initLocomotive() {
  if (!window.LocomotiveScroll || !scrollContainer || isMobileLike) return;

  locoScroll = new window.LocomotiveScroll({
    el: scrollContainer,
    smooth: true,
    lerp: 0.085,
    multiplier: 0.9,
    smartphone: { smooth: false },
    tablet: { smooth: false },
  });
}

/**
 * Safely refreshes Locomotive Scroll without spamming update calls.
 */
function refreshScroll() {
  if (!locoScroll || refreshScheduled) return;

  refreshScheduled = true;

  requestAnimationFrame(() => {
    locoScroll.update();
    refreshScheduled = false;
  });
}

initLocomotive();

/* -------------------------------------------------------------------------- */
/* Smooth Navigation Links                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Gets the current navbar height so anchor scrolling does not hide content
 * behind the fixed navigation bar.
 */
function getNavOffset() {
  const nav = document.querySelector(".navbar");
  return nav ? nav.offsetHeight : 82;
}

/**
 * Scrolls to a target section using Locomotive Scroll when available,
 * otherwise falls back to native smooth scrolling.
 */
function scrollToTarget(targetSelector) {
  const target = document.querySelector(targetSelector);
  if (!target) return;

  const offset = -getNavOffset() + 8;

  if (locoScroll) {
    locoScroll.scrollTo(target, {
      offset,
      duration: 700,
    });
  } else {
    const top = target.getBoundingClientRect().top + window.pageYOffset + offset;

    window.scrollTo({
      top,
      behavior: "smooth",
    });
  }
}

// Attach smooth scrolling to all internal nav links.
document.querySelectorAll(".nav_scroll_link").forEach((link) => {
  link.addEventListener("click", (event) => {
    const href = link.getAttribute("href");
    if (!href || !href.startsWith("#")) return;

    event.preventDefault();
    scrollToTarget(href);
  });
});

/* -------------------------------------------------------------------------- */
/* Hero Signature Animation                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Loads the SVG signature, normalizes its sizing, creates a stroke mask,
 * and animates the signature so it draws onto the page.
 */
async function initHeroSignature() {
  const signatureMount = document.getElementById("heroSignature");
  if (!signatureMount) return;

  try {
    const response = await fetch("assets/MaeharaSignature.svg");

    if (!response.ok) {
      throw new Error(`Failed to load SVG: ${response.status}`);
    }

    const svgText = await response.text();
    signatureMount.innerHTML = svgText;

    const svg = signatureMount.querySelector("svg");
    if (!svg) return;

    // Let CSS control dimensions while preserving proper SVG scaling.
    svg.removeAttribute("width");
    svg.removeAttribute("height");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

    requestAnimationFrame(() => {
      try {
        const bbox = svg.getBBox();
        const padX = 12;
        const padY = 12;

        if (bbox.width > 0 && bbox.height > 0) {
          svg.setAttribute(
            "viewBox",
            `${bbox.x - padX} ${bbox.y - padY} ${
              bbox.width + padX * 2
            } ${bbox.height + padY * 2}`
          );
        }
      } catch (err) {
        console.warn("Could not compute SVG bounding box:", err);
      }

      const ns = "http://www.w3.org/2000/svg";
      const drawable = Array.from(
        svg.querySelectorAll(
          "path, line, polyline, polygon, ellipse, circle, rect"
        )
      );

      if (!drawable.length) {
        refreshScroll();
        return;
      }

      // Rebuild the SVG with a visible group and animated mask strokes.
      while (svg.firstChild) {
        svg.removeChild(svg.firstChild);
      }

      const defs = document.createElementNS(ns, "defs");
      const mask = document.createElementNS(ns, "mask");
      const maskId = `sig-mask-${Date.now()}`;

      mask.setAttribute("id", maskId);
      mask.setAttribute("maskUnits", "userSpaceOnUse");

      const viewBox = svg.getAttribute("viewBox");

      if (viewBox) {
        const parts = viewBox.split(/\s+/).map(Number);

        if (parts.length === 4) {
          const [x, y, w, h] = parts;
          const blackRect = document.createElementNS(ns, "rect");

          blackRect.setAttribute("x", x);
          blackRect.setAttribute("y", y);
          blackRect.setAttribute("width", w);
          blackRect.setAttribute("height", h);
          blackRect.setAttribute("fill", "black");

          mask.appendChild(blackRect);
        }
      }

      const visibleGroup = document.createElementNS(ns, "g");
      visibleGroup.setAttribute("class", "sig-visible");
      visibleGroup.setAttribute("mask", `url(#${maskId})`);

      const lengths = [];
      let totalLength = 0;

      drawable.forEach((el) => {
        let length = 0;

        try {
          if (typeof el.getTotalLength === "function") {
            length = el.getTotalLength();
          }
        } catch (err) {
          length = 0;
        }

        // Fallback length keeps animation working for shapes without path data.
        if (!length || !Number.isFinite(length)) {
          length = 100;
        }

        lengths.push(length);
        totalLength += length;

        const visibleClone = el.cloneNode(true);
        visibleGroup.appendChild(visibleClone);

        const maskClone = el.cloneNode(true);
        maskClone.removeAttribute("style");
        maskClone.setAttribute("class", "sig-mask-stroke");
        maskClone.setAttribute("fill", "none");
        maskClone.setAttribute("stroke", "white");
        maskClone.style.setProperty("--path-length", length);
        maskClone.style.strokeDasharray = `${length}`;
        maskClone.style.strokeDashoffset = `${length}`;

        mask.appendChild(maskClone);
      });

      const totalDuration = 1.8;
      let accumulatedDelay = 0;

      const maskStrokes = mask.querySelectorAll(".sig-mask-stroke");

      maskStrokes.forEach((el, index) => {
        const length = lengths[index];
        const segmentDuration = (length / totalLength) * totalDuration;

        el.style.animationDuration = `${segmentDuration}s`;
        el.style.setProperty("--delay", `${accumulatedDelay}s`);

        accumulatedDelay += segmentDuration;
      });

      defs.appendChild(mask);
      svg.appendChild(defs);
      svg.appendChild(visibleGroup);

      refreshScroll();
    });
  } catch (error) {
    console.error("Signature SVG load error:", error);
    refreshScroll();
  }
}

initHeroSignature();

/* -------------------------------------------------------------------------- */
/* Gallery Lightbox                                                           */
/* -------------------------------------------------------------------------- */

const rectGallery = document.getElementById("rectGallery");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxCaption = document.getElementById("lightboxCaption");
const lightboxClose = document.getElementById("lightboxClose");
const lightboxBackdrop = document.getElementById("lightboxBackdrop");

/**
 * Preloads a full-size gallery image before the user opens it.
 */
function preloadImage(src) {
  if (!src) return;

  const img = new Image();
  img.decoding = "async";
  img.src = src;
}

/**
 * Opens the lightbox and swaps in the full-size image after it loads.
 */
function openLightbox(src, alt, caption) {
  if (!lightbox || !lightboxImg || !lightboxCaption || !src) return;

  lightboxCaption.textContent = caption || "";
  lightbox.classList.add("is_open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("lightbox_open");

  const temp = new Image();
  temp.decoding = "async";

  temp.onload = () => {
    lightboxImg.src = src;
    lightboxImg.alt = alt || "";
  };

  temp.src = src;

  if (locoScroll) {
    locoScroll.stop();
  }
}

/**
 * Closes the lightbox and clears the image after the close animation.
 */
function closeLightbox() {
  if (!lightbox || !lightboxImg || !lightboxCaption) return;

  lightbox.classList.remove("is_open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("lightbox_open");

  window.setTimeout(() => {
    lightboxImg.src = "";
    lightboxImg.alt = "";
    lightboxCaption.textContent = "";
  }, 150);

  if (locoScroll) {
    locoScroll.start();
    refreshScroll();
  }
}

if (rectGallery) {
  rectGallery.addEventListener("click", (event) => {
    const tile = event.target.closest(".rect_tile");
    if (!tile) return;

    const img = tile.querySelector(".rect_img");
    const fullSrc = tile.dataset.full;
    const caption = tile.dataset.caption || "";
    const alt = img ? img.getAttribute("alt") : "";

    openLightbox(fullSrc, alt, caption);
  });

  // Desktop hover preload only. Avoids unnecessary mobile data usage.
  if (supportsHover) {
    rectGallery.querySelectorAll(".rect_tile").forEach((tile) => {
      tile.addEventListener(
        "mouseenter",
        () => {
          preloadImage(tile.dataset.full);
        },
        { passive: true }
      );
    });
  }
}

if (lightboxClose) {
  lightboxClose.addEventListener("click", closeLightbox);
}

if (lightboxBackdrop) {
  lightboxBackdrop.addEventListener("click", closeLightbox);
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && lightbox?.classList.contains("is_open")) {
    closeLightbox();
  }
});

/* -------------------------------------------------------------------------- */
/* Optional Image Protection                                                  */
/* -------------------------------------------------------------------------- */

// Prevent casual right-click saving and dragging on gallery images.
[rectGallery, lightboxImg].forEach((element) => {
  if (!element) return;

  element.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });

  element.addEventListener("dragstart", (event) => {
    event.preventDefault();
  });
});

// Make all images non-draggable for cleaner interaction.
document.querySelectorAll("img").forEach((img) => {
  img.setAttribute("draggable", "false");
});

/* -------------------------------------------------------------------------- */
/* Contact Form Validation                                                    */
/* -------------------------------------------------------------------------- */

const contactForm = document.querySelector(".contact_form");

if (contactForm) {
  const requiredFields = contactForm.querySelectorAll(
    "input[required], textarea[required]"
  );
  const formError = contactForm.querySelector(".form_error");

  requiredFields.forEach((field) => {
    field.addEventListener("blur", () => {
      field.classList.add("touched");
    });
  });

  contactForm.addEventListener("submit", (event) => {
    let hasInvalidField = false;

    requiredFields.forEach((field) => {
      field.classList.add("touched");

      if (!field.checkValidity()) {
        hasInvalidField = true;
      }
    });

    if (hasInvalidField) {
      event.preventDefault();

      if (formError) {
        formError.textContent = "Please fill out all required fields.";
      }

      const firstInvalid = contactForm.querySelector(":invalid");

      if (firstInvalid) {
        if (locoScroll) {
          locoScroll.scrollTo(firstInvalid, {
            offset: -getNavOffset() - 20,
            duration: 600,
          });
        } else {
          firstInvalid.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }

        firstInvalid.focus({ preventScroll: true });
      }
    } else if (formError) {
      formError.textContent = "";
    }
  });
}

/* -------------------------------------------------------------------------- */
/* Initial Load / Resize Updates                                              */
/* -------------------------------------------------------------------------- */

window.addEventListener("load", () => {
  refreshScroll();
});

window.addEventListener("resize", () => {
  refreshScroll();
});