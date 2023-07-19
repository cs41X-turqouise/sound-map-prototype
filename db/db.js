const randDate = () => {
  const start = new Date(2019, 0, 1);
  const end = new Date();
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

export const db = [
  {
    latlng: [36.82563, -76.16032],
    date: randDate(),
    file: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    name: 'Test',
  },
  {
    latlng: [36.88546327183475, -76.30592151771837],
    date: randDate(),
    file: '../assets/waves-crashing.wav',
    name: 'Hello World!',
  },
  {
    latlng: [36.83773, -75.96771],
    date: randDate(),
    file: '../assets/waves-crashing.wav',
    name: 'Test2',
  },
  {
    latlng: [36.69912, -76.22452],
    date: randDate(),
    file: '../assets/waves-crashing.wav',
    name: 'Test3',
  },
  {
    latlng: [37.01996, -76.32751],
    date: randDate(),
    file: '../assets/waves-crashing.wav',
    name: 'Test4',
  },
];