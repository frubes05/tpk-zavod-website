import { SiteApp } from './common.js';

const REF_CASES = {
  en: [
    {tag:"MONITORING", loc:"ZAGREB HQ / LAB", stat:"3,500+", desc:"Condition assessment and monitoring of equipment in service — including damage-cause expertise, repair-procedure definition and reconstruction management.", pin:"zagreb"},
    {tag:"NDT", loc:"ZAGREB HQ / LAB", stat:"~120,000", desc:"Non-destructive test reports (RT, UT, PA, MT, PT, VT, vacuum) issued from lab and field work, by inspectors certified to HRN EN ISO 9712 and SNT-TC-1A/CP-189.", pin:"zagreb"},
    {tag:"CERTIFICATION", loc:"ZAGREB HQ / LAB", stat:"3,161 + 757", desc:"Welder and welding-procedure certificates issued since 2008 under EN and ASME standards, plus 322 pressure-equipment certificates since 2010.", pin:"zagreb"},
    {tag:"FEATURED PROJECT", loc:"TE SISAK · HEP", stat:"230 / 50", desc:"Certification nearing completion for the pressure part of a new boiler unit (230 MWe / 50 MWt) at the Sisak thermal power plant.", pin:"sisak"}
  ],
  hr: [
    {tag:"PRAĆENJE", loc:"SJEDIŠTE ZAGREB / LAB.", stat:"3.500+", desc:"Procjena stanja i praćenje opreme u eksploataciji — uključujući ekspertize uzroka oštećenja, definiranje postupaka sanacije i vođenje rekonstrukcija.", pin:"zagreb"},
    {tag:"NDT ISPITIVANJA", loc:"SJEDIŠTE ZAGREB / LAB.", stat:"~120.000", desc:"Izvještaji o ispitivanju bez razaranja (RT, UT, PA, MT, PT, VT, vakuumsko ispitivanje) iz laboratorija i s terena, koje izdaju ispitivači certificirani prema HRN EN ISO 9712 i SNT-TC-1A/CP-189.", pin:"zagreb"},
    {tag:"CERTIFICIRANJE", loc:"SJEDIŠTE ZAGREB / LAB.", stat:"3.161 + 757", desc:"Certifikati zavarivača i postupaka zavarivanja izdani od 2008. prema EN i ASME normama, uz 322 certifikata tlačne opreme izdana od 2010.", pin:"zagreb"},
    {tag:"ISTAKNUTI PROJEKT", loc:"TE SISAK · HEP", stat:"230 / 50", desc:"Certifikacija tlačnog dijela novog kotla (230 MWe / 50 MWt) u Termoelektrani Sisak pri je kraju.", pin:"sisak"}
  ]
};

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZnJ1YmVzMDUiLCJhIjoiY2t0c3BkY2o0MDExODJxcXRwZXQ4djEweSJ9.lyHaaEkHAW9t4dYnk_cO6g';

const PIN_LOCATIONS = {
  zagreb: { lng: 16.0297, lat: 45.7957, label: 'ZAGREB' }, // Slavonska avenija 20, 10000 Zagreb
  sisak:  { lng: 16.3719, lat: 45.4658, label: 'TE SISAK' }
};

const PIN_ZOOM = 6.5;
const SPIN_VIEW = { center: [10, 20], zoom: 1.3 };
const SPIN_SECONDS_PER_REV = 240; // slower than sstr.tech's 120 per user request
const SPIN_MAX_ZOOM = 3; // spin only below this zoom; holds still once zoomed into a pin

/* Real Mapbox globe (dark style) with a marker per office/project location.
   Rotates continuously forever at a fixed, slow speed — same behavior as
   sstr.tech's reference globe — and never auto-zooms anywhere. Clicking a
   pin/case is the only thing that stops the spin and zooms in. */
class RefMap {
  constructor(){
    this.container = document.getElementById('ref-map');
    this.markers = {};
    this.map = null;
    this.onPinClick = null;
    this.userInteracting = false; // true only while actively dragging/zooming; spin always resumes after
  }

  init(){
    if(!this.container || typeof mapboxgl === 'undefined') return;
    mapboxgl.accessToken = MAPBOX_TOKEN;

    this.map = new mapboxgl.Map({
      container: this.container,
      style: 'mapbox://styles/mapbox/dark-v11',
      projection: 'globe',
      center: SPIN_VIEW.center,
      zoom: SPIN_VIEW.zoom,
      attributionControl: true
    });
    var map = this.map;
    var self = this;

    map.addControl(new mapboxgl.NavigationControl({ showCompass:false }), 'top-left');
    map.on('style.load', function(){
      map.setFog({
        'range': [0.5, 10],
        'color': 'rgb(120, 120, 120)',
        'high-color': 'rgb(40, 40, 40)',
        'space-color': 'rgb(10, 12, 14)',
        'horizon-blend': 0.025,
        'star-intensity': 0
      });
    });

    /* Pause (not stop) while the user is actively interacting, and resume
       right after — nothing ever stops the spin for good. Pausing on
       mousedown/touchstart (rather than waiting for Mapbox to recognize a
       full drag gesture) matters: otherwise a drag attempt starting while
       our own easeTo() is mid-flight has to fight that animation first,
       which is what made dragging feel sticky. */
    map.on('mousedown', function(){ self.userInteracting = true; });
    map.on('mouseup', function(){ self.userInteracting = false; self.spinGlobe(); });
    map.on('touchstart', function(){ self.userInteracting = true; });
    map.on('touchend', function(){ self.userInteracting = false; self.spinGlobe(); });
    map.on('zoomstart', function(e){ if(e.originalEvent){ self.userInteracting = true; } });
    map.on('zoomend', function(e){ if(e.originalEvent){ self.userInteracting = false; self.spinGlobe(); } });
    map.on('moveend', function(){ self.spinGlobe(); });

    /* kick off the rotation once the map has actually finished loading —
       starting it at init() time (before tiles/style are ready) meant
       nothing visible would happen for a while, especially on a cold
       cache / slower connection. */
    map.on('load', function(){ self.spinGlobe(); });

    Object.keys(PIN_LOCATIONS).forEach(function(key){
      var loc = PIN_LOCATIONS[key];
      var el = document.createElement('div');
      el.className = 'mb-pin';
      var popup = new mapboxgl.Popup({ offset:14, closeButton:false, className:'mb-popup' }).setText(loc.label);
      var marker = new mapboxgl.Marker({ element: el }).setLngLat([loc.lng, loc.lat]).setPopup(popup).addTo(map);
      el.addEventListener('click', function(){
        if(self.onPinClick) self.onPinClick(key);
      });
      self.markers[key] = { marker: marker, el: el };
    });
  }

  /* Spins only at the zoomed-out overview level. Past SPIN_MAX_ZOOM (e.g.
     after a pin click zooms in on a location) it just holds still; zooming
     back out — whether via the "-" control or scrolling out — passes back
     through zoomend, which calls this again and picks the spin back up. */
  spinGlobe(){
    if(this.userInteracting || !this.map) return;
    var zoom = this.map.getZoom();
    if(zoom > SPIN_MAX_ZOOM) return;
    var distancePerSecond = (360 / SPIN_SECONDS_PER_REV) / (1 + zoom);
    var center = this.map.getCenter();
    center.lng -= distancePerSecond;
    this.map.easeTo({ center:center, duration:1000, easing:function(n){ return n; } });
  }

  /* Just marks which pin is highlighted — safe to call any time, including
     during the automatic first render, since it never touches the camera
     or the spin. */
  highlightPin(pinKey){
    var markers = this.markers;
    Object.keys(markers).forEach(function(key){
      markers[key].el.classList.toggle('active', key === pinKey);
    });
  }

  /* Moves the camera to a location (next/prev, pin click) — the spin isn't
     stopped, just re-centers once this easeTo's 'moveend' fires. */
  setActive(pinKey){
    if(!this.map) return;
    this.highlightPin(pinKey);
    var loc = PIN_LOCATIONS[pinKey];
    if(loc){ this.map.easeTo({ center:[loc.lng, loc.lat], zoom:PIN_ZOOM, duration:800 }); }
  }
}

class ReferencesCarousel {
  constructor(langManager, refMap){
    this.lang = langManager;
    this.refMap = refMap;
    this.rpTag = document.getElementById('rp-tag');
    this.rpLoc = document.getElementById('rp-loc');
    this.rpStat = document.getElementById('rp-stat');
    this.rpDesc = document.getElementById('rp-desc');
    this.rpCount = document.getElementById('rp-count');
    this.index = 0;
  }

  render(i, isInitial){
    if(!this.rpTag) return;
    var cases = REF_CASES[this.lang.current()];
    var c = cases[i];
    var rpTag = this.rpTag, rpLoc = this.rpLoc, rpStat = this.rpStat, rpDesc = this.rpDesc;
    gsap.to("#rp-tag,#rp-loc,#rp-stat,#rp-desc",{opacity:0,y:8,duration:.2,onComplete:function(){
      rpTag.textContent = c.tag;
      rpLoc.textContent = c.loc;
      rpStat.innerHTML = c.stat;
      rpDesc.textContent = c.desc;
      gsap.to("#rp-tag,#rp-loc,#rp-stat,#rp-desc",{opacity:1,y:0,duration:.3});
    }});
    this.rpCount.textContent = (i+1)+" / "+cases.length;
    if(this.refMap){
      if(isInitial){ this.refMap.highlightPin(c.pin); }
      else { this.refMap.setActive(c.pin); }
    }
  }

  init(){
    if(!this.rpTag) return;
    var self = this;
    this.render(0, true);
    document.getElementById('rp-next').addEventListener('click', function(){
      self.index = (self.index+1) % REF_CASES.en.length;
      self.render(self.index);
    });
    document.getElementById('rp-prev').addEventListener('click', function(){
      self.index = (self.index-1+REF_CASES.en.length) % REF_CASES.en.length;
      self.render(self.index);
    });
  }
}

const app = new SiteApp();
const refMap = new RefMap();
const carousel = new ReferencesCarousel(app.lang, refMap);
refMap.onPinClick = function(pinKey){
  var idx = REF_CASES[app.lang.current()].findIndex(function(c){ return c.pin === pinKey; });
  if(idx >= 0){ carousel.index = idx; carousel.render(idx); }
};
app.onLangChange = function(){ carousel.render(carousel.index); };
app.init();
refMap.init();
carousel.init();
