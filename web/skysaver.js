/*
 * The night screensaver (local addition): tonight's real sky over home, facing south. The stars and constellations
 * where they are right now (they turn with the Earth: redrawn every minute), the Milky Way, the planets, the moon in its
 * phase, and the space station's track when it passes. Star data: web/skydata.js (from d3-celestial, BSD). Planets from
 * JPL's approximate orbital elements, checked against the Astronomy Engine library: within 0.1 degree, 2025-2030.
 * Plain ES5 for webOS 5.
 *
 *   SkySaver.draw(box, lat, lon, info)   draws into box (the screensaver), returns the facts for its caption
 */
var SkySaver = (function () {
  'use strict';

  var RAD = Math.PI / 180, W = 1920, H = 1080;

  // MARK: - Where things are

  var EL = {   // JPL's approximate Keplerian elements (Standish), J2000: a, e, I, L, perihelion, node, then their rates a century
    Mercury: [0.38709927, 0.20563593, 7.00497902, 252.25032350, 77.45779628, 48.33076593, 0.00000037, 0.00001906, -0.00594749, 149472.67411175, 0.16047689, -0.12534081],
    Venus: [0.72333566, 0.00677672, 3.39467605, 181.97909950, 131.60246718, 76.67984255, 0.00000390, -0.00004107, -0.00078890, 58517.81538729, 0.00268329, -0.27769418],
    Earth: [1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0.0, 0.00000562, -0.00004392, -0.01294668, 35999.37244981, 0.32327364, 0.0],
    Mars: [1.52371034, 0.09339410, 1.84969142, -4.55343205, -23.94362959, 49.55953891, 0.00001847, 0.00007882, -0.00813131, 19140.30268499, 0.44441088, -0.29257343],
    Jupiter: [5.20288700, 0.04838624, 1.30439695, 34.39644051, 14.72847983, 100.47390909, -0.00011607, -0.00013253, -0.00183714, 3034.74612775, 0.21252668, 0.20469106],
    Saturn: [9.53667594, 0.05386179, 2.48599187, 49.95424423, 92.59887831, 113.66242448, -0.00125060, -0.00050991, 0.00193609, 1222.49362201, -0.41897216, -0.28867794]
  };
  var PLANETS = [['Venus', '#FFF6E0', 5.5], ['Jupiter', '#FFE9C4', 5], ['Mars', '#FFB08A', 4], ['Saturn', '#F2DDB0', 4.2], ['Mercury', '#E8E0D4', 3.4]];

  function helio(name, T) {
    var k = EL[name], a = k[0] + k[6] * T, e = k[1] + k[7] * T, I = (k[2] + k[8] * T) * RAD, L = k[3] + k[9] * T,
      wb = k[4] + k[10] * T, O = (k[5] + k[11] * T) * RAD, w = wb * RAD - O, M = ((L - wb) % 360) * RAD, E = M;
    for (var i = 0; i < 10; i++) E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    var x = a * (Math.cos(E) - e), y = a * Math.sqrt(1 - e * e) * Math.sin(E);
    var cw = Math.cos(w), sw = Math.sin(w), cO = Math.cos(O), sO = Math.sin(O), cI = Math.cos(I), sI = Math.sin(I);
    return [(cw * cO - sw * sO * cI) * x + (-sw * cO - cw * sO * cI) * y,
            (cw * sO + sw * cO * cI) * x + (-sw * sO + cw * cO * cI) * y,
            (sw * sI) * x + (cw * sI) * y];
  }

  /** A planet's right ascension and declination, in degrees (J2000). */
  function planet(name, t) {
    var T = (t / 86400000 + 2440587.5 - 2451545) / 36525, p = helio(name, T), g = helio('Earth', T);
    var x = p[0] - g[0], y = p[1] - g[1], z = p[2] - g[2], ob = 23.43928 * RAD;
    var Y = y * Math.cos(ob) - z * Math.sin(ob), Z = y * Math.sin(ob) + z * Math.cos(ob);
    return {ra: (Math.atan2(Y, x) / RAD + 360) % 360, dec: Math.atan2(Z, Math.sqrt(x * x + Y * Y)) / RAD};
  }

  /** The moon's right ascension and declination (to about a degree, as in sky.js). */
  function moonEq(t) {
    var d = t / 86400000 + 2440587.5 - 2451545;
    var L = RAD * (218.316 + 13.176396 * d), M = RAD * (134.963 + 13.064993 * d), F = RAD * (93.272 + 13.229350 * d);
    var l = L + RAD * 6.289 * Math.sin(M), b = RAD * 5.128 * Math.sin(F), ob = 23.4397 * RAD;
    var ra = Math.atan2(Math.sin(l) * Math.cos(ob) - Math.tan(b) * Math.sin(ob), Math.cos(l));
    var dec = Math.asin(Math.sin(b) * Math.cos(ob) + Math.cos(b) * Math.sin(ob) * Math.sin(l));
    return {ra: (ra / RAD + 360) % 360, dec: dec / RAD};
  }

  /** Altitude and azimuth (degrees; azimuth from north through east) of a point of the sky. */
  function horiz(ra, dec, lst, sp, cp) {
    var Hh = (lst - ra) * RAD, de = dec * RAD, sd = Math.sin(de), cd = Math.cos(de), cH = Math.cos(Hh);
    var alt = Math.asin(sp * sd + cp * cd * cH);
    var az = Math.atan2(-Math.sin(Hh) * cd, cp * sd - sp * cd * cH);
    return [alt / RAD, (az / RAD + 360) % 360];
  }

  // MARK: - The view: facing south, the horizon flat along the bottom, the sky rising to near the zenith at the top.
  // Altitude is linear up the screen; azimuth spreads across it, drawn in toward the middle as the sky climbs (as a
  // dome does), so constellations high up keep roughly their shapes. About 170 degrees across, 0 to 78 degrees up.

  var S = 11.5, CX = 960, HY = 905;   // pixels a degree, the screen's middle, the horizon's height

  function project(alt, az) {
    if (alt < -12) return null;
    var dz = ((az - 180 + 540) % 360) - 180;
    if (Math.abs(dz) > 120) return null;
    var squeeze = Math.sqrt(Math.max(0.05, Math.cos(Math.max(0, alt) * RAD)));
    return [CX + S * dz * squeeze, HY - S * alt];
  }

  /** The same, for the Milky Way's big outlines: never cut (clamped far off screen instead), so a shape that runs
   * behind us or below the horizon still closes cleanly. */
  function projectWide(alt, az) {
    var dz = Math.max(-140, Math.min(140, ((az - 180 + 540) % 360) - 180)), a = Math.max(-25, alt);
    var squeeze = Math.sqrt(Math.max(0.05, Math.cos(Math.max(0, a) * RAD)));
    return [CX + S * dz * squeeze, HY - S * a];
  }

  function onScreen(p, m) { return p && p[0] > -m && p[0] < W + m && p[1] > -m && p[1] < H + m; }

  // MARK: - Drawing

  function colourOf(bv) {
    return bv < 0 ? '191,212,255' : bv < 0.3 ? '228,236,255' : bv < 0.6 ? '255,247,234' : bv < 1.0 ? '255,226,184' : '255,196,138';
  }

  function canvas(box, cls, w, h) {
    var c = box.querySelector('canvas.' + cls);
    if (!c) {
      c = document.createElement('canvas');
      c.className = cls;
      box.appendChild(c);
    }
    c.width = w;
    c.height = h;
    return c;
  }

  function draw(box, lat, lon, info) {
    var D = window.SKYDATA, t = Date.now(), facts = {planets: [], moon: null, iss: null};
    if (!D) return facts;
    var d = t / 86400000 + 2440587.5 - 2451545, lst = ((280.46061837 + 360.98564736629 * d + lon) % 360 + 360) % 360;
    var sp = Math.sin(lat * RAD), cp = Math.cos(lat * RAD);
    function at(ra, dec) { var h = horiz(ra, dec, lst, sp, cp); return {alt: h[0], az: h[1], p: project(h[0], h[1])}; }

    var c = canvas(box, 'sky-main', W, H), g = c.getContext('2d'), i, j, a, p;
    // the sky: deep blue overhead, lighter and a little warm down at the city's horizon
    var bg = g.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#04060F');
    bg.addColorStop(0.55, '#0A1124');
    bg.addColorStop(0.82, '#16203A');
    bg.addColorStop(1, '#2A2A3A');
    g.fillStyle = bg;
    g.fillRect(0, 0, W, H);

    // the Milky Way: its five brightness levels, soft (drawn small, then scaled up)
    var mw = canvas(box, 'sky-mw', W / 6, H / 6), m = mw.getContext('2d'), levels = ['ol1', 'ol2', 'ol3', 'ol4', 'ol5'];
    m.scale(1 / 6, 1 / 6);
    try { m.filter = 'blur(3px)'; } catch (e) {}   // soft edges (canvas filters: Chromium 52 and up)
    for (j = 0; j < levels.length; j++) {
      var rings = D.mw[levels[j]] || [];
      m.beginPath();
      for (i = 0; i < rings.length; i++) {
        var ring = rings[i], started = false;
        for (var k = 0; k < ring.length; k += 2) {
          var hz = horiz(ring[k], ring[k + 1], lst, sp, cp), q = projectWide(hz[0], hz[1]);
          if (!started) { m.moveTo(q[0], q[1]); started = true; } else m.lineTo(q[0], q[1]);
        }
        m.closePath();
      }
      m.fillStyle = 'rgba(190, 205, 255, 0.045)';
      m.fill('evenodd');
    }

    // constellation lines
    g.strokeStyle = 'rgba(143, 211, 204, 0.2)';
    g.lineWidth = 1.2;
    g.beginPath();
    for (var cid in D.lines) {
      if (!D.lines.hasOwnProperty(cid)) continue;
      var segs = D.lines[cid];
      for (i = 0; i < segs.length; i++) {
        var prev = null;
        for (k = 0; k < segs[i].length; k += 2) {
          a = at(segs[i][k], segs[i][k + 1]);
          var cur = a.alt > -1 && onScreen(a.p, 200) ? a.p : null;
          if (cur && prev) { g.moveTo(prev[0], prev[1]); g.lineTo(cur[0], cur[1]); }
          prev = cur;
        }
      }
    }
    g.stroke();

    // stars
    var tw = canvas(box, 'sky-twinkle', W, H), tg = tw.getContext('2d'), st = D.stars;
    for (i = 0; i < st.length; i += 4) {
      a = at(st[i], st[i + 1]);
      if (a.alt < 0 || !onScreen(a.p, 4)) continue;
      var mag = st[i + 2], r = Math.max(0.55, Math.min(3.6, 2.5 - 0.4 * mag)), col = colourOf(st[i + 3]);
      var fade = a.alt < 12 ? 0.45 + 0.55 * a.alt / 12 : 1;   // dimmer low down, in the city's haze
      g.fillStyle = 'rgba(' + col + ',' + ((mag > 4 ? 0.55 : 0.95) * fade).toFixed(2) + ')';
      g.beginPath();
      g.arc(a.p[0], a.p[1], r, 0, 6.283);
      g.fill();
      if (mag < 2.2) {   // the bright ones get a glow (on their own layer, which twinkles)
        var gl = tg.createRadialGradient(a.p[0], a.p[1], 0, a.p[0], a.p[1], r * 6);
        gl.addColorStop(0, 'rgba(' + col + ',' + (0.5 * fade).toFixed(2) + ')');
        gl.addColorStop(1, 'rgba(' + col + ',0)');
        tg.fillStyle = gl;
        tg.fillRect(a.p[0] - r * 6, a.p[1] - r * 6, r * 12, r * 12);
      }
    }

    g.textAlign = 'center';
    // constellation names, the well-known ones, small and quiet
    g.font = '600 17px Fraunces, Georgia, serif';
    g.fillStyle = 'rgba(143, 211, 204, 0.5)';
    for (cid in D.cons) {
      if (!D.cons.hasOwnProperty(cid)) continue;
      var cn = D.cons[cid];
      if (cn[3] > 1) continue;
      a = at(cn[1], cn[2]);
      if (a.alt < 10 || !onScreen(a.p, -60)) continue;
      spaced(g, cn[0].toUpperCase(), a.p[0], a.p[1], 3);
    }
    // the brightest stars by name
    g.font = 'italic 20px Fraunces, Georgia, serif';
    g.fillStyle = 'rgba(243, 237, 228, 0.62)';
    g.textAlign = 'left';
    for (i = 0; i < D.names.length; i++) {
      a = at(D.names[i][0], D.names[i][1]);
      if (a.alt < 4 || !onScreen(a.p, -40)) continue;
      g.fillText(D.names[i][2], a.p[0] + 10, a.p[1] - 8);
    }

    // planets
    for (i = 0; i < PLANETS.length; i++) {
      var pl = planet(PLANETS[i][0], t);
      a = at(pl.ra, pl.dec);
      if (a.alt < 1) continue;
      facts.planets.push({name: PLANETS[i][0], alt: a.alt, az: a.az});
      if (!onScreen(a.p, -10)) continue;
      var pg = tg.createRadialGradient(a.p[0], a.p[1], 0, a.p[0], a.p[1], 26);
      pg.addColorStop(0, 'rgba(255, 240, 210, 0.45)');
      pg.addColorStop(1, 'rgba(255, 240, 210, 0)');
      tg.fillStyle = pg;
      tg.fillRect(a.p[0] - 26, a.p[1] - 26, 52, 52);
      g.fillStyle = PLANETS[i][1];
      g.beginPath();
      g.arc(a.p[0], a.p[1], PLANETS[i][2], 0, 6.283);
      g.fill();
      g.font = '600 22px Fraunces, Georgia, serif';
      g.fillStyle = 'rgba(255, 233, 196, 0.9)';
      g.fillText(PLANETS[i][0], a.p[0] + 14, a.p[1] + 7);
    }

    // the moon, in its phase
    if (window.Sky) {
      var mi = Sky.moon(new Date(t), lat, lon), me = moonEq(t);
      a = at(me.ra, me.dec);
      if (a.alt > 0) {
        facts.moon = {lit: mi.lit, waxing: mi.waxing, alt: a.alt, az: a.az};
        if (onScreen(a.p, -30)) moonDisc(g, tg, a.p[0], a.p[1], 22, mi);
      }
    }

    // the space station: its next pass in the coming three hours, as a dotted track, and where it is during the pass
    var o = issElements();
    if (o && window.Sky && info.iss) {
      var pass = info.iss;
      g.setLineDash([3, 9]);
      g.strokeStyle = 'rgba(143, 211, 204, 0.75)';
      g.lineWidth = 2.5;
      g.beginPath();
      var moved = false;
      for (var tt = pass.rise; tt <= pass.set; tt += 15000) {
        var lk = Sky._look(o, Sky._site(lat, lon, tt), tt), q = project(lk.el, lk.az);
        if (!q) { moved = false; continue; }
        if (!moved) { g.moveTo(q[0], q[1]); moved = true; } else g.lineTo(q[0], q[1]);
      }
      g.stroke();
      g.setLineDash([]);
      var now = t >= pass.rise && t <= pass.set ? Sky._look(o, Sky._site(lat, lon, t), t) : null;
      var lab = Sky._look(o, Sky._site(lat, lon, pass.top), pass.top), lp = project(lab.el, lab.az);
      if (now) {
        var np = project(now.el, now.az);
        if (np) { g.fillStyle = '#FFFFFF'; g.beginPath(); g.arc(np[0], np[1], 5, 0, 6.283); g.fill(); }
      }
      if (lp && onScreen(lp, -40)) {
        g.font = '600 20px Fraunces, Georgia, serif';
        g.fillStyle = 'rgba(143, 211, 204, 0.95)';
        g.fillText('Space station', lp[0] + 14, lp[1] - 12);
      }
    }

    // the ground: a dark band below the horizon, the compass points along it (its own layer, over the Milky Way and
    // the glows, so nothing shows below the horizon)
    var gc = canvas(box, 'sky-ground', W, H);
    g = gc.getContext('2d');
    g.beginPath();
    var first = true;
    for (var az = 50; az <= 310; az += 5) {
      p = project(0, az);
      if (!p) continue;
      if (first) { g.moveTo(p[0], p[1]); first = false; } else g.lineTo(p[0], p[1]);
    }
    g.lineTo(W + 50, H + 50);
    g.lineTo(-50, H + 50);
    g.closePath();
    var gr = g.createLinearGradient(0, 860, 0, H);
    gr.addColorStop(0, '#0B0D14');
    gr.addColorStop(1, '#05060A');
    g.fillStyle = gr;
    g.fill();
    g.strokeStyle = 'rgba(255, 200, 150, 0.18)';
    g.lineWidth = 1.5;
    g.stroke();
    g.textAlign = 'center';
    g.font = '600 20px Fraunces, Georgia, serif';
    g.fillStyle = 'rgba(243, 237, 228, 0.5)';
    var pts = [[90, 'E'], [135, 'SE'], [180, 'S'], [225, 'SW'], [270, 'W']];
    for (i = 0; i < pts.length; i++) {
      p = project(0, pts[i][0]);
      if (onScreen(p, -20)) spaced(g, pts[i][1], p[0], p[1] + 34, 4);
    }
    return facts;
  }

  /** Letter-spaced text (canvas has no letter-spacing on old Chromium). */
  function spaced(g, text, x, y, gap) {
    var w = 0, i, ws = [];
    for (i = 0; i < text.length; i++) { ws.push(g.measureText(text.charAt(i)).width); w += ws[i] + (i ? gap : 0); }
    var align = g.textAlign, cx = x - w / 2;
    g.textAlign = 'left';
    for (i = 0; i < text.length; i++) { g.fillText(text.charAt(i), cx, y); cx += ws[i] + gap; }
    g.textAlign = align;
  }

  function moonDisc(g, tg, x, y, r, m) {
    var halo = tg.createRadialGradient(x, y, r, x, y, r * 5);
    halo.addColorStop(0, 'rgba(225, 232, 255, ' + (0.35 * m.lit + 0.05).toFixed(2) + ')');
    halo.addColorStop(1, 'rgba(225, 232, 255, 0)');
    tg.fillStyle = halo;
    tg.fillRect(x - r * 5, y - r * 5, r * 10, r * 10);
    g.fillStyle = 'rgba(40, 48, 72, 0.6)';
    g.beginPath();
    g.arc(x, y, r, 0, 6.283);
    g.fill();
    if (m.lit < 0.02) return;
    var k = Math.cos(2 * Math.PI * m.phase);
    g.save();
    g.translate(x, y);
    if (!m.waxing) g.scale(-1, 1);
    var lit = g.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r);
    lit.addColorStop(0, '#FBFAF4');
    lit.addColorStop(1, '#D9DCE6');
    g.fillStyle = lit;
    g.beginPath();
    g.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, false);
    g.ellipse(0, 0, Math.abs(k) * r, r, 0, Math.PI / 2, -Math.PI / 2, k > 0);
    g.fill();
    g.restore();
  }

  function issElements() {
    try {
      var c = JSON.parse(localStorage.getItem('fmtv.sky.iss'));
      return c && c.tle && window.Sky ? Sky.parse(c.tle) : null;
    } catch (e) { return null; }
  }

  return {draw: draw, planet: planet, horiz: horiz, project: project};
})();
if (typeof module !== 'undefined') module.exports = SkySaver;
