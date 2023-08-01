const randDate = () => {
  const start = new Date(2019, 0, 1);
  const end = new Date();
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const randNum = (min = 0, max = 100) => {
  return Math.floor(Math.random() * (max - min) + min);
};

/**
 * Get random latitude and longitude
 * @return {[number, number]} [lat, lng]
 */
function randLatLng () {
  const lat = (Math.random() * 180) - 90;
  const lng = (Math.random() * 360) - 180;
  return [lat, lng];
}

const sounds = [
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  '../assets/waves-crashing.wav',
  '../assets/waitomo-nz-ambiance.wav',
  '../assets/deep-waves-with-reverb.wav',
];

const names = [
  'Amber Joseph',
  'Demetrius Bush',
  'Dylan Mccarthy',
  'Eliana Mccormick',
  'Emanuel Mccormick',
  'Jimmy Hancock',
  'Marylou Webb',
  'Kristi Everett',
  'Theron Archer',
  'Jacinto Riggs',
  'Kim Norton',
  'Angelique Jones',
  'Evelyn Solomon',
  'Logan Russo',
];

const randName = () => {
  return names[randNum(0, names.length)];
};

const randSound = () => {
  return sounds[randNum(0, sounds.length)];
};

/** @class */
// class SoundArtifact {
//   /**
//    * @constructor
//    * @param {string} [artist]
//    * @param {string} [title]
//    * @param {string} [description]
//    * @param {string} [file]
//    * @param {[number, number]} [latlng]
//    */
//   constructor (artist, title, description, file, latlng) {
//     this.file = file || randSound();
//     this.artist = artist || randName();
//     this.title = title || this.file.split('/').pop();
//     this.description = description || '';
//     this.fileType = this.file.split('.').pop();
//     this.latlng = latlng || randLatLng();
//   }
// };

/**
 * @typedef {Object} DbItemOptions
 * @property {string} [user]
 * @property {Date} [date]
 * @property {string} [artist]
 * @property {string} [title]
 * @property {string} [description]
 * @property {string[]} [tags]
 * @property {string} [file]
 * @property {[number, number]} [latlng]
 */

/** @class */
export class DbItem {
  /**
   * @constructor
   * @param {DbItemOptions} [options]
   */
  constructor (options = {}) {
    const {
      user = `user${randNum()}`,
      date = randDate(),
      file = randSound(),
      image = null,
      artist = randName(),
      title = file instanceof File ? file.name : file.split('/').pop(),
      description = '...description of the sound',
      tags = ['tag1', 'tag2'],
      latlng = randLatLng()
    } = options;

    this.user = user;
    this.date = date;
    this.file = file;
    this.image = image;
    this.artist = artist;
    this.title = title;
    this.description = description;
    this.tags = tags.map((tag) => tag.toLowerCase());
    this.fileType = file instanceof File
      ? file.name.split('.').pop()
      : file.split('.').pop();
    this.latlng = latlng;
    // this.artifact = new SoundArtifact(
    //     artist,
    //     title,
    //     description,
    //     file,
    //     latlng
    // );
  }
};

/** @type {Array<DbItem>} */
export const db = [];

// insert some test data
[
  {
    user: 'user1',
    date: randDate(),
    title: 'Test',
    file: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    latlng: [36.82563, -76.16032],
  },
  {
    user: 'user1',
    date: randDate(),
    title: 'Hello World!',
    file: '../assets/waves-crashing.wav',
    image: '../assets/sea.jpg',
    latlng: [36.88546327183475, -76.30592151771837],
  },
  {
    user: 'user2',
    date: randDate(),
    title: 'Test2',
    file: '../assets/waves-crashing.wav',
    latlng: [36.83773, -75.96771],
  },
  {
    user: 'user3',
    date: randDate(),
    title: 'Test3',
    file: '../assets/waves-crashing.wav',
    image: ['../assets/sea.jpg', '../assets/default-avatar.png'],
    latlng: [36.69912, -76.22452],
  },
  {
    user: 'user1',
    date: randDate(),
    title: 'Test4',
    file: '../assets/waves-crashing.wav',
    image: '../assets/sea.jpg',
    latlng: [37.01996, -76.32751],
  },
].forEach((item) => {
  db.push(new DbItem(item));
});

for (let i = 0; i < 100; i++) {
  db.push(new DbItem());
}
