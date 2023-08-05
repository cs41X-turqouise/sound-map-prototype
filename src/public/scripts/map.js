/** @typedef {import('../../db/db.js').DbItem} PopUp */
import { db, DbItem } from '../../db/db.js';

/** @type {L.Map} */
const map = new L.Map('map', {
  center: [36.88546327183475, -76.30592151771837],
  maxBounds: L.latLngBounds(L.latLng(-90, -180), L.latLng(90, 180)),
  zoom: 10
});

/** @type {Record<string, L.TileLayer>}*/
const views = {
  osm: (new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  })),
  mapbox: (new L.TileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1IjoidGhlYmd1eSIsImEiOiJjbGpmNnpiZ3QyZDR5M2luNXU2anJsbXp3In0.UP5wSUCUx2mm9j_A2ganfQ'
  })),
  satellite: (L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 18,
  })),
  googleSatellite: (L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
  })),
  googleTerrain: (L.tileLayer('http://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
  })),
  googleHybrid: (L.tileLayer('http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
  })),
};

const CoordinatesControl = L.Control.extend({
  onAdd: function (map) {
    const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
    container.style.backgroundColor = 'white';
    container.style.padding = '5px';
    container.style.marginRight = '10px';
    container.innerHTML = 'Center: ' + map.getCenter().lat.toFixed(4) + ', ' + map.getCenter().lng.toFixed(4);
    return container;
  }
});

// set inital view
views.osm.addTo(map);
L.control.scale().addTo(map);
L.control.layers(views, null, { position: 'bottomleft' }).addTo(map);
map.zoomControl.setPosition('bottomright');
L.control.locate({ position: 'bottomright' }).addTo(map);
const coordinatesControl = new CoordinatesControl().setPosition('topleft').addTo(map);

/** @type {HTMLAudioElement} */
let currentAudio = null;

/**
 * @param {HTMLElement} list
 * @param {PopUp} popup
 */
function createListItem (list, popup) {
  const distance = popup?.distance?.toFixed(2) || 0;

  const listItem = document.createElement('li');
  // popup.image = popup.image || '../assets/sea.jpg';
  listItem.innerHTML = (
    `<b class="name">${popup.title}</b> (<span class="distance">${distance}</span> m)<br>`
    + `Date: <span class="date">${popup.date?.toLocaleDateString()}</span><br>`
    + `Artist: <span class="artist">${popup.artist}</span><br>`
    + `Description:`
    + `<div class="description-container">`
    + `<p class="description">${popup.description}</p>`
    + `</div>`
    + (popup.image
      ? Array.isArray(popup.image)
        ? `<div class="slideshow-container"></div>`
        : `<img class="image" src=${popup.image}><br>`
      : ''
    )
    + `Tags: <span class="tags">${popup.tags}</span><br>`
    + `<div class="sound-bar" data-file="${popup.file}">`
    + `<audio class="audio" controls>`
    + `<source src="" type="audio/*">`
    + `</audio>`
    + `</div>`
  );
  list.appendChild(listItem);
  // listItem.style.backgroundImage = `url(${popup.image})`; // TODO: fix this

  if (popup.image && Array.isArray(popup.image)) {
    const slideshowContainer = listItem.querySelector('.slideshow-container');
    let currentSlide = 0;
    const prev = document.createElement('a');
    prev.innerHTML = '&#10094;';
    prev.classList.add('prev');
    prev.onclick = (e) => {
      e.stopPropagation();
      const slides = slideshowContainer.querySelectorAll('.slide');
      currentSlide === 0
        ? (currentSlide = slides.length - 1)
        : currentSlide--;
      slides.forEach((slide, index) => {
        slide.style.display = index === currentSlide ? 'block' : 'none';
      });
    };
    const next = document.createElement('a');
    next.innerHTML = '&#10095;';
    next.classList.add('next');
    next.onclick = (e) => {
      e.stopPropagation();
      const slides = slideshowContainer.querySelectorAll('.slide');
      currentSlide === slides.length - 1
        ? (currentSlide = 0)
        : currentSlide++;
      slides.forEach((slide, index) => {
        slide.style.display = index === currentSlide ? 'block' : 'none';
      });
    };
    slideshowContainer.appendChild(prev);
    slideshowContainer.appendChild(next);
    popup.image.forEach((image, index) => {
      const slide = document.createElement('div');
      slide.classList.add('slide');
      slide.id = `slide-${index}`;
      slide.style.display = index === 0 ? 'block' : 'none';

      const img = document.createElement('img');
      img.classList.add('image');
      img.src = image;
      slide.appendChild(img);
      slideshowContainer.appendChild(slide);
    });
  }

  const soundBar = listItem.querySelector('.sound-bar');
  const audio = new Audio(popup.file instanceof File ? URL.createObjectURL(popup.file) : popup.file);
  const audioBar = soundBar.querySelector('audio');
  const audioSource = audioBar.querySelector('source');
  audioSource.type = `audio/${popup.fileType}`;
  audioSource.src = audio.src;

  listItem.addEventListener('click', function (e) {
    map.setView(popup.latlng, 10);
    const activeListItem = list.querySelector('.active');
    if (activeListItem) activeListItem.classList.remove('active');
    listItem.classList.add('active');
  });
};

const showSidebar = function () {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.add('show');
};

const hideSidebar = function () {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.remove('show');
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
};

/**
 * @param {HTMLFormElement} form
 * @param {HTMLElement} modal
 */
const closeForm = function (form, modal) {
  form.reset();
  modal.style.display = 'none';
};
const searchForm = document.getElementById('search-form');
const searchModal = document.getElementById('search-modal');
document.querySelector('#search-modal .close').addEventListener('click', function (e) {
  closeForm(searchForm, searchModal);
});
searchForm.addEventListener('submit', function (e) {
  e.preventDefault();
  const formData = new FormData(searchForm);
  /**
   * @type {{
   * title: string,
   * artist: string[],
   * description: string,
   * tags: string[],
   * fileType: string[],
   * dateFrom: Date,
   * dateTo: Date,
   * }}
   */
  const data = {};
  for (const [key, value] of formData.entries()) {
    if (['artist', 'tags', 'fileType'].includes(key)) {
      data[key] = value.includes(',')
        ? value.split(',').map((item) => item.trim().toLowerCase())
        : value ? [value] : []; // feels hacky
      if (key === 'fileType') {
        data[key] = data[key].map((item) => item.replace('.', ''));
      }
    } else if (value && (key === 'dateFrom' || key === 'dateTo')) {
      data[key] = new Date(value);
    } else {
      data[key] = value;
    }
  }
  const filteredData = db.filter(function (item) {
    if (data.title && !item.title.includes(data.title)) {
      return false;
    }
    if (data.artist.length
      && !data.artist.some((artist) => item.artist.toLowerCase().includes(artist))) {
      return false;
    }
    if (data.description && !item.description.includes(data.description)) {
      return false;
    }
    if (data.tags.length
      && !data.tags.some((tag) => item.tags.includes(tag.toLowerCase()))) {
      return false;
    }
    if (data.fileType.length
      && !data.fileType.some((ft) => item.fileType.includes(ft.toLowerCase()))) {
      return false;
    }
    if (data.dateFrom && item.date < data.dateFrom) {
      return false;
    }
    if (data.dateTo && item.date > data.dateTo) {
      return false;
    }
    return true;
  });
  closeForm(searchForm, searchModal);
  if (!filteredData.length) {
    console.log('No results found.');
    return;
  }
  // const firstResult = filteredData.at(0);
  // map.setView(firstResult.latlng, 20);
  const popupList = document.getElementById('popup-list');
  popupList.innerHTML = '';
  filteredData.forEach(function (item) {
    // want to create a way to sort results by how much they match the search
    // item.distance = L.latLng(item.latlng).distanceTo(firstResult.latlng);
    createListItem(popupList, item);
  });
  showSidebar();
});

const dropdown = document.getElementById('dropbtn-search');
dropdown.addEventListener('click', function (e) {
  searchModal.style.display = 'block';
});

document.getElementById('user-avatar').addEventListener('click', function (e) {
  console.log('user avatar clicked');
  const userMenu = document.getElementById('user-menu');
  if (userMenu.classList.contains('show')) {
    userMenu.classList.remove('show');
    userMenu.style.display = 'none';
    return;
  }
  userMenu.style.display = 'block';
  userMenu.classList.add('show');
});
document.querySelector('.user-menu #login')?.addEventListener('click', function (e) {
  window.location.href = '/auth/google';
});
document.querySelector('.user-menu #logout')?.addEventListener('click', function (e) {
  fetch('/logout', {
    method: 'POST',
    credentials: 'same-origin'
  }).then((response) => {
    if (response.ok) {
      // redirect to home page - reloads the page
      window.location.href = '/';
    } else {
      throw new Error('Logout failed');
    }
  }).catch((error) => {
    console.error(error);
  });
});
document.querySelector('.user-menu #profile')?.addEventListener('click', function (e) {
  window.location.href = '/profile';
});
const uploadModal = document.getElementById('upload-modal');
const uploadForm = document.getElementById('upload-form');
document.querySelector('#upload-modal .close').addEventListener('click', function () {
  closeForm(uploadForm, uploadModal);
});
uploadForm.addEventListener('submit', function (e) {
  e.preventDefault();
  const formData = new FormData(uploadForm);
  const data = {};
  for (const [key, value] of formData.entries()) {
    if (key === 'tags') {
      data[key] = value.includes(',')
        ? value.split(',').map((item) => item.trim().toLowerCase())
        : value.includes(' ')
          ? value.split(' ').map((item) => item.trim().toLowerCase())
          : value ? [value] : []; // feels hacky
    } else if (key === 'images') {
      data[key] = formData.getAll('images').filter((item) => item.name);
    } else {
      data[key] = value;
    }
  }
  db.push(new DbItem(data));
  closeForm(uploadForm, uploadModal);
});
document.getElementById('upload')?.addEventListener('click', function (e) {
  uploadModal.style.display = 'block';
});

map.on('click', (e) => {
  const clickedLatLng = e.latlng;
  // maybe paginate? For now hardcoded range
  const range = 1e6;
  const popups = db.map(function (popup) {
    const popupLatLng = L.latLng(popup.latlng);
    const distance = clickedLatLng.distanceTo(popupLatLng);
    popup.distance = distance;
    return popup;
  }).filter(function (popup) {
    return popup.distance < range;
  });

  popups.sort(function (a, b) {
    return a.distance - b.distance;
  });

  const popupList = document.getElementById('popup-list');
  popupList.innerHTML = '';
  popups.forEach(function (popup) {
    createListItem(popupList, popup);
  });
  sidebar.style.bottom = '0';

  showSidebar();
});

// kinda like this, kinda don't
const centerMarker = L.marker(map.getCenter()).addTo(map);

map.on('move', function (e) {
  const center = map.getCenter();
  centerMarker.setLatLng(center);
  coordinatesControl.getContainer().innerHTML = 'Center: ' + center.lat.toFixed(4) + ', ' + center.lng.toFixed(4);
});

document.getElementById('sidebar-close').addEventListener('click', function () {
  hideSidebar();
});

for (const marker of db) {
  /** @type {L.Popup} */
  const popup = L.marker(marker.latlng)
    .addTo(map);
  popup.on('click', function (e) {
    console.log('popup clicked');
    const popupList = document.getElementById('popup-list');
    popupList.innerHTML = '';
    createListItem(popupList, marker);
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.add('show');
    sidebar.style.bottom = 'auto';
  });
}
