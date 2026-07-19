/* ==========================================================
   DOM
========================================================== */

const DOM = {};

// Scroll can emit updates faster than a compressed video can seek. Keep one
// pending target per video instead of stacking dozens of seek operations.
const VIDEO_SEEKS = new WeakMap();
const SEEK_TOLERANCE = 1 / 30;

/* ==========================================================
   STATE
========================================================== */

const STATE = {

    introFinished: false

};

/* ==========================================================
   CONFIG
========================================================== */

// The last portion of the transition section is shared with the journey
// section. Increase this for a slower cross-fade between the two sections.
const HANDOFF_RANGE = 0.03;

// The journey section enters 20vh before transition's pin releases. Hold its
// first frame during that lead-in, then begin its own scroll playback.
const JOURNEY_LEAD_IN = 0.3;

/* ==========================================================
   INIT
========================================================== */

document.addEventListener("DOMContentLoaded", init);

function init(){

    gsap.registerPlugin(ScrollTrigger);

    cacheDOM();

    lockScroll();

    setupIntro();

}

/* ==========================================================
   CACHE
========================================================== */

function cacheDOM(){

    DOM.heroSection = document.getElementById("hero-section");

    DOM.heroSticky = document.querySelector(".hero-sticky");

    DOM.introVideo = document.getElementById("intro-video");

    DOM.transitionVideo = document.getElementById("transition-video");

    DOM.journeyVideo = document.getElementById("journey-video");

    DOM.scrollIndicator = document.getElementById("scroll-indicator");

}

/* ==========================================================
   SCROLL LOCK
   Prevents any scroll from "banking up" while intro autoplays.
   Page height never changes, so nothing visually crops.
========================================================== */

function lockScroll(){

    document.documentElement.classList.add("intro-locked");

    document.body.classList.add("intro-locked");

}

function unlockScroll(){

    document.documentElement.classList.remove("intro-locked");

    document.body.classList.remove("intro-locked");

}

/* ==========================================================
   INTRO
========================================================== */

function setupIntro(){

    DOM.transitionVideo.pause();
    DOM.transitionVideo.currentTime = 0;

    DOM.journeyVideo.pause();
    DOM.journeyVideo.currentTime = 0;

    DOM.introVideo.addEventListener("ended", onIntroEnded, { once:true });

    // If autoplay is blocked or a source fails, do not leave the visitor
    // trapped on a locked page.
    DOM.introVideo.addEventListener("error", onIntroEnded, { once:true });

    DOM.introVideo.play().catch(() => {
        // Muted autoplay normally succeeds. The native controls are not
        // needed here; a user interaction will allow the video to resume.
    });

}

function onIntroEnded(){

    if (STATE.introFinished) return;

    STATE.introFinished = true;

    unlockScroll();

    gsap.to(DOM.scrollIndicator, {
        opacity: 1,
        y: 0,
        duration: .8,
        ease: "power2.out"
    });

    // Keep both clips in the same pinned hero: the completed intro gives way
    // directly to transition's first scroll-controlled frame.
    gsap.set(DOM.introVideo, { opacity: 0 });
    gsap.set(DOM.transitionVideo, { opacity: 1 });

    // Build the pins only after the intro finishes. This prevents ScrollTrigger
    // from responding to scroll input while the intro has the page locked.
    createStoryTrigger();

    ScrollTrigger.refresh();

}

/* ==========================================================
   SEPARATE SCROLL SCENES
========================================================== */

function createStoryTrigger(){

    ScrollTrigger.create({

        trigger: "#hero-section",

        start: "top top",

        end: "bottom bottom",

        scrub: true,

        pin: DOM.heroSticky,

        invalidateOnRefresh: true,

        onUpdate(self){

            // Ignore any stray updates before intro has actually finished
            if (!STATE.introFinished) return;

            seekVideo(DOM.transitionVideo, self.progress);

            // The journey sticky layer is already entering the viewport here.
            // Fade it over transition's ending frames instead of cutting.
            const handoffProgress = gsap.utils.clamp(
                0,
                1,
                (self.progress - (1 - HANDOFF_RANGE)) / HANDOFF_RANGE
            );

            gsap.set(DOM.journeyVideo, { opacity: handoffProgress });

        }

    });

    ScrollTrigger.create({

        trigger: "#journey-section",

        start: "top top",

        end: "bottom bottom",

        scrub: true,

        pin: ".journey-section .scene-sticky",

        invalidateOnRefresh: true,

        onUpdate(self){

            const journeyProgress = gsap.utils.clamp(
                0,
                1,
                (self.progress - JOURNEY_LEAD_IN) / (1 - JOURNEY_LEAD_IN)
            );

            seekVideo(DOM.journeyVideo, journeyProgress);

        }

    });

}

function seekVideo(video, progress){

    if (!video.duration || !Number.isFinite(video.duration)) return;

    const targetTime = gsap.utils.clamp(
        0,
        video.duration,
        progress * video.duration
    );

    let state = VIDEO_SEEKS.get(video);

    if (!state) {
        state = { seeking: false, targetTime: 0 };
        VIDEO_SEEKS.set(video, state);
    }

    state.targetTime = targetTime;

    if (!state.seeking) {
        performVideoSeek(video, state);
    }

}

function performVideoSeek(video, state){

    if (Math.abs(video.currentTime - state.targetTime) < SEEK_TOLERANCE) {
        return;
    }

    state.seeking = true;

    video.addEventListener("seeked", () => {

        state.seeking = false;

        // If the visitor kept scrolling during this seek, go straight to the
        // latest requested frame rather than replaying stale positions.
        if (Math.abs(video.currentTime - state.targetTime) >= SEEK_TOLERANCE) {
            performVideoSeek(video, state);
        }

    }, { once:true });

    if (typeof video.fastSeek === "function") {
        video.fastSeek(state.targetTime);
    } else {
        video.currentTime = state.targetTime;
    }

}

