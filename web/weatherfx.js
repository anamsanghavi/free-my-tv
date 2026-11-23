/*
 * The weather backgrounds (local addition): the space around the diorama follows the same weather as the diorama.
 * Sun behind the clock on clear days, clouds, rain, snow, fog, a storm bank with lightning, stars and moonlight at night.
 * Everything is drawn in #fx, which sits over the wallpaper and is masked by web/dio-<name>-mask.png (made by
 * webos/make_dio_masks.py) so it never covers the model itself. Plain ES5 for webOS 5.
 *
 *   WeatherFX.set(name, night, mode)   name: the diorama ('' clears); mode: 'full', 'subtle' or 'off'
 *   WeatherFX.pause(true|false)        nobody can see it (an app is open, the screensaver, Movie night...)
 */
var WeatherFX = (function () {
  'use strict';

  var W = 1920, H = 1080, SUN_X = 490, SUN_Y = 190;   // the sun: high in the sky, left of the clock
  // lite: the home screen's low-memory mode (tv.js, deviceMemory <= 1). The effects still run there, lighter.
  var LITE = /(^| )lite( |$)/.test(document.documentElement.className);
  var fx = null, key = '', paused = false, mode = 'full', parts = null, raf = 0, last = 0, flashTimer = 0;
  // withClip: the scene's own video is playing. Its clouds, rain, snow, fog and stars already move, so ours would only
  // double them (and cost the TV a full-screen masked layer): only the light stays (sun, moon, lightning, aurora).
  var withClip = false;

  function $(id) { return document.getElementById(id); }
  function div(cls, parent, css) {
    var e = document.createElement('div');
    e.className = cls;
    if (css) for (var k in css) if (css.hasOwnProperty(k)) e.style[k] = css[k];
    parent.appendChild(e);
    return e;
  }
  function canvas(cls, w, h, parent, css) {
    var c = document.createElement('canvas');
    c.className = cls;
    c.width = w;
    c.height = h;
    if (css) for (var k in css) if (css.hasOwnProperty(k)) c.style[k] = css[k];
    parent.appendChild(c);
    return c;
  }
  function rng(seed) { var s = seed || 7; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

  // MARK: - Pieces

  /** Soft clouds: clusters of overlapping puffs, lighter on top. spec: n, y0, y1 (band), r0, r1, top, bottom, seed, fill */
  function clouds(w, h, spec) {
    var c = document.createElement('canvas'), g, i, j;
    c.width = w;
    c.height = h;
    g = c.getContext('2d');
    var rnd = rng(spec.seed || 11);
    if (spec.fill) {   // a solid bank underneath, so a storm covers everything
      var bg = g.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, spec.fill[0]);
      bg.addColorStop(1, spec.fill[1]);
      g.fillStyle = bg;
      g.fillRect(0, 0, w, h);
    }
    for (i = 0; i < spec.n; i++) {
      var R = spec.r0 + rnd() * (spec.r1 - spec.r0), cx = rnd() * w, cy = spec.y0 + rnd() * (spec.y1 - spec.y0);
      var puffs = 9 + Math.floor(rnd() * 9);
      for (j = 0; j < puffs; j++) {
        var px = cx + (rnd() * 2 - 1) * R * 1.7, py = cy + (rnd() * 0.7 - 0.45) * R, r = R * (0.45 + rnd() * 0.5);
        var col = py < cy ? spec.top : spec.bottom;
        var grad = g.createRadialGradient(px, py - r * 0.15, 0, px, py, r);
        grad.addColorStop(0, col);
        grad.addColorStop(0.55, col.replace(/[\d.]+\)$/, function (a) { return (parseFloat(a) * 0.55) + ')'; }));
        grad.addColorStop(1, col.replace(/[\d.]+\)$/, '0)'));
        g.fillStyle = grad;
        g.beginPath();
        g.arc(px, py, r, 0, Math.PI * 2);
        g.fill();
      }
    }
    return c;
  }

  /** A cloud layer that drifts slowly side to side (wider than the screen, so its edges never show). */
  function cloudLayer(spec, secs, opacity) {
    if (withClip) return;
    var c = clouds(3200, spec.h || H, spec);   // 1280 px wider than the screen: room to drift without an edge showing
    c.className = 'fx-drift';
    c.style.top = (spec.top0 || 0) + 'px';
    c.style.opacity = opacity;
    c.style.webkitAnimationDuration = c.style.animationDuration = Math.round(secs * 0.55) + 's';   // ~15 px a second: you can see it move
    fx.appendChild(c);
  }

  function sun(strength, tone) {
    div('fx-sun' + (tone ? ' ' + tone : ''), fx, {opacity: strength});
    if (strength < 0.7) return;
    // rays fanning out toward the diorama on the right, swaying a few degrees
    var c = canvas('fx-rays', 2200, 2200, fx), g = c.getContext('2d'), cx = 1100, cy = 1100, rnd = rng(5), i;
    for (i = 0; i < 16; i++) {
      var a = (-62 + rnd() * 124) * Math.PI / 180, wdt = (1.5 + rnd() * 4) * Math.PI / 180, len = 900 + rnd() * 200;
      var grad = g.createRadialGradient(cx, cy, 60, cx, cy, len);
      grad.addColorStop(0, 'rgba(255, 244, 214, ' + (0.18 + rnd() * 0.12) + ')');
      grad.addColorStop(1, 'rgba(255, 244, 214, 0)');
      g.fillStyle = grad;
      g.beginPath();
      g.moveTo(cx, cy);
      g.arc(cx, cy, len, a - wdt, a + wdt);
      g.closePath();
      g.fill();
    }
    c.style.left = (SUN_X - 1100) + 'px';
    c.style.top = (SUN_Y - 1100) + 'px';
  }

  /**
   * The real moon (sky.js): drawn in tonight's phase above the clock, its glow as bright as the moon is full, and not
   * there at all while it's below the horizon. Without sky.js or a place, the plain glow of before.
   */
  var MOON_X = 1615, MOON_Y = 125;   // the sky's top right, clear of the clock
  function moon() {
    var m = moonNow();
    if (m && m.alt < 0) return;   // set, or not yet risen: the stars have the sky
    var g = div('fx-moon', fx, m ? {opacity: (0.35 + 0.65 * m.lit).toFixed(2)} : null);
    if (!m) return;
    var size = 160, r = 30, c = canvas('fx-moondisc', size, size, fx, {left: (MOON_X - size / 2) + 'px', top: (MOON_Y - size / 2) + 'px'});
    var x = c.getContext('2d'), cx = size / 2, cy = size / 2, k = Math.cos(2 * Math.PI * m.phase);
    var halo = x.createRadialGradient(cx, cy, r * 0.9, cx, cy, size / 2);
    halo.addColorStop(0, 'rgba(235, 240, 255, ' + (0.28 * m.lit).toFixed(3) + ')');
    halo.addColorStop(1, 'rgba(235, 240, 255, 0)');
    x.fillStyle = halo;
    x.fillRect(0, 0, size, size);
    x.fillStyle = 'rgba(40, 48, 72, 0.35)';   // the dark side, just visible
    x.beginPath();
    x.arc(cx, cy, r, 0, Math.PI * 2);
    x.fill();
    if (m.lit > 0.02) {
      x.save();
      x.translate(cx, cy);
      if (!m.waxing) x.scale(-1, 1);   // waning: lit on the left (as seen from the northern hemisphere)
      var lit = x.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r);
      lit.addColorStop(0, '#FBFAF4');
      lit.addColorStop(1, '#D9DCE6');
      x.fillStyle = lit;
      x.beginPath();
      x.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, false);   // the lit half
      x.ellipse(0, 0, Math.abs(k) * r, r, 0, Math.PI / 2, -Math.PI / 2, k > 0);   // back along the terminator
      x.fill();
      x.restore();
    }
    g.style.left = (MOON_X - 600) + 'px';
    g.style.top = (MOON_Y - 600) + 'px';
  }

  var where = null;   // {lat, lon} from custom.js
  function moonNow() { return where && window.Sky ? Sky.moon(new Date(), where.lat, where.lon) : null; }
  function moonKey() { var m = moonNow(); return m ? (m.alt < 0 ? 'down' : Math.round(m.lit * 20)) : ''; }

  /** Northern lights over the city: soft green curtains with a violet top, swaying, only on clear nights with a strong Kp. */
  function aurora() {
    for (var k = 0; k < 2; k++) {
      var c = canvas('fx-aurora fx-aurora' + k, 2400, 640, fx), g = c.getContext('2d'), rnd = rng(41 + k * 13);
      try { g.filter = 'blur(14px)'; } catch (e) {}
      for (var i = 0; i < 46; i++) {
        var x0 = rnd() * 2400, w = 18 + rnd() * 70, top = 40 + rnd() * 160, bottom = 380 + rnd() * 230, a = 0.10 + rnd() * 0.22;
        var grad = g.createLinearGradient(0, top, 0, bottom);
        grad.addColorStop(0, 'rgba(170, 110, 255, 0)');
        grad.addColorStop(0.25, 'rgba(170, 110, 255, ' + (a * 0.6).toFixed(3) + ')');
        grad.addColorStop(0.6, 'rgba(90, 255, 170, ' + a.toFixed(3) + ')');
        grad.addColorStop(1, 'rgba(90, 255, 170, 0)');
        g.fillStyle = grad;
        g.fillRect(x0, top, w, bottom - top);
      }
      c.style.webkitAnimationDuration = c.style.animationDuration = (38 + k * 21) + 's';
    }
  }

  function stars() {
    if (withClip) return;
    // two sets that fade in and out against each other: a gentle twinkle with no drawing per frame
    for (var k = 0; k < 2; k++) {
      var c = canvas('fx-stars fx-stars' + k, W, H, fx), g = c.getContext('2d'), rnd = rng(17 + k * 31);
      for (var i = 0; i < 170; i++) {
        var x = rnd() * W, y = rnd() * H * 0.8, r = rnd() > 0.93 ? 1.8 : 1;
        g.fillStyle = 'rgba(255, 250, 240, ' + (0.4 + rnd() * 0.6) + ')';
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.fill();
      }
    }
  }

  function veil(css) { if (!withClip) div('fx-veil', fx, css); }

  function fog(dark) {
    if (withClip) return;
    for (var k = 0; k < 2; k++) {
      var c = document.createElement('canvas');
      c.width = 2600;
      c.height = H;
      var g = c.getContext('2d'), rnd = rng(23 + k * 7);
      for (var i = 0; i < 26; i++) {
        var x = rnd() * 2600, y = 380 + rnd() * 640, rx = 380 + rnd() * 520, ry = 60 + rnd() * 90;
        g.save();
        g.translate(x, y);
        g.scale(1, ry / rx);
        var grad = g.createRadialGradient(0, 0, 0, 0, 0, rx);
        var col = dark ? '150, 155, 160' : '245, 246, 247';
        grad.addColorStop(0, 'rgba(' + col + ', 0.42)');
        grad.addColorStop(1, 'rgba(' + col + ', 0)');
        g.fillStyle = grad;
        g.beginPath();
        g.arc(0, 0, rx, 0, Math.PI * 2);
        g.fill();
        g.restore();
      }
      c.className = 'fx-drift fx-fog';
      c.style.webkitAnimationDuration = c.style.animationDuration = (70 + k * 45) + 's';
      fx.appendChild(c);
    }
  }

  function lightning() {
    var flash = div('fx-flash', fx);
    function strike() {
      if (!paused && mode === 'full') {
        var steps = [[0.55, 0], [0.08, 90], [0.4, 170], [0, 460]];
        var stage = $('stage');
        steps.forEach(function (s) {
          setTimeout(function () {
            flash.style.opacity = s[0];
            // the glass and the clock catch the flash too (custom.css: .wx-flash)
            if (stage) stage.className = stage.className.replace(/ ?wx-flash/g, '') + (s[0] > 0.2 ? ' wx-flash' : '');
          }, s[1]);
        });
      }
      flashTimer = setTimeout(strike, 6000 + Math.random() * 11000);
    }
    flashTimer = setTimeout(strike, 2500);
  }

  // MARK: - Falling things: rain, snow, leaves (one half-size canvas, scaled up: soft, and light on the TV)

  function particles(kind, opts) {
    if (withClip) return;
    var c = canvas('fx-parts', W / 2, H / 2, fx), g = c.getContext('2d'), n = opts.n, list = [], i;
    if (mode === 'subtle') n = Math.round(n / 2);
    if (LITE) n = Math.round(n * 0.6);   // TVs the home screen runs in lite mode (1.5 GB, like this LG): fewer drops
    for (i = 0; i < n; i++) list.push(spawn(kind, opts, true));
    parts = {c: c, g: g, kind: kind, opts: opts, list: list};
    loop();
  }

  function spawn(kind, o, anywhere) {
    var w = W / 2, h = H / 2;
    var p = {x: Math.random() * (w + 200) - 100, y: anywhere ? Math.random() * h : -20 - Math.random() * 60};
    if (kind === 'rain') { p.v = 9 + Math.random() * 7; p.len = 9 + Math.random() * 9; }
    else if (kind === 'snow') { p.v = (o.fast ? 1.6 : 0.5) + Math.random() * (o.fast ? 1.8 : 0.9); p.r = 0.7 + Math.random() * 1.7; p.ph = Math.random() * 6.3; }
    else { p.v = 0.5 + Math.random() * 0.6; p.r = 3 + Math.random() * 3; p.ph = Math.random() * 6.3; p.rot = Math.random() * 6.3;
      var cols = o.colors || ['#C8642A', '#D9932E', '#A8452B', '#E0B04A']; p.col = cols[Math.floor(Math.random() * cols.length)]; }
    return p;
  }

  function loop(t) {
    if (!parts) return;
    raf = requestAnimationFrame(loop);
    if (paused || (t && t - last < (LITE ? 40 : 33))) return;   // about 30 frames a second (25 in lite)
    last = t || 0;
    var g = parts.g, o = parts.opts, w = W / 2, h = H / 2, list = parts.list, i, p;
    g.clearRect(0, 0, w, h);
    if (parts.kind === 'rain') {
      g.strokeStyle = o.color;
      g.lineWidth = 1;
      g.beginPath();
      for (i = 0; i < list.length; i++) {
        p = list[i];
        g.moveTo(p.x, p.y);
        g.lineTo(p.x - p.len * 0.18, p.y + p.len);
        p.y += p.v;
        p.x -= p.v * 0.18;
        if (p.y > h) list[i] = spawn('rain', o);
      }
      g.stroke();
    } else if (parts.kind === 'snow') {
      g.fillStyle = o.color;
      for (i = 0; i < list.length; i++) {
        p = list[i];
        p.ph += 0.03;
        p.y += p.v;
        p.x += Math.sin(p.ph) * 0.4 + (o.wind || 0);
        g.beginPath();
        g.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        g.fill();
        if (p.y > h + 5 || p.x > w + 60) list[i] = spawn('snow', o);
      }
    } else {
      for (i = 0; i < list.length; i++) {
        p = list[i];
        p.ph += 0.02;
        p.rot += 0.03;
        p.y += p.v;
        p.x += Math.sin(p.ph) * 0.8 + 0.3;
        g.save();
        g.translate(p.x, p.y);
        g.rotate(p.rot);
        g.fillStyle = p.col;
        g.beginPath();
        g.ellipse(0, 0, p.r, p.r * 0.5, 0, 0, Math.PI * 2);
        g.fill();
        g.restore();
        if (p.y > h + 10) list[i] = spawn('leaves', o);
      }
    }
  }

  // MARK: - The scenes

  var WHITE = 'rgba(255, 255, 255, 0.92)', WHITE_B = 'rgba(232, 236, 242, 0.85)';

  function scene(name, night, extra) {
    if (extra && extra.aurora && night && /clear|partly|aurora/.test(name)) aurora();   // before the moon and stars
    switch (name) {
      case 'clear-day':
        sun(1);
        break;
      case 'autumn-clear':
        sun(1);
        particles('leaves', {n: 26});
        break;
      case 'partly-cloudy':
        sun(0.6);
        cloudLayer({n: 7, y0: 60, y1: 300, r0: 50, r1: 95, top: WHITE, bottom: WHITE_B, seed: 3, h: 520}, 140, 0.95);
        break;
      case 'overcast':
        veil({background: 'rgba(120, 128, 136, 0.16)'});
        cloudLayer({n: 24, y0: -40, y1: 330, r0: 90, r1: 170, top: 'rgba(214, 218, 223, 0.85)', bottom: 'rgba(170, 176, 184, 0.8)', seed: 9, h: 620}, 160, 0.9);
        break;
      case 'rain':
      case 'rain-night':
        var dk = name === 'rain-night';
        cloudLayer({n: 26, y0: -60, y1: 300, r0: 90, r1: 170, top: dk ? 'rgba(52, 58, 70, 0.9)' : 'rgba(150, 157, 167, 0.88)',
          bottom: dk ? 'rgba(30, 34, 42, 0.9)' : 'rgba(112, 120, 131, 0.85)', seed: 13, h: 600}, 120, 0.95);
        particles('rain', {n: 230, color: dk ? 'rgba(200, 214, 230, 0.34)' : 'rgba(78, 92, 108, 0.32)'});
        break;
      case 'thunderstorm':
        // the whole background under a storm bank like the diorama's own clouds; the clock still reads (light lettering)
        cloudLayer({n: 46, y0: -80, y1: 1120, r0: 120, r1: 230, top: 'rgba(58, 66, 80, 0.9)', bottom: 'rgba(22, 26, 34, 0.92)', seed: 21,
          fill: ['rgba(20, 24, 31, 0.88)', 'rgba(10, 12, 16, 0.92)']}, 110, 1);
        lightning();
        particles('rain', {n: 300, color: 'rgba(196, 210, 228, 0.36)'});
        break;
      case 'snow':
        cloudLayer({n: 16, y0: -60, y1: 220, r0: 90, r1: 160, top: 'rgba(236, 239, 243, 0.8)', bottom: 'rgba(206, 211, 218, 0.75)', seed: 15, h: 460}, 170, 0.85);
        particles('snow', {n: 190, color: 'rgba(255, 255, 255, 0.92)'});
        break;
      case 'snow-night':
        moon();
        particles('snow', {n: 190, color: 'rgba(240, 244, 255, 0.85)'});
        break;
      case 'snow-squall':
        veil({background: 'linear-gradient(rgba(236, 240, 245, 0.5), rgba(236, 240, 245, 0.25))'});
        particles('snow', {n: 460, fast: true, wind: 2.6, color: 'rgba(255, 255, 255, 0.9)'});
        break;
      case 'fog':
        veil({background: 'rgba(225, 228, 231, 0.22)'});
        fog(night);
        break;
      case 'clear-night':
      case 'winter-clear-night':
        moon();
        stars();
        break;
      case 'partly-cloudy-night':
        moon();
        stars();
        cloudLayer({n: 7, y0: 60, y1: 300, r0: 50, r1: 95, top: 'rgba(150, 160, 185, 0.55)', bottom: 'rgba(70, 78, 98, 0.6)', seed: 4, h: 520}, 150, 0.9);
        break;
      case 'overcast-night':
      case 'winter-cloudy-night':
        cloudLayer({n: 26, y0: -60, y1: 330, r0: 90, r1: 170, top: 'rgba(70, 76, 90, 0.85)', bottom: 'rgba(36, 40, 50, 0.85)', seed: 19, h: 620}, 170, 0.9);
        break;
      case 'winter-clear-day':
        sun(1);
        break;
      case 'dusk':
        sun(1, 'dusk');
        break;
      case 'dawn':
        sun(0.8, 'dawn');
        fog(false);
        break;
      case 'spring-clear':
        sun(1);
        particles('leaves', {n: 22, colors: ['#F4C2D0', '#F8D7E0', '#FFFFFF', '#EBA8BC']});
        break;
      case 'summer-haze':
        sun(1);
        veil({background: 'rgba(255, 226, 180, 0.16)'});
        break;
      case 'drizzle':
        cloudLayer({n: 22, y0: -60, y1: 280, r0: 90, r1: 160, top: 'rgba(170, 176, 185, 0.85)', bottom: 'rgba(138, 145, 155, 0.8)', seed: 27, h: 580}, 150, 0.9);
        particles('rain', {n: 110, color: 'rgba(90, 104, 120, 0.26)'});
        break;
      case 'heavy-rain':
        cloudLayer({n: 34, y0: -80, y1: 420, r0: 110, r1: 200, top: 'rgba(84, 92, 106, 0.92)', bottom: 'rgba(46, 52, 62, 0.9)', seed: 31, h: 720}, 110, 1);
        particles('rain', {n: 420, color: 'rgba(196, 208, 222, 0.36)'});
        break;
      case 'freezing-rain':
        veil({background: 'rgba(200, 212, 225, 0.2)'});
        cloudLayer({n: 20, y0: -60, y1: 260, r0: 90, r1: 160, top: 'rgba(200, 206, 214, 0.85)', bottom: 'rgba(160, 168, 180, 0.8)', seed: 33, h: 560}, 160, 0.9);
        particles('rain', {n: 170, color: 'rgba(120, 140, 165, 0.3)'});
        break;
      case 'flurries':
        cloudLayer({n: 16, y0: -60, y1: 220, r0: 90, r1: 160, top: 'rgba(230, 233, 238, 0.8)', bottom: 'rgba(196, 202, 210, 0.75)', seed: 35, h: 460}, 170, 0.85);
        particles('snow', {n: 70, color: 'rgba(255, 255, 255, 0.92)'});
        break;
    }
  }

  // MARK: - Control

  function clear() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    parts = null;
    clearTimeout(flashTimer);
    if (fx) {
      var cs = fx.querySelectorAll('canvas');
      for (var i = 0; i < cs.length; i++) cs[i].width = 0;   // hand the memory back at once
      fx.innerHTML = '';
    }
  }

  /** The light the weather casts on the glass: sun, dusk, dawn, cloud, rain, ice, snow, storm, fog or night. */
  function light(name, night) {
    if (/^(clear-day|autumn-clear|spring-clear|summer-haze|winter-clear-day)$/.test(name)) return 'sun';
    if (name === 'dusk' || name === 'dawn') return name;
    if (name === 'thunderstorm') return 'storm';
    if (name === 'freezing-rain') return 'ice';
    if (/rain|drizzle/.test(name)) return 'rain';
    if (/snow|flurries|winter-/.test(name)) return 'snow';
    if (name === 'fog') return 'fog';
    if (/night/.test(name) || night) return 'night';
    return 'cloud';
  }

  /** maskOf: whose silhouette to keep clear (the clip's, when the scene borrows another scene's video). */
  var lastArgs = null;
  function set(name, night, m, maskOf, extra) {
    lastArgs = [name, night, m, maskOf, extra];
    mode = m || 'full';
    if (extra && extra.lat !== undefined) where = {lat: extra.lat, lon: extra.lon};
    withClip = !!(extra && extra.clip);
    var k = name + '|' + (night ? 1 : 0) + '|' + mode + '|' + (maskOf || '') + '|' + (extra && extra.aurora ? 'a' : '') + '|' + moonKey() + '|' + (withClip ? 'v' : '');
    var sky = $('sky');
    if (!fx && sky) { fx = document.createElement('div'); fx.id = 'fx'; }
    if (!fx) return;
    // always just under the night dimming, so it sits over the wallpaper and any moving diorama
    if (sky && fx.nextSibling !== $('wallshade')) sky.insertBefore(fx, $('wallshade'));
    if (k === key) return;
    key = k;
    clear();
    var stage = $('stage');
    if (stage) stage.className = stage.className.replace(/ ?wx-[a-z]+/g, '') + (name && mode !== 'off' ? ' wx-' + light(name, night) : '');
    if (!name || mode === 'off') return;
    var url = 'dio-' + (maskOf || name) + '-mask.png';
    fx.style.webkitMaskImage = 'url("' + url + '")';
    fx.style.maskImage = 'url("' + url + '")';
    fx.className = mode === 'subtle' ? 'subtle' : '';
    if (window.fmtvMark) fmtvMark('weather effects rebuilt');
    scene(name, night, extra);
  }
  // the moon moves: look again every ten minutes (a redraw only when its phase or rising changed what's shown)
  setInterval(function () { if (lastArgs) set.apply(null, lastArgs); }, 10 * 60000);

  function pause(on) {
    paused = !!on;
    if (fx) fx.className = (mode === 'subtle' ? 'subtle' : '') + (paused ? ' paused' : '');
  }

  return {set: set, pause: pause};
})();
