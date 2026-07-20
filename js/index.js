import { SiteApp } from './common.js';

/* Homepage-only hero: animated waveform, scramble-in headline, and background video. */
class HeroIntro {
  constructor(){
    this.wavePath = document.getElementById('wavepath');
    this.heroVideo = document.querySelector(".hero-video");

    if(this.heroVideo && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches){
      this.heroVideo.removeAttribute("autoplay");
      this.heroVideo.pause();
    } else if(this.heroVideo){
      /* many mobile browsers (data saver / low power mode) only honor a
         script-triggered play() and silently ignore the declarative
         autoplay attribute — calling it explicitly is the reliable path. */
      var playPromise = this.heroVideo.play();
      if(playPromise && playPromise.catch){ playPromise.catch(function(){}); }
    }

    if(this.wavePath){
      this.wavePath.setAttribute('d', HeroIntro.buildWave());
      var len = this.wavePath.getTotalLength ? this.wavePath.getTotalLength() : 2000;
      this.wavePath.style.strokeDasharray = len;
      this.wavePath.style.strokeDashoffset = len;
    }
  }

  static buildWave(){
    var d = "M0,45 ";
    var points = 60;
    for(var i=0;i<=points;i++){
      var x = (1000/points)*i;
      var y = 45;
      if(i>8 && i<12) y = 45 - 30*Math.sin((i-8)/4*Math.PI);
      else if(i>26 && i<30) y = 45 + 24*Math.sin((i-26)/4*Math.PI);
      else if(i>42 && i<47) y = 45 - 36*Math.sin((i-42)/5*Math.PI);
      else y += (Math.random()-0.5)*3;
      d += "L"+x.toFixed(1)+","+y.toFixed(1)+" ";
    }
    return d;
  }

  play(){
    if(!document.querySelector(".hero")) return;
    gsap.fromTo(".hero .eyebrow",{opacity:0,y:16},{opacity:1,y:0,duration:.5,delay:.03,ease:"power2.out"});
    gsap.to(".hero h1 .line .reveal-txt",{ y:"0%", duration:.7, ease:"power4.out", stagger:.07 });
    gsap.fromTo(".hero-sub,.hero-cta",{opacity:0,y:20},{opacity:1,y:0,duration:.65,delay:.25,stagger:.08,ease:"power2.out"});
    if(this.wavePath){ gsap.to(this.wavePath,{ strokeDashoffset:0, duration:1.3, delay:.35, ease:"power2.inOut" }); }
    gsap.fromTo(".waveform-wrap",{opacity:0},{opacity:1,duration:.7,delay:.25});
    gsap.to(this.wavePath,{ filter:"drop-shadow(0 0 10px rgba(255,106,43,.9))", duration:1.6, ease:"sine.inOut", repeat:-1, yoyo:true, delay:3 });
  }

  static scrambleReveal(el){
    var original = el.textContent;
    var originalHTML = el.innerHTML; // preserves any CroatianGlyphFix wrapping already applied
    var len = original.length;
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&";
    var duration = 750;
    var start = null;
    function frame(now){
      if(start === null) start = now;
      var elapsed = now - start;
      var revealCount = Math.floor((elapsed/duration)*len);
      if(revealCount >= len){ el.innerHTML = originalHTML; return; }
      var out = "";
      for(var i=0;i<len;i++){
        if(i < revealCount || original[i] === " ") out += original[i];
        else out += chars[Math.floor(Math.random()*chars.length)];
      }
      el.textContent = out;
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* Only replay the character-scramble the first time the homepage loads in this tab session. */
  initScramble(){
    if(sessionStorage.getItem('tpkHeroScrambled') === '1') return;
    var spans = document.querySelectorAll(".hero h1 .reveal-txt span");
    spans.forEach(function(el, i){
      setTimeout(function(){ HeroIntro.scrambleReveal(el); }, i*150 + 150);
    });
    if(spans.length){ sessionStorage.setItem('tpkHeroScrambled','1'); }
  }
}

new SiteApp({ heroIntro: new HeroIntro() }).init();
