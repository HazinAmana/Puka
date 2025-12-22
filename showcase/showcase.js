console.clear();

// config
const OFFSET = 7; // distance from edge of container
const EXTRA_INSET = 2;
const MIN_START_RATIO = 0.8;
const MIN_THUMB = 20;
const SEGMENTS = 50;

// init scrollbars - each has their own scoped functions and settings
document.querySelectorAll("[data-scrollbar]").forEach((container) => {
  initCurvedScrollbar(container);
});

// function - init scrolled container
function initCurvedScrollbar(container) {
  const content = container.querySelector(".scroll-content");

  // create and add SVG
  svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("scrollbar-svg");
  svg.setAttribute("aria-hidden", "true");

  const trackPath = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  trackPath.classList.add("scrollbar-track");

  const thumbPath = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  thumbPath.classList.add("scrollbar-thumb");

  svg.appendChild(trackPath);
  svg.appendChild(thumbPath);
  container.appendChild(svg);

  // state
  let pathLength = 0;
  let thumbLength = 50;
  let dragging = false;
  let pointerId = null;

  // function - update
  function updatePath() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    const r = parseFloat(getComputedStyle(container).borderRadius) || 0;

    const effectiveRadius = Math.max(r - OFFSET, 0);
    const trackX = w - OFFSET;
    const topY = OFFSET;
    const bottomY = h - OFFSET;
    const cornerX = trackX - effectiveRadius;

    // calculate x start point - ensure that it is never higher than the corner radius start point
    const minStartX = w * MIN_START_RATIO;
    let startX = trackX - effectiveRadius * EXTRA_INSET;
    if (startX < minStartX) startX = minStartX;
    if (startX > cornerX) startX = cornerX;

    // create the dynamic path
    const d = `
      M ${startX} ${topY}
      L ${cornerX} ${topY}
      A ${effectiveRadius} ${effectiveRadius} 0 0 1 ${trackX} ${
      topY + effectiveRadius
    }
      L ${trackX} ${bottomY - effectiveRadius}
      A ${effectiveRadius} ${effectiveRadius} 0 0 1 ${cornerX} ${bottomY}
      L ${startX} ${bottomY}
    `;
    trackPath.setAttribute("d", d);

    // calculate length of thumb based on content height
    pathLength = trackPath.getTotalLength();
    const ratio = content.clientHeight / content.scrollHeight;
    thumbLength = Math.max(MIN_THUMB, pathLength * ratio);

    updateThumb();
  }

  // function - thumb update
  function updateThumb() {
    const scrollableHeight = content.scrollHeight - content.clientHeight || 1;
    const scrollRatio = content.scrollTop / scrollableHeight;
    const startOffset = (pathLength - thumbLength) * scrollRatio;
    const endOffset = startOffset + thumbLength;

    // the thumb needs to follow the path so we get the generated path points
    // NOTE - the high number of segments help follow the curves
    const points = [];
    for (let i = 0; i <= SEGMENTS; i++) {
      const t = startOffset + ((endOffset - startOffset) / SEGMENTS) * i;
      const p = trackPath.getPointAtLength(t);
      points.push(`${p.x} ${p.y}`);
    }

    const segmentD = `M ${points[0]} ${points
      .slice(1)
      .map((pt) => `L ${pt}`)
      .join(" ")}`;
    thumbPath.setAttribute("d", segmentD);
  }

  //  function - grab thumb
  thumbPath.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    dragging = true;
    pointerId = e.pointerId;
    thumbPath.setPointerCapture(pointerId);
  });

  // function - drag thumb
  window.addEventListener("pointermove", (e) => {
    if (!dragging || e.pointerId !== pointerId) return;
    const rect = container.getBoundingClientRect();
    let ratio = (e.clientY - rect.top) / rect.height;
    ratio = Math.max(0, Math.min(1, ratio));
    content.scrollTop = ratio * (content.scrollHeight - content.clientHeight);
    updateThumb();
  });

  // function - release thumb
  window.addEventListener("pointerup", (e) => {
    if (!dragging || e.pointerId !== pointerId) return;
    dragging = false;
    try {
      thumbPath.releasePointerCapture(pointerId);
    } catch {}
    pointerId = null;
  });

  // events
  content.addEventListener("scroll", updateThumb);
  window.addEventListener("resize", updatePath);

  updatePath();
}

/* Sync .scroll-container height with the image height on small screens (mobile UX)
   - On mobile (<768px) set the right panel height to match the image so the panel
     becomes a scrollable box whose height equals the image's height.
   - On desktop we remove the inline height so the two-column layout behaves as before. */
function syncScrollContainerHeights() {
  const isMobile = window.innerWidth < 768;
  document
    .querySelectorAll('.doubleHoriz[data-layout*="duo"]')
    .forEach((wrapper) => {
      const img = wrapper.querySelector(".portfo");
      const container = wrapper.querySelector(".scroll-container");
      const content = container && container.querySelector(".scroll-content");
      if (!img || !container || !content) return;

      if (isMobile) {
        const h = img.clientHeight || img.getBoundingClientRect().height || 0;
        // set the container height to image height and make inner content scrollable
        container.style.height = h + "px";
        container.style.overflow = "hidden";
        content.style.height = "100%";
        content.style.overflowY = "auto";
      } else {
        // remove inline styles so desktop css + grid can manage heights
        container.style.height = "";
        container.style.overflow = "";
        content.style.height = "";
        content.style.overflowY = "";
      }
    });

  // recalc any custom scrollbars
  window.dispatchEvent(new Event("resize"));
}

// Run on load, resize and when images finish loading
window.addEventListener("resize", syncScrollContainerHeights);
window.addEventListener("orientationchange", syncScrollContainerHeights);
window.addEventListener("load", syncScrollContainerHeights);

// Also bind to image load for dynamic images
document
  .querySelectorAll('.doubleHoriz[data-layout*="duo"] .portfo')
  .forEach((img) => {
    if (img.complete) syncScrollContainerHeights();
    else img.addEventListener("load", syncScrollContainerHeights);
  });

// In case scripts execute early
setTimeout(syncScrollContainerHeights, 200);
