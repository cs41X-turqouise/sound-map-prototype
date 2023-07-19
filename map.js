import { db } from "./db/db.js";

/** @type {L.Map} */
const map = new L.map('map' , {
  center: [36.88546327183475, -76.30592151771837],
  zoom: 10
});

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
};

// set inital view
views.osm.addTo(map);
L.control.layers(views).addTo(map);
L.control.scale().addTo(map);
L.control.locate({ position: 'bottomright' }).addTo(map);
/** @type {L.Marker} */
let marker = null;
const addressSearchControl = L.control.addressSearch(
  '831a036f042649b889c729791827ea17',
  {
    position: 'topright',
    // set it true to search addresses nearby first
    mapViewBias: true,
    placeholder: "Enter an address here",

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

map.on('click', (e) => {
  L.popup()
    .setLatLng(e.latlng)
    .setContent(`You clicked the map at ${e.latlng.toString()}`)
    .openOn(map);
  const clickedLatLng = e.latlng;

  const popupDistances = db.map(function (popup) {
    const popupLatLng = L.latLng(popup.latlng);
    const distance = clickedLatLng.distanceTo(popupLatLng);
    return { popup: popup, distance: distance };
  });

  popupDistances.sort(function (a, b) {
    return a.distance - b.distance;
  });

  const popupList = document.getElementById('popup-list');
  popupList.innerHTML = '';
  popupDistances.forEach(function (popupDistance) {
    const popup = popupDistance.popup;
    const distance = popupDistance.distance.toFixed(2);
    const listItem = document.createElement('li');
    listItem.innerHTML = (
      `<b class="name">${popup.name}</b> (<span class="distance">${distance}</span> m)<br>`
      + `Date: <span class="date">${popup.date.toLocaleDateString()}</span><br>`
      + `<div class="sound-bar" data-file="${popup.file}">`
      + `<button class="play-button">▶️</button>`
      + `<div class="progress-bar"></div>`
      + `<div class="duration-label"></div>`
      + `</div>`
    );
    popupList.appendChild(listItem);

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

    function formatTime(time) {
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
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
      `<b>${marker.name}</b><br>`
      + `Date: ${marker.date.toLocaleDateString()}`
    );
  popup.on('click', function (e) {
    console.log('popup clicked');
  });
}
