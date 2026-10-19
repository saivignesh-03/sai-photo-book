'use strict';
/* Adjust these values to change the feel. No animation library is required. */
(() => {
  const SETTINGS = {revealThreshold:0.08,cardStagger:55,photoFade:320,parallaxDistance:18};
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const toggle = document.querySelector('#motion-toggle');
  let paused = false;
  try {paused = localStorage.getItem('sai-photo-book:pause-motion') === 'true';} catch {}
  const allowsMotion = () => !paused && !preference.matches;
  const runningAnimations = new Set();
  const activeImageAnimations = new WeakMap();
  let observer;

  function observeCards(target = document) {
    const cards = target.querySelectorAll('.photo-card');
    cards.forEach((card,index) => {
      if (card.dataset.motionObserved) return;
      card.dataset.motionObserved = 'true';
      if (!observer || !allowsMotion()) {card.classList.add('visible');return;}
      card.classList.add('card-reveal');
      card.style.setProperty('--reveal-delay',`${index%3*SETTINGS.cardStagger}ms`);
      observer.observe(card);
    });
  }
  function applyPreference() {
    const enabled = allowsMotion();
    document.body.classList.toggle('motion-enabled',enabled);
    document.body.classList.toggle('motion-paused',!enabled);
    // This class also stops smooth anchor scrolling on the root element.
    document.documentElement.style.scrollBehavior = enabled ? '' : 'auto';
    toggle.setAttribute('aria-pressed',String(!enabled));
    toggle.disabled = preference.matches;
    toggle.setAttribute('aria-label',preference.matches ? 'Animations paused by your system setting' : enabled ? 'Pause decorative animations' : 'Resume decorative animations');
    toggle.textContent = preference.matches ? 'Motion reduced ✓' : enabled ? 'Pause motion Ⅱ' : 'Resume motion ▷';
    if (!enabled) {
      runningAnimations.forEach(animation => animation.cancel());
      runningAnimations.clear();
      document.querySelectorAll('.reveal,.card-reveal').forEach(node => node.classList.add('visible'));
      document.querySelector('.hero-photo')?.style.setProperty('--hero-y','0px');
    }
  }
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },{threshold:SETTINGS.revealThreshold});
  }
  document.querySelectorAll('.reveal').forEach(node => {
    if (observer && allowsMotion()) observer.observe(node); else node.classList.add('visible');
  });
  applyPreference();
  observeCards();
  document.addEventListener('photobook:render',event => observeCards(event.target));
  toggle.addEventListener('click',() => {
    paused = !paused;
    try {localStorage.setItem('sai-photo-book:pause-motion',String(paused));} catch {}
    applyPreference();
  });
  preference.addEventListener('change',applyPreference);
  window.PhotoBookMotion = {
    transitionPhoto(image) {
      activeImageAnimations.get(image)?.cancel();
      if (!allowsMotion() || typeof image.animate !== 'function') return;
      const animation = image.animate([{opacity:0.25,transform:'scale(.985)'},{opacity:1,transform:'scale(1)'}],{duration:SETTINGS.photoFade,easing:'ease-out'});
      runningAnimations.add(animation);
      activeImageAnimations.set(image,animation);
      animation.onfinish = animation.oncancel = () => runningAnimations.delete(animation);
    }
  };
  let queued = false;
  function updateParallax() {
    queued = false;
    const hero = document.querySelector('.hero-photo');
    if (!hero || hero.closest('[hidden]') || document.hidden || !allowsMotion() || !finePointer.matches || innerWidth < 701) return;
    const rect = hero.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > innerHeight) return;
    const progress = (innerHeight/2-rect.top-rect.height/2)/innerHeight;
    const offset = Math.max(-1,Math.min(1,progress))*SETTINGS.parallaxDistance;
    hero.style.setProperty('--hero-y',`${offset.toFixed(2)}px`);
  }
  const scheduleParallax = () => {if (!queued) {queued=true;requestAnimationFrame(updateParallax);}};
  addEventListener('scroll',scheduleParallax,{passive:true});
  addEventListener('resize',scheduleParallax);
  document.addEventListener('visibilitychange',() => {
    runningAnimations.forEach(animation => document.hidden ? animation.pause() : animation.play());
    if (!document.hidden) scheduleParallax();
  });
  scheduleParallax();
})();
