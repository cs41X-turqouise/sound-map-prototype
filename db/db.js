const randDate = () => {
  const start = new Date(2019, 0, 1);
  const end = new Date();
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

/**
 * @typedef {Object} DbItem
 * @property {string} user
 * @property {Date} date
 * @property {string} title
 * @property {string} [description]
 * @property {string} file
 * @property {number[]} latlng
 */
export const db = [
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
    latlng: [36.69912, -76.22452],
  },
  {
    user: 'user1',
    date: randDate(),
    title: 'Test4',
    file: '../assets/waves-crashing.wav',
    latlng: [37.01996, -76.32751],
  },
];