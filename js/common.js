/* ---------- SHARED DATA ---------- */
export const SECTION_LABELS = {
  en: { "index.html":"Home", "about.html":"About", "activities.html":"Activities", "quality.html":"Quality System", "references.html":"References", "contact.html":"Contact" },
  hr: { "index.html":"Naslovna", "about.html":"O nama", "activities.html":"Djelatnosti", "quality.html":"Sustav kvalitete", "references.html":"Reference", "contact.html":"Kontakt" }
};

export const PRELOAD_MSGS = {
  en: ["CALIBRATING SENSORS...","LOADING WELD DATA...","VERIFYING CERTIFICATES...","READY"],
  hr: ["KALIBRACIJA SENZORA...","UČITAVANJE PODATAKA O ZAVARIMA...","PROVJERA CERTIFIKATA...","SPREMNO"]
};

export const SPOT_SELECTOR = ".svc-card,.cap-item,.badge,.stat,.tl-item,.mission-item,.duty-item";

/* ---------- CROATIAN GLYPH FIX ---------- */
/* Big Shoulders Display renders Š š Ž ž Č č Ć ć Đ đ with the caron/accent
   detached from the letter, at every weight — a font bug, not a CSS issue
   (verified: unicode-range @font-face overrides don't take effect against
   Google's own subsetted faces). Wraps just those characters inside
   h1/h2/h3 in a span the .cro-fix CSS rule renders with a normal sans-serif
   instead, leaving every other character on the display font untouched. */
export class CroatianGlyphFix {
  static run(){
    var re = /[ŠšŽžČčĆćĐđ]/;
    document.querySelectorAll("h1,h2,h3").forEach(function(el){
      var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      var nodes = [];
      var node;
      while((node = walker.nextNode())){ if(re.test(node.nodeValue)){ nodes.push(node); } }
      nodes.forEach(function(textNode){
        var text = textNode.nodeValue;
        var frag = document.createDocumentFragment();
        var lastIndex = 0;
        var m;
        var global = /[ŠšŽžČčĆćĐđ]/g;
        while((m = global.exec(text))){
          if(m.index > lastIndex){ frag.appendChild(document.createTextNode(text.slice(lastIndex, m.index))); }
          var span = document.createElement("span");
          span.className = "cro-fix";
          span.textContent = m[0];
          frag.appendChild(span);
          lastIndex = m.index + m[0].length;
        }
        frag.appendChild(document.createTextNode(text.slice(lastIndex)));
        textNode.parentNode.replaceChild(frag, textNode);
      });
    });
  }
}

/* ---------- LANGUAGE ---------- */
export class LangManager {
  constructor(){
    this.changeCallbacks = [];
  }
  current(){
    return document.body.classList.contains('lang-hr') ? 'hr' : 'en';
  }
  onChange(cb){
    this.changeCallbacks.push(cb);
  }
  applyPlaceholders(lang){
    document.querySelectorAll('[data-ph-en]').forEach(function(el){
      el.setAttribute('placeholder', lang === 'hr' ? el.getAttribute('data-ph-hr') : el.getAttribute('data-ph-en'));
    });
  }
  updateButtons(lang){
    document.querySelectorAll('.lang-btn').forEach(function(b){
      b.classList.toggle('active', b.getAttribute('data-lang') === lang);
    });
  }
  set(lang){
    document.body.className = 'lang-' + lang;
    document.documentElement.setAttribute('lang', lang);
    localStorage.setItem('tpkLang', lang);
    this.updateButtons(lang);
    this.applyPlaceholders(lang);
    this.changeCallbacks.forEach(function(cb){ cb(lang); });
  }
  init(){
    var self = this;
    document.querySelectorAll('.lang-btn').forEach(function(btn){
      btn.addEventListener('click', function(){
        var lang = btn.getAttribute('data-lang');
        if(lang === self.current()) return;
        localStorage.setItem('tpkLang', lang);
        window.location.reload();
      });
    });
    document.querySelectorAll('.lang-toggle-btn').forEach(function(btn){
      var toggle = btn.closest('.lang-toggle');
      if(!toggle) return;
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        var isOpen = toggle.classList.toggle('open');
        btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
    });
    document.addEventListener('click', function(e){
      document.querySelectorAll('.lang-toggle.open').forEach(function(toggle){
        if(!toggle.contains(e.target)){
          toggle.classList.remove('open');
          var btn = toggle.querySelector('.lang-toggle-btn');
          if(btn){ btn.setAttribute('aria-expanded','false'); }
        }
      });
    });
    this.updateButtons(this.current());
    this.applyPlaceholders(this.current());
  }
}

/* ---------- SCROLL PROGRESS BAR ---------- */
export class ScrollProgressBar {
  init(){
    ScrollTrigger.create({
      start: 0, end: "max",
      onUpdate: function(self){
        var bar = document.getElementById('scroll-progress');
        if(bar) bar.style.width = (self.progress*100)+"%";
      }
    });
  }
}

/* ---------- BLUEPRINT GRID PARALLAX ---------- */
export class GridParallax {
  init(){
    gsap.to(".grid-bg", {
      backgroundPositionY: "-120px", ease:"none",
      scrollTrigger:{ start:0, end:"max", scrub:true }
    });
  }
}

/* ---------- STICKY IMAGE/TEXT SCROLLER (.scroller-outer) ---------- */
/* Matches sstr.tech/en/about/'s own "Patented in-house technologies"
   scroller: .scroller-outer is a plain tall element (n*100vh) so CSS
   position:sticky on .scroller-stage holds it in view for that whole
   range — no GSAP pin needed. Each image holder wipes into view via a
   clip-path reveal (growing from the bottom up, stacking over the previous
   one), while the whole text column translates up by one slide-height in
   lockstep, continuously, with no dead pauses. Skipped under 900px, where
   CSS hides the image column and just stacks the captions. */
export class ImageStoryPin {
  init(){
    var root = document.querySelector("[data-scroller]");
    if(!root) return;
    if(!(window.matchMedia && window.matchMedia("(min-width:900px)").matches)) return;

    var media = root.querySelectorAll("[data-scroller-media]");
    var track = root.querySelector("[data-scroller-track]");
    var outer = root.closest(".scroller-outer");
    var n = media.length;
    if(n < 2 || !track || !outer) return;

    var SHOWN = "inset(0% 0% 0% 0%)";
    var HIDDEN = "inset(100% 0% 0% 0%)";
    media.forEach(function(m, i){ gsap.set(m, { clipPath: i===0 ? SHOWN : HIDDEN, zIndex:i }); });
    gsap.set(track, { yPercent:0 });

    var tl = gsap.timeline({
      scrollTrigger:{ trigger: outer, start:"top top", end:"bottom bottom", scrub:true }
    });
    for(var i=1;i<n;i++){
      tl.to(media[i], { clipPath: SHOWN, ease:"none", duration:1 }, i-1);
      tl.to(track, { yPercent: (-100/n)*i, ease:"none", duration:1 }, i-1);
    }
  }
}

/* ---------- SPOTLIGHT HOVER ON CARD-LIKE ELEMENTS ---------- */
export class SpotlightCards {
  constructor(selector){ this.selector = selector || SPOT_SELECTOR; }
  init(){
    document.querySelectorAll(this.selector).forEach(function(el){
      el.addEventListener("mousemove", function(e){
        var r = el.getBoundingClientRect();
        el.style.setProperty("--mx", ((e.clientX-r.left)/r.width*100)+"%");
        el.style.setProperty("--my", ((e.clientY-r.top)/r.height*100)+"%");
      });
    });
  }
}

/* ---------- CUSTOM CURSOR (fine-pointer only) ---------- */
export class CustomCursor {
  constructor(spotSelector){ this.spotSelector = spotSelector || SPOT_SELECTOR; }
  init(){
    if(!(window.matchMedia && window.matchMedia("(pointer:fine)").matches)) return;
    document.body.classList.add("has-cursor");
    var cDot = document.getElementById("cursor-dot");
    var cRing = document.getElementById("cursor-ring");
    if(!(cDot && cRing)) return;

    gsap.set([cDot,cRing],{ xPercent:0, yPercent:0 });
    var dotX = gsap.quickTo(cDot,"x",{duration:.01});
    var dotY = gsap.quickTo(cDot,"y",{duration:.01});
    var ringX = gsap.quickTo(cRing,"x",{duration:.4,ease:"power3"});
    var ringY = gsap.quickTo(cRing,"y",{duration:.4,ease:"power3"});

    var gearSvg = cDot.querySelector("svg");
    var gearTween = null, gearIdleTimer = null, gearSpeed = 1;
    if(gearSvg){
      gearTween = gsap.to(gearSvg, { rotation:360, transformOrigin:"50% 50%", duration:4, repeat:-1, ease:"none" });
      gearTween.timeScale(0);
    }
    function gearSpinUp(){
      if(!gearTween) return;
      clearTimeout(gearIdleTimer);
      gsap.killTweensOf(gearTween);
      gsap.to(gearTween, { timeScale:gearSpeed, duration:.5, ease:"power2.out" });
      gearIdleTimer = setTimeout(function(){
        gsap.killTweensOf(gearTween);
        gsap.to(gearTween, { timeScale:0, duration:1.4, ease:"power2.out" });
      }, 200);
    }

    /* the cursor starts hidden (see CSS) since we have no way to know the mouse position
       until a real "mousemove" fires; snap to it instantly on the first one instead of
       letting it glide in from the top-left corner. */
    var positioned = false;
    window.addEventListener("mousemove", function(e){
      if(!positioned){
        positioned = true;
        gsap.set([cDot,cRing], { x:e.clientX, y:e.clientY });
        document.body.classList.add("cursor-positioned");
      }
      dotX(e.clientX); dotY(e.clientY);
      ringX(e.clientX); ringY(e.clientY);
      gearSpinUp();
    });
    /* nav links get their own background-pill hover state, so skip the cursor-ring enlarge there */
    Array.prototype.slice.call(document.querySelectorAll("a,button,"+this.spotSelector))
      .filter(function(el){ return !el.closest("nav.mainnav") && !el.closest("#mobile-menu"); })
      .forEach(function(el){
        el.addEventListener("mouseenter", function(){ cRing.classList.add("hover"); gearSpeed=3; gearSpinUp(); });
        el.addEventListener("mouseleave", function(){ cRing.classList.remove("hover"); gearSpeed=1; gearSpinUp(); });
      });
  }
}

/* ---------- MAGNETIC BUTTONS (fine-pointer only) ---------- */
export class MagneticButtons {
  init(){
    if(!(window.matchMedia && window.matchMedia("(pointer:fine)").matches)) return;
    document.querySelectorAll(".btn").forEach(function(btn){
      var bx = gsap.quickTo(btn,"x",{duration:.4,ease:"power3"});
      var by = gsap.quickTo(btn,"y",{duration:.4,ease:"power3"});
      btn.addEventListener("mousemove", function(e){
        var r = btn.getBoundingClientRect();
        bx((e.clientX - r.left - r.width/2) * 0.25);
        by((e.clientY - r.top - r.height/2) * 0.35);
      });
      btn.addEventListener("mouseleave", function(){ bx(0); by(0); });
    });
  }
}

/* ---------- SCROLL-TRIGGERED REVEALS ---------- */
export class RevealAnimations {
  init(){
    document.querySelectorAll(".section-head h2").forEach(function(el){
      el.classList.add("fill-reveal");
      gsap.fromTo(el, {"--fill":"0%"}, {
        "--fill":"100%", duration:1.1, ease:"power2.out",
        scrollTrigger:{
          trigger:el, start:"top 85%", end:"bottom top",
          toggleActions:"restart reverse restart reverse"
        }
      });
    });

    document.querySelectorAll(".reveal").forEach(function(el){
      gsap.to(el,{
        opacity:1, y:0, duration:.9, ease:"power3.out",
        scrollTrigger:{
          trigger:el, start:"top 88%", end:"bottom top",
          toggleActions:"restart reverse restart reverse"
        }
      });
    });

    ["services-grid","cap-grid","badge-grid","timeline","mission-grid","duty-list"].forEach(function(cls){
      var container = document.querySelector("."+cls);
      if(!container) return;
      gsap.to(container.children,{
        opacity:1,y:0,duration:.7,stagger:.08,ease:"power3.out",
        scrollTrigger:{
          trigger:container, start:"top 85%", end:"bottom top",
          toggleActions:"restart reverse restart reverse"
        }
      });
    });

    document.querySelectorAll("[data-count]").forEach(function(el){
      var target = parseInt(el.getAttribute("data-count"),10);
      var obj = {val:0};
      function goTo(v){
        gsap.to(obj,{ val:v, duration:1.3, ease:"power2.out",
          onUpdate:function(){ el.textContent = Math.round(obj.val); } });
      }
      ScrollTrigger.create({
        trigger: el, start:"top 90%", end:"bottom top",
        onEnter: function(){ goTo(target); },
        onEnterBack: function(){ goTo(target); },
        onLeave: function(){ goTo(0); },
        onLeaveBack: function(){ goTo(0); }
      });
    });

    var stampText = document.getElementById('stamptext');
    if(stampText){ gsap.to(stampText, { rotation:360, transformOrigin:"100px 100px", duration:26, repeat:-1, ease:"none" }); }

    document.querySelectorAll('[data-bg-toggle]').forEach(function(el){
      ScrollTrigger.create({
        trigger: el, start:"top 65%", end:"bottom 35%",
        toggleClass:{ targets: el, className:"section-light" }
      });
      var headerEl = document.querySelector("header");
      if(headerEl){
        ScrollTrigger.create({
          trigger: el, start:"top 88", end:"bottom 88",
          toggleClass:{ targets: headerEl, className:"theme-light" }
        });
      }
    });

    /* header-only sync: the section itself is permanently .section-light in
       the markup (not toggled), but the header still needs to switch to its
       light theme while scrolling past it. */
    document.querySelectorAll('[data-header-toggle]').forEach(function(el){
      var headerEl = document.querySelector("header");
      if(headerEl){
        ScrollTrigger.create({
          trigger: el, start:"top 88", end:"bottom 88",
          toggleClass:{ targets: headerEl, className:"theme-light" }
        });
      }
    });

    [{ sel:".eyebrow", speed:.08 },{ sel:".stat .num", speed:.18 }].forEach(function(t){
      document.querySelectorAll(t.sel).forEach(function(el){
        gsap.to(el,{
          y: -260*t.speed, ease:"none",
          scrollTrigger:{ trigger:el, start:"top bottom", end:"bottom top", scrub:true }
        });
      });
    });
  }
}

/* ---------- SIMPLE PAGE-HERO REVEAL (inner pages) ---------- */
export class PageHeroReveal {
  play(){
    if(!document.querySelector(".page-hero")) return;
    gsap.fromTo(".page-hero .eyebrow,.page-hero h1,.page-hero p",
      {opacity:0,y:26},
      {opacity:1,y:0,duration:.55,stagger:.07,ease:"power3.out",delay:.1});
  }
}

/* ---------- PRELOADER ---------- */
export class Preloader {
  constructor(langManager){
    this.lang = langManager;
    this.el = document.getElementById('preloader');
  }
  hideInstantly(){
    if(this.el){ this.el.style.display = 'none'; }
  }
  playOnce(onDone){
    if(!this.el){ onDone(); return; }
    var el = this.el;
    var pctEl = document.getElementById('pctnum');
    var barFill = document.getElementById('barfill');
    var loadMsg = document.getElementById('ploadmsg');
    var messages = PRELOAD_MSGS[this.lang.current()];
    var msgIndex = 0;
    var counter = {val:0};
    gsap.to(counter,{
      val:100, duration:2.1, ease:"power2.inOut",
      onUpdate:function(){
        pctEl.textContent = Math.round(counter.val);
        barFill.style.width = counter.val+"%";
        var step = Math.floor(counter.val/26);
        if(step !== msgIndex && step < messages.length){ msgIndex = step; loadMsg.textContent = messages[step]; }
      },
      onComplete:function(){
        loadMsg.textContent = messages[messages.length-1];
        el.style.pointerEvents = 'none';
        gsap.to(el,{ delay:.35, duration:.8, autoAlpha:0, ease:"power2.inOut",
          onComplete:function(){ el.style.display='none'; onDone(); } });
      }
    });
  }
}

/* ---------- FULL-SCREEN MOBILE MENU ---------- */
export class MobileMenu {
  constructor(){
    this.burgerEl = document.querySelector(".burger");
    this.menuEl = document.getElementById("mobile-menu");
    this.closeEl = document.querySelector(".mm-close");
    this.isOpen = false;
  }
  init(){
    if(!(this.burgerEl && this.menuEl)) return;
    var self = this;
    gsap.set(this.menuEl, { y:"-100%" });
    this.burgerEl.addEventListener("click", function(){
      self.isOpen ? self.close() : self.open_();
    });
    if(this.closeEl){
      this.closeEl.addEventListener("click", function(){ self.close(); });
    }
  }
  open_(){
    this.isOpen = true;
    this.burgerEl.classList.add("active");
    var headerEl = document.querySelector("header");
    var headerIsLight = headerEl && headerEl.classList.contains("theme-light");
    this.menuEl.classList.toggle("theme-light", !!headerIsLight);
    document.body.style.overflow = "hidden";
    gsap.to(this.menuEl, { y:"0%", duration:.6, ease:"power3.inOut" });
  }
  close(){
    this.isOpen = false;
    this.burgerEl.classList.remove("active");
    document.body.style.overflow = "";
    gsap.to(this.menuEl, { y:"-100%", duration:.5, ease:"power3.inOut" });
  }
}

/* ---------- CROSS-PAGE TRANSITION OVERLAY ---------- */
export class PageTransition {
  constructor(langManager){
    this.lang = langManager;
    this.overlay = document.getElementById('page-transition');
    this.title = document.getElementById('pt-title');
    this.eyebrow = document.querySelector('#page-transition .pt-eyebrow');
    this.lineSpan = document.querySelector('#page-transition .pt-line span');
    this.currentFile = location.pathname.split('/').pop() || 'index.html';
    this.animating = false;
    this.mobileMenu = null;
  }
  setMobileMenu(mobileMenu){ this.mobileMenu = mobileMenu; }

  static isInternalPageLink(link){
    var href = link.getAttribute('href');
    if(!href) return false;
    if(href.indexOf('#')===0) return false;
    if(href.indexOf('mailto:')===0 || href.indexOf('tel:')===0) return false;
    if(link.target === '_blank') return false;
    var clean = href.split('#')[0].split('?')[0];
    return Object.prototype.hasOwnProperty.call(SECTION_LABELS.en, clean);
  }

  static cameFromNav(){
    var came = sessionStorage.getItem('tpkNav') === '1';
    sessionStorage.removeItem('tpkNav');
    return came;
  }

  setHiddenInstantly(){
    gsap.set(this.overlay, { y:"100%" });
  }

  playIntroClose(){
    /* the outgoing page already filled the bar and held on this exact same-looking
       panel (text + full bar) right before navigating here, so arrival must NOT
       reset and replay that fill — it just continues holding briefly, then the
       whole panel (still fully visible) slides away as one continuous motion. */
    var overlay = this.overlay;
    /* the early <head> script already added html.nav-light synchronously
       (same no-flash pattern as nav-arrival) — this just keeps it in sync
       in case that script's sessionStorage read ever gets out of step. */
    document.documentElement.classList.toggle('nav-light', sessionStorage.getItem('tpkNavLight') === '1');
    gsap.set(overlay,{ y:"0%" });
    gsap.set(this.lineSpan,{scaleX:1});

    var startClose = function(){
      gsap.to(overlay,{ y:"-100%", duration:.75, delay:.15, ease:"power3.inOut",
        onComplete: function(){ gsap.set(overlay, { y:"100%" }); }
      });
    };

    /* on a cold cache (first load of the session, this specific page/font not
       yet fetched before) the display-font swaps in right as the panel would
       otherwise start sliding away, reading as a flicker. Since the overlay
       is still fully opaque at this point, holding until fonts are ready
       (capped so a slow/unsupported case never hangs the transition) lets
       any swap happen invisibly behind it instead. */
    if(document.fonts && document.fonts.ready){
      var done = false;
      var proceed = function(){ if(done) return; done = true; startClose(); };
      document.fonts.ready.then(proceed);
      setTimeout(proceed, 400);
    } else {
      startClose();
    }
  }

  bindLinks(){
    var self = this;
    document.querySelectorAll('a[href]').forEach(function(link){
      if(!PageTransition.isInternalPageLink(link)) return;
      link.addEventListener('click', function(e){
        var href = link.getAttribute('href');
        if(self.animating){ e.preventDefault(); return; }
        e.preventDefault();
        self.animating = true;

        var clean = href.split('#')[0].split('?')[0];
        var label = SECTION_LABELS[self.lang.current()][clean] || clean;
        self.title.textContent = label;

        /* match the overlay's theme to whatever's currently on screen (a
           .section-light stretch vs the default dark) so covering the page
           doesn't itself cause a jarring dark/light flash, then carry that
           choice across the navigation so arrival starts the same way. */
        var headerEl = document.querySelector('header');
        var isLight = !!(headerEl && headerEl.classList.contains('theme-light'));
        document.documentElement.classList.toggle('nav-light', isLight);
        sessionStorage.setItem('tpkNavLight', isLight ? '1' : '0');

        gsap.set([self.eyebrow,self.title],{opacity:0});
        gsap.set(self.title,{y:24});
        gsap.set(self.lineSpan,{scaleX:0});

        var tl = gsap.timeline();
        tl.to(self.overlay,{ y:"0%", duration:.75, ease:"power3.inOut" });
        tl.to(self.eyebrow,{ opacity:1, duration:.35, ease:"power2.out" }, "-=.25");
        tl.to(self.title,{ opacity:1, y:0, duration:.5, ease:"power3.out" }, "-=.2");
        tl.to(self.lineSpan,{ scaleX:1, duration:.5, ease:"power2.inOut" }, "-=.25");
        tl.add(function(){
          sessionStorage.setItem('tpkNav','1');
          window.location.href = href;
        }, "+=.35");

        if(self.mobileMenu && self.mobileMenu.isOpen){ self.mobileMenu.close(); }
      });
    });
  }

  bindBfcacheReset(){
    var self = this;
    window.addEventListener('pageshow', function(e){
      if(e.persisted){
        gsap.killTweensOf(self.overlay);
        gsap.set(self.overlay,{ y:"100%" });
        gsap.set([self.eyebrow,self.title],{ opacity:0 });
        gsap.set(self.lineSpan,{ scaleX:0 });
        self.animating = false;
      }
    });
  }
}

/* ---------- SITE APP: wires up every shared piece in the right order ---------- */
export class SiteApp {
  constructor(options){
    options = options || {};
    this.lang = new LangManager();
    this.pageTransition = new PageTransition(this.lang);
    this.preloader = new Preloader(this.lang);
    this.mobileMenu = new MobileMenu();
    this.reveals = new RevealAnimations();
    this.pageHeroReveal = new PageHeroReveal();
    this.cursor = new CustomCursor();
    this.magneticButtons = new MagneticButtons();
    this.scrollProgress = new ScrollProgressBar();
    this.gridParallax = new GridParallax();
    this.spotlightCards = new SpotlightCards();
    this.heroIntro = options.heroIntro || null;
    this.onLangChange = null;
  }

  init(){
    gsap.registerPlugin(ScrollTrigger);

    var self = this;
    var cameFromNav = PageTransition.cameFromNav();

    if(cameFromNav){
      this.preloader.hideInstantly();
      this.pageTransition.playIntroClose();
      this.reveals.init();
      if(this.heroIntro){ this.heroIntro.play(); }
      this.pageHeroReveal.play();
    }else{
      this.pageTransition.setHiddenInstantly();
      this.preloader.playOnce(function(){
        if(self.heroIntro){ self.heroIntro.play(); }
        self.pageHeroReveal.play();
      });
      this.reveals.init();
    }

    this.mobileMenu.init();
    this.pageTransition.setMobileMenu(this.mobileMenu);
    this.pageTransition.bindLinks();
    this.pageTransition.bindBfcacheReset();

    this.scrollProgress.init();
    this.gridParallax.init();
    this.spotlightCards.init();
    this.cursor.init();
    this.magneticButtons.init();

    CroatianGlyphFix.run();
    if(this.heroIntro && this.heroIntro.initScramble){ this.heroIntro.initScramble(); }

    this.lang.onChange(function(lang){ if(self.onLangChange){ self.onLangChange(lang); } });
    this.lang.init();
  }
}
