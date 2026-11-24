'use strict';
// ============================================================
//  NHẠC NỀN — tự tạo bằng WebAudio, không cần file nhạc
//  Âm giai ngũ cung (C D F G A), tiếng gảy kiểu đàn tranh,
//  luyến láy kiểu đàn bầu ở nốt dài, mõ gõ nhịp nhẹ.
// ============================================================
const MUSIC = (() => {
  const BPM = 84, STEP = 60 / BPM / 2;          // nốt móc đơn
  const N = { C3: 48, D3: 50, F3: 53, G3: 55, A3: 57, C4: 60, D4: 62, F4: 65, G4: 67, A4: 69, C5: 72, D5: 74, F5: 77, G5: 79, A5: 81, E4: 64, E3: 52, B3: 59 };
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  const CH = { F: ['F3', 'A3', 'C4'], C: ['C3', 'G3', 'C4'], Dm: ['D3', 'F3', 'A3'], G: ['G3', 'D4', 'G4'], Am: ['A3', 'C4', 'E4'] };
  const _ = null;
  // mỗi khúc: 8 ô nhịp × 8 phách
  const SONG = [
    { chords: ['F', 'C', 'Dm', 'C', 'F', 'G', 'Am', 'C'], mel: [
      'A4', _, 'C5', _, 'D5', 'C5', 'A4', _,
      'G4', _, _, 'A4', 'G4', 'F4', 'D4', _,
      'F4', _, 'G4', 'A4', _, 'C5', 'A4', _,
      'G4', _, _, _, _, _, _, _,
      'C5', _, 'D5', 'F5', _, 'D5', 'C5', _,
      'D5', _, 'C5', 'A4', _, 'G4', 'A4', _,
      'C5', _, 'A4', 'G4', 'F4', _, 'D4', 'F4',
      'G4', _, _, _, _, _, _, _] },
    { chords: ['Dm', 'C', 'F', 'G', 'Dm', 'Am', 'G', 'C'], mel: [
      'D5', _, 'F5', _, 'D5', 'C5', 'A4', _,
      'C5', _, 'A4', _, 'G4', _, 'A4', _,
      'F4', _, 'G4', 'A4', 'C5', _, 'D5', _,
      'C5', _, 'A4', _, 'G4', _, _, _,
      'A4', _, 'C5', 'D5', _, 'F5', 'D5', _,
      'C5', _, _, 'A4', 'G4', _, 'A4', _,
      'D4', _, 'F4', 'G4', _, 'A4', 'G4', 'F4',
      'C4', _, _, _, _, _, _, _] },
  ];
  const TOTAL = SONG.length * 64;

  let ac = null, out = null, filt = null, timer = null, step = 0, next = 0;
  let enabled = true, running = false;
  let mood = { night: false, rain: false };
  try { enabled = localStorage.getItem('mongmo_music') !== 'off'; } catch (e) { }

  function setup() {
    if (out) return true;
    ac = SFX.ctx(); if (!ac) return false;
    out = ac.createGain(); out.gain.value = 0;
    filt = ac.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 2600; filt.Q.value = 0.4;
    filt.connect(out); out.connect(ac.destination);
    return true;
  }

  function pluck(m, t, dur, vol, vibrato) {
    const f = hz(N[m]);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(vol * 0.35, t + 0.18);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(filt);
    const o1 = ac.createOscillator(), o2 = ac.createOscillator(), g2 = ac.createGain();
    o1.type = 'triangle'; o2.type = 'sine'; g2.gain.value = 0.35;
    o1.frequency.setValueAtTime(f * 1.025, t); o1.frequency.exponentialRampToValueAtTime(f, t + 0.06);
    o2.frequency.setValueAtTime(f * 2.05, t); o2.frequency.exponentialRampToValueAtTime(f * 2, t + 0.06);
    if (vibrato) {
      const lfo = ac.createOscillator(), lg = ac.createGain();
      lfo.frequency.value = 5.2; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.014, t + 0.6);
      lfo.connect(lg); lg.connect(o1.frequency); lfo.start(t); lfo.stop(t + dur);
      // luyến lên rồi trả về (kiểu đàn bầu)
      o1.frequency.setValueAtTime(f, t + 0.35); o1.frequency.linearRampToValueAtTime(f * 1.06, t + 0.55); o1.frequency.linearRampToValueAtTime(f, t + 0.8);
    }
    o1.connect(g); o2.connect(g2); g2.connect(g);
    o1.start(t); o2.start(t); o1.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  }
  function bass(m, t, vol) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.value = hz(N[m]) / 2;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + STEP * 3.5);
    o.connect(g); g.connect(filt); o.start(t); o.stop(t + STEP * 4);
  }
  function pad(chord, t, vol) {
    CH[chord].forEach(m => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'triangle'; o.frequency.value = hz(N[m]);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.5); g.gain.linearRampToValueAtTime(0.0001, t + STEP * 8);
      o.connect(g); g.connect(filt); o.start(t); o.stop(t + STEP * 8 + 0.05);
    });
  }
  function mo(t, vol, high) { // tiếng mõ gỗ
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(high ? 1250 : 880, t); o.frequency.exponentialRampToValueAtTime(high ? 1000 : 700, t + 0.05);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.1);
  }

  function schedule(i, t) {
    const sec = SONG[Math.floor(i / 64) % SONG.length], k = i % 64, bar = Math.floor(k / 8), beat = k % 8;
    const night = mood.night;
    const chord = sec.chords[bar];
    if (beat === 0) { pad(chord, t, night ? 0.012 : 0.016); bass(CH[chord][0], t, night ? 0.09 : 0.11); }
    if (beat === 4 && !night) bass(CH[chord][0], t, 0.07);
    let m = sec.mel[k];
    if (m) {
      let len = 1; while (len < 8 && k + len < 64 && !sec.mel[k + len]) len++;
      if (night && beat % 2 === 1) m = null; // ban đêm thưa nốt
      if (m) {
        const noteName = night && N[m] - 12 >= 60 ? Object.keys(N).find(x => N[x] === N[m] - 12) || m : m;
        pluck(noteName, t, Math.min(2.4, STEP * len + 0.9), night ? 0.07 : 0.1, len >= 4);
      }
    }
    if (!night && !mood.rain) {
      if (beat === 0 || beat === 3 || beat === 6) mo(t, 0.035, beat !== 0);
    } else if (!night && beat === 0) mo(t, 0.025, false);
  }

  function tick() {
    if (!ac) return;
    while (next < ac.currentTime + 0.15) {
      schedule(step, next);
      step = (step + 1) % TOTAL; next += STEP;
    }
  }

  function start() {
    if (!enabled || running || !setup()) return;
    running = true;
    next = ac.currentTime + 0.1;
    out.gain.cancelScheduledValues(ac.currentTime);
    out.gain.setValueAtTime(out.gain.value, ac.currentTime);
    out.gain.linearRampToValueAtTime(0.55, ac.currentTime + 1.5);
    timer = setInterval(tick, 40); tick();
  }
  function stop() {
    if (!running) return;
    running = false; clearInterval(timer); timer = null;
    out.gain.cancelScheduledValues(ac.currentTime);
    out.gain.setValueAtTime(out.gain.value, ac.currentTime);
    out.gain.linearRampToValueAtTime(0, ac.currentTime + 0.4);
  }
  function setMood(night, rain) {
    if (mood.night === night && mood.rain === rain) return;
    mood = { night, rain };
    if (filt && ac) filt.frequency.setTargetAtTime(night ? 1100 : rain ? 1700 : 2600, ac.currentTime, 0.8);
  }
  function toggle() {
    enabled = !enabled;
    try { localStorage.setItem('mongmo_music', enabled ? 'on' : 'off'); } catch (e) { }
    enabled ? start() : stop();
    return enabled;
  }
  return { start, stop, toggle, setMood, get enabled() { return enabled; } };
})();
