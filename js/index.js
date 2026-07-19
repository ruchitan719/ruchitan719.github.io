(function() {
  // Word reveal
  const headline = document.getElementById('headline');
  const text = "Hello, I'm Ruchita 🌸.";
  const words = text.split(' ');
  words.forEach(function(word, i) {
    const span = document.createElement('span');
    span.className = 'word-reveal';
    span.textContent = word;
    span.style.animationDelay = (1 + i * 0.05) + 's';
    headline.appendChild(span);
  });
  // Base video -> still handoff
const baseVideo = document.getElementById('base-video');
let videoEnded = false;

baseVideo.addEventListener('ended', function() {
  videoEnded = true;
  // video just stays visible on its last frame — no swap needed
});

function replayVideo() {
  videoEnded = false;
  baseVideo.currentTime = 0;
  baseVideo.play().catch(function() {});
}

  // Replay the video if the hero fully scrolls out of view and back in
  const heroSection = document.querySelector('.hero');
  let hasLeftView = false;
  const heroObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) {
        hasLeftView = true;
      } else if (hasLeftView) {
        hasLeftView = false;
        replayVideo();
      }
    });
  }, { threshold: 0 });
  heroObserver.observe(heroSection);


  // Spotlight reveal
  const SPOTLIGHT_R = 260;
  const canvas = document.getElementById('reveal-canvas');
  const imgLayer = document.getElementById('reveal-img');
  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  const mouse = { x: -999, y: -999 };
  const smooth = { x: -999, y: -999 };

  window.addEventListener('mousemove', function(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  function loop() {
    // While the video is still playing, keep the reveal layer fully masked off
    if (!videoEnded) {
      imgLayer.style.webkitMaskImage = 'none';
      imgLayer.style.maskImage = 'none';
      imgLayer.style.opacity = '0';
      requestAnimationFrame(loop);
      return;
    }
    imgLayer.style.opacity = '1';

    smooth.x += (mouse.x - smooth.x) * 0.1;
    smooth.y += (mouse.y - smooth.y) * 0.1;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var grad = ctx.createRadialGradient(smooth.x, smooth.y, 0, smooth.x, smooth.y, SPOTLIGHT_R);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.4, 'rgba(255,255,255,1)');
    grad.addColorStop(0.6, 'rgba(255,255,255,0.75)');
    grad.addColorStop(0.75, 'rgba(255,255,255,0.4)');
    grad.addColorStop(0.88, 'rgba(255,255,255,0.12)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');

    ctx.beginPath();
    ctx.arc(smooth.x, smooth.y, SPOTLIGHT_R, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    var dataUrl = canvas.toDataURL();
    imgLayer.style.webkitMaskImage = 'url(' + dataUrl + ')';
    imgLayer.style.maskImage = 'url(' + dataUrl + ')';
    imgLayer.style.webkitMaskSize = '100% 100%';
    imgLayer.style.maskSize = '100% 100%';

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

//   Scroll wrapper
//   Scroll wrapper
const FRAME_COUNT = 192;
const FRAME_PATH = (i) => `frames/Girl2-${i + 1}.png`;

const sequenceCanvas = document.getElementById('sequence-canvas');
const sequenceCtx = sequenceCanvas.getContext('2d');
const wrapper = document.getElementById('sequence-wrapper');
const images = [];

function resizeSequenceCanvas() {
  sequenceCanvas.width = sequenceCanvas.clientWidth;
  sequenceCanvas.height = sequenceCanvas.clientHeight;
}
resizeSequenceCanvas();
window.addEventListener('resize', resizeSequenceCanvas);

function drawFrame(index) {
  const img = images[index];
  if (!img || !img.complete || img.naturalWidth === 0) return;
  sequenceCtx.clearRect(0, 0, sequenceCanvas.width, sequenceCanvas.height);
  const canvasRatio = sequenceCanvas.width / sequenceCanvas.height;
  const imgRatio = img.naturalWidth / img.naturalHeight;
  let drawW, drawH, offsetX, offsetY;
  if (imgRatio > canvasRatio) {
    drawH = sequenceCanvas.height; drawW = drawH * imgRatio;
    offsetX = (sequenceCanvas.width - drawW) / 2; offsetY = 0;
  } else {
    drawW = sequenceCanvas.width; drawH = drawW / imgRatio;
    offsetX = 0; offsetY = (sequenceCanvas.height - drawH) / 2;
  }
  sequenceCtx.drawImage(img, offsetX, offsetY, drawW, drawH);
}

for (let i = 0; i < FRAME_COUNT; i++) {
  const img = new Image();
  img.src = FRAME_PATH(i);
  img.onload = () => { if (i === 0) drawFrame(0); };
  img.onerror = () => console.error('Failed to load frame', i, FRAME_PATH(i));
  images[i] = img;
}

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.create({
  trigger: wrapper,
  start: 'top top',
  end: 'bottom bottom',
  pin: '.scroll-sequence-sticky',
  scrub: true,
  onUpdate: (self) => drawFrame(Math.round(self.progress * (FRAME_COUNT - 1)))
});


})();


