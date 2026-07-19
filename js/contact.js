import { SiteApp } from './common.js';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZnJ1YmVzMDUiLCJhIjoiY2t0c3BkY2o0MDExODJxcXRwZXQ4djEweSJ9.lyHaaEkHAW9t4dYnk_cO6g';
const HQ = { lng: 16.0297, lat: 45.7957 }; // Slavonska avenija 20, 10000 Zagreb

const FORM_MSG = {
  en: "This is a design concept without backend logic.",
  hr: "Ovo je dizajnerski koncept bez backend logike."
};

/* Simple static Mapbox map centered on Zagreb HQ — no spin/loop here, just a
   practical "here's where we are" map, unlike the multi-location globe on
   the references page. */
class ContactMap {
  constructor(){
    this.container = document.getElementById('contact-map-canvas');
  }
  init(){
    if(!this.container || typeof mapboxgl === 'undefined') return;
    mapboxgl.accessToken = MAPBOX_TOKEN;
    var map = new mapboxgl.Map({
      container: this.container,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [HQ.lng, HQ.lat],
      zoom: 13.5,
      attributionControl: true,
      scrollZoom: false
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass:false }), 'top-left');
    var el = document.createElement('div');
    el.className = 'mb-pin active';
    new mapboxgl.Marker({ element: el }).setLngLat([HQ.lng, HQ.lat]).addTo(map);
  }
}

class ContactForm {
  constructor(langManager){
    this.lang = langManager;
    this.form = document.getElementById('contact-form');
  }
  init(){
    if(!this.form) return;
    var lang = this.lang;
    this.form.addEventListener('submit', function(e){
      e.preventDefault();
      var msg = document.getElementById('form-msg');
      msg.style.display = 'block';
      msg.textContent = FORM_MSG[lang.current()];
      e.target.reset();
    });
  }
}

const app = new SiteApp();
new ContactForm(app.lang).init();
new ContactMap().init();
app.init();
