'use strict';


const COLLECTIONS = [
  {key:'all',name:'All',description:'A few moments from nature, landscapes, and everyday life.',tagline:'THREE COLLECTIONS. ONE CURIOUS EYE.'},
  {key:'nature',name:'Nature',description:'Small wonders, wild details, and a little room to breathe.',tagline:'THE WORLD, UNHURRIED'},
  {key:'landscapes',name:'Landscapes',description:'Open skies, distant horizons, and places that make you pause.',tagline:'A LITTLE FURTHER, A LITTLE WIDER'},
  {key:'life',name:'Life',description:'Ordinary moments, familiar spaces, and the stories in between.',tagline:'BEAUTY IN THE EVERYDAY'}
];
let currentCatalog = window.PHOTO_BOOK_CATALOG || {photos:[],recentPhotos:[]};
let PHOTOS = currentCatalog.photos;
let RECENT_PHOTOS = currentCatalog.recentPhotos;
let selectedCollection = 'all', viewerIsRecent = false, viewerCategory = null;
const $ = selector => document.querySelector(selector);
const collectionFor = key => key === 'recent' ? {key:'recent',name:'Latest frames'} : COLLECTIONS.find(collection => collection.key === key);
const photosFor = key => key === 'all' ? PHOTOS : PHOTOS.filter(photo => photo.category === key);
const countLabel = count => `${String(count).padStart(2,'0')} ${count === 1 ? 'FRAME' : 'FRAMES'}`;
const galleryURL = key => `?collection=${encodeURIComponent(key)}`;
const dialog = $('#photo-dialog');
let viewerPhotos = [], viewerIndex = 0, lastTrigger = null;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// Keep loading states exclusive, including when a failed image later succeeds.
function prepareImage(image,container) {
  container.classList.remove('image-ready','image-error');
  let fallback = container.querySelector('.image-fallback');
  if (!fallback) {
    fallback = element('span','image-fallback','This photograph couldn’t load. Check the image path or your connection.');
    container.append(fallback);
  }
  const loaded = () => {
    container.classList.remove('image-error');
    container.classList.add('image-ready');
  };
  const failed = () => {
    container.classList.remove('image-ready');
    container.classList.add('image-error');
  };
  image.onload = loaded;
  image.onerror = failed;
  if (image.complete) { if (image.naturalWidth) loaded(); else failed(); }
}

function renderCards(target, photos, scope = photos) {
  target.replaceChildren();
  if (!photos.length) {
    target.append(element('p','empty-collection','A little space for what comes next.'));
    return;
  }
  photos.forEach((photo,index) => {
    const card = element('article','photo-card');
    card.style.animationDelay = `${Math.min(index,8)*35}ms`;
    const button = element('button','photo-button');
    button.type = 'button';
    button.setAttribute('aria-label',`View ${photo.title} and its story`);
    const image = element('img');
    image.src = photo.image;
    prepareImage(image, button);
    image.alt = photo.alt || photo.title;
    image.loading = 'lazy';
    image.width = 800;
    image.height = 1000;
    button.append(image,element('span','view-story','READ THE STORY ↗'));
    button.addEventListener('click',() => openPhoto(photo.id,button,scope));
    const caption = element('div','photo-caption');
    const arrow = element('span','','↗');
    arrow.setAttribute('aria-hidden','true');
    caption.append(element('h3','',photo.title),arrow);
    const category = collectionFor(photo.category)?.name || 'Photo journal';
    card.dataset.category = photo.category;
    card.append(button,caption,element('p','photo-meta',`${category}${photo.sample ? ' / Sample frame' : ''}`));
    target.append(card);
  });
  target.dispatchEvent(new CustomEvent('photobook:render',{bubbles:true}));
}
function createTabs(target,selected,links) {
  target.replaceChildren();
  COLLECTIONS.forEach(collection => {
    const tab = element(links ? 'a' : 'button','collection-tab',collection.name);
    const active = selected === collection.key;
    tab.classList.toggle('active',active);
    tab.append(element('span','',String(photosFor(collection.key).length).padStart(2,'0')));
    if (links) {
      tab.href = galleryURL(collection.key);
      if (active) tab.setAttribute('aria-current','page');
    } else {
      tab.type = 'button';
      tab.dataset.collection = collection.key;
      tab.setAttribute('aria-pressed',String(active));
      tab.setAttribute('aria-controls','collection-preview-grid');
      tab.addEventListener('click',() => selectCollection(collection.key));
    }
    target.append(tab);
  });
}
function mixedPreview() {
  const groups = COLLECTIONS.slice(1).map(collection => photosFor(collection.key));
  return [0,1].flatMap(index => groups.map(group => group[index]).filter(Boolean));
}
function selectCollection(key) {
  const collection = collectionFor(key);
  if (!collection) return;
  selectedCollection = key;
  $('#collection-filters').querySelectorAll('button').forEach(button => {
    const active = button.dataset.collection === key;
    button.classList.toggle('active',active);
    button.setAttribute('aria-pressed',String(active));
  });
  const matching = photosFor(key);
  const preview = key === 'all' ? mixedPreview() : matching.slice(0,3);
  $('#preview-description').textContent = collection.description;
  $('#preview-count').textContent = `${String(preview.length).padStart(2,'0')} OF ${countLabel(matching.length)}`;
  renderCards($('#collection-preview-grid'),preview,matching);
  const detail = key === 'all' ? `${matching.length} photographs across all collections` : `${matching.length} photographs in ${collection.name}`;
  $('#see-more-detail').textContent = `Explore all ${detail}`;
  $('#collection-see-more').href = galleryURL(key);
  $('#collection-see-more').setAttribute('aria-label',`See more: ${detail}`);
  $('#collection-status').textContent = `Showing ${preview.length} of ${detail}.`;
}
function renderHome() {
  createTabs($('#collection-filters'),selectedCollection,false);
  selectCollection(selectedCollection);
  const recent = RECENT_PHOTOS;
  renderCards($('#recent-grid'),recent.slice(0,6),recent);
  $('#recent-count').textContent = `${countLabel(Math.min(recent.length,6))} / MOST RECENT`;
  $('.sample-note').hidden = !recent.some(photo => photo.sample);
  const hero = PHOTOS.find(photo => photo.category === 'landscapes' && !photo.sample) || PHOTOS[0];
  const heroButton = $('#hero-photo');
  heroButton.disabled = !hero;
  if (hero) {
    const image = heroButton.querySelector('img');
    image.hidden = false;
    image.src = hero.image;
    image.alt = hero.alt || hero.title;
    prepareImage(image,heroButton);
    heroButton.setAttribute('aria-label',`View ${hero.title} and its story`);
    heroButton.onclick = () => openPhoto(hero.id,heroButton,PHOTOS);
    heroButton.querySelector('.hero-label small').textContent = '01 / THROUGH MY LENS';
  }
}
function renderGallery(key) {
  $('#home-page').hidden = true;
  $('#gallery-page').hidden = false;
  const collection = collectionFor(key);
  createTabs($('#gallery-filters'),key,true);
  if (!collection) {
    document.title = 'Collection not found — Sai’s Photo Book';
    $('#gallery-title').textContent = 'A different path.';
    $('#gallery-description').textContent = 'That collection isn’t here. Choose one of the collections below.';
    return;
  }
  const name = key === 'all' ? 'All frames' : collection.name;
  document.title = `${name} — Sai’s Photo Book`;
  $('#gallery-title').replaceChildren(document.createTextNode(name),element('em','','.'));
  $('#gallery-tagline').textContent = collection.tagline;
  $('#gallery-description').textContent = collection.description;
  $('#gallery-count').textContent = countLabel(photosFor(key).length);
  renderCards($('#gallery-grid'),photosFor(key));
}
function updatePhoto() {
  const photo = viewerPhotos[viewerIndex];
  if (!photo) return;
  $('#detail-image').src = photo.image;
  $('#detail-image').alt = photo.alt || photo.title;
  window.PhotoBookMotion?.transitionPhoto($('#detail-image'));
  prepareImage($('#detail-image'),$('.dialog-image'));
  $('#photo-title').textContent = photo.title;
  const category = collectionFor(photo.category)?.name || 'Photo journal';
  $('#photo-category').textContent = `${category} / A PHOTO & A FEELING`;
  $('#photo-story').textContent = photo.story || 'Some photographs speak for themselves. A story may follow.';
  $('#photo-camera').textContent = photo.camera || 'Camera details to come';
  $('#photo-collection').textContent = category;
  $('#photo-counter').textContent = `${String(viewerIndex+1).padStart(2,'0')} / ${String(viewerPhotos.length).padStart(2,'0')}`;
  $('#sample-disclaimer').hidden = !photo.sample;
  $('#viewer-prev').hidden = $('#viewer-next').hidden = viewerPhotos.length < 2;
}
function openPhoto(id,trigger,scope) {
  const index = scope.findIndex(photo => photo.id === id);
  if (index < 0) return;
  viewerIsRecent = scope === RECENT_PHOTOS;
  viewerCategory = !viewerIsRecent && scope.every(photo => photo.category === scope[0].category) ? scope[0].category : null;
  viewerPhotos = scope;
  viewerIndex = index;
  lastTrigger = trigger;
  updatePhoto();
  document.body.classList.add('modal-open');
  dialog.showModal();
  dialog.scrollTop = 0;
  $('#close-dialog').focus({preventScroll:true});
}
function stepPhoto(direction) {
  if (!viewerPhotos.length) return;
  viewerIndex = (viewerIndex+direction+viewerPhotos.length)%viewerPhotos.length;
  updatePhoto();
}
$('#close-dialog').addEventListener('click',() => dialog.close());
$('#viewer-prev').addEventListener('click',() => stepPhoto(-1));
$('#viewer-next').addEventListener('click',() => stepPhoto(1));
dialog.addEventListener('keydown',event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    stepPhoto(event.key === 'ArrowLeft' ? -1 : 1);
  }
});
dialog.addEventListener('close',() => {
  document.body.classList.remove('modal-open');
  if (lastTrigger?.isConnected) lastTrigger.focus({preventScroll:true});
});
dialog.addEventListener('click',event => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
});
$('#year').textContent = new Date().getFullYear();
const params = new URLSearchParams(location.search);
if (params.has('collection')) renderGallery(params.get('collection')); else renderHome();

let scrollQueued = false;
function updateScroll() {
  const distance = document.documentElement.scrollHeight-innerHeight;
  $('.scroll-progress').style.transform = `scaleX(${distance > 0 ? scrollY/distance : 0})`;
  scrollQueued = false;
}
addEventListener('scroll',() => {
  if (!scrollQueued) {scrollQueued = true;requestAnimationFrame(updateScroll);}
},{passive:true});
updateScroll();


// Refresh hosted galleries too: cached catalogs can refer to an older deployment.
if (['http:','https:'].includes(location.protocol)) {
  const localPreview = ['127.0.0.1','localhost','[::1]'].includes(location.hostname);
  let refreshing = false;
  async function refreshPhotos() {
    if (refreshing || document.hidden) return;
    refreshing = true;
    try {
      const response = await fetch(`catalog.json?refresh=${Date.now()}`,{cache:'no-store'});
      if (!response.ok) return;
      const next = await response.json();
      if (!Array.isArray(next.photos) || !Array.isArray(next.recentPhotos) || JSON.stringify(next) === JSON.stringify(currentCatalog)) return;
      const activeId = viewerPhotos[viewerIndex]?.id;
      currentCatalog = next;
      PHOTOS = next.photos;
      RECENT_PHOTOS = next.recentPhotos;
      if (params.has('collection')) renderGallery(params.get('collection')); else renderHome();
      if (dialog.open) {
        viewerPhotos = viewerIsRecent ? RECENT_PHOTOS : viewerCategory ? photosFor(viewerCategory) : PHOTOS;
        viewerIndex = viewerPhotos.findIndex(photo => photo.id === activeId);
        if (viewerIndex < 0) dialog.close(); else updatePhoto();
      }
    } catch { /* Keep the last loaded catalog when the connection is unavailable. */ }
    finally {refreshing=false;}
  }
  if (localPreview) setInterval(refreshPhotos,5000);
  addEventListener('focus',refreshPhotos);
  document.addEventListener('visibilitychange',() => { if (!document.hidden) refreshPhotos(); });
  refreshPhotos();
}
