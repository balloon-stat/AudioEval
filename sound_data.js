class SoundData {

  static se_merge = {
    title: "合成音",
    code:
`sound.playSynth(
{
  type: 'triangle',
  duration: 0.15,
  volume: 0.1,
  freqStart: 600,
  freqEnd: 1200
}
);`};
  static se_laser = {
    title: "レーザー音",
    code:
`sound.playSynth(
{
  type: 'sawtooth',
  duration: 0.2,
  volume: 0.08,
  freqStart: 1600,
  freqEnd: 200
}
);`};
  static se_explosion = {
    title: "爆発音",
    code:
`sound.playSynth(
{
  type: 'noise',
  duration: 0.5,
  volume: 0.15,
  freqStart: 200,
  freqEnd: 40
}
);`};
  static se_clear = {
    title: "ゲームクリア音",
    code:
`const notes = [523, 659, 784, 1046];

notes.forEach((freq, i) => {
  sound.playSynth(
    {
      type: "triangle",
      duration: 0.15,
      volume: 0.1,
      freqStart: freq,
    },
    i * 0.1,
  );
});
`};
  static se_gameover = {
    title: "ゲームオーバー音",
    code:
`sound.playSynth(
  {
    type: "triangle",
    duration: 0.15,
    volume: 0.1,
    freqStart: 780,
    freqEnd: 700,
    freqTime: 0.3,
  }
);
sound.playSynth(
  {
    type: "triangle",
    duration: 0.1,
    volume: 0.05,
    freqStart: 598,
    freqEnd: 550,
    freqTime: 0.25,
  },
  0.08,
);
sound.playSynth(
  {
    type: "triangle",
    duration: 0.15,
    volume: 0.1,
    freqStart: 780,
    freqEnd: 700,
    freqTime: 0.3,
  },
  0.28,
);
`};
  static se_move = {
    title: "タイル移動の音",
    code:
`sound.playSynth({
  type: "noise",
  duration: 0.07,
  volume: 0.38,

  noiseSmooth: 0.85,
  smoothCount: 3,

  filterType: "bandpass",
  filterFreq: 4000,
  filterFreqEnd: 2000,
  filterQ: 2.0,

  attackTime: 0.03,
});
`};
  static se_merge_pop = {
    title: "タイルのマージポップの音",
    code:
`merge(32);

function merge(value) {
  const pitch = 280 + Math.log2(value) * 20;
  const volume = Math.min(0.35, 0.2 + Math.log2(value) * 0.01);
  let toneDuration = 0.06;

  if (value >= 512) {
    toneDuration = 0.1;
  }

  sound.playSynth({
    type: "noise",
    duration: 0.01,
    volume: 0.07,
    filterType: "bandpass",
    filterFreq: 3400,
    filterQ: 5,
  });

  sound.playSynth(
    {
      type: "sine",
      duration: toneDuration,
      volume: volume,
      freqStart: pitch,
      freqEnd: pitch * 0.75,
      freqTime: 0.01,
    },
    0.018,
  );

  if (value >= 1024) {
    sound.playSynth(
      {
        type: "triangle",
        duration: toneDuration * 1.2,
        volume: 0.06,
        freqStart: 190,
        freqEnd: 150,
        freqTime: 0.02,
      },
      0.018,
    );
  }
}
`};
}
