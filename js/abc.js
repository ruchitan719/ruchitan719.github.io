/* ==========================================================
   DOM
========================================================== */

const DOM = {};

// Scroll events can arrive faster than a compressed video can seek. Store one
// latest target per video instead of queueing every intermediate seek.
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

// What fraction of the combined scroll distance belongs to the
// transition video vs. the journey video. Must add up to 1.
const TRANSITION_WEIGHT = 0.3;

/* ==========================================================
   INIT
========================================================== */

document.addEventListener("DOMContentLoaded", init);

function init(){

    gsap.registerPlugin(ScrollTrigger);

    cacheDOM();

    lockScroll();

    setupIntro();

    setupViewportRefresh();

}

function setupViewportRefresh(){

    // Mobile browsers change viewport height on rotation. Recalculate the
    // pinned scroll distances once that change has settled.
    window.addEventListener("orientationchange", () => {
        window.setTimeout(() => ScrollTrigger.refresh(), 250);
    });

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

    gsap.to(DOM.transitionVideo, {
        opacity: 1,
        duration: .5
    });

    // Build the pin only after the intro finishes. This prevents ScrollTrigger
    // from responding to scroll input while the intro has the page locked.
    createStoryTrigger();

    ScrollTrigger.refresh();

}

/* ==========================================================
   STORY SCRUB (transition + journey combined, one trigger)
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

            const progress = self.progress;

            if (progress <= TRANSITION_WEIGHT) {

                const localProgress = progress / TRANSITION_WEIGHT;

                seekVideo(DOM.transitionVideo, localProgress);

                gsap.set(DOM.transitionVideo, { opacity: 1 });
                gsap.set(DOM.journeyVideo, { opacity: 0 });

            } else {

                const localProgress =
                    (progress - TRANSITION_WEIGHT) / (1 - TRANSITION_WEIGHT);

                seekVideo(DOM.journeyVideo, localProgress);

                // Switch exactly at the boundary: transition's final frame
                // is followed by journey's first frame without a new section.
                gsap.set(DOM.transitionVideo, { opacity: 0 });
                gsap.set(DOM.journeyVideo, { opacity: 1 });

            }

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
