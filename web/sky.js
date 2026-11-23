/*
 * The sky events (local addition): the real moon, the ISS passing over, and the aurora. Plain ES5 for webOS 5.
 *
 *   Sky.moon(date, lat, lon)        {phase 0..1 (0 new, 0.5 full), lit 0..1, waxing, alt (degrees)}
 *   Sky.sun(date, lat, lon)         {alt, az} in degrees
 *   Sky.passes(tle, from, hours, lat, lon)   visible ISS passes: [{rise, top, set (ms), maxEl, riseAz, setAz}]
 *   Sky.iss(done)                   today's ISS orbit (two-line elements), fetched at most every 12 hours
 *   Sky.kp(done)                    NOAA's planetary Kp: {now, peak (next 9 hours)}, at most every 30 minutes
 *
 * The positions follow the low-precision formulas also used by SunCalc (the moon to about a degree). The ISS is moved
 * along its orbit from the elements with Earth's flattening (J2) and the decay term in the elements: within a minute
 * of the full model over a day, which is plenty for "look up in 4 minutes".
 */
var Sky = (function () {
  'use strict';

  var RAD = Math.PI / 180, DAY = 86400000, J2000 = 2451545, OBL = RAD * 23.4397;

  function days(date) { return date / DAY + 2440587.5 - J2000; }   // days since J2000.0
  function sidereal(d, lw) { return RAD * (280.16 + 360.9856235 * d) - lw; }
  function altitude(H, phi, dec) { return Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H)); }
  function azimuth(H, phi, dec) { return Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi)); }
  function raOf(l, b) { return Math.atan2(Math.sin(l) * Math.cos(OBL) - Math.tan(b) * Math.sin(OBL), Math.cos(l)); }
  function decOf(l, b) { return Math.asin(Math.sin(b) * Math.cos(OBL) + Math.cos(b) * Math.sin(OBL) * Math.sin(l)); }

  function sunLon(d) {
    var M = RAD * (357.5291 + 0.98560028 * d);
    var C = RAD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
    return M + C + RAD * 102.9372 + Math.PI;
  }

  function sun(date, lat, lon) {
    var d = days(+date), L = sunLon(d), ra = raOf(L, 0), dec = decOf(L, 0);
    var H = sidereal(d, RAD * -lon) - ra, phi = RAD * lat;
    // azimuth from north, clockwise
    return {alt: altitude(H, phi, dec) / RAD, az: (azimuth(H, phi, dec) / RAD + 180) % 360};
  }

  function moon(date, lat, lon) {
    var d = days(+date);
    var L = RAD * (218.316 + 13.176396 * d), M = RAD * (134.963 + 13.064993 * d), F = RAD * (93.272 + 13.229350 * d);
    var l = L + RAD * 6.289 * Math.sin(M), b = RAD * 5.128 * Math.sin(F);
    var ra = raOf(l, b), dec = decOf(l, b), H = sidereal(d, RAD * -lon) - ra;
    // phase from the sun-moon elongation in ecliptic longitude
    var elong = ((l - sunLon(d)) / RAD % 360 + 360) % 360;
    return {phase: elong / 360, lit: (1 - Math.cos(elong * RAD)) / 2, waxing: elong < 180,
      alt: altitude(H, RAD * lat, dec) / RAD};
  }

  // MARK: - The ISS

  var MU = 398600.4418, RE = 6378.137, J2 = 0.00108262998905, FLAT = 1 / 298.257223563;

  /** Two-line elements to what the orbit needs. */
  function parse(tle) {
    var lines = String(tle || '').split(/\r?\n/).filter(function (s) { return /^[12] /.test(s); });
    if (lines.length < 2) return null;
    var l1 = lines[0], l2 = lines[1];
    var yy = parseInt(l1.substr(18, 2), 10), doy = parseFloat(l1.substr(20, 12));
    var epoch = Date.UTC(yy < 57 ? 2000 + yy : 1900 + yy, 0, 1) + (doy - 1) * DAY;
    var ndot = parseFloat(l1.substr(33, 10));   // half the rate of change of mean motion, revolutions a day squared
    var o = {epoch: epoch, ndot: ndot, i: parseFloat(l2.substr(8, 8)) * RAD, raan: parseFloat(l2.substr(17, 8)) * RAD,
      e: parseFloat('0.' + l2.substr(26, 7)), argp: parseFloat(l2.substr(34, 8)) * RAD, M: parseFloat(l2.substr(43, 8)) * RAD,
      n: parseFloat(l2.substr(52, 11))};
    if (isNaN(o.n) || isNaN(o.i) || isNaN(o.epoch)) return null;
    var nRad = o.n * 2 * Math.PI / 86400;
    o.a = Math.pow(MU / (nRad * nRad), 1 / 3);
    var p = o.a * (1 - o.e * o.e), k = 1.5 * J2 * (RE / p) * (RE / p) * nRad;
    o.dRaan = -k * Math.cos(o.i);   // radians a second
    o.dArgp = 0.5 * k * (5 * Math.cos(o.i) * Math.cos(o.i) - 1);
    return o;
  }

  /** Earth-centred inertial position (km) at a time. */
  function eci(o, t) {
    var dt = (t - o.epoch) / 1000, dd = dt / 86400;
    var revs = o.n * dd + o.ndot * dd * dd;
    var M = o.M + revs * 2 * Math.PI, E = M;
    for (var k = 0; k < 8; k++) E = E - (E - o.e * Math.sin(E) - M) / (1 - o.e * Math.cos(E));
    var nNow = o.n + 2 * o.ndot * dd, nRad = nNow * 2 * Math.PI / 86400, a = Math.pow(MU / (nRad * nRad), 1 / 3);
    var xp = a * (Math.cos(E) - o.e), yp = a * Math.sqrt(1 - o.e * o.e) * Math.sin(E);
    var w = o.argp + o.dArgp * dt, W = o.raan + o.dRaan * dt;
    var cw = Math.cos(w), sw = Math.sin(w), cW = Math.cos(W), sW = Math.sin(W), ci = Math.cos(o.i), si = Math.sin(o.i);
    return [
      (cW * cw - sW * sw * ci) * xp + (-cW * sw - sW * cw * ci) * yp,
      (sW * cw + cW * sw * ci) * xp + (-sW * sw + cW * cw * ci) * yp,
      (sw * si) * xp + (cw * si) * yp
    ];
  }

  function gmst(t) {
    var T = (t / DAY + 2440587.5 - J2000) / 36525;
    var s = 67310.54841 + (876600 * 3600 + 8640184.812866) * T + 0.093104 * T * T - 6.2e-6 * T * T * T;
    return ((s % 86400) / 240 * RAD + 2 * Math.PI) % (2 * Math.PI);
  }

  /** The observer in the same frame, plus the local up/north/east at that moment. */
  function site(lat, lon, t) {
    var phi = lat * RAD, e2 = FLAT * (2 - FLAT), N = RE / Math.sqrt(1 - e2 * Math.sin(phi) * Math.sin(phi));
    var th = gmst(t) + lon * RAD;
    var r = [N * Math.cos(phi) * Math.cos(th), N * Math.cos(phi) * Math.sin(th), N * (1 - e2) * Math.sin(phi)];
    return {r: r, sp: Math.sin(phi), cp: Math.cos(phi), st: Math.sin(th), ct: Math.cos(th)};
  }

  function look(o, s, t) {
    var p = eci(o, t), dx = p[0] - s.r[0], dy = p[1] - s.r[1], dz = p[2] - s.r[2];
    var S = s.sp * s.ct * dx + s.sp * s.st * dy - s.cp * dz;   // south
    var E = -s.st * dx + s.ct * dy;
    var Z = s.cp * s.ct * dx + s.cp * s.st * dy + s.sp * dz;   // up
    var range = Math.sqrt(S * S + E * E + Z * Z);
    return {el: Math.asin(Z / range) / RAD, az: (Math.atan2(E, -S) / RAD + 360) % 360, p: p};
  }

  /** In Earth's shadow? (a cylinder behind the planet: close enough to seconds at the edges) */
  function shadowed(p, t) {
    var L = sunLon(days(t)), u = [Math.cos(L), Math.sin(L) * Math.cos(OBL), Math.sin(L) * Math.sin(OBL)];
    var dot = p[0] * u[0] + p[1] * u[1] + p[2] * u[2];
    if (dot > 0) return false;
    var x = p[0] - dot * u[0], y = p[1] - dot * u[1], z = p[2] - dot * u[2];
    return Math.sqrt(x * x + y * y + z * z) < RE;
  }

  /** Passes over the next hours where the station is above 10°, lit by the sun, with the sky dark. */
  function passes(tle, from, hours, lat, lon) {
    var o = typeof tle === 'string' ? parse(tle) : tle, out = [], cur = null, step = 20000;
    if (!o) return out;
    for (var t = from; t < from + hours * 3600000; t += step) {
      var s = site(lat, lon, t), lk = look(o, s, t);
      var seen = lk.el >= 10 && !shadowed(lk.p, t) && sun(t, lat, lon).alt < -6;
      if (seen) {
        if (!cur) cur = {rise: t, riseAz: lk.az, top: t, maxEl: lk.el};
        if (lk.el > cur.maxEl) { cur.maxEl = lk.el; cur.top = t; }
        cur.set = t;
        cur.setAz = lk.az;
      } else if (cur) { out.push(cur); cur = null; }
    }
    if (cur) out.push(cur);
    return out;
  }

  var COMPASS = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];
  function compass(az) { return COMPASS[Math.round(az / 45) % 8]; }

  // MARK: - Fetching (cached in localStorage)

  function store(k, v) { try { localStorage.setItem('fmtv.sky.' + k, JSON.stringify(v)); } catch (e) {} }
  function stored(k) { try { return JSON.parse(localStorage.getItem('fmtv.sky.' + k)); } catch (e) { return null; } }

  function get(url, done) {
    var x = new XMLHttpRequest(), finished = false;
    function end(err, text) { if (finished) return; finished = true; done(err, text); }
    try {
      x.open('GET', url, true);
      x.timeout = 15000;
      x.onload = function () { end(x.status >= 200 && x.status < 300 ? null : 'http ' + x.status, x.responseText); };
      x.onerror = function () { end('network'); };
      x.ontimeout = function () { end('timeout'); };
      x.send();
    } catch (e) { end('error'); }
  }

  var issTried = 0;
  /** ISS elements: CelesTrak first, a JSON mirror of the same elements second. */
  function iss(done) {
    var c = stored('iss');
    if (c && Date.now() - c.at < 12 * 3600000) return done(c.tle);
    if (Date.now() - issTried < 30 * 60000) return done(c ? c.tle : '');
    issTried = Date.now();
    get('https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE', function (err, text) {
      if (!err && parse(text)) { store('iss', {at: Date.now(), tle: text}); return done(text); }
      get('https://tle.ivanstanojevic.me/api/tle/25544', function (err2, body) {
        var j = null;
        try { j = JSON.parse(body); } catch (e) {}
        var tle = j && j.line1 ? j.line1 + '\n' + j.line2 : '';
        if (!err2 && parse(tle)) { store('iss', {at: Date.now(), tle: tle}); return done(tle); }
        done(c ? c.tle : '');
      });
    });
  }

  var kpTried = 0;
  /** NOAA's Kp: observed, estimated and predicted 3-hour values; rows are arrays (header first) or objects. */
  function kp(done) {
    var c = stored('kp');
    if (c && Date.now() - c.at < 30 * 60000) return done(c);
    if (Date.now() - kpTried < 10 * 60000) return done(c);
    kpTried = Date.now();
    get('https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json', function (err, text) {
      var rows = null;
      try { rows = JSON.parse(text); } catch (e) {}
      if (err || !rows || !rows.length) return done(c);
      var head = rows[0] instanceof Array ? rows[0] : null, ti = 0, ki = 1, list = [];
      if (head) { ti = head.indexOf('time_tag'); ki = head.indexOf('kp'); if (ki < 0) ki = head.indexOf('Kp'); }
      for (var i = head ? 1 : 0; i < rows.length; i++) {
        var r = rows[i], tt = head ? r[ti] : (r.time_tag || r.timeTag), kv = head ? r[ki] : (r.kp !== undefined ? r.kp : r.Kp);
        var t = Date.parse(String(tt).replace(' ', 'T') + (/Z|[+-]\d\d:?\d\d$/.test(tt) ? '' : 'Z')), v = parseFloat(kv);
        if (!isNaN(t) && !isNaN(v)) list.push({t: t, kp: v});
      }
      var now = Date.now(), cur = 0, peak = 0;
      for (var j = 0; j < list.length; j++) {
        var x = list[j];
        if (x.t <= now && x.t > now - 3 * 3600000) cur = Math.max(cur, x.kp);
        if (x.t > now - 3 * 3600000 && x.t < now + 9 * 3600000) peak = Math.max(peak, x.kp);
      }
      var res = {at: Date.now(), now: cur, peak: peak};
      store('kp', res);
      done(res);
    });
  }

  return {sun: sun, moon: moon, parse: parse, passes: passes, compass: compass, iss: iss, kp: kp, _look: look, _site: site, _eci: eci};
})();
if (typeof module !== 'undefined') module.exports = Sky;
