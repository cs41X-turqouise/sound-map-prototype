/** @typedef {import('../../db/db.js').DbItem} PopUp */
import { db } from '../../db/db.js';

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
/** @type {L.Marker} */
let marker = null;
const addressSearchControl = L.control.addressSearch(
    '831a036f042649b889c729791827ea17',
    {
      position: 'topleft',
      // set it true to search addresses nearby first
      mapViewBias: true,
      placeholder: 'Enter an address here',

      resultCallback: (address) => {
        if (!address) return;
        if (marker) {
          map.removeLayer(marker);
          marker = null;
        }

        // add marker
        marker = L.marker([address.lat, address.lon]).addTo(map);
        // Sets the view of the map (geographical center and zoom) with the given animation options.
        map.setView([address.lat, address.lon], 20);
      },

      suggestionsCallback: (suggestions) => {
        console.debug(suggestions);
      }
    }
);
map.addControl(addressSearchControl);

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

  playButton.addEventListener('click', function (e) {
    if (audio.paused) {
      audio.play();
      playButton.textContent = '⏸️';
    } else {
      audio.pause();
      playButton.textContent = '▶️';
    }
    console.log(document.getElementById('user-avatar'));
  });

  audio.addEventListener('timeupdate', function () {
    const progress = (audio.currentTime / audio.duration) * 100;
    progressBar.style.width = `${progress}%`;
  });

  audio.addEventListener('ended', function () {
    soundBar.style.display = 'none';
  });

  audio.addEventListener('loadedmetadata', function () {
    const duration = formatTime(audio.duration);
    durationLabel.textContent = duration;
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

  const sidebar = document.getElementById('sidebar');
  sidebar.classList.add('show');
});

map.on('popupopen', function () {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.add('show');
});

map.on('popupclose', function () {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.remove('show');
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

const userAvatar = document.getElementById('user-avatar');
userAvatar.addEventListener('click', function (e) {
  console.log('user avatar clicked');
  const userMenu = document.getElementById('user-menu-dropdown');
  userMenu.innerHTML = '';
  if (userMenu.classList.contains('show')) {
    userMenu.classList.remove('show');
    return;
  }
  const userGreeting = document.createElement('span');
  userGreeting.textContent = 'Hello <USER>';
  const userLogin = document.createElement('button');
  userLogin.textContent = 'Login with Google';
  userLogin.addEventListener('click', function (e) {
    window.location.href = '/auth/google';
  });
  const uploadButton = document.createElement('button');
  uploadButton.textContent = 'Upload';
  uploadButton.addEventListener('click', function (e) {
    const uploadModal = document.getElementById('upload-modal');
    const form = document.getElementById('upload-form');
    const closeButton = document.querySelector('.close');
    closeButton.addEventListener('click', function () {
      form.reset();
      // uploadModal.classList.remove('show');
      uploadModal.style.display = 'none';
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      form.reset();
      uploadModal.classList.remove('show');
      uploadModal.style.display = 'none';
      const formData = new FormData(form);
      console.log(
          `Form submitted: `
          + `title=${formData.get('title')}, `
          + `description=${formData.get('description')}, `
          + `file=${formData.get('file').name}, `
      );
    });
    // uploadModal.classList.add('show');
    uploadModal.style.display = 'block';
  });
  userMenu.appendChild(
      document.createElement('li').appendChild(userGreeting)
  );
  userMenu.appendChild(
      document.createElement('li').appendChild(userLogin)
  );
  userMenu.appendChild(
      document.createElement('li').appendChild(uploadButton)
  );
  userMenu.classList.add('show');
});
