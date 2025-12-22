const SVG_WIDTH = 900;
const CENTER_X = SVG_WIDTH / 2;
const STEP_Y = 400;

/* TYPEWRITER */
function typeWriter(el, text, speed = 120) {
  let i = 0;
  el.textContent = "";
  const timer = setInterval(() => {
    el.textContent += text[i++];
    if (i >= text.length) clearInterval(timer);
  }, speed);
}

/* BUILD CURVE */
function buildPath(count) {
  let d = `M ${CENTER_X} 0`;
  let y = 0;

  for (let i = 1; i <= count; i++) {
    const nextY = i * STEP_Y;
    const dir = i % 2 === 0 ? -200 : 200;

    d += `
      C ${CENTER_X + dir} ${y + STEP_Y * 0.3},
        ${CENTER_X + dir} ${nextY - STEP_Y * 0.3},
        ${CENTER_X} ${nextY}
    `;
    y = nextY;
  }

  return d;
}

/* MAIN */
fetch("data/travels.csv")
  .then(r => r.text())
  .then(text => {
    const rows = text.trim().split("\n").slice(1);
    const svg = document.getElementById("journey-svg");
    const container = document.getElementById("countries");

    /* SVG SETUP — FIXED */
    const pathHeight = rows.length * STEP_Y + 350;

const TOP_PADDING = 30;

svg.setAttribute(
  "viewBox",
  `0 ${-TOP_PADDING} ${SVG_WIDTH} ${pathHeight + TOP_PADDING}`
);
svg.setAttribute("height", pathHeight);
    svg.innerHTML = "";

    /* Start dot */
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", CENTER_X);
    dot.setAttribute("cy", 3);
    dot.setAttribute("r", 6);
    svg.appendChild(dot);

    /* Path */
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", buildPath(rows.length + 1));
svg.appendChild(path);


requestAnimationFrame(() => {
    
  const length = path.getTotalLength();

  path.style.strokeDasharray = "18 22";
  path.style.strokeDashoffset = length;

 
    /* Scroll animation — OFFSET ONLY */
    window.addEventListener("scroll", () => {
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return;

      const progress = Math.min(window.scrollY / maxScroll, 1);
      path.style.strokeDashoffset = length * (1 - progress);
      
    });
    
});

    /* COUNTRIES */
    rows.forEach(row => {
      const [country, flag, year, lat, lng, image] =
        row.split(",").map(v => v.trim());

      const link = document.createElement("a");
      link.href = `countries/${country.toLowerCase()}.html`;
      link.className = "country";

      link.innerHTML = `
        <div class="country-inner">
          <img src="images/${image}" alt="${country}">
          <div class="country-text">
            <div class="country-name" data-text="${country}"></div>
            <div class="country-meta">
              <span>${flag}</span>
              <span>${year}</span>
              <span>${lat}°, ${lng}°</span>
            </div>
          </div>
        </div>
      `;

      container.appendChild(link);
    });

    /* TYPEWRITER OBSERVER */
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const name = e.target.querySelector(".country-name");
          if (name && !name.dataset.done) {
            typeWriter(name, name.dataset.text);
            name.dataset.done = "true";
          }
        }
      });
    }, { threshold: 0.5 });

    document.querySelectorAll(".country").forEach(c => observer.observe(c));
  });