(function () {
      const section  = document.getElementById('jv-animated-section');

      const glowWrap = document.getElementById('glowWrap');

      const phase1   = document.getElementById('phase1');
      const phase2   = document.getElementById('phase2');
      const p1Img    = document.getElementById('phase1Frame');

      const stage    = document.getElementById('phase2Stage');
      const emoji    = document.getElementById('emojiPic');
      const blackBg  = document.getElementById('blackBg');
      const channel  = document.getElementById('channelPic');
      const img900   = document.getElementById('image900');

      function restartAnim(el, className) {
        if (!el) return;
        el.classList.remove(className);
        void el.offsetWidth; // reflow
        el.classList.add(className);
      }

      function resetPhases() {
        phase1.classList.remove('shown-phase'); phase1.classList.add('hidden-phase');
        phase2.classList.remove('shown-phase'); phase2.classList.add('hidden-phase');

        glowWrap.classList.remove('glow-on', 'glow-animated');

        p1Img && p1Img.classList.remove('anim-zoom-bounce');
        [blackBg, channel, img900].forEach(el => el && el.classList.remove('anim-gentle-pulse'));
        [stage].forEach(el => el && el.classList.remove('anim-vigorous-shake'));

        if (emoji && emoji._anim) { emoji._anim.cancel(); emoji._anim = null; }
        if (emoji) emoji.style.transform = '';
      }

      /**
       * Emoji covers the parent FIRST, then shrinks back to original position.
       * We compute the center and a "cover scale" that fully covers the stage (like background-size: cover).
       */
      function animateEmojiCoverThenReturn() {
        if (!emoji) return;

        const parent = emoji.parentElement; // stage
        const pr = parent.getBoundingClientRect();
        const er = emoji.getBoundingClientRect();

        // compute cover scale: max of width/height ratios, add a small margin
        const coverScale = Math.max(pr.width / er.width, pr.height / er.height) * 1.06;

        // centers
        const emojiCenterX = er.left + er.width / 2;
        const emojiCenterY = er.top  + er.height / 2;
        const parentCenterX = pr.left + pr.width / 2;
        const parentCenterY = pr.top  + pr.height / 2;

        const dx = parentCenterX - emojiCenterX;
        const dy = parentCenterY - emojiCenterY;

        // keyframes: START from COVER + centered, then shrink back to original spot
        const keyframes = [
          { transform: `translate(${dx}px, ${dy}px) scale(${coverScale})`, offset: 0    },
          { transform: `translate(${dx * 0.08}px, ${dy * 0.08}px) scale(${coverScale*0.98})`, offset: 0.18 }, // tiny settle
          { transform: 'translate(0px, 0px) scale(1)', offset: 1 }
        ];

        const timing = {
          duration: 1800,
          easing: 'cubic-bezier(.25,.8,.25,1)',
          fill: 'both'
        };

        // glow ON while emoji is covering, then remove at end
        glowWrap.classList.add('glow-on', 'glow-animated');

        if (emoji._anim) emoji._anim.cancel();
        emoji._anim = emoji.animate(keyframes, timing);

        emoji._anim.onfinish = () => {
          glowWrap.classList.remove('glow-animated'); // stop pulsing
          // keep a faint glow for a beat (optional) before fully off:
          setTimeout(() => glowWrap.classList.remove('glow-on'), 180);
        };
      }

      // One full cycle: Phase 1 -> Phase 2 (emoji covers first, then shrinks) -> finish
      function runSequence() {
        resetPhases();

        // Phase 1 in
        phase1.classList.remove('hidden-phase');
        phase1.classList.add('shown-phase');
        requestAnimationFrame(() => requestAnimationFrame(() => {
          restartAnim(p1Img, 'anim-zoom-bounce');
        }));

        const p1Dur   = 1100;   // sync with CSS
        const xFade   = 220;
        const emojiDur= 1800;
        const pad     = 250;

        // To Phase 2
        setTimeout(() => {
          phase1.classList.remove('shown-phase');
          phase1.classList.add('hidden-phase');

          phase2.classList.remove('hidden-phase');
          phase2.classList.add('shown-phase');

          // stage micro-motion + decor
          restartAnim(stage, 'anim-vigorous-shake');
          setTimeout(() => {
            [blackBg, channel, img900].forEach(el => restartAnim(el, 'anim-gentle-pulse'));
          }, 80);

          // IMPORTANT: Emoji should be the FIRST visible focal in phase 2:
          // We immediately animate it FROM COVER -> back to its corner.
          requestAnimationFrame(() => requestAnimationFrame(() => {
            animateEmojiCoverThenReturn();
          }));
        }, p1Dur + xFade);

        return p1Dur + xFade + emojiDur + pad; // total time for one cycle
      }

      // Loop controller (only while in view)
      let inView = false;
      let loopTimer = null;
      function startLoop() {
        if (loopTimer) return;
        const cycle = () => {
          const total = runSequence();
          loopTimer = setTimeout(cycle, total + 6600); // small buffer
        };
        cycle();
      }
      function stopLoop() {
        if (loopTimer) { clearTimeout(loopTimer); loopTimer = null; }
      }

      // Start/stop based on viewport visibility
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting && !inView) {
              inView = true;
              startLoop();
            } else if (!e.isIntersecting && inView) {
              inView = false;
              stopLoop();
              resetPhases();
            }
          });
        },
        { root: null, threshold: 0.35, rootMargin: '0px 0px -6%' }
      );

      resetPhases();
      io.observe(section);

      // Optional: rerun sequence adaptively after big resizes (keeps math fresh next loop)
      window.addEventListener('orientationchange', () => { /* next loop uses new size */ });
      window.addEventListener('resize', () => { /* next loop uses new size */ });
    })();


    // sales sales
   
(function () {
  const stage   = document.getElementById('cf-anim-stage');     // <-- your container
  const first   = document.getElementById('hidden-image');      // starts with class="hidden"
  const main    = document.getElementById('main-image');
  const overlay = document.getElementById('overlay-image');

  if (!stage || !first || !main) return;

  const HOLD_MS = 1400;   // how long the first image stays visible
  const FADE_MS = 700;    // fade duration (ms)
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // prepare fade (inline only; no class/style changes except opacity/transition)
  function prep(el) {
    if (!el) return;
    el.style.transition = `opacity ${FADE_MS}ms ease-out`;
    el.style.willChange = 'opacity';
  }

  function show(el) { if (el) { el.classList.remove('hidden'); el.style.opacity = '1'; } }
  function hide(el) { if (el) { el.style.opacity = '0'; } }

  function run() {
    [first, main, overlay].forEach(prep);

    // Start: show hidden-image, keep display images invisible
    // (use double rAF so browsers apply transitions after we remove `hidden`)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        show(first);
        if (main)    main.style.opacity = '0';
        if (overlay) overlay.style.opacity = '0';

        if (prefersReduced) {
          // accessibility: no animation, jump to final
          hide(first);
          first.classList.add('hidden');
          if (main)    main.style.opacity = '1';
          if (overlay) overlay.style.opacity = '1';
          return;
        }

        // keep first on top while visible
        first.style.zIndex = '30';

        // Cross-fade after hold
        setTimeout(() => {
          hide(first);
          if (main)    main.style.opacity = '1';
          if (overlay) overlay.style.opacity = '1';

          // After fade completes, remove from hit-test/flow again
          setTimeout(() => {
            first.classList.add('hidden');
            first.style.zIndex = '';  // clear inline z-index
          }, FADE_MS + 50);
        }, HOLD_MS);
      });
    });
  }

  // Run once when visible (prevents firing while off-screen)
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          run();
          io.unobserve(stage); // remove this line if you want it to re-run on re-entry
        }
      });
    }, { threshold: 0.2 });
    io.observe(stage);
  } else {
    run(); // fallback
  }
})();

// end of sales script


// carousel script start
  const track = document.getElementById('carousel');
  const prev  = document.getElementById('prev');
  const next  = document.getElementById('next');

  // keep your step if you like; using your existing 320
  const step = 320;

  function atStart() {
    return Math.floor(track.scrollLeft) <= 0;
  }
  function atEnd() {
    const max = track.scrollWidth - track.clientWidth - 1;
    return Math.ceil(track.scrollLeft) >= max;
  }

  function updateArrows() {
    // show gray border only when button can scroll
    prev.classList.toggle('border-gray-400', !atStart());
    next.classList.toggle('border-gray-400', !atEnd());
  }

  // click handlers (keep your behavior)
  prev.addEventListener('click', () => {
    track.scrollBy({ left: -step, behavior: 'smooth' });
  });
  next.addEventListener('click', () => {
    track.scrollBy({ left:  step, behavior: 'smooth' });
  });

  // update on load, scroll, and resize
  window.addEventListener('load', updateArrows);
  window.addEventListener('resize', updateArrows);

  let t;
  track.addEventListener('scroll', () => {
    clearTimeout(t);
    // update during scroll (instant)…
    updateArrows();
    // …and also after it settles (for snap corrections)
    t = setTimeout(updateArrows, 120);
  });


  // carousel ennd


  // top carousel
   const trace = document.getElementById('carouselTracker');
  const pre  = document.getElementById('prvBtn');
  const nex  = document.getElementById('netBtn');

  function stepSize(){
    const card = track.querySelector('article');
    if(!card) return 320;
    return Math.round(card.getBoundingClientRect().width + 24); // width + gap
  }

  function brighten(btn){
    btn.classList.add('ring-2','ring-emerald-400');
    setTimeout(()=>btn.classList.remove('ring-2','ring-emerald-400'),180);
  }

  function updateButtons(){
    const max = trace.scrollWidth - trace.clientWidth;
    const x   = trace.scrollLeft;
    pre.disabled = x <= 2;
    nex.disabled = x >= max - 2;
  }

  pre.addEventListener('click', ()=>{
    trace.scrollBy({left:-stepSize(), behavior:'smooth'});
    brighten(pre);
    setTimeout(updateButtons,250);
  });

  nex.addEventListener('click', ()=>{
    trace.scrollBy({left: stepSize(), behavior:'smooth'});
    brighten(nex);
    setTimeout(updateButtons,250);
  });

  trace.addEventListener('scroll', updateButtons, {passive:true});
  window.addEventListener('resize', updateButtons);
  updateButtons();
  // end of top carousel

  // Prevent horizontal overflow
