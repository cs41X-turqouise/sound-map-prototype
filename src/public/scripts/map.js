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

// set inital view
views.osm.addTo(map);
L.control.scale().addTo(map);
L.control.layers(views, null, { position: 'bottomleft' }).addTo(map);
map.zoomControl.setPosition('bottomright');
L.control.locate({ position: 'bottomright' }).addTo(map);

/**
 * @param {HTMLElement} list
 * @param {PopUp} popup
 */
function createListItem (list, popup) {
  const distance = popup?.distance?.toFixed(2) || 0;

  const listItem = document.createElement('li');
  listItem.innerHTML = (
    `<b class="name">${popup.title}</b> (<span class="distance">${distance}</span> m)<br>`
    + `Date: <span class="date">${popup.date?.toLocaleDateString()}</span><br>`
    + `Artist: <span class="artist">${popup.artist}</span><br>`
    + `Description:`
    + `<div class="description-container">`
    + `<p class="description">${popup.description}</p>`
    + `</div>`
    // todo - tags
    + `Tags: <span class="tags">${popup.tags}</span><br>`
    + `<div class="sound-bar" data-file="${popup.file}">`
    + `<button class="play-button">▶️</button>`
    + `<div class="progress-bar"></div>`
    + `<div class="duration-label"></div>`
    + `</div>`
  );
  list.appendChild(listItem);

  const playButton = listItem.querySelector('.play-button');
  const soundBar = listItem.querySelector('.sound-bar');
  const progressBar = soundBar.querySelector('.progress-bar');
  const durationLabel = soundBar.querySelector('.duration-label');
  const audio = new Audio(popup.file);

  listItem.addEventListener('click', function (e) {
    map.setView(popup.latlng, 10);
    const activeListItem = list.querySelector('.active');
    if (activeListItem) activeListItem.classList.remove('active');
    listItem.classList.add('active');
  });

  playButton.addEventListener('click', function (e) {
    if (audio.paused) {
      audio.play();
      playButton.textContent = '⏸️';
    } else {
      audio.pause();
      playButton.textContent = '▶️';
    }
  });

  audio.addEventListener('timeupdate', function () {
    const progress = (audio.currentTime / audio.duration) * 100;
    progressBar.style.width = `${progress}%`;
    const duration = formatTime(audio.duration);
    const currentTime = formatTime(audio.currentTime);
    durationLabel.textContent = `${currentTime} / ${duration}`;
  });

  audio.addEventListener('ended', function () {
    playButton.textContent = '▶️';
    progressBar.style.width = '0%';
    durationLabel.textContent = `0:00 / ${formatTime(audio.duration)}`;
  });

  audio.addEventListener('loadedmetadata', function () {
    const duration = formatTime(audio.duration);
    durationLabel.textContent = `0:00 / ${duration}`;
  });

  /**
   * @param {number} time
   * @return {string}
   */
  function formatTime (time) {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
};

const showSidebar = function () {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.add('show');
};

const hideSidebar = function () {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.remove('show');
};

const dropdown = document.getElementById('dropbtn-search');
const form = document.getElementById('search-form');
const searchModal = document.getElementById('search-modal');
const closeButton = document.querySelector('#search-modal .close');
const closeForm = function () {
  form.reset();
  searchModal.style.display = 'none';
};
closeButton.addEventListener('click', function (e) {
  closeForm();
});
form.addEventListener('submit', function (e) {
  e.preventDefault();
  const formData = new FormData(form);
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
  closeForm();
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
  window.location.href = '/logout';
});
document.getElementById('upload').addEventListener('click', function (e) {
  const uploadModal = document.getElementById('upload-modal');
  const form = document.getElementById('upload-form');
  const closeButton = document.querySelector('#upload-modal .close');
  closeButton.addEventListener('click', function () {
    form.reset();
    uploadModal.style.display = 'none';
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const formData = new FormData(form);
    const data = {};
    for (const [key, value] of formData.entries()) {
      if (key === 'tags') {
        data[key] = value.includes(',')
          ? value.split(',').map((item) => item.trim().toLowerCase())
          : value.includes(' ')
            ? value.split(' ').map((item) => item.trim().toLowerCase())
            : value ? [value] : []; // feels hacky
      } else {
        data[key] = value;
      }
    }
    console.log(data);
    db.push(new DbItem(data));
    console.log(db.at(-1));
    console.log(
        `Form submitted: `
        + `title=${formData.get('title')}, `
        + `description=${formData.get('description')}, `
        + `file=${formData.get('file').name}, `
    );
    form.reset();
    uploadModal.classList.remove('show');
    uploadModal.style.display = 'none';
  });
  uploadModal.style.display = 'block';
});

map.on('click', (e) => {
  L.popup()
      .setLatLng(e.latlng)
      .setContent(`You clicked the map at ${e.latlng.toString()}`)
      .openOn(map);
  const clickedLatLng = e.latlng;

  const popups = db.map(function (popup) {
    const popupLatLng = L.latLng(popup.latlng);
    const distance = clickedLatLng.distanceTo(popupLatLng);
    popup.distance = distance;
    return popup;
  });

  popups.sort(function (a, b) {
    return a.distance - b.distance;
  });

  const popupList = document.getElementById('popup-list');
  popupList.innerHTML = '';
  popups.forEach(function (popup) {
    createListItem(popupList, popup);
  });

  showSidebar();
});

map.on('popupopen', function () {
  showSidebar();
});

map.on('popupclose', function () {
  hideSidebar();
});

document.getElementById('sidebar-close').addEventListener('click', function () {
  hideSidebar();
});

for (const marker of db) {
  const popup = L.marker(marker.latlng)
      .addTo(map)
      .bindPopup(
          `<b>${marker.title}</b><br>`
          + `Date: ${marker.date.toLocaleDateString()}`
      );
  popup.on('click', function (e) {
    console.log('popup clicked');
    const popupList = document.getElementById('popup-list');
    popupList.innerHTML = '';
    createListItem(popupList, marker);
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.add('show');
  });
}
