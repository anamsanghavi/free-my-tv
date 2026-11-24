/*
 * The living-room additions (local, not part of Free My TV upstream). Plain ES5 for webOS 5's older Chromium.
 *  - Space photos from NASA's Image and Video Library as the daytime wallpaper (a new one every 30 minutes, its
 *    title small in the top left); a slow starfield at night
 *  - Environment Canada warnings for the home city, as a banner across the top
 *  - A film of the day in the bottom drawer (TMDB: the key typed on the TV), with where it streams in Canada
 *  - A screensaver of recent space photos with a film quote on each
 *  - Modes in the drawer: Movie night, Study (25/5 Pomodoro + instrumental radio), Old Bollywood melodies (YouTube)
 * home.js calls in here at a few places marked "Local addition".
 */
var Custom = (function () {
  'use strict';

  var NASA_KEY = String((window.CONFIG && CONFIG.nasaKey) || 'DEMO_KEY');
  // Study's sounds. ↑ ↓ switch between the saved ones; ← opens the picker: genres from Radio Browser, the open, community-run
  // station directory (no key, no account), plus noise made right here. SomaFM is listener-supported, no ads.
  var RB_MIRRORS = ['https://de1.api.radio-browser.info', 'https://nl1.api.radio-browser.info', 'https://at1.api.radio-browser.info'];
  var STUDY_DEFAULT = [
    {name: 'Fluid · instrumental hip-hop', url: 'https://ice1.somafm.com/fluid-128-mp3'},
    {name: 'Groove Salad · chilled downtempo', url: 'https://ice1.somafm.com/groovesalad-128-mp3'},
    {name: 'Sonic Universe · modern jazz', url: 'https://ice1.somafm.com/sonicuniverse-128-mp3'},
    {name: 'Bossa Beyond · bossa nova', url: 'https://ice1.somafm.com/bossa-128-mp3'},
    {name: 'Deep Space One · ambient', url: 'https://ice1.somafm.com/deepspaceone-128-mp3'},
    {name: 'Drone Zone · slow ambient', url: 'https://ice1.somafm.com/dronezone-128-mp3'},
    {name: 'Rain and distant thunder', url: 'sound-thunderstorm.ogg', loop: true},
    {name: 'Brown noise', noise: 'brown'}
  ];
  var NOISES = [{name: 'Brown noise', noise: 'brown', meta: 'deep, like a far waterfall'},
    {name: 'Pink noise', noise: 'pink', meta: 'soft, like steady rain'}, {name: 'White noise', noise: 'white', meta: 'bright, like a fan'}];
  // the picker's first page; Genres, Countries and Languages are read from Radio Browser, with these first in each
  var STUDY_GENRES = [
    {name: 'Visuals', visuals: true}, {name: 'MilkDrop · next look', nextLook: true}, {name: 'Saved', saved: true},
    {name: 'Search stations', search: true, meta: 'by name'}, {name: 'Indian FM', fm: true}, {name: 'Podcasts', pods: true, meta: 'stories, horror, RJ shows'},
    {name: 'Genres', list: 'tags', meta: 'all of them'}, {name: 'Countries', list: 'countries'}, {name: 'Languages', list: 'languages'},
    {name: 'Most played worldwide', q: 'order=clickcount&reverse=true'}, {name: 'Noise · works offline', noise: true}
  ];
  // the big Indian FM brands, found in Radio Browser by name (which streams are official isn't known: some are relays)
  var INDIAN_FM = [
    {name: 'Radio Mirchi', q: 'name=mirchi'}, {name: 'Red FM', q: 'name=red%20fm'}, {name: 'Radio City', q: 'name=radio%20city'},
    {name: 'Big FM', q: 'name=big%20fm'}, {name: 'Vividh Bharati', q: 'name=vividh'}, {name: 'AIR FM Gold', q: 'name=fm%20gold'},
    {name: 'Ishq FM', q: 'name=ishq'}, {name: 'Radio Mirchi · Gujarati', q: 'name=mirchi&language=gujarati'}
  ];
  // podcasts the stations publish themselves (open feeds); episodes play like any sound, newest first, one after another
  // Yaadon Ka Idiot Box (Big FM, 2011-2020): the 34 episodes Big FM's own podcast page plays, from Big FM's own storage
  var YKIB_BASE = 'https://sgp1.digitaloceanspaces.com/bigfmindia/';
  var YKIB = [
      ['Aayat', '2019/05/AAYAT-Yaadon-Ka-Idiot-Box-with-Neelesh-Misra'],
      ['Baat Paise Ki', '2019/05/BAAT-PAISE-KI-Yaadon-Ka-Idiot-Box-with-Neelesh-Misra'],
      ['Chaar Rituaon Wala Intezar', '2019/05/CHAAR-RITUAON-WALA-INTEZAR-Yaadon-Ka-Idiot-Box-with-Neelesh-Misra'],
      ['Duaaon Ka Asar', '2019/05/DUAAON-KA-ASAR-Yaadon-Ka-Idiot-Box-with-Neelesh-Misra'],
      ['Fiasala', '2019/05/Fiasala-Yaadon-Ka-Idiot-Box-with-Neelesh-Misra'],
      ['Hara Samandar', '2019/05/HARA-SAMANDAR-Yaadon-Ka-Idiot-Box-with-Neelesh-Misra'],
      ['Jharna', '2019/05/JHARNA-Yaadon-Ka-Idiot-Box-with-Neelesh-Misra'],
      ['Khamoshiyaan', '2019/05/KHAMOSHIYAAN-Yaadon-Ka-Idiot-Box-with-Neelesh-Misra'],
      ['Kora Aanchal', '2019/05/Kora-Aanchal-Yaadon-Ka-Idiot-Box-with-Neelesh-Misra'],
      ['My Dear Professor', '2019/05/MY-DEAR-PROFESSOR-Yaadon-Ka-Idiot-Box-with-Neelesh-Misra'],
      ['Panne', '2019/05/Panne-Yaadon-Ka-Idiot-Box-with-Neelesh-Misra'],
      ['Saloni', '2019/05/SALONI-Yaadon-Ka-Idiot-Box-with-Neelesh-Misra'],
      ['Sorry Maria', '2019/05/SORRY-MARIA-Yaadon-Ka-Idiot-Box-with-Neelesh-Misra'],
      ['Tum Nadi Ban Jaana', '2019/05/TUM-NADI-BAN-JAANA-Yaadon-Ka-Idiot-Box-with-Neelesh-Misra'],
      ['Wo Jo Ishq Tha', '2019/05/WO-JO-ISHQ-THA-Yaadon-Ka-Idiot-Box-with-Neelesh-Misra'],
      ['Zindagi Haseen Hai', '2019/05/Zindagi-Haseen-Hai-Yaadon-Ka-Idiot-Box-with-Neelesh-Misra'],
      ['Ek Tha Ishq Adhoora', '2019/05/EK-THA-ISHQ-ADHOORA-Yaadon-Ka-Idiot-Box-with-Neelesh-Misra'],
      ['Taai', '2019/05/TAAI-Yaadon-Ka-Idiot-Box-with-Neelesh-Misra'],
      ['Teri Aadat', '2019/05/TERI-AADAT-Yaadon-Ka-Idiot-Box-with-Neelesh-Misra'],
      ['Us Baras Ki Barsat', '2019/05/US-BARAS-KI-BARSAT-Yaadon-Ka-Idiot-Box-with-Neelesh-Misra'],
      ['Achhi Ladki', '2019/06/ACHHI-LADKI-Yaadon-Ka-Idiot-Box-with-Neelesh-Misra'],
      ['Bachpan Ke Chhor Par', '2019/06/BACHPAN-KE-CHHOR-PAR-YAADON-KA-IDIOT-BOX-WITH-NEELESH-MISRA-13TH-JUNE-2019'],
      ['Dadu Ke Qisse', '2019/06/DADU-KE-QISSE-YAADON-KA-IDIOT-BOX-WITH-NEELESH-MISRA-4TH-JUNE'],
      ['Dost Samandar', '2019/06/DOST-SAMANDAR-YAADON-KA-IDIOT-BOX-WITH-NEELESH-MISRA-10TH-JUNE-2019'],
      ['Ek Mod Manchaha', '2019/06/EK-MOD-MANCHAHA-Yaadon-Ka-Idiot-Box-with-Neelesh-Misra'],
      ['Gulabi Cycle', '2019/06/GULABI-CYCLE-YAADON-KA-IDIOT-BOX-WITH-NEELESH-MISRA-14TH-JUNE-2019'],
      ['Hai Lambi Judaai', '2019/06/HAI-LAMBI-JUDAAI-Yaadon-Ka-Idiot-Box-with-Neelesh-Misra'],
      ['Mustafa Ka Pehla Roza', '2019/06/MUSTAFA-KA-PEHLA-ROZA-YAADON-KA-IDIOT-BOX-WITH-NEELESH-MISRA-5TH-JUNE'],
      ['Nana Ka Udhankhatola', '2019/06/NANA-KA-UDHANKHATOLA-YAADON-KA-IDIOT-BOX-WITH-NEELESH-MISRA-12TH-JUNE-2019'],
      ['Nanhi Navya', '2019/06/NANHI-NAVYA-YAADON-KA-IDIOT-BOX-WITH-NEELESH-MISRA-11TH-JUNE-2019'],
      ['Tumhari Hassi Ke Liye', '2019/06/TUMHARI-HASSI-KE-LIYE-Yaadon-Ka-Idiot-Box-with-Neelesh-Misra'],
      ['Uss Ek Din', '2019/06/USS-EK-DIN-YAADON-KA-IDIOT-BOX-WITH-NEELESH-MISRA-7TH-JUNE'],
      ['Vada Raha', '2019/06/VADA-RAHA-YAADON-KA-IDIOT-BOX-WITH-NEELESH-MISRA-6TH-JUNE'],
      ['Yuh Hi Rehna', '2019/06/YUH-HI-REHNA-YAADON-KA-IDIOT-BOX-WITH-NEELESH-MISRA']
  ];
  var PODCASTS = [
    {name: 'Yaadon Ka Idiot Box', by: 'Big FM · Neelesh Misra\u2019s stories', eps: YKIB},
    {name: 'Yaadon Ka Idiot Box · every season', by: 'opens YouTube · Neelesh Misra\u2019s channel', yts: [
      ['Season 1', '58 stories', '_0jDxV4WtXU', 'PL6BC2B76F17F751D0'],
      ['Season 2', '207 stories', '_KpD0aPwqhY', 'PL33C4CB0A430B8DD1'],
      ['Season 3', '224 stories', '-7oelkGlhcM', 'PLRknjC5MPHa0ORz6ublg_ll9OciXprAjA'],
      ['Season 4', '', 'kz0h9N9dA1Q', 'PLRknjC5MPHa29hPAM0Mg1IfFEUuFkqeBx'],
      ['Season 5', '695 stories', '3OvBiWo6QdE', 'PLRknjC5MPHa3o-pxq8q30S-gaTvdHsqAT'],
      ['Season 6', '', 'kjhDQfqfZUo', 'PLRknjC5MPHa1QqiV4Ja3YsS9eKH4_wJiC'],
      ['Season 7', '104 stories', 'BXwb6X0bGQA', 'PLRknjC5MPHa34ataIPLk4WG_yKfmkRB3D'],
      ['Family stories', '46 stories', 'C5y6AK88trs', 'PLRknjC5MPHa3ayTbOhop7FmvcdlUCSR5m'],
      ['Romantic stories', '76 stories', 'Z59F4EeIiV8', 'PLRknjC5MPHa2AN7TXgSHdA0Eb07A2XmwS'],
      ['Inspirational stories', '45 stories', 'Y4mJ9_i6xA8', 'PLRknjC5MPHa21LB-CqSvncQnTbTs_DNQG']
    ]},
    {name: 'Ek Kahani Aisi Bhi', by: 'Red FM · RJ Praveen’s late-night ghost stories', feed: 'https://omny.fm/shows/ek-kahani-aisi-bhi/playlists/podcast.rss'},
    {name: 'Ek Choti Si Horror Story', by: 'Red FM · RJ Mohnish', feed: 'https://omny.fm/shows/ek-choti-si-horror-story/playlists/podcast.rss'},
    {name: 'Red FM Bauaa', by: 'Red FM · RJ Raunac’s prank calls', feed: 'https://www.omnycontent.com/d/playlist/8ce708b9-c3c2-4eaa-a27d-ac0f007c53c5/232a6ee0-f0fb-4a77-a1cd-ac22009d88c7/8c8aa2ff-faca-4553-a635-ac22009d88d0/podcast.rss'},
    {name: 'Red Murga', by: 'Red FM · RJ Praveen’s prank calls', feed: 'https://omny.fm/shows/red-murga/playlists/podcast.rss'},
    {name: 'Morning No. 1 with RJ Dhrumil', by: 'Red FM · Gujarati mornings', feed: 'https://www.omnycontent.com/d/playlist/8ce708b9-c3c2-4eaa-a27d-ac0f007c53c5/660b4d3a-7d72-4093-b171-ac46009be068/2ee27847-20a0-42f9-b737-ac46009be077/podcast.rss'},
    {name: 'The Devdutt Pattanaik Show', by: 'Mirchi · mythology', feed: 'https://feeds.simplecast.com/pgsclD_d'}
  ];
  var PIN_TAGS = ['lofi', 'jazz', 'classical', 'piano', 'ambient', 'chillout', 'indian classical', 'bollywood', 'ghazal', 'nature'];
  var PIN_COUNTRIES = ['CA', 'IN', 'US', 'GB'];
  var PIN_LANGUAGES = ['hindi', 'gujarati', 'punjabi', 'english', 'french', 'urdu', 'tamil'];
  var SILENCE = {name: 'Silence'};
  // the visuals: the old media-player kind, drawn small (480×270) and scaled up, so they're cheap and a bit pixelly on purpose
  var VIS_MODES = ['milkdrop', 'tunnel', 'bars', 'scope', 'off'];
  var VIS_NAMES = {milkdrop: 'MilkDrop', tunnel: 'Tunnel', bars: 'Bars', scope: 'Scope', off: 'Off'};
  // MilkDrop (butterchurn, MIT: web/vendor) needs WebGL 2; it's newer JavaScript, so it's loaded only where that exists
  var MK_W = 512, MK_H = 288, MK_EVERY = 30, MK_BLEND = 1.6;
  // Self-tuning detail: it aims for 60 frames a second and steps down a tier when it can't hold 50, back up after a long
  // smooth stretch. A look that still can't hold 24 at the lowest tier is skipped from then on (kept in 'mkSlow').
  var MK_TIERS = [
    {w: 512, h: 288, mw: 48, mh: 36, every: 1}, {w: 448, h: 252, mw: 40, mh: 30, every: 1}, {w: 384, h: 216, mw: 32, mh: 24, every: 1},
    {w: 320, h: 180, mw: 24, mh: 18, every: 1}, {w: 320, h: 180, mw: 24, mh: 18, every: 2}
  ];
  var mk = {ok: null, loading: false, loaded: false, presets: null, names: null};
  function mkSupported() {
    if (mk.ok === null) {
      try { var c = document.createElement('canvas'); mk.ok = !!(window.WebGL2RenderingContext && c.getContext('webgl2')); }
      catch (e) { mk.ok = false; }
    }
    return mk.ok;
  }
  function visModes() { return mkSupported() ? VIS_MODES : VIS_MODES.slice(1); }
  var VIS_W = 480, VIS_H = 270;
  // LG and Samsung play <audio> in the TV's own media pipeline: an analyser on it reads only zeros. There the stations get a
  // made-up beat, and what can be heard through Web Audio (the noise, the rain loop) drives the visuals for real.
  var MEDIA_TAP = !/Web0S|webOS|Tizen|SMART-TV/i.test(navigator.userAgent);
  var genreCache = {};
  var BOLLYWOOD_VIDEO = '_i0oA5YYf1Y';   // the YouTube video the Bollywood button plays
  var FOCUS_MIN = 25, BREAK_MIN = 5;

  var hooks = {};   // from home.js: toast, redraw (the drawer), panels (the drawer's cards), night (re-check the look)

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, parent, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  function setClass(e, c, on) {
    if (!e) return;
    var has = (' ' + e.className + ' ').indexOf(' ' + c + ' ') >= 0;
    if (on && !has) e.className = (e.className ? e.className + ' ' : '') + c;
    else if (!on && has) e.className = (' ' + e.className + ' ').replace(' ' + c + ' ', ' ').replace(/^\s+|\s+$/g, '');
  }
  function store(key, value) { try { localStorage.setItem('fmtv.my.' + key, JSON.stringify(value)); } catch (e) {} }
  function stored(key) { try { return JSON.parse(localStorage.getItem('fmtv.my.' + key)); } catch (e) { return null; } }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function today(offsetDays) {
    var d = new Date(Date.now() - (offsetDays || 0) * 86400000);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function dayNumber() { return Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000); }

  function get(url, headers, done, timeout) {
    var x = new XMLHttpRequest(), over = false;
    x.open('GET', url, true);
    x.timeout = timeout || 15000;
    for (var h in headers) if (headers.hasOwnProperty(h)) x.setRequestHeader(h, headers[h]);
    x.onreadystatechange = function () {
      if (x.readyState !== 4 || over) return;
      over = true;
      if (x.status !== 200) { done(new Error('HTTP ' + x.status)); return; }
      var json;
      try { json = JSON.parse(x.responseText); } catch (e) { done(e); return; }
      done(null, json);
    };
    x.ontimeout = x.onerror = function () { if (!over) { over = true; done(new Error('no connection')); } };
    x.send();
  }

  // MARK: - Space photos: NASA's Image and Video Library (images-api.nasa.gov; no key, no daily limit)
  // The Astronomy Picture of the Day feed is no longer used: since NASA moved that site, it answers with a logo.

  var QUERIES = ['nebula hubble', 'galaxy hubble', 'webb telescope nebula', 'webb telescope galaxy', 'star cluster hubble',
    'orion nebula', 'carina nebula', 'andromeda galaxy', 'supernova remnant', 'spiral galaxy', 'planetary nebula',
    'star forming region', 'globular cluster', 'saturn cassini rings', 'jupiter juno', 'deep field galaxies'];
  // Only the sky itself: the title or keywords must name something out there...
  var SKY = /nebula|galax|star cluster|globular|supernova|milky way|andromeda|magellanic|cosmic|interstellar|star[- ]forming|stellar nursery|pillars of creation|deep field|quasar|pulsar|saturn|jupiter|neptune|uranus|comet/i;
  // ...and the title must not be about people, places or machines
  var NOT_SKY_TITLE = /astronaut|crew|engineer|scientist|technician|director|administrator|visitor|student|team|rocket|launch|spacecraft|rover|lander|antenna|dish|mirror|instrument|facility|building|center|lab|test|hardware|install|assembl|prepar|ceremony|award|briefing|press|event|tour|model|exhibit|museum|mission control|patch|logo|poster|art\b|sound|sonification|video|trailer/i;
  // Not photographs of the sky: drawings, charts, people and hardware
  var NOT_A_PHOTO = /artist|illustrat|concept|render|diagram|logo|graphic|poster|portrait|crew member|briefing|press|ceremony|employee|engineer|technician|scientist|team|model|animation|simulation|chart|spectrum|spectra|map of|annotated|labeled|compass|infographic|mirror|instrument|assembly|clean ?room|launch pad|rollout/i;

  // {day, list: [{title, base}] still to check, ready: [{title, src}] checked: sharp, wide, and loads on this TV}
  var space = stored('space4') || {day: '', list: [], ready: []};
  if (!space.ready.length && !space.list.length) space.day = '';
  var spaceTriedAt = 0, spaceError = '', checking = false;

  function refreshSpace() {
    if (space.day === today()) return;
    // The hand-checked galleries built into the app (web/spacelist.js: ESA's Webb and NASA's Spitzer) come first:
    // 120 of them a day, in a new order. NASA's general library below is only the fallback without that list.
    if (window.SPACE_LIST && window.SPACE_LIST.length) {
      space = {day: today(), ready: space.ready.slice(-110), list: shuffled(window.SPACE_LIST).slice(0, 120).map(function (x) {
        return {title: x.t, label: x.l, tries: x.s};
      })};
      store('space4', space);
      checkNext();
      return;
    }
    if (Date.now() - spaceTriedAt < 10 * 60000) return;
    spaceTriedAt = Date.now();
    var picks = shuffled(QUERIES).slice(0, 6), found = [], seen = {}, answers = 0, failures = 0;
    function one(q) {
      var url = 'https://images-api.nasa.gov/search?media_type=image&page_size=100&page=' + (1 + Math.floor(Math.random() * 4)) +
        '&q=' + encodeURIComponent(q);
      get(url, {}, function (err, body) {
        var items = !err && body && body.collection && body.collection.items || [];
        if (err) failures++;
        for (var i = 0; i < items.length; i++) {
          var d = items[i].data && items[i].data[0], links = items[i].links || [], pick = null;
          // the library lists each size with its width and height: the smallest file that is wide and at least about full HD
          for (var l = 0; l < links.length; l++) {
            var k = links[l], w = +k.width, h = +k.height;
            if (k.render !== 'image' || !/^https:\/\//.test(k.href || '') || !(w >= 1600 && h >= 850) || w * h > 30e6 || w / h < 1.25 || w / h > 2.4) continue;
            if (!pick || w < +pick.width) pick = k;
          }
          var m = pick ? [pick.href, pick.href] : null;
          if (!d || !m || seen[m[1]]) continue;
          var text = (d.title || '') + ' ' + String(d.description || '').slice(0, 400) + ' ' + (d.keywords || []).join(' ');
          // drawings are named as such in the description; the rest is judged on the title and keywords
          if (/artist|illustrat|concept|animation|simulat|diagram|annotat|visualization|label|compass|scale bar|infographic|graphic|poster|chart|graph\b|plot|timeline|comparison|side[- ]by[- ]side|before and after|montage|collage|inset|arrow|circled|outlined|text|caption|logo|map\b|spectr/i.test(text)) continue;
          if (NOT_A_PHOTO.test((d.title || '') + ' ' + (d.keywords || []).join(' '))) continue;
          if (!SKY.test((d.title || '') + ' ' + (d.keywords || []).join(' ')) || NOT_SKY_TITLE.test(d.title || '')) continue;
          seen[m[1]] = true;
          found.push({title: String(d.title || '').slice(0, 90), src: m[1]});
        }
        if (++answers < picks.length) return;
        if (!found.length) {
          spaceError = failures ? 'NASA’s photo library isn’t answering' : 'no photos found';
          note();
          return;
        }
        spaceError = '';
        // yesterday's checked photos stay (the newest 12) until today's have been checked: never a blank wall
        space = {day: today(), list: shuffled(found).slice(0, 250), ready: space.ready.slice(-70)};   // 70 stay, up to 80 new ones join each day
        store('space4', space);
        checkNext();
      }, 30000);
    }
    for (var p = 0; p < picks.length; p++) one(picks[p]);
  }

  /**
   * Checks one waiting photo at a time, gently (the TV is busy enough): NASA's 1920-wide file, or its original when
   * there is none. Kept when it is wide, at least about full HD, and not so large that the TV would struggle.
   */
  function checkNext() {
    if (checking || !space.list.length || space.ready.length >= 150) return;
    checking = true;
    var item = space.list.shift(), tries = item.tries || (item.src ? [item.src] : [item.base + '~large.jpg', item.base + '~orig.jpg']);
    (function next(i) {
      if (i >= tries.length) { done(''); return; }
      var img = new Image();
      img.onload = function () {
        var w = img.naturalWidth, h = img.naturalHeight;
        if (w * h > 30e6) done('');
        else if (w >= 1590 && h >= 850 && w / h >= 1.25 && w / h <= 2.4) done(tries[i]);
        else if (i === 0 && w < 1600) next(1);   // the "large" file is small for some: the original may be bigger
        else done('');
      };
      img.onerror = function () { next(i + 1); };
      img.src = tries[i];
    })(0);
    function done(src) {
      checking = false;
      for (var r = 0; src && r < space.ready.length; r++) if (space.ready[r].src === src) src = '';   // already kept
      if (src) {
        space.ready.push({title: item.title, label: item.label || 'NASA', src: src});
        if (space.ready.length > 150) space.ready.shift();
      }
      store('space4', space);
      if (src && !$('wall').getAttribute('data-src')) applyLook();
      setTimeout(checkNext, src ? 4000 : 1000);
    }
  }

  // Your own downloaded photos, built into the app (web/sp-*.jpg, web/spacelocal.js): always there, even offline
  var LOCAL = (window.SPACE_LOCAL || []).map(function (x) { return {title: x.t, label: x.l, src: x.src}; });

  function pool() { return LOCAL.concat(space.ready); }

  // MARK: - Wallpaper by day (a new photo every 30 minutes), starfield by night

  var night = false, starsDrawn = false, wallIndex = Math.floor(Math.random() * 1000), wallAt = 0, WALL_EVERY = 30 * 60000;

  function drawStars() {
    if (starsDrawn) return;
    starsDrawn = true;
    var c = $('stars'), ctx = c.getContext('2d'), w = c.width, h = c.height;
    // A faint warm haze, then ~520 stars: most tiny and dim, a few bright, some faintly warm or blue
    var g = ctx.createRadialGradient(w * 0.62, h * 0.35, 40, w * 0.62, h * 0.35, w * 0.7);
    g.addColorStop(0, 'rgba(70, 48, 40, 0.35)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    var seed = 7;
    function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
    for (var i = 0; i < 520; i++) {
      var x = rnd() * w, y = rnd() * h, r = rnd(), size = r > 0.985 ? 2.2 : r > 0.9 ? 1.5 : 0.9;
      var tint = rnd(), a = 0.35 + rnd() * 0.6;
      ctx.fillStyle = tint > 0.85 ? 'rgba(255, 214, 170, ' + a + ')' : tint > 0.7 ? 'rgba(190, 215, 255, ' + a + ')' : 'rgba(255, 248, 238, ' + a + ')';
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
      if (size > 2) {   // a soft glow on the brightest
        ctx.fillStyle = 'rgba(255, 240, 220, 0.08)';
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function showWall() {
    var list = pool(), wall = $('wall');
    if (!list.length || !wall) return;
    var photo = list[wallIndex % list.length], img = new Image();
    img.onload = function () {   // the photo on screen stays until the next one has loaded
      wall.style.backgroundImage = 'url("' + photo.src + '")';
      wall.setAttribute('data-src', photo.src);
      wallAt = Date.now();
      var cap = $('wallcap');
      cap.innerHTML = '';
      el('b', '', cap, 'NASA');
      cap.appendChild(document.createTextNode(photo.title));
      setClass($('stage'), 'wall-on', true);
      setClass($('stage'), 'stars-on', false);
      setClass($('stage'), 'note-on', false);
    };
    img.onerror = function () {   // gone from NASA's library: dropped, and the next one
      var at = space.ready.indexOf(photo);
      if (at >= 0) { space.ready.splice(at, 1); store('space4', space); }
      if (space.ready.length) showWall(); else note();
    };
    img.src = photo.src;
  }

  function note() {
    var cap = $('wallcap');
    if (!cap || !$('wall') || $('wall').getAttribute('data-src') || night) return;
    cap.innerHTML = '';
    el('b', '', cap, 'Space photos');
    cap.appendChild(document.createTextNode(spaceError ? spaceError + ' · trying again soon' : 'finding today’s photos…'));
    setClass($('stage'), 'note-on', true);
  }

  // MARK: - Weather dioramas: the home screen's wallpaper, picked by the home city's live weather (web/dio-*.jpg, bundled)

  var DIO = window.DIORAMAS || {}, dioShown = '', alertName = '';

  function hasDio() { for (var k in DIO) if (DIO.hasOwnProperty(k)) return true; return false; }

  /** Which diorama fits now: the live weather code (Open-Meteo's, WMO), day or night, the season, and any snow squall warning. */
  /**
   * Which diorama fits now, from the live weather (Open-Meteo's WMO code), day or night, the hour around sunrise and
   * sunset, the season, the temperature, and any snow squall warning. A missing picture falls back to clear day or night.
   */
  function dioName() {
    var w = null;
    try { w = Data.weather; } catch (e) {}
    var dark = w ? !w.isDay : night, code = w ? w.code : 0, now = Date.now(), d = new Date(), md = (d.getMonth() + 1) * 100 + d.getDate();
    var winter = md >= 1201 || md <= 310, autumn = md >= 922 && md <= 1130, spring = md >= 311 && md <= 531, name;
    var near = function (t) { return t && Math.abs(now - t) < 40 * 60000; };   // within 40 minutes
    var clearish = code <= 2;
    if (/squall|blizzard/i.test(alertName) || code === 75 || code === 86) name = 'snow-squall';
    else if (code >= 95) name = 'thunderstorm';
    else if (code === 56 || code === 57 || code === 66 || code === 67) name = 'freezing-rain';
    else if (code === 71 || code === 85) name = dark ? 'snow-night' : 'flurries';
    else if (code >= 71 && code <= 77) name = dark ? 'snow-night' : 'snow';
    else if (code >= 51 && code <= 55) name = dark ? 'rain-night' : 'drizzle';
    else if (code === 65 || code === 81 || code === 82) name = dark ? 'rain-night' : 'heavy-rain';
    else if ((code >= 61 && code <= 63) || code === 80) name = dark ? 'rain-night' : 'rain';
    else if (code === 45 || code === 48) name = 'fog';
    else if (winter) {   // a dry winter day still has snow on the ground
      if (dark) name = clearish && code <= 1 ? 'winter-clear-night' : 'winter-cloudy-night';
      else name = code <= 1 ? 'winter-clear-day' : 'snow';
    }
    else if (clearish && w && near(w.sunset)) name = 'dusk';
    else if (clearish && w && near(w.sunrise)) name = 'dawn';
    else if (dark) name = code <= 1 ? 'clear-night' : code === 2 ? 'partly-cloudy-night' : 'overcast-night';
    else if (code === 3) name = 'overcast';
    else if (code === 2) name = 'partly-cloudy';
    else if (autumn) name = 'autumn-clear';
    else if (spring) name = 'spring-clear';
    else if (w && w.temp >= 28) name = 'summer-haze';
    else name = 'clear-day';
    if (!DIO[name]) name = DIO[dark ? 'clear-night' : 'clear-day'] ? (dark ? 'clear-night' : 'clear-day') : '';
    return name;
  }

  // MARK: - Special scenes: holidays, the time machine on Sunday mornings, the aurora (each only once its picture exists)

  // Diwali's main day (Lakshmi Puja) moves with the lunar calendar; the scene shows two days either side
  var DIWALI = {2026: '11-08', 2027: '10-29', 2028: '10-17', 2029: '11-05', 2030: '10-26', 2031: '11-14', 2032: '11-02',
    2033: '10-22', 2034: '11-10', 2035: '10-30'};
  var SEVERE = /thunderstorm|snow-squall|freezing-rain|heavy-rain/;   // the weather always wins on days like these

  function holiday(d) {
    var y = d.getFullYear(), md = (d.getMonth() + 1) * 100 + d.getDate(), dw = DIWALI[y];
    if (dw) {
      var day = new Date(y, parseInt(dw.slice(0, 2), 10) - 1, parseInt(dw.slice(3), 10));
      if (Math.abs(d - day) < 2.5 * 86400000) return 'diwali';
    }
    if (md >= 1025 && md <= 1031) return 'halloween';
    if (md >= 1218 && md <= 1226) return 'christmas';
    if (md === 1231 || md === 101) return 'new-year';
    if (md === 701) return 'canada-day';
    return '';
  }

  /** The first of these pictures that exists (a winter or night version first, when there is one). */
  function variant(base, dark, winter) {
    var tries = [];
    if (dark) tries.push(base + '-night');
    if (winter) tries.push(base + '-winter');
    tries.push(base);   // a holiday drawn only at night (Diwali, Halloween ...) waits for the evening
    for (var i = 0; i < tries.length; i++) if (DIO[tries[i]]) return tries[i];
    return '';
  }

  var sky = {kp: null, iss: [], aurora: false};

  /** The picture for now: weather picks the scene; a holiday, Sunday morning or an aurora can swap the picture. */
  function sceneImage(name) {
    var d = new Date(), md = (d.getMonth() + 1) * 100 + d.getDate(), winter = md >= 1201 || md <= 310;
    var w = null;
    try { w = Data.weather; } catch (e) {}
    var dark = w ? !w.isDay : night, clearish = !w || w.code <= 2;
    if (SEVERE.test(name)) return name;
    if (sky.aurora && dark && clearish) { var au = variant('aurora', false, winter); if (au) return au; }
    var h = holiday(d);
    if (h) { var hv = variant(h, dark, winter); if (hv) return hv; }
    if (d.getDay() === 0 && !dark && d.getHours() >= 7 && d.getHours() < 13) {
      // a season of its own: in winter only the winter version, never a green 1890s city on a snowy Sunday
      var tm = winter ? (DIO['time-machine-winter'] ? 'time-machine-winter' : '') : (DIO['time-machine'] ? 'time-machine' : '');
      if (tm) return tm;
    }
    return name;
  }

  function showDio() {
    if (window.fmtvMark) fmtvMark('scene check');
    var name = dioName(), stage = $('stage'), wall = $('wall');
    if (!name || !stage || !wall) return false;
    var w = null;
    try { w = Data.weather; } catch (e) {}
    var line = $('diowx');
    if (line) line.textContent = w ? Data.degrees(w.temp) + '  ·  ' + Data.condition(w.code, w.isDay) : '';
    var image = sceneImage(name);   // the picture; the weather effects still follow the weather (name)
    var nightImage = /night|thunderstorm|dusk|dawn|heavy-rain|aurora/.test(image);   // already dark or twilight: not dimmed
    setClass(stage, 'dio-light', !!DIO[image].light && !(night && !nightImage));
    setClass(stage, 'dio-dim', night && !nightImage);   // a daytime diorama after dark (fog, say) is dimmed
    // each of the home screen's words in the ink that reads on the picture right behind it (make_dioramas.py: ink)
    var ink = DIO[image].ink || {}, dim = night && !nightImage;
    ['date', 'clock', 'notice'].forEach(function (k) {
      var v = dim ? 'l' : ink[k] || (DIO[image].light ? 'd' : 'l');
      setClass(stage, 'ink-' + k + '-d', v.charAt(0) === 'd');
      setClass(stage, 'busy-' + k, v.indexOf('+') > 0);
    });
    var clip = DIO[image].video === true ? image : DIO[image].video;   // a scene may borrow a near-identical scene's clip
    var c = coords();
    // with the scene's video playing, the effects keep only their light (weatherfx.js: withClip)
    var vv = $('diovid');
    var playing = !!clip && !!vv && vv.getAttribute('src') === 'dio-' + clip + '.mp4' && /(^| )vid-on( |$)/.test(($('sky') || {}).className || '');
    if (window.WeatherFX) WeatherFX.set(name, night, fxMode, clip || image, {lat: c.lat, lon: c.lon, aurora: sky.aurora, clip: playing});
    showLights(image, clip);
    var snd = DIO[image].sound || (DIO[name] && DIO[name].sound);   // a holiday picture keeps the weather's sound
    amb.want = snd ? 'sound-' + snd + '.ogg' : '';
    ambientUpdate();
    if (image === dioShown) return true;
    var src = 'dio-' + image + '.jpg', img = new Image();
    img.onload = function () {
      if (window.fmtvMark) fmtvMark('new picture');
      dioShown = image;
      wall.style.backgroundImage = 'url("' + src + '")';
      wall.setAttribute('data-src', src);
      setClass(stage, 'dio', true);
      setClass(stage, 'wall-on', true);
      setClass(stage, 'stars-on', false);
      setClass(stage, 'note-on', false);
      dioVideo(clip ? 'dio-' + clip + '.mp4' : '');
      showLights(image, clip);
    };
    img.src = src;
    return true;
  }

  // MARK: - Lights that follow the clock: windows go dark a few at a time late at night, and come back before dawn

  /**
   * How many of a night scene's light groups are off now (make_dio_lights.py splits its lit windows into groups, each
   * with a picture of those windows dark). From 10:30 pm one group every half hour; a few always stay on (night owls).
   */
  function lightsOff(groups) {
    var d = new Date(), m = d.getHours() * 60 + d.getMinutes(), off = 0;
    if (m >= 22 * 60 + 30) off = Math.floor((m - (22 * 60 + 30)) / 30) + 1;
    else if (m < 5 * 60) off = Math.floor((m + 90) / 30) + 1;   // after midnight: keep counting from 10:30
    else if (m < 6 * 60 + 30) off = Math.max(0, groups - 1 - Math.floor((m - 5 * 60) / 15));   // waking up
    return Math.max(0, Math.min(groups - 1, off));
  }

  function showLights(image, clip) {
    var box = $('diolights'), info = DIO[image], src = clip || image, n = info && info.lights ? info.lights : 0;
    if (!box) {
      var sky0 = $('sky');
      if (!sky0) return;
      box = document.createElement('div');
      box.id = 'diolights';
      sky0.insertBefore(box, $('fx') || $('wallshade'));
    }
    if (box.getAttribute('data-src') !== src + '|' + n) {
      box.innerHTML = '';
      box.setAttribute('data-src', src + '|' + n);
      for (var k = 0; k < n; k++) {
        var layer = el('div', '', box);
        layer.style.backgroundImage = 'url("dio-' + src + '-lights-' + k + '.png")';
        layer.style.display = 'none';
      }
    }
    setClass(box, 'clip', !!clip);   // drawn from the clip's frame: shown once the clip plays, so they line up
    var off = n ? lightsOff(n) : 0, kids = box.children;
    // a layer that isn't dark yet is off the screen altogether (display: none), so the TV doesn't composite six
    // invisible full-screen pictures over the video all day; it comes in, then fades, and leaves after fading out
    for (var j = 0; j < kids.length; j++) lightLayer(kids[j], j < off);
  }

  function lightLayer(e, on) {
    var shown = /(^| )on( |$)/.test(e.className);
    if (on === shown && (on || e.style.display === 'none')) return;
    clearTimeout(e.fmtvT);
    if (on) {
      e.style.display = '';
      e.fmtvT = setTimeout(function () { setClass(e, 'on', true); }, 50);
    } else {
      setClass(e, 'on', false);
      e.fmtvT = setTimeout(function () { e.style.display = 'none'; }, 6500);   // after the 6 s fade
    }
  }

  /**
   * The moving version of a diorama (web/dio-<name>.mp4, from make_dio_video.py), over its still: it fades in once it
   * plays, and pauses whenever nobody can see it (behind an app, under the screensaver, in Movie night). The still stays
   * underneath, so a clip that won't play just leaves the still.
   */
  function dioVideo(src) {
    var v = $('diovid');
    if (!src) {
      if (v) { setClass(v, 'on', false); v.pause(); v.removeAttribute('src'); v.load(); }
      return;
    }
    if (!v) {
      v = document.createElement('video');
      v.id = 'diovid';
      v.muted = true;
      v.loop = true;
      v.setAttribute('muted', '');
      v.setAttribute('playsinline', '');
      v.preload = 'auto';
      $('sky').insertBefore(v, $('fx') || $('wallshade'));   // under the weather effects
      v.addEventListener('playing', function () { setClass(v, 'on', true); setClass($('sky'), 'vid-on', true); if (hasDio()) showDio(); });   // effects step back
      v.addEventListener('error', function () {
        setClass(v, 'on', false);
        vidReport('Diorama video couldn’t play (' + v.getAttribute('src') + ', error ' + (v.error ? v.error.code : '?') + ')');
      });
    }
    if (v.getAttribute('src') !== src) {
      setClass(v, 'on', false);
      setClass($('sky'), 'vid-on', false);
      v.setAttribute('src', src);
      vidSaid = '';
      clearTimeout(vidCheck);
      // still not playing after 10 s on the home screen: say why, once (readyState 0 = nothing loaded, 4 = ready)
      vidCheck = setTimeout(function () {
        if (!/(^| )on( |$)/.test(v.className) && !document.hidden && !movie && !study)
          vidReport('Diorama video didn’t start (' + src + ', ready ' + v.readyState + ', network ' + v.networkState + (v.paused ? ', paused' : '') + ')');
      }, 10000);
    }
    keepVideo();
  }

  var vidSaid = '', vidCheck = 0;
  function vidReport(msg) { if (vidSaid === msg) return; vidSaid = msg; if (hooks.toast) hooks.toast(msg); }

  function keepVideo() {
    var v = $('diovid');
    if (!v || !v.getAttribute('src')) {
      var sv = $('saver');
      if (window.WeatherFX) WeatherFX.pause(document.hidden || movie || !!study || !!overlay || (sv && /(^| )on( |$)/.test(sv.className)));
      return;
    }
    var saver = $('saver'), hidden = document.hidden || movie || (saver && /(^| )on( |$)/.test(saver.className)) || !!study || !!overlay;
    if (window.WeatherFX) WeatherFX.pause(hidden);
    if (hidden) { if (!v.paused) v.pause(); }
    else if (v.paused) { try { var p = v.play(); if (p && p.catch) p.catch(function (e) { vidReport('Diorama video blocked (' + (e && e.name) + ')'); }); } catch (e) { vidReport('Diorama video error (' + e.message + ')'); } }
  }
  document.addEventListener('visibilitychange', keepVideo);

  function applyLook() {
    if (hasDio() && showDio()) return;   // the dioramas are the wallpaper; the space photos keep the screensaver
    var stage = $('stage');
    if (!stage || !$('wall')) return;
    var shown = !!$('wall').getAttribute('data-src');
    if (night && !shown) drawStars();
    setClass(stage, 'stars-on', night && !shown);
    setClass(stage, 'wall-on', shown);
    if (!shown || Date.now() - wallAt > WALL_EVERY) { if (pool().length) showWall(); else note(); }
  }

  setInterval(function () {
    checkNext();
    if (hasDio()) { showDio(); return; }
    if (!pool().length || !wallAt || Date.now() - wallAt < WALL_EVERY) return;
    wallIndex++;
    showWall();
  }, 60000);

  // MARK: - Environment Canada warnings for the home city

  var alertsAt = 0;

  /** The home city: the one picked on the TV (Home Settings > City), else the build's, else the TV's time zone's. */
  function coords() {
    var lat = NaN, lon = NaN;
    try { lat = parseFloat(Prefs.latitude()); lon = parseFloat(Prefs.longitude()); } catch (e) {}
    if (isNaN(lat) || isNaN(lon)) { lat = parseFloat(window.CONFIG && CONFIG.latitude); lon = parseFloat(window.CONFIG && CONFIG.longitude); }
    if (isNaN(lat) || isNaN(lon)) { lat = 40.7128; lon = -74.006; }   // as data.js: New York when nothing says otherwise
    return {lat: lat, lon: lon};
  }

  function refreshAlerts() {
    if (Date.now() - alertsAt < 15 * 60000) return;
    alertsAt = Date.now();
    var c = coords(), d = 0.02;
    var url = 'https://api.weather.gc.ca/collections/weather-alerts/items?f=json&lang=en&limit=20&bbox=' +
      (c.lon - d).toFixed(4) + ',' + (c.lat - d).toFixed(4) + ',' + (c.lon + d).toFixed(4) + ',' + (c.lat + d).toFixed(4);
    get(url, {Accept: 'application/geo+json, application/json'}, function (err, body) {
      if (err || !body) return;   // keep what's shown until a fresh answer
      showAlerts(body.features || []);
    });
  }

  function showAlerts(features) {
    var now = Date.now(), best = null, rank = {red: 3, orange: 2, yellow: 1};
    for (var i = 0; i < features.length; i++) {
      var p = features[i] && features[i].properties;
      if (!p) continue;
      var ends = Date.parse(p.expiration_datetime || '');
      if (!isNaN(ends) && ends < now) continue;
      if (p.status_en && /ended|cancel/i.test(p.status_en)) continue;
      var colour = String(p.risk_colour_en || '').toLowerCase();
      var r = rank[colour] || 0;
      if (!best || r > best.r) best = {r: r, colour: colour, name: p.alert_name_en || p.alert_short_name_en || 'weather alert', area: p.feature_name_en || ''};
    }
    alertName = best ? best.name : '';
    weatherAlert = best;
    if (hasDio()) showDio();
    renderPill();
  }

  // MARK: - The pill: one line at the top for whatever matters most right now
  // Environment Canada's warnings first, then the ISS about to pass over, then the aurora. Never more than one.

  var weatherAlert = null;

  function renderPill() {
    var bar = $('alertbar');
    if (!bar) return;
    var p = null, now = Date.now(), best = weatherAlert;
    if (best) {
      p = {cls: best.colour === 'red' ? 'red' : best.colour === 'orange' ? 'orange' : '', b: best.name.charAt(0).toUpperCase() + best.name.slice(1),
        t: 'Environment Canada', k: 'Weather warning'};
    } else {
      var pass = nextPass(now);
      if (pass) {
        var mins = Math.ceil((pass.rise - now) / 60000);
        p = {cls: 'sky', k: 'Space station', b: mins > 0 ? 'Overhead in ' + mins + ' min' : 'Overhead now',
          t: mins > 0 ? 'look ' + Sky.compass(pass.riseAz) + (pass.maxEl >= 60 ? ', it climbs high' : '') :
            Sky.compass(pass.riseAz) + ' to ' + Sky.compass(pass.setAz)};
      } else if (auroraWatch()) {
        p = {cls: 'sky aurora', k: 'Northern lights', b: (sky.kp.peak >= 7 ? 'Strong aurora' : 'Aurora') + ' possible tonight', t: 'look north'};
      }
    }
    setClass(document.documentElement, 'alert-on', !!p);
    var key = p ? p.cls + p.b + p.t : '';
    if (bar.getAttribute('data-key') === key) return;
    bar.setAttribute('data-key', key);
    bar.innerHTML = '';
    bar.className = p ? p.cls : '';
    if (!p) return;
    var kick = el('div', 'k', bar);   // the kind of notice, small, over what it says
    el('i', 'dot', kick);
    kick.appendChild(document.createTextNode(p.k || ''));
    var line = el('div', 'l', bar);
    el('b', '', line, p.b);
    line.appendChild(document.createTextNode(' \u00B7 ' + p.t));
  }

  // MARK: - Sky events (sky.js): the ISS passing over, and the aurora

  var skyAt = 0;

  function clearSky() {
    var w = null;
    try { w = Data.weather; } catch (e) {}
    return !w || w.code <= 2;
  }

  /** A pass worth looking up for: high enough to be bright, starting within 15 minutes or under way, sky not overcast. */
  function nextPass(now) {
    if (!clearSky()) return null;
    for (var i = 0; i < sky.iss.length; i++) {
      var p = sky.iss[i];
      if (p.maxEl >= 25 && p.set > now && p.rise - now < 15 * 60000) return p;
    }
    return null;
  }

  /** Kp 6 and up reaches southern Canada's latitudes (low on the northern horizon); shown from sunset until sunrise. */
  function auroraWatch() {
    if (!sky.kp || sky.kp.peak < 6) return false;
    var c = coords();
    return Sky.sun(new Date(), c.lat, c.lon).alt < -4;
  }

  function refreshSky() {
    if (!window.Sky || Date.now() - skyAt < 9 * 60000) return;
    skyAt = Date.now();
    var c = coords();
    Sky.iss(function (tle) {
      if (tle) sky.iss = Sky.passes(tle, Date.now() - 15 * 60000, 24, c.lat, c.lon);
      renderPill();
    });
    Sky.kp(function (k) {
      sky.kp = k || sky.kp;
      // the aurora picture only while it's actually strong now (or a strong night is already under way)
      var on = !!(sky.kp && (sky.kp.now >= 6 || (sky.kp.now >= 5 && sky.kp.peak >= 7)));
      if (on !== sky.aurora) { sky.aurora = on; if (hasDio()) showDio(); }
      renderPill();
    });
  }
  setInterval(renderPill, 30000);   // the ISS countdown

  // MARK: - Film of the day (TMDB, with the key typed on the TV)

  var film = stored('film'), filmTriedAt = 0;

  function tmdbKey() { try { return Prefs.tmdbKey(); } catch (e) { return ''; } }

  function tmdb(path, done) {
    var key = tmdbKey();
    var bearer = key.indexOf('eyJ') === 0;
    var url = 'https://api.themoviedb.org/3' + path + (bearer ? '' : (path.indexOf('?') >= 0 ? '&' : '?') + 'api_key=' + encodeURIComponent(key));
    get(url, bearer ? {Authorization: 'Bearer ' + key, Accept: 'application/json'} : {Accept: 'application/json'}, done);
  }

  function refreshFilm() {
    if (!tmdbKey()) return;
    if (film && film.day === today()) return;
    if (Date.now() - filmTriedAt < 20 * 60000) return;
    filmTriedAt = Date.now();
    var n = dayNumber();
    // Every third day a Hindi classic; otherwise a much-loved film from anywhere. Both from the best-rated, most-voted.
    var hindi = n % 3 === 0;
    var path = '/discover/movie?include_adult=false&sort_by=vote_count.desc&page=' + (1 + (n % (hindi ? 4 : 12))) +
      (hindi ? '&with_original_language=hi&vote_average.gte=7.2&vote_count.gte=150' : '&vote_average.gte=7.6&vote_count.gte=2500');
    tmdb(path, function (err, body) {
      if (err || !body || !body.results || !body.results.length) return;
      var m = body.results[(n * 7) % body.results.length];
      tmdb('/movie/' + m.id + '/watch/providers', function (err2, prov) {
        var ca = !err2 && prov && prov.results && prov.results.CA, where = [];
        var list = ca ? (ca.flatrate || []).concat(ca.free || [], ca.ads || []) : [];
        for (var i = 0; i < list.length && where.length < 3; i++) if (where.indexOf(list[i].provider_name) < 0) where.push(list[i].provider_name);
        film = {day: today(), id: m.id, title: m.title || m.original_title, year: (m.release_date || '').slice(0, 4),
          overview: m.overview || '', poster: m.poster_path ? 'https://image.tmdb.org/t/p/w342' + m.poster_path : '',
          where: where, rent: !where.length && !!(ca && (ca.rent || ca.buy))};
        store('film', film);
        if (hooks.panels) hooks.panels();
      });
    });
  }

  function renderFilm(card) {
    el('div', 'head', card, 'Film of the day');
    if (!tmdbKey()) {
      el('div', 'msg', card, 'Add your free TMDB key in Home Settings › TMDB key to see a film here every day.');
      return;
    }
    if (!film || !film.title) { el('div', 'msg', card, 'Finding today’s film…'); return; }
    if (film.poster) { var p = el('div', 'poster', card); p.style.backgroundImage = 'url("' + film.poster + '")'; }
    else setClass(card, 'no-poster', true);
    var t = el('div', 'ttl', card, film.title + ' ');
    if (film.year) el('span', 'yr', t, '(' + film.year + ')');
    el('div', 'ov', card, film.overview);
    el('div', 'where', card, film.where.length ? 'Streaming on ' + film.where.join(', ') :
      film.rent ? 'To rent or buy in Canada' : 'Not streaming in Canada right now');
  }

  // MARK: - This day in film history (TMDB): films released on today's date, at round anniversaries (10, 15 ... 75 years)

  var history = stored('history'), historyTriedAt = 0;

  function refreshHistory() {
    if (!tmdbKey()) return;
    if (history && history.day === today()) return;
    if (Date.now() - historyTriedAt < 60 * 60000) return;
    historyTriedAt = Date.now();
    var d = new Date(), md = '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()), year = d.getFullYear(), jobs = [], found = [];
    for (var ago = 10; ago <= 75; ago += 5) {
      jobs.push({y: year - ago, hi: false});
      jobs.push({y: year - ago, hi: true});
    }
    (function next() {
      var j = jobs.shift();
      if (!j) {
        // the three best-known films, and the best-known Hindi one if it isn't already among them
        found.sort(function (a, b) { return b.votes - a.votes; });
        var pick = found.filter(function (f) { return !f.hi; }).slice(0, 3), hi = found.filter(function (f) { return f.hi; })[0];
        if (hi && !pick.some(function (f) { return f.id === hi.id; })) pick.push(hi);
        history = {day: today(), list: pick};
        store('history', history);
        return;
      }
      var date = j.y + md;
      tmdb('/discover/movie?include_adult=false&sort_by=vote_count.desc&primary_release_date.gte=' + date +
        '&primary_release_date.lte=' + date + (j.hi ? '&with_original_language=hi&vote_count.gte=60' : '&vote_count.gte=800'), function (err, body) {
        var m = !err && body && body.results && body.results[0];
        if (m && !found.some(function (f) { return f.id === m.id; }))
          found.push({id: m.id, title: m.title || m.original_title, year: j.y, ago: year - j.y, votes: m.vote_count || 0, hi: j.hi});
        setTimeout(next, 250);   // gentle on TMDB
      });
    })();
  }

  // MARK: - Film quotes for the screensaver (short lines, with the film they're from)

  var QUOTES = [
    ["You talkin\u2019 to me?", "Taxi Driver (1976)"],
    ["Go ahead, make my day.", "Sudden Impact (1983)"],
    ["What we\u2019ve got here is failure to communicate.", "Cool Hand Luke (1967)"],
    ["The Dude abides.", "The Big Lebowski (1998)"],
    ["If you build it, he will come.", "Field of Dreams (1989)"],
    ["Run, Forrest, run!", "Forrest Gump (1994)"],
    ["Stupid is as stupid does.", "Forrest Gump (1994)"],
    ["Hasta la vista, baby.", "Terminator 2: Judgment Day (1991)"],
    ["You\u2019re killing me, Smalls!", "The Sandlot (1993)"],
    ["Inconceivable!", "The Princess Bride (1987)"],
    ["As you wish.", "The Princess Bride (1987)"],
    ["Well, nobody\u2019s perfect.", "Some Like It Hot (1959)"],
    ["I\u2019ll get you, my pretty, and your little dog too!", "The Wizard of Oz (1939)"],
    ["Snap out of it!", "Moonstruck (1987)"],
    ["Wilson!", "Cast Away (2000)"],
    ["Shaken, not stirred.", "Goldfinger (1964)"],
    ["They may take our lives, but they\u2019ll never take our freedom!", "Braveheart (1995)"],
    ["Help me, Obi-Wan Kenobi. You\u2019re my only hope.", "Star Wars (1977)"],
    ["These aren\u2019t the droids you\u2019re looking for.", "Star Wars (1977)"],
    ["I\u2019ve got a bad feeling about this.", "Star Wars (1977)"],
    ["Chewie, we\u2019re home.", "Star Wars: The Force Awakens (2015)"],
    ["Great Scott!", "Back to the Future (1985)"],
    ["Nobody calls me chicken.", "Back to the Future Part II (1989)"],
    ["It was beauty killed the beast.", "King Kong (1933)"],
    ["Keep the change, ya filthy animal.", "Home Alone (1990)"],
    ["You shall not pass!", "The Lord of the Rings: The Fellowship of the Ring (2001)"],
    ["One does not simply walk into Mordor.", "The Lord of the Rings: The Fellowship of the Ring (2001)"],
    ["To me, you are perfect.", "Love Actually (2003)"],
    ["I am Iron Man.", "Iron Man (2008)"],
    ["Wakanda forever!", "Black Panther (2018)"],
    ["I love you 3000.", "Avengers: Endgame (2019)"],
    ["Avengers, assemble!", "Avengers: Endgame (2019)"],
    ["Remember who you are.", "The Lion King (1994)"],
    ["The flower that blooms in adversity is the most rare and beautiful of all.", "Mulan (1998)"],
    ["Anyone can cook.", "Ratatouille (2007)"],
    ["It\u2019s leviOsa, not levioSA.", "Harry Potter and the Philosopher\u2019s Stone (2001)"],
    ["Every time a bell rings, an angel gets his wings.", "It\u2019s a Wonderful Life (1946)"],
    ["Rosebud.", "Citizen Kane (1941)"],
    ["I coulda been a contender.", "On the Waterfront (1954)"],
    ["Play it, Sam.", "Casablanca (1942)"],
    ["I want to be alone.", "Grand Hotel (1932)"],
    ["Today, I consider myself the luckiest man on the face of the earth.", "The Pride of the Yankees (1942)"],
    ["I volunteer as tribute!", "The Hunger Games (2012)"],
    ["That\u2019ll do, pig. That\u2019ll do.", "Babe (1995)"],
    ["Ogres are like onions.", "Shrek (2001)"],
    ["Yo, Adrian!", "Rocky (1976)"],
    ["Good morning, Vietnam!", "Good Morning, Vietnam (1987)"],
    ["Bueller?\u2026 Bueller?", "Ferris Bueller\u2019s Day Off (1986)"],
    ["I\u2019m not bad. I\u2019m just drawn that way.", "Who Framed Roger Rabbit (1988)"],
    ["I\u2019m gonna make him an offer he can\u2019t refuse.", "The Godfather (1972)"],
    ["Keep your friends close, but your enemies closer.", "The Godfather Part II (1974)"],
    ["Frankly, my dear, I don\u2019t give a damn.", "Gone with the Wind (1939)"],
    ["Toto, I\u2019ve a feeling we\u2019re not in Kansas anymore.", "The Wizard of Oz (1939)"],
    ["We\u2019ll always have Paris.", "Casablanca (1942)"],
    ["Round up the usual suspects.", "Casablanca (1942)"],
    ["The stuff that dreams are made of.", "The Maltese Falcon (1941)"],
    ["Fasten your seatbelts. It\u2019s going to be a bumpy night.", "All About Eve (1950)"],
    ["Bond. James Bond.", "Dr. No (1962)"],
    ["I\u2019m sorry, Dave. I\u2019m afraid I can\u2019t do that.", "2001: A Space Odyssey (1968)"],
    ["No, I am your father.", "The Empire Strikes Back (1980)"],
    ["I feel the need\u2014the need for speed!", "Top Gun (1986)"],
    ["Nobody puts Baby in a corner.", "Dirty Dancing (1987)"],
    ["I\u2019ll have what she\u2019s having.", "When Harry Met Sally\u2026 (1989)"],
    ["You can\u2019t handle the truth!", "A Few Good Men (1992)"],
    ["Life finds a way.", "Jurassic Park (1993)"],
    ["Show me the money!", "Jerry Maguire (1996)"],
    ["You had me at hello.", "Jerry Maguire (1996)"],
    ["I\u2019m the king of the world!", "Titanic (1997)"],
    ["There is no spoon.", "The Matrix (1999)"],
    ["I see dead people.", "The Sixth Sense (1999)"],
    ["My precious.", "The Lord of the Rings: The Two Towers (2002)"],
    ["With great power comes great responsibility.", "Spider-Man (2002)"],
    ["Why so serious?", "The Dark Knight (2008)"],
    ["The night is darkest just before the dawn.", "The Dark Knight (2008)"],
    ["Adventure is out there!", "Up (2009)"],
    ["Some people are worth melting for.", "Frozen (2013)"],
    ["I am Groot.", "Guardians of the Galaxy (2014)"],
    ["Don\u2019t underestimate the power of a common man.", "Chennai Express (2013)"],
    ['Here’s looking at you, kid.', 'Casablanca (1942)'],
    ['Louis, I think this is the beginning of a beautiful friendship.', 'Casablanca (1942)'],
    ['May the Force be with you.', 'Star Wars (1977)'],
    ['Open the pod bay doors, HAL.', '2001: A Space Odyssey (1968)'],
    ['Houston, we have a problem.', 'Apollo 13 (1995)'],
    ['To infinity and beyond!', 'Toy Story (1995)'],
    ['There’s no place like home.', 'The Wizard of Oz (1939)'],
    ['Get busy living, or get busy dying.', 'The Shawshank Redemption (1994)'],
    ['Hope is a good thing, maybe the best of things.', 'The Shawshank Redemption (1994)'],
    ['After all, tomorrow is another day!', 'Gone with the Wind (1939)'],
    ['Roads? Where we’re going, we don’t need roads.', 'Back to the Future (1985)'],
    ['Carpe diem. Seize the day, boys.', 'Dead Poets Society (1989)'],
    ['You’re gonna need a bigger boat.', 'Jaws (1975)'],
    ['I’ll be back.', 'The Terminator (1984)'],
    ['E.T. phone home.', 'E.T. the Extra-Terrestrial (1982)'],
    ['Do. Or do not. There is no try.', 'The Empire Strikes Back (1980)'],
    ['All we have to decide is what to do with the time that is given us.', 'The Fellowship of the Ring (2001)'],
    ['Why do we fall? So we can learn to pick ourselves up.', 'Batman Begins (2005)'],
    ['Do not go gentle into that good night.', 'Interstellar (2014)'],
    ['Just keep swimming.', 'Finding Nemo (2003)'],
    ['Ohana means family. Family means nobody gets left behind.', 'Lilo & Stitch (2002)'],
    ['Hakuna matata.', 'The Lion King (1994)'],
    ['Wax on, wax off.', 'The Karate Kid (1984)'],
    ['There’s no crying in baseball!', 'A League of Their Own (1992)'],
    // Hindi dialogues: the line as said (romanized: the TV's fonts have no Devanagari to rely on), then in English
    ['Kitne aadmi the?', 'Sholay (1975)', 'How many men were there?'],
    ['Jo darr gaya, samjho mar gaya.', 'Sholay (1975)', 'Whoever got scared, consider them dead.'],
    ['Basanti, in kutton ke saamne mat naachna.', 'Sholay (1975)', 'Basanti, don’t dance in front of these dogs.'],
    ['Mogambo khush hua!', 'Mr. India (1987)', 'Mogambo is pleased!'],
    ['Bade bade deshon mein aisi chhoti chhoti baatein hoti rehti hain.', 'Dilwale Dulhania Le Jayenge (1995)', 'In big countries, little things like this keep happening.'],
    ['Jaa Simran jaa, jee le apni zindagi.', 'Dilwale Dulhania Le Jayenge (1995)', 'Go, Simran, go. Live your life.'],
    ['Picture abhi baaki hai mere dost.', 'Om Shanti Om (2007)', 'The film isn’t over yet, my friend.'],
    ['Ek chutki sindoor ki keemat tum kya jaano, Ramesh babu?', 'Om Shanti Om (2007)', 'What would you know of the worth of a pinch of sindoor, Ramesh?'],
    ['Pushpa, I hate tears.', 'Amar Prem (1972)', ''],
    ['Babumoshai, zindagi badi honi chahiye, lambi nahi.', 'Anand (1971)', 'Life should be big, not long.'],
    ['Mere paas maa hai.', 'Deewaar (1975)', 'I have Mother.'],
    ['Main aaj bhi phenke hue paise nahi uthata.', 'Deewaar (1975)', 'Even today, I don’t pick up money that’s thrown at me.'],
    ['Aal izz well.', '3 Idiots (2009)', 'All is well.'],
    ['Kabhi kabhi jeetne ke liye kuch haarna padta hai.', 'Baazigar (1993)', 'Sometimes, to win, you have to lose something.'],
    ['Haar kar jeetne wale ko baazigar kehte hain.', 'Baazigar (1993)', 'The one who wins after losing is called a gambler.'],
    ['Don ko pakadna mushkil hi nahi, naamumkin hai.', 'Don (1978)', 'Catching Don isn’t just difficult, it’s impossible.'],
    ['Rishte mein toh hum tumhare baap lagte hain, naam hai Shahenshah.', 'Shahenshah (1988)', 'By relation, I’m your father. The name is Shahenshah.'],
    ['Hum jahan khade ho jaate hain, line wahi se shuru hoti hai.', 'Kaalia (1981)', 'Wherever I stand, that’s where the line starts.'],
    ['Tareekh pe tareekh, tareekh pe tareekh milti rahi hai.', 'Damini (1993)', 'Date after date, date after date is all we’ve got.'],
    ['Rahul… naam toh suna hoga.', 'Dil To Pagal Hai (1997)', 'Rahul… you must have heard the name.'],
    ['Kuch kuch hota hai, Anjali, tum nahi samjhogi.', 'Kuch Kuch Hota Hai (1998)', 'Something happens, Anjali. You won’t understand.'],
    ['Main apni favourite hoon!', 'Jab We Met (2007)', 'I’m my own favourite!'],
    ['Thappad se darr nahi lagta sahab, pyaar se lagta hai.', 'Dabangg (2010)', 'I’m not scared of a slap, sir. I’m scared of love.'],
    ['Apna time aayega.', 'Gully Boy (2019)', 'Our time will come.'],
    ['How’s the josh?', 'Uri: The Surgical Strike (2019)', 'How’s the spirit?'],
    ['Tension lene ka nahi, sirf dene ka.', 'Munna Bhai M.B.B.S. (2003)', 'Don’t take tension. Only give it.'],
    ['Utha le re baba!', 'Hera Pheri (2000)', 'Take me away, God!'],
    ['Chinoy Seth, jinke apne ghar sheeshe ke hon, woh doosron par patthar nahi phenka karte.', 'Waqt (1965)', 'Those who live in glass houses don’t throw stones.'],
    ['Ek baar jo maine commitment kar di, uske baad toh main khud ki bhi nahi sunta.', 'Wanted (2009)', 'Once I make a commitment, I don’t even listen to myself.'],
    ['Dosti ka ek usool hai, madam: no sorry, no thank you.', 'Maine Pyar Kiya (1989)', 'Friendship has one rule: no sorry, no thank you.'],
    ['Main udna chahta hoon, daudna chahta hoon, girna bhi chahta hoon… bas rukna nahi chahta.', 'Yeh Jawaani Hai Deewani (2013)', 'I want to fly, run, even fall… I just don’t want to stop.'],
    ['Mhaari chhoriyan chhoron se kam hai ke?', 'Dangal (2016)', 'Are our girls any less than the boys?'],
    ['Sattar minute hai tumhare paas.', 'Chak De! India (2007)', 'You have seventy minutes.'],
    ['Kaun kambakht hai jo bardaasht karne ke liye peeta hai?', 'Devdas (2002)', 'Who on earth drinks just to bear it?'],
    ['Kehte hain agar kisi cheez ko dil se chaho, toh poori kaynaat usse tumse milane ki koshish mein lag jaati hai.', 'Om Shanti Om (2007)', 'If you want something with all your heart, the whole universe conspires to help you get it.'],
    ['Main hoon na.', 'Main Hoon Na (2004)', 'I’m here, aren’t I?']
  ];

  function shuffled(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  /** The screensaver: recent space photos, each with a film quote. [] while NASA hasn't answered yet. */
  function saverItems() {
    var photos = shuffled(pool()), quotes = shuffled(QUOTES), out = [], i;
    var hist = history && history.day === today() ? history.list : [], h = 0;
    // every quote gets a turn, even with only a few photos ready: the photos go round again
    for (i = 0; photos.length && i < Math.max(photos.length, quotes.length); i++) {
      var ph = photos[i % photos.length], q = quotes[i % quotes.length];
      if (hist.length && i % 6 === 2) {   // every sixth card, this day in film history, in the same panel
        var f = hist[h++ % hist.length];
        out.push({img: ph.src, title: ph.title, label: ph.label, history: true, quote: f.title + ' was released ' + f.ago + ' years ago today.',
          film: 'On this day · ' + f.year});
        continue;
      }
      out.push({img: ph.src, title: ph.title, label: ph.label, quote: q[0], film: q[1], en: q[2] || ''});
    }
    if (!out.length && dioShown) {
      for (i = 0; i < quotes.length; i++) out.push({img: 'dio-' + dioShown + '.jpg', quote: quotes[i][0], film: quotes[i][1], en: quotes[i][2] || ''});
    }
    return out;
  }

  // MARK: - How long each screensaver photo and quote stays (Home Settings > Screensaver changes every)

  // Home Settings > Weather effects: Full, Subtle or Off
  var FX_MODES = ['full', 'subtle', 'off'], fxMode = stored('fxMode') || 'full';
  function fxLabel() { return {full: 'Full', subtle: 'Subtle', off: 'Off'}[fxMode]; }
  function fxStep(d) {
    fxMode = FX_MODES[(FX_MODES.indexOf(fxMode) + (d < 0 ? 2 : 1)) % 3];
    store('fxMode', fxMode);
    dioShown = '';
    applyLook();
  }

  var SPEEDS = [10, 15, 20, 30, 45, 60, 120, 300], saverSecs = +stored('saverSecs') || 20;

  function saverLabel() { return saverSecs < 60 ? saverSecs + ' seconds' : saverSecs === 60 ? '1 minute' : (saverSecs / 60) + ' minutes'; }

  function saverStep(d) {
    var i = SPEEDS.indexOf(saverSecs);
    if (i < 0) i = 2;
    saverSecs = SPEEDS[(i + (d < 0 ? SPEEDS.length - 1 : 1)) % SPEEDS.length];
    store('saverSecs', saverSecs);
  }

  // MARK: - Liquid glass: the shelf, the round buttons, the drawer's keys and cards and the screensaver's clock
  // webOS 5's browser can't blur what is behind an element (no backdrop-filter), so each glass panel carries its own
  // blurred copy of the picture behind it (.frost), lined up with it. Pictures only: a moving diorama shows its still.

  var frostOn = true;

  function stageScale() { var r = $('stage').getBoundingClientRect(); return r.width / 1920 || 1; }

  function frost(el, url, scale, s0) {
    if (!el || !el.offsetWidth) return;
    var f = el.querySelector(':scope > .frost');
    if (!url) { if (f) f.style.backgroundImage = 'none'; return; }
    if (!f) { f = document.createElement('div'); f.className = 'frost'; el.insertBefore(f, el.firstChild); setClass(el, 'lg', true); }
    var r = el.getBoundingClientRect(), st = $('stage').getBoundingClientRect();
    var x = (r.left - st.left) / s0 - 30, y = (r.top - st.top) / s0 - 30,   // .frost reaches 30px past each edge
        z = scale || 1;
    var want = 'url("' + url + '")', pos = (-(x + 960 * (z - 1))) + 'px ' + (-(y + 540 * (z - 1))) + 'px', size = (1920 * z) + 'px ' + (1080 * z) + 'px';
    if (f.style.backgroundImage !== want) f.style.backgroundImage = want;
    if (f.style.backgroundPosition !== pos) f.style.backgroundPosition = pos;
    if (f.style.backgroundSize !== size) f.style.backgroundSize = size;
  }

  function wallUrl() {
    var wall = $('wall'), stage = $('stage');
    if (!wall || !/(^| )wall-on( |$)/.test(stage.className)) return '';
    return wall.getAttribute('data-src') || '';
  }

  function refreshGlass() {
    if (!frostOn || document.hidden) return;
    var ed = /(^| )ed( |$)/.test(document.documentElement.className), sv = $('saver');
    // the editorial layout has no glass on the home screen (it's hidden): only the screensaver's clock, while it shows
    if (ed && !(sv && /(^| )on( |$)/.test(sv.className))) return;
    var s0 = stageScale(), url = wallUrl(), i, list;
    frost($('platter'), url, 1, s0);
    list = document.querySelectorAll('#buttons .round');
    for (i = 0; i < list.length; i++) frost(list[i], url, 1, s0);
    if (/(^| )drawer-open( |$)/.test(document.body.className)) {
      list = document.querySelectorAll('#drawer .glass');
      for (i = 0; i < list.length; i++) frost(list[i], url, 1, s0);
    }
    var saver = $('saver');
    if (saver && /(^| )on( |$)/.test(saver.className)) {
      var front = saver.querySelector('.photo.on'), m = front && /url\(["']?([^"')]+)/.exec(front.style.backgroundImage || '');
      frost(saver.querySelector('.clock'), m ? m[1] : '', 1.08, s0);
    }
  }
  setInterval(refreshGlass, 700);

  // MARK: - Ambient sound (Home Settings > Ambient sound): the sound Veo made with each clip, looped, under the home screen
  // Off by default. Plays only on the home screen: never under an app, the screensaver, Movie night, Study or the modes.

  var SOUND_MODES = ['off', 'quiet', 'on'], soundMode = stored('soundMode') || 'off', SOUND_GAIN = {quiet: 0.35, on: 0.8};
  var amb = {ctx: null, buffers: {}, src: null, gain: null, want: '', playing: '', loading: ''};

  function soundLabel() { return {off: 'Off', quiet: 'Quiet', on: 'On'}[soundMode]; }
  function soundStep(d) {
    soundMode = SOUND_MODES[(SOUND_MODES.indexOf(soundMode) + (d < 0 ? 2 : 1)) % 3];
    store('soundMode', soundMode);
    dioShown = '';
    applyLook();
  }

  function ambCtx() {
    if (!amb.ctx) {
      try { var Ctx = window.AudioContext || window.webkitAudioContext; amb.ctx = new Ctx(); } catch (e) { return null; }
    }
    return amb.ctx;
  }

  function loadSound(url, done) {
    if (amb.buffers[url]) return done(amb.buffers[url]);
    var x = new XMLHttpRequest();
    x.open('GET', url, true);
    x.responseType = 'arraybuffer';
    x.onload = function () {
      var ctx = ambCtx();
      if (!ctx || !x.response) return done(null);
      try {
        ctx.decodeAudioData(x.response, function (buf) { amb.buffers[url] = buf; done(buf); }, function () { done(null); });
      } catch (e) { done(null); }
    };
    x.onerror = function () { done(null); };
    x.send();
  }

  /** Fade out what's playing (over two seconds), and in the wanted sound, if anyone can hear it now. */
  function ambientUpdate() {
    var ctx = amb.ctx, hidden = document.hidden || movie || !!study || !!overlay || /(^| )on( |$)/.test(($('saver') || {}).className || '');
    var url = soundMode !== 'off' && !hidden ? amb.want : '';
    if (url === amb.playing) {
      if (amb.gain && ctx) amb.gain.gain.setTargetAtTime(SOUND_GAIN[soundMode] || 0, ctx.currentTime, 0.4);
      return;
    }
    if (amb.src && ctx) {
      var old = amb.src, g = amb.gain;
      g.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
      setTimeout(function () { try { old.stop(); } catch (e) {} }, 2500);
      amb.src = amb.gain = null;
    }
    amb.playing = '';
    if (!url || amb.loading === url) return;
    amb.loading = url;
    loadSound(url, function (buf) {
      amb.loading = '';
      var c = ambCtx();
      if (!buf || !c || amb.want !== url) return;
      try { if (c.state === 'suspended') c.resume(); } catch (e) {}
      var src = c.createBufferSource(), gain = c.createGain();
      src.buffer = buf;
      src.loop = true;   // the file is made to loop without a seam
      gain.gain.value = 0;
      src.connect(gain);
      gain.connect(c.destination);
      src.start();
      gain.gain.setTargetAtTime(SOUND_GAIN[soundMode] || 0, c.currentTime, 0.8);
      amb.src = src;
      amb.gain = gain;
      amb.playing = url;
    });
  }
  document.addEventListener('visibilitychange', ambientUpdate);
  // one tick for both (they used to have a timer each); behind an app it only checks that it's hidden
  setInterval(function () {
    keepVideo();   // pauses the video and effects when hidden, so this call stays even then
    if (!document.hidden) ambientUpdate();
    if (perfOn) perfDraw();
  }, 2000);

  // MARK: - Modes

  var movie = stored('movie') === true;

  function setMovie(on) {
    movie = on;
    store('movie', on);
    setClass(document.documentElement, 'movie', on);
    if (hooks.night) hooks.night();
    if (hooks.redraw) hooks.redraw();
    if (hooks.toast) hooks.toast(on ? 'Movie night on · select it again to turn it off' : 'Movie night off');
  }

  // Study: 25 minutes focus, 5 minutes break, with instrumental radio playing here (so the timer stays on screen)
  var study = null;

  function chime() {
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext, ctx = new Ctx(), t = ctx.currentTime;
      [523.25, 659.25, 783.99].forEach(function (f, i) {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = f;
        g.gain.setValueAtTime(0, t + i * 0.22);
        g.gain.linearRampToValueAtTime(0.22, t + i * 0.22 + 0.04);
        g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.22 + 1.6);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(t + i * 0.22);
        o.stop(t + i * 0.22 + 1.7);
      });
      setTimeout(function () { try { ctx.close(); } catch (e) {} }, 3000);
    } catch (e) {}
  }

  function studyDraw() {
    var s = $('study');
    if (!study || !s) return;
    if (study.radio) {
      var snd = study.current || SILENCE;
      s.querySelector('.phase').textContent = study.paused ? 'Paused' : (snd.url || snd.noise ? 'Now playing' : 'Radio');
      s.querySelector('.time').textContent = snd.url || snd.noise ? snd.name : 'Pick a station with ←';
      s.querySelector('.dots').textContent = '';
      setClass(s, 'paused', study.paused);
      s.querySelector('.hint').textContent = (study.paused ? 'Paused · OK to carry on' : 'OK to pause') + '  ·  ↑ ↓ saved stations  ·  ← more  ·  → ' +
        (study.visMode === 'milkdrop' ? 'next look' : 'next visual') + '  ·  Back to leave';
      return;
    }
    var gone = Math.floor(((study.paused ? study.pausedAt : Date.now()) - study.start) / 1000);
    var left = Math.max(0, study.length - gone);
    s.querySelector('.time').textContent = Math.floor(left / 60) + ':' + pad(left % 60);
    s.querySelector('.phase').textContent = study.focus ? 'Focus' : 'Break · stretch, water, look away';
    var dots = '';
    for (var i = 0; i < 4; i++) dots += i < (study.done % 4) ? '●' : '○';
    s.querySelector('.dots').textContent = dots;
    setClass(s, 'paused', study.paused);
    s.querySelector('.hint').textContent = (study.paused ? 'Paused · OK to carry on' : 'OK to pause') + (study.radioOn ? '  ·  ↑ ↓ saved sounds  ·  ← more sounds' : '  ·  ← radio') + '  ·  → skip  ·  Back to leave';
    if (!study.paused && left === 0) { studyNext(); studyDraw(); }
  }

  function studyNext() {
    if (study.focus) study.done++;
    study.focus = !study.focus;
    study.length = (study.focus ? FOCUS_MIN : (study.done % 4 === 0 ? 15 : BREAK_MIN)) * 60;   // a longer break every 4th
    study.start = Date.now();
    study.paused = false;
    chime();
  }

  function soundId(snd) { return snd.noise ? 'noise:' + snd.noise : (snd.url || ''); }
  function savedSounds() { var v = stored('studySaved'); return v && v.length !== undefined ? v : STUDY_DEFAULT.slice(); }
  function isSaved(snd) {
    var id = soundId(snd), list = savedSounds();
    for (var i = 0; i < list.length; i++) if (soundId(list[i]) === id) return true;
    return false;
  }
  function toggleSaved(snd) {
    var id = soundId(snd), list = savedSounds(), out = [], had = false;
    for (var i = 0; i < list.length; i++) { if (soundId(list[i]) === id) had = true; else out.push(list[i]); }
    if (!had) out.push({name: snd.name, url: snd.url, loop: snd.loop, noise: snd.noise});
    store('studySaved', out);
    return !had;
  }

  /** Noise made here: a few seconds of it, its ends cross-faded so the loop has no seam. */
  function startNoise(kind) {
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    try {
      var ctx = study.ctx || (study.ctx = new Ctx()), rate = ctx.sampleRate, len = rate * 6, fade = Math.floor(rate * 0.5);
      var raw = new Float32Array(len + fade), last = 0, b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (var i = 0; i < len + fade; i++) {
        var w = Math.random() * 2 - 1;
        if (kind === 'brown') { last = (last + 0.02 * w) / 1.02; raw[i] = last * 3.5; }
        else if (kind === 'pink') {
          b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
          b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
          raw[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
        } else raw[i] = w * 0.3;
      }
      var buf = ctx.createBuffer(1, len, rate), d = buf.getChannelData(0);
      for (var j = 0; j < len; j++) d[j] = j < fade ? raw[j] * (j / fade) + raw[len + j] * (1 - j / fade) : raw[j];
      var src = ctx.createBufferSource(), gain = ctx.createGain();
      src.buffer = buf;
      src.loop = true;
      gain.gain.value = 0;
      src.connect(gain);
      gain.connect(visGraph() || ctx.destination);
      src.start();
      gain.gain.setTargetAtTime(0.55, ctx.currentTime, 0.6);
      study.synced = true;
      if (ctx.state === 'suspended' && !study.paused) ctx.resume();
      study.noise = src;
    } catch (e) {}
  }

  function stopSound() {
    clearTimeout(study.watch);
    tapStop();
    if (study.audio) { try { study.audio.pause(); study.audio.removeAttribute('src'); study.audio.load(); } catch (e) {} }
    if (study.noise) { try { study.noise.stop(); } catch (e) {} }
    study.audio = study.noise = null;
  }

  function resumeSound() {
    if (study.audio) { try { var p = study.audio.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {} }
    tapMaybe();
    if (study.ctx) { try { study.ctx.resume(); } catch (e) {} }
  }
  function pauseSound() {
    if (study.audio) study.audio.pause();
    tapStop();
    if (study.ctx) { try { study.ctx.suspend(); } catch (e) {} }
  }

  /** Plays a sound; a stream that hasn't started in 10 s is called out on the music line instead of sitting there silent. */
  function playSound(snd) {
    stopSound();
    study.current = snd;
    study.failed = false;
    study.synced = false;
    store('studyNow', {name: snd.name, url: snd.url, loop: snd.loop, noise: snd.noise});
    if (snd.noise) startNoise(snd.noise);
    else if (snd.url) {
      try {
        // With the visuals on, the stream is asked for with CORS, so the analyser may read it; a station that refuses is
        // played again without (the visuals then keep an approximate beat), and remembered for this session.
        if (snd.loop && !/^https?:/.test(snd.url) && playBuffer(snd)) { musicLine(); if (study.picker) renderPicker(); return; }
        var a = new Audio(), started = false, cors = MEDIA_TAP && study.visMode !== 'off' && !study.noCors[snd.url], fail = function () {
          if (study && study.audio === a && !started) { study.failed = true; musicLine(); }
        };
        a.loop = !!snd.loop;
        a.volume = 0.6;
        a.addEventListener('playing', function () { started = true; if (study && study.audio === a) { study.failed = false; musicLine(); } });
        if (snd.episode) a.addEventListener('ended', function () { if (study && study.audio === a) nextEpisode(snd); });
        a.addEventListener('error', function () {
          if (cors && study && study.audio === a && !started) { study.noCors[snd.url] = true; playSound(snd); }
          else fail();
        });
        if (cors) {
          a.crossOrigin = 'anonymous';
          var an = visGraph();
          if (an) { try { study.ctx.createMediaElementSource(a).connect(an); study.synced = true; } catch (e) {} }
        }
        a.src = snd.url;
        study.audio = a;
        tapMaybe();
        if (!study.paused) resumeSound();
        study.watch = setTimeout(fail, 10000);
      } catch (e) { study.failed = true; }
    }
    musicLine();
    if (study.picker) renderPicker();
  }

  /** A loop that ships with the app, decoded and played through Web Audio, so the visuals can hear it. */
  function playBuffer(snd) {
    var an = visGraph();
    if (!an) return false;
    var ctx = study.ctx, want = snd, x = new XMLHttpRequest();
    try {
      x.open('GET', snd.url, true);
      x.responseType = 'arraybuffer';
      x.onload = function () {
        if (!study || study.current !== want || !x.response) return;
        ctx.decodeAudioData(x.response, function (buf) {
          if (!study || study.current !== want) return;
          var src = ctx.createBufferSource(), gain = ctx.createGain();
          src.buffer = buf;
          src.loop = true;
          gain.gain.value = 0;
          src.connect(gain);
          gain.connect(an);
          src.start();
          gain.gain.setTargetAtTime(0.6, ctx.currentTime, 0.6);
          if (!study.paused) ctx.resume();
          study.noise = src;
          study.synced = true;
        }, function () { if (study && study.current === want) { study.failed = true; musicLine(); } });
      };
      x.onerror = function () { if (study && study.current === want) { study.failed = true; musicLine(); } };
      x.send();
      return true;
    } catch (e) { return false; }
  }

  // MARK: live sync. Where the TV keeps a station's sound to itself, a second, silent copy of the stream is read here,
  // decoded a second at a time and played into an analyser that never reaches the speakers, each piece placed as far
  // ahead as the TV's player is behind what it has received, so the visuals land on the beat you hear. It costs a second
  // download of the station (about 58 MB an hour at 128 kbps) and only runs while the visuals are on. A station whose
  // server doesn't allow it falls back to the made-up groove.

  function tapMaybe() {
    var snd = study.current;
    if (MEDIA_TAP || study.paused || study.visMode === 'off' || !snd || !snd.url || snd.episode || !/^https?:/.test(snd.url) || study.noTap[snd.url]) return;
    if (study.tap && study.tap.url === snd.url) return;
    if (!visGraph()) return;
    tapStop();
    var ctx = study.ctx, t = study.tap = {url: snd.url, xhr: null, pos: 0, bytes: [], len: 0, ok: false, fails: 0, an: null, sink: null, opened: 0};
    try {
      t.an = ctx.createAnalyser();
      t.an.fftSize = 512;
      t.an.smoothingTimeConstant = 0.72;
      t.sink = ctx.createGain();
      t.sink.gain.value = 0;   // pulled through so it runs, never heard
      t.an.connect(t.sink);
      t.sink.connect(ctx.destination);
    } catch (e) { study.tap = null; return; }
    tapOpen(t);
  }

  function tapOpen(t) {
    var x = new XMLHttpRequest(), quit = function () { x.onprogress = x.onerror = x.onload = null; try { x.abort(); } catch (e) {} };
    t.xhr = x;
    t.pos = 0;
    t.opened = Date.now();
    var lost = function (refused) {
      if (!refused && t.len && study && study.tap === t) tapDecode(t);   // what came before the end
      quit();
      if (!study || study.tap !== t) return;
      if (++t.fails > 3 || (refused && !t.ok)) { study.noTap[t.url] = true; tapStop(); return; }   // refused, or keeps dropping: the groove
      setTimeout(function () { if (study && study.tap === t) tapOpen(t); }, 1500);
    };
    try {
      x.open('GET', t.url, true);
      x.overrideMimeType('text/plain; charset=x-user-defined');   // bytes as they come, in an ES5-only browser
      x.onprogress = function () {
        if (!study || study.tap !== t) return quit();
        var str = x.responseText, n = str.length;
        if (n > t.pos) {
          var b = new Uint8Array(n - t.pos);
          for (var i = t.pos; i < n; i++) b[i - t.pos] = str.charCodeAt(i) & 255;
          t.pos = n;
          t.bytes.push(b);
          t.len += b.length;
          if (t.len >= 20000) tapDecode(t);
        }
        if (Date.now() - t.opened > 20000) { quit(); tapOpen(t); }   // a fresh request now and then: the text only grows
      };
      x.onerror = function () { lost(true); };
      x.onload = function () { lost(false); };
      x.send();
    } catch (e) { lost(true); }
  }

  /** How far the TV's player is behind what it has received: where a decoded piece has to wait before it's "heard". */
  function tapAhead() {
    var a = study.audio;
    try {
      if (a && a.buffered && a.buffered.length) {
        var v = a.buffered.end(a.buffered.length - 1) - a.currentTime;
        if (v > 0.2 && v < 30) return v;
      }
    } catch (e) {}
    return 2.5;
  }

  function tapDecode(t) {
    var all = new Uint8Array(t.len), o = 0;
    for (var i = 0; i < t.bytes.length; i++) { all.set(t.bytes[i], o); o += t.bytes[i].length; }
    t.bytes = [];
    t.len = 0;
    var ctx = study.ctx, came = ctx.currentTime, ahead = tapAhead();
    try {
      ctx.decodeAudioData(all.buffer, function (buf) {
        if (!study || study.tap !== t) return;
        if (!t.ok) { t.ok = true; musicLine(); }
        t.fails = 0;
        var src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(t.an);
        src.start(Math.max(ctx.currentTime, came + ahead - buf.duration));
      }, function () {});
    } catch (e) {}
  }

  function tapStop() {
    var t = study && study.tap;
    if (!t) return;
    study.tap = null;
    if (t.xhr) { t.xhr.onprogress = t.xhr.onerror = t.xhr.onload = null; try { t.xhr.abort(); } catch (e) {} }
    try { t.an.disconnect(); t.sink.disconnect(); } catch (e) {}
  }

  /** The analyser everything plays through while the visuals are on. */
  function visGraph() {
    if (study.analyser) return study.analyser;
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    try {
      var ctx = study.ctx || (study.ctx = new Ctx()), an = ctx.createAnalyser();
      an.fftSize = 512;
      an.smoothingTimeConstant = 0.78;
      an.connect(ctx.destination);
      if (!study.paused) ctx.resume();
      study.analyser = an;
      return an;
    } catch (e) { return null; }
  }

  /** This frame's spectrum and waveform: the real ones, an approximate beat for a stream that can't be read, flat in silence. */
  function visData(t) {
    var f = study.freq, w = study.wave, i, snd = study.current || SILENCE;
    if (study.paused || (!snd.url && !snd.noise) || study.failed) {
      for (i = 0; i < f.length; i++) f[i] = f[i] * 0.9;
      for (i = 0; i < w.length; i++) w[i] = 128 + (w[i] - 128) * 0.9;
    } else if (study.tap && study.tap.ok) {
      study.tap.an.getByteFrequencyData(f);
      study.tap.an.getByteTimeDomainData(w);
    } else if (study.synced && study.analyser) {
      study.analyser.getByteFrequencyData(f);
      study.analyser.getByteTimeDomainData(w);
      var peak = 0;
      for (i = 0; i < 64; i++) if (f[i] > peak) peak = f[i];
      study.silentFrames = peak ? 0 : (study.silentFrames || 0) + 1;
      if (study.silentFrames > 90 && study.audio) study.synced = false;   // reads only zeros: this browser can't tap it
    } else {
      // a made-up groove at 92 bpm: kick on 1 and 3, snare on 2 and 4, hats on the eighths, chords drifting in the mids
      var beatLen = 60 / 92, ph = (t % (beatLen * 4)) / beatLen, b = Math.floor(ph), fr = ph - b;
      var kick = (b % 2 === 0) ? Math.exp(-fr * 7) : 0, snare = (b % 2 === 1) ? Math.exp(-fr * 9) : 0, hat = Math.exp(-((ph * 2) % 1) * 14);
      for (i = 0; i < f.length; i++) {
        var x = i / f.length, chord = 0.5 + 0.5 * Math.sin(t * 0.9 + i * 0.21) * Math.sin(t * 0.37 + i * 0.05);
        var v = 70 * Math.exp(-x * 2.2) + 150 * kick * Math.exp(-x * 14) + 90 * snare * Math.exp(-Math.pow((x - 0.3) * 6, 2)) +
          110 * chord * Math.exp(-Math.pow((x - 0.18) * 5, 2)) + 60 * hat * Math.exp(-Math.pow((x - 0.62) * 5, 2));
        f[i] = Math.min(255, v * (0.85 + 0.3 * Math.random()));
      }
      for (i = 0; i < w.length; i++)
        w[i] = 128 + (40 * kick * Math.sin(i * 0.05) + 22 * Math.sin(i * 0.11 + t * 2) * (0.5 + chord) + 12 * snare * (Math.random() - 0.5) * 2) * 0.9;
    }
  }

  function visDraw(g, c, t) {
    visData(t);
    var f = study.freq, w = study.wave, i, bass = 0, mode = study.visMode;
    for (i = 0; i < 8; i++) bass += f[i];
    bass /= 8 * 255;
    if (mode === 'tunnel') {
      // the picture fed back into itself, bigger and turned a little, so everything drawn flies outward and swirls;
      // spokes of the spectrum from the centre and a glowing ring of the waveform feed it, and a kick sends out a ring
      g.save();
      g.globalAlpha = 0.9;
      g.translate(VIS_W / 2, VIS_H / 2);
      g.rotate(0.006 + bass * 0.03 + Math.sin(t * 0.21) * 0.01);
      var z = 1.025 + bass * 0.05;
      g.scale(z, z);
      g.drawImage(c, -VIS_W / 2, -VIS_H / 2);
      g.restore();
      g.fillStyle = 'rgba(4,2,10,0.10)';
      g.fillRect(0, 0, VIS_W, VIS_H);
      var hue = Math.round(t * 30) % 360, cx = VIS_W / 2, cy = VIS_H / 2;
      g.globalCompositeOperation = 'lighter';
      var spokes = 48;
      g.lineWidth = 2;
      for (i = 0; i < spokes; i++) {
        var v2 = f[Math.floor(Math.pow(i / spokes, 1.5) * 120)] / 255, ang = i / spokes * Math.PI * 2 + t * 0.4;
        if (v2 < 0.12) continue;
        g.strokeStyle = 'hsla(' + (hue + i * 7) % 360 + ',100%,60%,' + (v2 * 0.8).toFixed(2) + ')';
        g.beginPath();
        g.moveTo(cx + Math.cos(ang) * 18, cy + Math.sin(ang) * 18);
        g.lineTo(cx + Math.cos(ang) * (18 + v2 * 70), cy + Math.sin(ang) * (18 + v2 * 70));
        g.stroke();
      }
      var r = 22 + bass * 46, n = 120;
      for (var pass = 0; pass < 2; pass++) {
        g.lineWidth = pass ? 1.6 : 6;
        g.strokeStyle = 'hsla(' + (hue + 180) % 360 + ',100%,' + (pass ? 75 : 55) + '%,' + (pass ? 0.95 : 0.25) + ')';
        g.beginPath();
        for (i = 0; i <= n; i++) {
          var a2 = i / n * Math.PI * 2, rr = r + (w[(i * 4) % w.length] - 128) * 0.4;
          var x2 = cx + Math.cos(a2) * rr, y2 = cy + Math.sin(a2) * rr;
          if (i) g.lineTo(x2, y2); else g.moveTo(x2, y2);
        }
        g.stroke();
      }
      if (bass > 0.55 && t - (study.lastKick || 0) > 0.3) {
        study.lastKick = t;
        g.lineWidth = 3;
        g.strokeStyle = 'hsla(' + (hue + 90) % 360 + ',100%,70%,0.9)';
        g.beginPath();
        g.arc(cx, cy, r + 10, 0, Math.PI * 2);
        g.stroke();
      }
      g.globalCompositeOperation = 'source-over';
    } else if (mode === 'bars') {
      g.fillStyle = 'rgba(0,0,0,0.4)';
      g.fillRect(0, 0, VIS_W, VIS_H);
      var bars = 40, bw = VIS_W / bars, floor = VIS_H * 0.74;
      for (i = 0; i < bars; i++) {
        var v = f[Math.floor(Math.pow(i / bars, 1.6) * 150)] / 255, h = v * VIS_H * 0.55;
        study.peaks[i] = Math.max(h, (study.peaks[i] || 0) - 1.6);
        g.fillStyle = 'hsl(' + Math.round(t * 25 + i * 7) % 360 + ',90%,56%)';
        g.globalAlpha = 1;
        g.fillRect(i * bw + 1, floor - h, bw - 2, h);
        g.globalAlpha = 0.14;
        g.fillRect(i * bw + 1, floor + 2, bw - 2, h * 0.4);
        g.globalAlpha = 0.9;
        g.fillStyle = '#F3EDE4';
        g.fillRect(i * bw + 1, floor - study.peaks[i] - 3, bw - 2, 2);
      }
      g.globalAlpha = 1;
    } else {
      g.fillStyle = 'rgba(0,0,0,0.2)';
      g.fillRect(0, 0, VIS_W, VIS_H);
      g.lineWidth = 3;
      for (var k = 0; k < 2; k++) {
        g.strokeStyle = 'hsl(' + Math.round(t * 40 + k * 180) % 360 + ',100%,60%)';
        g.globalAlpha = k ? 0.45 : 1;
        g.beginPath();
        for (i = 0; i < w.length; i += 2) {
          var px = i / (w.length - 1) * VIS_W, py = VIS_H / 2 + (w[i] - 128) * (k ? -0.9 : 0.9) * (0.8 + bass);
          if (i) g.lineTo(px, py); else g.moveTo(px, py);
        }
        g.stroke();
      }
      g.globalAlpha = 1;
    }
  }

  function visStart() {
    var s = $('study'), c = s && s.querySelector('canvas.vis');
    setClass(s, 'vis-on', study.visMode !== 'off');
    setClass(s, 'mk-on', study.visMode === 'milkdrop');
    setClass(s.parentNode, 'mk-full', study.visMode === 'milkdrop');   // nothing drawn behind it while it shows
    if (study.visMode === 'milkdrop') return mkStart();
    mkStop();
    if (!c || study.visMode === 'off' || study.raf) return;
    var g = c.getContext('2d'), frame = 0, t0 = Date.now();
    g.fillStyle = '#000';
    g.fillRect(0, 0, VIS_W, VIS_H);
    (function loop() {
      if (!study || study.visMode === 'off' || study.visMode === 'milkdrop') { if (study) study.raf = 0; return; }
      study.raf = requestAnimationFrame(loop);
      if (++frame % 2) return;   // 30 frames a second is plenty for this
      try { visDraw(g, c, (Date.now() - t0) / 1000); } catch (e) {}
    })();
  }

  // MARK: MilkDrop

  function mkLoad(done) {
    if (mk.loaded) return done(true);
    if (mk.loading) { mk.waiting = done; return; }
    mk.loading = true;
    mk.waiting = done;
    var left = 2, finish = function (ok) {
      if (!ok) left = -99;
      if (--left === 0) {
        try {
          var P = window.butterchurnPresets;
          P = P && (P.getPresets ? P : P['default']);
          mk.presets = P.getPresets();
          mk.names = Object.keys(mk.presets);
          mk.loaded = true;
        } catch (e) { mk.ok = false; }
      }
      if (left <= 0 && mk.waiting) { var w = mk.waiting; mk.waiting = null; mk.loading = false; w(mk.loaded); }
    };
    ['vendor/butterchurn.min.js', 'vendor/butterchurnPresets.min.js'].forEach(function (src) {
      var sc = document.createElement('script');
      sc.src = src;
      sc.onload = function () { finish(true); };
      sc.onerror = function () { finish(false); };
      document.head.appendChild(sc);
    });
  }

  /** A made-up groove as real audio (never sent to the speakers), for MilkDrop to dance to when the station can't be heard. */
  function mkGroove(ctx) {
    if (study.groove) return study.groove;
    var rate = ctx.sampleRate, beat = 60 / 92, len = Math.floor(rate * beat * 8), buf = ctx.createBuffer(1, len, rate), d = buf.getChannelData(0);
    var chords = [[220, 277.2, 329.6], [196, 246.9, 293.7], [174.6, 220, 261.6], [196, 246.9, 311.1]];
    for (var i = 0; i < len; i++) {
      var t = i / rate, b = Math.floor(t / beat), tb = t - b * beat, te = (t % (beat / 2));
      var v = 0, ch = chords[Math.floor(b / 2) % 4];
      if (b % 2 === 0) v += Math.sin(2 * Math.PI * (50 + 90 * Math.exp(-tb * 30)) * tb) * Math.exp(-tb * 6) * 0.9;   // kick
      else v += (Math.random() * 2 - 1) * Math.exp(-tb * 14) * 0.45;   // snare
      v += (Math.random() * 2 - 1) * Math.exp(-te * 60) * 0.12;   // hats
      for (var k = 0; k < 3; k++) v += Math.sin(2 * Math.PI * ch[k] * t) * 0.07 * (0.6 + 0.4 * Math.sin(t * 1.3));
      d[i] = v * 0.8;
    }
    var src = ctx.createBufferSource(), g = ctx.createGain();
    src.buffer = buf;
    src.loop = true;
    src.connect(g);
    src.start();
    study.groove = g;
    return g;
  }

  /** Feeds MilkDrop what's playing: the analyser when it can be read, else the made-up groove. */
  function mkFeed() {
    if (!study.mkViz) return;
    var want = study.tap && study.tap.ok ? study.tap.an : study.synced && study.analyser ? study.analyser : (study.current && (study.current.url || study.current.noise) ? mkGroove(study.ctx) : null);
    if (want === study.mkFed) return;
    try { if (study.mkFed) study.mkViz.disconnectAudio(study.mkFed); } catch (e) {}
    study.mkFed = want;
    try { if (want) study.mkViz.connectAudio(want); } catch (e) {}
  }

  function mkNext(blend) {
    if (!study.mkViz || !mk.names) return;
    var slow = stored('mkSlow') || [], pool = mk.names.filter(function (n) { return slow.indexOf(n) < 0 && n !== study.mkName; });
    if (!pool.length) pool = mk.names;
    var name = pool[Math.floor(Math.random() * pool.length)];
    try {
      study.mkViz.loadPreset(mk.presets[name], blend);
      study.mkName = name;
      study.mkAt = Date.now();
      study.mkWin = {from: Date.now() + blend * 1000 + 500, frames: 0};   // judged after its blend
    } catch (e) {}
  }

  function mkTier(i) {
    var t = MK_TIERS[i], c = $('study') && $('study').querySelector('canvas.mk');
    study.mkTierAt = i;
    study.mkSince = Date.now();
    if (!c || !study.mkViz) return;
    c.width = t.w;
    c.height = t.h;
    try { study.mkViz.setRendererSize(t.w, t.h, {meshWidth: t.mw, meshHeight: t.mh}); } catch (e) {}
  }

  /** Once a second: the frame rate drawn, and whether to step the detail down or up, or skip a look that's too heavy. */
  function mkTune() {
    var w = study.mkWin, now = Date.now();
    if (!w || now < w.from) return;
    var secs = (now - w.from) / 1000;
    if (secs < 2) return;
    var tier = MK_TIERS[study.mkTierAt], fps = w.frames / secs, cap = 60 / tier.every, next = MK_TIERS[study.mkTierAt + 1];
    study.mkFps = Math.round(fps);
    study.mkWin = {from: now, frames: 0};
    // step down when it can't hold 50 (or, before the half-rate tier, when it can't hold 30 anyway)
    if (next && fps < (next.every > tier.every ? 30 : 50)) { mkTier(study.mkTierAt + 1); study.mkGood = 0; return; }
    if (!next && fps < 24) {
      var slow = stored('mkSlow') || [];
      if (slow.indexOf(study.mkName) < 0) { slow.push(study.mkName); store('mkSlow', slow.slice(-60)); }
      mkNext(0.5);
      return;
    }
    study.mkGood = fps >= cap * 0.95 ? (study.mkGood || 0) + 1 : 0;
    if (study.mkGood >= 8 && study.mkTierAt > 0) { mkTier(study.mkTierAt - 1); study.mkGood = 0; }
  }

  function mkStart() {
    if (!mkSupported()) { study.visMode = 'tunnel'; return visStart(); }
    var s = $('study'), c = s && s.querySelector('canvas.mk');
    if (!c || study.mkRaf) return;
    mkLoad(function (ok) {
      if (!study || study.visMode !== 'milkdrop') return;
      if (!ok || !visGraph()) { study.visMode = 'tunnel'; return visStart(); }
      try {
        if (!study.mkViz) {
          var B = window.butterchurn;
          B = B && (B.createVisualizer ? B : B['default']);
          var t0 = MK_TIERS[stored('mkTier') || 0] || MK_TIERS[0];   // start where it settled last time
          c.width = t0.w;
          c.height = t0.h;
          study.mkViz = B.createVisualizer(study.ctx, c, {width: t0.w, height: t0.h, meshWidth: t0.mw, meshHeight: t0.mh, pixelRatio: 1, textureRatio: 1});
          study.mkTierAt = MK_TIERS.indexOf(t0);
          mkNext(0);
        }
      } catch (e) { study.visMode = 'tunnel'; return visStart(); }
      if (!study.paused) { try { study.ctx.resume(); } catch (e) {} }
      var frame = 0, tuned = Date.now();
      (function loop() {
        if (!study || study.visMode !== 'milkdrop') { if (study) study.mkRaf = 0; return; }
        study.mkRaf = requestAnimationFrame(loop);
        if (++frame % MK_TIERS[study.mkTierAt].every) return;
        mkFeed();
        if (Date.now() - study.mkAt > MK_EVERY * 1000) mkNext(MK_BLEND);
        try { study.mkViz.render(); } catch (e) {}
        if (study.mkWin) study.mkWin.frames++;
        if (Date.now() - tuned > 1000) {
          tuned = Date.now();
          mkTune();
          if (study.mkTierAt !== study.mkSaved) { study.mkSaved = study.mkTierAt; store('mkTier', study.mkTierAt); }
        }
      })();
    });
  }

  function mkStop() {
    if (study && study.mkRaf) { cancelAnimationFrame(study.mkRaf); study.mkRaf = 0; }
  }

  function visStep() {
    var was = study.visMode, modes = visModes();
    study.visMode = modes[(modes.indexOf(was) + 1) % modes.length];
    store('studyVis', study.visMode);
    if (was === 'off' && study.current && study.current.url) playSound(study.current);   // to ask for it with CORS this time
    if (study.visMode === 'off') tapStop();
    visStart();
  }

  function musicLine() {
    var s = $('study'), snd = study.current;
    if (!s || !snd) return;
    var text = study.radio ? (snd.meta || '') : (snd.url || snd.noise ? '♪ ' : '') + snd.name;
    if (study.radio) studyDraw();
    if (study.failed) text += '  ·  couldn’t play this one, try another';
    else if (isSaved(snd)) text += '  ·  ★';
    if (study.tap && study.tap.ok && study.tap.url === snd.url) text += '  ·  visuals in sync';
    text = text.replace(/^\s*·\s*/, '');
    s.querySelector('.music').textContent = text;
  }

  /** Study, or Radio (the same screen without the timer: the station, the visuals, the picker). In Study the radio can be
   *  switched off (kept in 'studyRadio'): then it's a plain timer, silent, no visuals. */
  function startStudy(radio) {
    var s = $('study');
    s.innerHTML = '';
    setClass(s, 'radio', !!radio);
    var cv = el('canvas', 'vis', s);
    cv.width = VIS_W;
    cv.height = VIS_H;
    var mc = el('canvas', 'mk', s);
    mc.width = MK_W;
    mc.height = MK_H;
    el('div', 'phase', s);
    el('div', 'time', s);
    el('div', 'dots', s);
    el('div', 'music', s);
    el('div', 'hint', s);
    el('div', 'picker', s);
    var vm = stored('studyVis');
    study = {focus: true, length: FOCUS_MIN * 60, start: Date.now(), paused: false, pausedAt: 0, done: 0, timer: 0,
      audio: null, noise: null, ctx: null, watch: 0, current: null, failed: false, picker: null,
      visMode: visModes().indexOf(vm) >= 0 ? vm : visModes()[0], analyser: null, synced: false, noCors: {}, raf: 0,
      mkViz: null, mkRaf: 0, mkFed: null, mkName: '', mkAt: 0, groove: null, tap: null, noTap: {},
      mkTierAt: 0, mkSince: 0, mkWin: null, mkFps: 0, mkGood: 0, mkSaved: -1,
      freq: new Uint8Array(256), wave: new Uint8Array(512), peaks: []};
    study.radio = !!radio;
    study.radioOn = radio || stored('studyRadio') !== false;
    if (!study.radioOn) study.visMode = 'off';
    playSound(study.radioOn ? stored('studyNow') || savedSounds()[0] || SILENCE : SILENCE);
    visStart();
    setClass(s, 'radio-off', !study.radioOn);
    setClass(s, 'on', true);
    overlayState();
    study.timer = setInterval(studyDraw, 500);
    studyDraw();
  }

  function stopStudy() {
    if (!study) return;
    clearInterval(study.timer);
    if (study.raf) cancelAnimationFrame(study.raf);
    mkStop();
    stopSound();
    if (study.ctx) { try { study.ctx.close(); } catch (e) {} }
    study = null;
    overlayState();
    var s = $('study');
    setClass(s, 'on', false);
    setClass(s, 'picking', false);
    setClass(s.parentNode, 'mk-full', false);
  }

  /** ↑ ↓ outside the picker: the saved sounds in order, then silence. */
  function cycleSaved(d) {
    var list = savedSounds().concat([SILENCE]), id = soundId(study.current), at = -1;
    for (var i = 0; i < list.length; i++) if (soundId(list[i]) === id) at = i;
    var n = list.length;
    playSound(list[at < 0 ? (d > 0 ? 0 : n - 1) : (at + d + n) % n]);
  }

  // MARK: the picker (a panel on the right; the timer slides left and keeps counting)

  /** A Radio Browser call, trying the mirrors in turn; null when none answers. */
  function rbGet(path, done) {
    if (genreCache[path]) return done(genreCache[path]);
    var i = 0;
    (function next() {
      if (i >= RB_MIRRORS.length) return done(null);
      var x = new XMLHttpRequest(), over = false, again = function () { if (!over) { over = true; next(); } };
      try {
        x.open('GET', RB_MIRRORS[i++] + path, true);
        x.timeout = 8000;
        x.onload = function () {
          if (over) return;
          var raw;
          try { raw = JSON.parse(x.responseText); } catch (e) { return again(); }
          over = true;
          genreCache[path] = raw;
          done(raw);
        };
        x.onerror = x.ontimeout = again;
        x.send();
      } catch (e) { again(); }
    })();
  }

  function cap(t) { return String(t).replace(/(^|[\s-])([a-z])/g, function (m, a, b) { return a + b.toUpperCase(); }); }

  /** The stations of a tag, a country or a language: playable ones only (MP3, AAC), most voted first, no repeats. */
  function stationsFrom(raw) {
    var out = [], seen = {};
    for (var k = 0; k < (raw || []).length && out.length < 80; k++) {
      var r = raw[k], codec = String(r.codec || '').toUpperCase(), name = String(r.name || '').replace(/\s+/g, ' ').trim();
      if (!r.url_resolved || !name || !/^(MP3|AAC|AAC\+)$/.test(codec) || seen[name.toLowerCase()]) continue;
      seen[name.toLowerCase()] = true;
      out.push({name: name.length > 46 ? name.slice(0, 45) + '…' : name, url: r.url_resolved,
        meta: [r.countrycode, r.bitrate ? r.bitrate + ' kbps' : ''].filter(function (v) { return v; }).join(' · ')});
    }
    return out;
  }

  /** A list page: genres, countries or languages, the pinned ones first, then the rest by how many stations they have. */
  function listFrom(kind, raw) {
    var pins = kind === 'tags' ? PIN_TAGS : kind === 'countries' ? PIN_COUNTRIES : PIN_LANGUAGES, first = [], rest = [], i, r;
    for (i = 0; i < (raw || []).length; i++) {
      r = raw[i];
      var n = r.stationcount || 0, key = kind === 'countries' ? r.iso_3166_1 : r.name;
      if (!key || n < (kind === 'tags' ? 15 : 3) || (kind === 'tags' && !/[a-z]{3}/i.test(key))) continue;
      var it = {name: kind === 'countries' ? r.name : cap(r.name), meta: n + ' stations',
        q: (kind === 'tags' ? 'tag=' : kind === 'countries' ? 'countrycode=' : 'language=') + encodeURIComponent(key) +
          (kind === 'countries' ? '' : '&tagExact=true') + '&order=votes&reverse=true'};
      if (kind === 'languages') it.q = 'language=' + encodeURIComponent(key) + '&languageExact=true&order=votes&reverse=true';
      var at = pins.indexOf(kind === 'countries' ? key : String(key).toLowerCase());
      if (at >= 0) first[at] = it; else rest.push(it);
    }
    return first.filter(function (v) { return v; }).concat(rest);
  }

  function openPicker() {
    var top = study.radio ? STUDY_GENRES : [{name: 'Radio in Study', radioToggle: true}].concat(study.radioOn ? STUDY_GENRES : []);
    study.picker = {stack: [{title: study.radio ? 'Radio' : 'Sounds', items: top, sel: 0, note: study.radioOn ? '' : 'Off: just the timer, no sound or visuals.'}]};
    setClass($('study'), 'picking', true);
    renderPicker();
  }
  /** Study's radio on or off: off is the plain timer (silence, no visuals); on brings back the last station and visuals. */
  function radioSwitch(on) {
    study.radioOn = on;
    store('studyRadio', on);
    var s = $('study');
    setClass(s, 'radio-off', !on);
    if (on) {
      var vm = stored('studyVis');
      study.visMode = visModes().indexOf(vm) >= 0 ? vm : visModes()[0];
      playSound(stored('studyNow') || savedSounds()[0] || SILENCE);
    } else {
      var keep = stored('studyNow');
      playSound(SILENCE);
      if (keep) store('studyNow', keep);   // so On brings it back
      study.visMode = 'off';
    }
    visStart();
    var pk = study.picker;
    pk.stack = [{title: 'Sounds', items: [{name: 'Radio in Study', radioToggle: true}].concat(on ? STUDY_GENRES : []), sel: 0,
      note: on ? '' : 'Off: just the timer, no sound or visuals.'}];
    renderPicker();
    studyDraw();
  }

  function closePicker() {
    study.picker = null;
    setClass($('study'), 'picking', false);
  }
  function view() { var st = study.picker.stack; return st[st.length - 1]; }

  /** Opens a row that leads somewhere: saved, noise, a list, or a list's stations. */
  function openItem(it) {
    if (it.fm) { study.picker.stack.push({title: 'Indian FM', items: INDIAN_FM.map(function (f) { return {name: f.name, q: f.q + '&order=votes&reverse=true'}; }), sel: 0, note: ''}); return renderPicker(); }
    if (it.pods) { study.picker.stack.push({title: 'Podcasts', items: PODCASTS.map(function (p) { return {name: p.name, meta: p.by, feed: p.feed, eps: p.eps, yt: p.yt, yts: p.yts}; }), sel: 0, note: ''}); return renderPicker(); }
    if (it.eps) {
      study.picker.stack.push({title: it.name, stations: true, episodes: true, sel: 0, note: '', items: it.eps.map(function (e) {
        return {name: e[0], url: YKIB_BASE + e[1] + '.mp3', episode: true, meta: 'Big FM · 2019 · 27 min'};
      })});
      return renderPicker();
    }
    if (it.yts) {
      study.picker.stack.push({title: 'Yaadon Ka Idiot Box', sel: 0, note: 'These open in the YouTube app: Study pauses while it\u2019s open.',
        items: it.yts.map(function (y) { return {name: y[0], meta: y[1], yt: 'v=' + y[2] + '&list=' + y[3]}; })});
      return renderPicker();
    }
    if (it.yt) {
      // YouTube is its own app: Study's timer stops behind it, so say so before leaving
      if (hooks.toast) hooks.toast('Opening YouTube · Study pauses while it\u2019s open');
      if (!study.paused) { study.paused = true; study.pausedAt = Date.now(); pauseSound(); studyDraw(); }
      TV.launch('youtube.leanback.v4', {contentTarget: it.yt}, function (ok) { if (!ok && hooks.toast) hooks.toast('Couldn\u2019t open YouTube.'); });
      return;
    }
    if (it.search) { study.picker.stack.push({title: 'Search stations', items: [], sel: 0, search: true, text: '', note: 'Type a station name, then OK.'}); return renderPicker(); }
    if (it.feed) return openFeed(it);
    var v = {title: it.name, items: [], sel: 0, note: '', stations: !it.list};
    study.picker.stack.push(v);
    var path = it.list ? '/json/' + it.list + '?order=stationcount&reverse=true&hidebroken=true' + (it.list === 'countries' ? '' : '&limit=400') :
      it.q ? '/json/stations/search?' + it.q + '&hidebroken=true&limit=150' : '';
    if (it.saved) { v.items = savedSounds(); if (!v.items.length) v.note = 'Nothing saved yet. OK twice on a station saves it.'; }
    else if (it.noise) v.items = NOISES;
    else if (path) {
      v.note = 'Finding stations…';
      rbGet(path, function (raw) {
        if (!study || !study.picker || view() !== v) return;
        v.items = raw === null ? [] : it.list ? listFrom(it.list, raw) : stationsFrom(raw);
        v.note = raw === null ? 'Couldn’t reach the station directory. Your saved sounds still play.' : (v.items.length ? '' : 'Nothing playable here right now.');
        renderPicker();
      });
    }
    renderPicker();
  }

  /** A podcast's episodes from its open feed, newest first. */
  function openFeed(it) {
    var v = {title: it.name, items: [], sel: 0, note: 'Loading episodes…', stations: true, episodes: true};
    study.picker.stack.push(v);
    renderPicker();
    if (genreCache[it.feed]) return feedDone(v, genreCache[it.feed]);
    var x = new XMLHttpRequest();
    try {
      x.open('GET', it.feed, true);
      x.timeout = 15000;
      x.onload = function () {
        var eps = [];
        try {
          var doc = new DOMParser().parseFromString(x.responseText, 'text/xml'), items = doc.getElementsByTagName('item');
          for (var i = 0; i < items.length && eps.length < 150; i++) {
            var n = items[i], enc = n.getElementsByTagName('enclosure')[0], url = enc && enc.getAttribute('url');
            if (!url) continue;
            var title = (n.getElementsByTagName('title')[0] || {}).textContent || 'Episode', when = (n.getElementsByTagName('pubDate')[0] || {}).textContent;
            var dur = (n.getElementsByTagName('itunes:duration')[0] || {}).textContent || '', d = when ? new Date(when) : null;
            var mins = /:/.test(dur) ? dur.split(':').reduce(function (a, b) { return a * 60 + (+b || 0); }, 0) / 60 : (+dur || 0) / 60;
            title = title.replace(/\s+/g, ' ').replace(/^RED FM( BAUAA)?\s*[:;-]+\s*/i, '').trim();
            eps.push({name: title.length > 46 ? title.slice(0, 45) + '…' : title, url: url, episode: true,
              meta: [d && !isNaN(d) ? d.getDate() + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()] + ' ' + d.getFullYear() : '',
                mins ? Math.round(mins) + ' min' : ''].filter(function (q) { return q; }).join(' · ')});
          }
        } catch (e) {}
        genreCache[it.feed] = eps;
        feedDone(v, eps);
      };
      x.onerror = x.ontimeout = function () { feedDone(v, null); };
      x.send();
    } catch (e) { feedDone(v, null); }
  }
  function feedDone(v, eps) {
    if (!study || !study.picker || view() !== v) return;
    v.items = eps || [];
    v.note = eps === null ? 'Couldn’t load this podcast right now.' : (v.items.length ? '' : 'No episodes found.');
    renderPicker();
  }

  /** After an episode ends, the next one down the list (older), so a podcast plays on like the radio. */
  function nextEpisode(snd) {
    var list = study && study.epList;
    if (!list) return;
    for (var i = 0; i < list.length; i++) if (list[i].url === snd.url && list[i + 1]) return playSound(list[i + 1]);
  }

  var PICKER_ROWS = 10;
  function renderPicker() {
    var pk = study && study.picker, box = $('study') && $('study').querySelector('.picker');
    if (!pk || !box) return;
    var v = view(), top = pk.stack.length === 1;
    box.innerHTML = '';
    el('div', 'ttl', box, (top ? '' : '‹  ') + v.title + (v.items.length > PICKER_ROWS ? '   ' + (v.sel + 1) + ' / ' + v.items.length : ''));
    var first = Math.max(0, Math.min(v.sel - Math.floor(PICKER_ROWS / 2), v.items.length - PICKER_ROWS)), cur = study.current && soundId(study.current);
    for (var i = first; i < Math.min(v.items.length, first + PICKER_ROWS); i++) {
      var it = v.items[i], row = el('div', 'row' + (i === v.sel ? ' sel' : ''), box);
      var mark = v.stations ? (soundId(it) === cur ? '▶  ' : '') + (isSaved(it) ? '★  ' : '') : '';
      el('span', '', row, mark + (it.visuals ? 'Visuals · ' + VIS_NAMES[study.visMode] : it.radioToggle ? 'Radio in Study · ' + (study.radioOn ? 'On' : 'Off') : it.name));
      if (it.visuals || it.radioToggle) el('span', 'm', row, 'OK to change');
      else if (it.nextLook) el('span', 'm', row, !mkSupported() ? 'needs WebGL 2, not on this TV' : (study.visMode === 'milkdrop' && study.mkName ? study.mkName.slice(0, 34) : ''));
      else if (it.meta) el('span', 'm', row, it.meta);
    }
    if (v.search) {
      var f = el('input', 'srch', box);
      f.type = 'text';
      f.value = v.text || '';
      f.setAttribute('placeholder', 'Station name, like Mirchi or CBC');
      setTimeout(function () { try { f.focus(); } catch (e) {} }, 30);
    }
    if (v.note) el('div', 'note', box, v.note);
    if (v.search) { el('div', 'ph', box, 'OK to search  ·  Back to go back'); return; }
    el('div', 'ph', box, !v.stations ? 'OK to open  ·  ← or Back to ' + (top ? 'close' : 'go back') :
      'OK to play  ·  OK again to save or unsave ★  ·  ← back');
  }

  function pickerKey(k, keys) {
    var v = view(), n = v.items.length;
    if (v.search) {
      var f = $('study').querySelector('.picker .srch');
      if (k === keys.ok || k === 65376 || k === 13) {
        var t = f ? String(f.value).trim() : '';
        if (f) f.blur();
        v.text = t;
        if (t.length < 2) { v.note = 'Type at least two letters.'; renderPicker(); return true; }
        study.picker.stack.pop();
        openItem({name: '“' + t + '”', q: 'name=' + encodeURIComponent(t) + '&order=votes&reverse=true'});
        return true;
      }
      if (k === keys.back || k === 27 || k === 65385) { if (f) f.blur(); study.picker.stack.pop(); renderPicker(); return true; }
      return 'type';
    }
    if (k === keys.back || k === 27 || k === 8 || k === keys.left) {
      if (study.picker.stack.length > 1) { study.picker.stack.pop(); renderPicker(); } else closePicker();
      return true;
    }
    if (k === keys.up || k === keys.down) {
      if (n) v.sel = (v.sel + (k === keys.up ? n - 1 : 1)) % n;
      renderPicker();
      return true;
    }
    if (k === 33 || k === 34) {   // channel or page up and down: a page at a time through long lists
      if (n) v.sel = Math.max(0, Math.min(n - 1, v.sel + (k === 33 ? -PICKER_ROWS : PICKER_ROWS)));
      renderPicker();
      return true;
    }
    if (k === keys.ok || k === keys.right) {
      var it = v.items[v.sel];
      if (!it) return true;
      if (it.radioToggle) { radioSwitch(!study.radioOn); return true; }
      if (it.visuals) { visStep(); renderPicker(); }
      else if (it.nextLook) {
        if (mkSupported()) {
          if (study.visMode !== 'milkdrop') { study.visMode = 'milkdrop'; store('studyVis', 'milkdrop'); visStart(); }
          else mkNext(MK_BLEND);
        }
        setTimeout(renderPicker, 50);
      }
      else if (!v.stations) openItem(it);
      else if (k === keys.ok && study.current && soundId(it) === soundId(study.current)) {
        var on = toggleSaved(it);
        if (hooks.toast) hooks.toast(on ? 'Saved · ↑ ↓ in Study reaches it' : 'Removed from saved');
        musicLine();
        renderPicker();
      } else {
        if (it.episode) study.epList = v.items;
        playSound(it);
      }
      return true;
    }
    return true;
  }

  function studyKey(k, keys) {
    if (study.picker) return pickerKey(k, keys);
    if (k === keys.back || k === 27 || k === 8) { stopStudy(); return true; }
    if (k === keys.ok) {
      if (study.paused) { study.start += Date.now() - study.pausedAt; study.paused = false; resumeSound(); }
      else { study.paused = true; study.pausedAt = Date.now(); pauseSound(); }
      studyDraw();
      return true;
    }
    if (k === keys.right) {
      if (!study.radio) { studyNext(); studyDraw(); }
      else if (study.visMode === 'milkdrop') mkNext(MK_BLEND);
      else { visStep(); studyDraw(); }
      return true;
    }
    if (k === keys.left) { openPicker(); return true; }
    if (k === keys.up || k === keys.down) { if (study.radioOn) cycleSaved(k === keys.up ? -1 : 1); return true; }
    return true;   // everything else stays in Study
  }

  function bollywood() {
    var target = 'v=' + BOLLYWOOD_VIDEO;
    TV.launch('youtube.leanback.v4', {contentTarget: target}, function (ok) {
      if (!ok && hooks.toast) hooks.toast('Couldn’t open YouTube.');
    });
  }

  // MARK: - Guest Wi-Fi: a QR code guests scan to join (the network is typed on the TV, kept only on the TV)

  var overlay = null;   // 'guest' or 'game' while one of them fills the screen
  var wifi = stored('wifi') || null;   // {ssid, pass, sec: 'WPA' | 'WEP' | 'nopass'}
  var guest = {editing: false, row: 0};
  var SECURITY = ['WPA', 'WEP', 'nopass'], SEC_NAME = {WPA: 'WPA / WPA2 / WPA3', WEP: 'WEP (old)', nopass: 'No password'};

  function wifiCode(w) {
    function esc(t) { return String(t).replace(/([\\;,:"])/g, '\\$1'); }
    return 'WIFI:T:' + w.sec + ';S:' + esc(w.ssid) + ';' + (w.sec === 'nopass' ? '' : 'P:' + esc(w.pass) + ';') + ';';
  }

  function drawQR(canvas, text) {
    var qr = qrcode(0, 'M');
    qr.addData(text, 'Byte');
    qr.make();
    var n = qr.getModuleCount(), quiet = 3, size = canvas.width, cell = Math.floor(size / (n + quiet * 2)), off = Math.floor((size - cell * n) / 2);
    var g = canvas.getContext('2d');
    g.fillStyle = '#FFFFFF';
    g.fillRect(0, 0, size, size);
    g.fillStyle = '#1D1712';
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (qr.isDark(r, c)) g.fillRect(off + c * cell, off + r * cell, cell, cell);
  }

  function openGuest() {
    overlay = 'guest';
    guest.editing = !wifi;
    guest.row = 0;
    renderGuest();
    setClass($('overlay'), 'on', true);
    overlayState();
  }

  // MARK: - Today: the weather, the film of the day and the sky, in the menu's column

  var PHASES = [[0.03, 'New moon'], [0.22, 'Waxing crescent'], [0.28, 'First quarter'], [0.47, 'Waxing gibbous'], [0.53, 'Full moon'],
    [0.72, 'Waning gibbous'], [0.78, 'Last quarter'], [0.97, 'Waning crescent'], [1.01, 'New moon']];

  function openToday() {
    overlay = 'today';
    renderToday();
    overlayState();
  }

  /** html.ov-on while a page of ours fills the screen: the menu steps back under it (custom.css). */
  function overlayState() { setClass(document.documentElement, 'ov-on', !!overlay || !!study); }

  function section(col, label) {
    var sec = el('div', 'sec', col);
    el('div', 'kicker', sec, label);
    return sec;
  }

  function renderToday() {
    var o = $('overlay'), d = new Date(), w = null, c = coords(), i;
    try { w = Data.weather; } catch (e) {}
    o.innerHTML = '';
    o.className = 'on page today';
    el('div', 'fade', o);
    var col = el('div', 'col', o);
    var part = d.getHours() < 12 ? 'morning' : d.getHours() < 17 ? 'afternoon' : 'evening';
    el('div', 'ptitle', col, night ? 'Tonight' : 'Today');
    el('div', 'psub', col, ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()] + ' ' + part);

    var sw = section(col, 'Weather');
    if (w) {
      el('div', 'big', sw, Data.degrees(w.temp) + ', ' + Data.condition(w.code, w.isDay).toLowerCase());
      var bits = [];
      if (w.max !== undefined && w.min !== undefined) bits.push('high ' + Data.degrees(w.max) + ' \u00B7 low ' + Data.degrees(w.min));
      if (night && w.sunrise) bits.push('sunrise ' + Data.time(w.sunrise));
      else if (w.sunset) bits.push('sunset ' + Data.time(w.sunset));
      el('div', 'dim', sw, bits.join(' \u00B7 '));
    } else el('div', 'dim', sw, 'No weather right now');

    var sf = section(col, 'Film of the day');
    if (!tmdbKey()) el('div', 'dim', sf, 'Add your TMDB key in Settings to see a film here.');
    else if (!film || !film.title) el('div', 'dim', sf, 'Finding today\u2019s film\u2026');
    else {
      var fr = el('div', 'film', sf);
      if (film.poster) el('div', 'poster', fr).style.backgroundImage = 'url("' + film.poster + '")';
      var ft = el('div', 'ftext', fr);
      el('div', 'ftitle', ft, film.title);
      el('div', 'dim', ft, (film.year ? film.year + ' \u00B7 ' : '') + (film.where.length ? film.where.slice(0, 2).join(', ') :
        film.rent ? 'to rent or buy' : 'not streaming here'));
    }

    var ss = section(col, 'Sky'), lines = [];
    if (window.Sky) {
      var m = Sky.moon(d, c.lat, c.lon), name = '';
      for (i = 0; i < PHASES.length; i++) if (m.phase < PHASES[i][0]) { name = PHASES[i][1]; break; }
      lines.push(name + ', ' + Math.round(m.lit * 100) + '% lit');
      var now = Date.now();
      for (i = 0; i < sky.iss.length; i++) {
        var p = sky.iss[i];
        if (p.maxEl >= 25 && p.set > now) { lines.push('Space station ' + Data.time(p.rise) + ', look ' + Sky.compass(p.riseAz)); break; }
      }
      if (auroraWatch()) lines.push('Aurora possible, look north');
    }
    for (i = 0; i < lines.length; i++) el('div', 'line', ss, lines[i]);
    el('div', 'pfoot', col, 'Back to the menu');
  }

  function todayKey(k, keys) {
    if (k === keys.back || k === 27 || k === 8 || k === keys.ok) closeOverlay();
    return true;
  }

  function closeOverlay() {
    if (overlay === 'game') stopGame();
    overlay = null;
    overlayState();
    var o = $('overlay');
    setClass(o, 'on', false);
    setTimeout(function () { if (!overlay) o.innerHTML = ''; }, 400);
  }

  function renderGuest() {
    var o = $('overlay');
    o.innerHTML = '';
    o.className = 'on guest';
    var card = el('div', 'card glass', o);
    if (!guest.editing) {
      var qr = el('canvas', 'qr', card);
      qr.width = qr.height = 440;
      drawQR(qr, wifiCode(wifi));
      var info = el('div', 'g-info', card);
      el('div', 'kicker', info, 'Guest Wi-Fi');
      el('div', 'ssid', info, wifi.ssid);
      if (wifi.sec !== 'nopass') {
        el('div', 'g-label', info, 'Password');
        el('div', 'pass', info, wifi.pass);
      }
      el('div', 'how', info, 'Point your phone’s camera at the code to join.');
      el('div', 'hint', o, 'OK to change the network  ·  Back to close');
      return;
    }
    var form = el('div', 'g-form', card);
    el('div', 'kicker', form, 'Guest Wi-Fi');
    el('div', 'lead', form, 'Type the network guests should join. It stays on this TV.');
    var rows = [
      {label: 'Network name', field: 'ssid', value: wifi ? wifi.ssid : ''},
      {label: 'Password', field: 'pass', value: wifi ? wifi.pass : ''},
      {label: 'Security', value: SEC_NAME[(guest.sec || (wifi && wifi.sec) || 'WPA')]},
      {label: 'Save', action: true}
    ];
    for (var i = 0; i < rows.length; i++) {
      var r = el('div', 'g-row' + (i === guest.row ? ' focus' : '') + (rows[i].action ? ' action' : ''), form);
      el('span', 'g-name', r, rows[i].label);
      if (rows[i].field) {
        var f = el('input', '', r);
        f.type = 'text';
        f.value = guest[rows[i].field] !== undefined ? guest[rows[i].field] : rows[i].value;
        f.setAttribute('data-field', rows[i].field);
        f.setAttribute('autocomplete', 'off');
        f.setAttribute('spellcheck', 'false');
        f.setAttribute('autocapitalize', 'off');
      } else if (!rows[i].action) el('span', 'g-val', r, '‹  ' + rows[i].value + '  ›');
    }
    el('div', 'hint', o, '▲▼ to move  ·  OK to type or save  ·  Back to ' + (wifi ? 'go back' : 'close'));
  }

  function guestField() { var a = document.activeElement; return a && a.getAttribute && a.getAttribute('data-field') ? a : null; }

  function keepTyped() {
    var fs = $('overlay').querySelectorAll('input');
    for (var i = 0; i < fs.length; i++) guest[fs[i].getAttribute('data-field')] = fs[i].value;
  }

  function saveWifi() {
    keepTyped();
    var sec = guest.sec || (wifi && wifi.sec) || 'WPA', ssid = String(guest.ssid !== undefined ? guest.ssid : (wifi ? wifi.ssid : '')).trim();
    var pass = String(guest.pass !== undefined ? guest.pass : (wifi ? wifi.pass : ''));
    if (!ssid) { if (hooks.toast) hooks.toast('Type the network name first.'); guest.row = 0; renderGuest(); return; }
    if (sec !== 'nopass' && !pass) { if (hooks.toast) hooks.toast('Type the password, or set Security to No password.'); guest.row = 1; renderGuest(); return; }
    wifi = {ssid: ssid, pass: sec === 'nopass' ? '' : pass, sec: sec};
    store('wifi', wifi);
    guest = {editing: false, row: 0};
    renderGuest();
  }

  /** Keys while Guest Wi-Fi is open. 'type' lets a key through to the field being typed in. */
  function guestKey(k, keys) {
    var f = guestField();
    if (f) {
      if (k === keys.ok || k === 65376) { keepTyped(); f.blur(); guest.row++; renderGuest(); return true; }
      if (k === keys.back || k === 27 || k === 65385) { keepTyped(); f.blur(); renderGuest(); return true; }
      if (k === keys.up || k === keys.down) { keepTyped(); f.blur(); guest.row = Math.max(0, Math.min(3, guest.row + (k === keys.up ? -1 : 1))); renderGuest(); return true; }
      return 'type';
    }
    if (k === keys.back || k === 27 || k === 8) {
      if (guest.editing && wifi) { guest = {editing: false, row: 0}; renderGuest(); } else closeOverlay();
      return true;
    }
    if (!guest.editing) {
      if (k === keys.ok) { guest = {editing: true, row: 0}; renderGuest(); }
      return true;
    }
    if (k === keys.up || k === keys.down) { keepTyped(); guest.row = Math.max(0, Math.min(3, guest.row + (k === keys.up ? -1 : 1))); renderGuest(); return true; }
    if (guest.row === 2 && (k === keys.left || k === keys.right || k === keys.ok)) {
      keepTyped();
      var cur = guest.sec || (wifi && wifi.sec) || 'WPA', i = SECURITY.indexOf(cur);
      guest.sec = SECURITY[(i + (k === keys.left ? 2 : 1)) % 3];
      renderGuest();
      return true;
    }
    if (k === keys.ok) {
      if (guest.row === 3) { saveWifi(); return true; }
      var input = $('overlay').querySelectorAll('input')[guest.row];
      if (input) { input.focus(); try { input.setSelectionRange(input.value.length, input.value.length); } catch (e) {} }
      return true;
    }
    return true;
  }

  // MARK: - Antakshari: two teams take turns. Each turn has three steps, and the screen always says what to press:
  //   1. think:  the letter, and 30 seconds to start singing a song that begins with it
  //   2. sing:   the clock stops; they sing as long as they like; OK when they finish (a point), or ◀ if it didn't count
  //   3. next:   the next letter (the classic rule: the song's last letter, set with ▲▼), then OK hands over

  // the sounds Hindi film songs start with, the common ones more often
  var LETTERS = ['K', 'K', 'K', 'M', 'M', 'M', 'T', 'T', 'D', 'D', 'P', 'P', 'B', 'B', 'J', 'J', 'H', 'H', 'S', 'S', 'Y', 'Y', 'A', 'A',
    'Ch', 'G', 'N', 'R', 'L', 'Bh', 'Dh', 'Kh', 'Ph', 'Sh', 'Th', 'Z', 'O', 'E', 'V', 'Gh'];
  var ALL_LETTERS = (function () { var u = []; for (var i = 0; i < LETTERS.length; i++) if (u.indexOf(LETTERS[i]) < 0) u.push(LETTERS[i]); return u.sort(); })();
  var THINK = 30;
  var game = null;

  function beep(f, len, vol, type, delay) {
    try {
      if (!game.ctx) { var Ctx = window.AudioContext || window.webkitAudioContext; game.ctx = new Ctx(); }
      var ctx = game.ctx, t = ctx.currentTime + (delay || 0), o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type || 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(vol || 0.15, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + len);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(t);
      o.stop(t + len + 0.05);
    } catch (e) {}
  }

  function newLetter(avoid) {
    var l;
    do { l = LETTERS[Math.floor(Math.random() * LETTERS.length)]; } while (l === avoid);
    return l;
  }

  function teamName(t) { return t ? 'Team B' : 'Team A'; }

  function startGame() {
    overlay = 'game';
    overlayState();
    game = {score: [0, 0], team: 0, letter: newLetter(), phase: 'think', start: Date.now(), timer: 0, ticked: -1, ctx: null, note: ''};
    var o = $('overlay');
    o.innerHTML = '';
    o.className = 'on game';
    var top = el('div', 'teams', o);
    for (var t = 0; t < 2; t++) {
      var team = el('div', 'team', top);
      el('div', 'name', team, teamName(t));
      el('div', 'score', team, '0');
    }
    var mid = el('div', 'stagebox', o);
    var ring = el('canvas', 'ring', mid);
    ring.width = ring.height = 520;
    el('div', 'turn', mid);
    el('div', 'letter', mid);
    el('div', 'sub', mid);
    el('div', 'ctas', o);
    setClass(o, 'on', true);
    game.timer = setInterval(drawGame, 100);
    drawGame();
  }

  function stopGame() {
    if (!game) return;
    clearInterval(game.timer);
    try { if (game.ctx) game.ctx.close(); } catch (e) {}
    game = null;
  }

  /** The buttons on screen: what each remote key does right now. The first is the main one. */
  function ctas(list) {
    var box = $('overlay').querySelector('.ctas'), key = JSON.stringify(list);
    if (box.getAttribute('data-key') === key) return;
    box.setAttribute('data-key', key);
    box.innerHTML = '';
    for (var i = 0; i < list.length; i++) {
      var b = el('div', 'cta' + (i === 0 ? ' main' : ''), box);
      el('span', 'keycap', b, list[i][0]);
      el('span', 'what', b, list[i][1]);
    }
  }

  function toPhase(p) {
    game.phase = p;
    game.start = Date.now();
    game.ticked = -1;
    drawGame();
  }

  function drawGame() {
    var o = $('overlay');
    if (!game || !o) return;
    var teams = o.querySelectorAll('.team');
    for (var t = 0; t < 2; t++) {
      var lead = game.score[0] === game.score[1] ? -1 : game.score[0] > game.score[1] ? 0 : 1;
      setClass(teams[t], 'now', game.phase === 'results' ? t === lead : t === game.team);   // the results light the winner
      teams[t].querySelector('.score').textContent = String(game.score[t]);
    }
    setClass(o, 'singing', game.phase === 'sing');
    setClass(o, 'timeup', game.phase === 'timeup');
    setClass(o, 'results', game.phase === 'results');
    var who = teamName(game.team), turn = o.querySelector('.turn'), sub = o.querySelector('.sub'), letter = o.querySelector('.letter');
    var ring = o.querySelector('.ring'), g = ring.getContext('2d'), c = ring.width / 2, r = c - 14, frac = 1, colour = '#8FD3CC';
    var secs = (Date.now() - game.start) / 1000;

    if (game.phase === 'think') {
      var left = Math.max(0, THINK - secs), whole = Math.ceil(left);
      frac = left / THINK;
      if (left <= 5) colour = '#E8836B';
      turn.textContent = who + ' · ' + whole + 's';
      letter.textContent = game.letter;
      sub.textContent = who + ': start singing a song that begins with this letter';
      ctas([['OK', 'They’re singing'], ['→', 'Pass to ' + teamName(1 - game.team)], ['Back', 'End game']]);
      if (whole <= 5 && whole > 0 && whole !== game.ticked) { game.ticked = whole; beep(660, 0.08, 0.12); }
      if (left <= 0) { beep(150, 0.7, 0.2, 'sawtooth'); toPhase('timeup'); return; }
    } else if (game.phase === 'sing') {
      frac = 1;
      colour = '#F2C46B';
      var m = Math.floor(secs / 60), s = Math.floor(secs % 60);
      turn.textContent = 'Singing · ' + m + ':' + (s < 10 ? '0' : '') + s;
      letter.textContent = '♪';
      sub.textContent = who + ' is singing. Take your time, press OK when the song ends';
      ctas([['OK', 'Song done · point to ' + who], ['←', 'Didn’t count'], ['Back', 'End game']]);
    } else if (game.phase === 'timeup') {
      frac = 0;
      turn.textContent = 'Time’s up';
      letter.textContent = game.letter;
      sub.textContent = 'No point for ' + who + ' this turn';
      ctas([['OK', teamName(1 - game.team) + '’s turn'], ['Back', 'End game']]);
    } else if (game.phase === 'results') {
      frac = 1;
      colour = '#F2C46B';
      var sc = game.score, tie = sc[0] === sc[1], win = sc[0] > sc[1] ? 0 : 1;
      turn.textContent = tie ? 'It\u2019s a tie' : 'Winner';
      letter.textContent = tie ? sc[0] + '\u2013' + sc[1] : teamName(win);
      sub.textContent = tie ? 'Both teams on ' + sc[0] + (sc[0] === 1 ? ' song' : ' songs') :
        teamName(win) + ' wins ' + sc[win] + ' to ' + sc[1 - win];
      ctas([['OK', 'Play again'], ['Back', 'Exit the game']]);
    } else if (game.phase === 'next') {
      frac = 1;
      turn.textContent = game.note || 'Next letter';
      letter.textContent = game.letter;
      sub.textContent = 'Letter for ' + teamName(1 - game.team) + ': set it to the song’s last letter, or keep this one';
      ctas([['OK', 'Start ' + teamName(1 - game.team) + '’s turn'], ['▲▼', 'Change letter'], ['Back', 'End game']]);
    }

    g.clearRect(0, 0, ring.width, ring.height);
    g.lineWidth = 10;
    g.lineCap = 'round';
    g.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    g.beginPath();
    g.arc(c, c, r, 0, Math.PI * 2);
    g.stroke();
    if (frac > 0) {
      g.strokeStyle = colour;
      g.beginPath();
      g.arc(c, c, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac, false);
      g.stroke();
    }
  }

  /** Hand over to the other team with this letter, and start their thirty seconds. */
  function handOver() {
    game.team = 1 - game.team;
    game.note = '';
    beep(520, 0.12, 0.12);
    toPhase('think');
  }

  function gameKey(k, keys) {
    var p = game.phase, back = k === keys.back || k === 27 || k === 8;
    if (p === 'results') {   // the end: Back leaves, OK plays again
      if (back) closeOverlay();
      else if (k === keys.ok) { game.score = [0, 0]; game.team = 0; game.letter = newLetter(); game.note = ''; toPhase('think'); }
      return true;
    }
    if (back) {   // Back during the game: the results, big
      beep(660, 0.2, 0.15); beep(880, 0.2, 0.15, 'sine', 0.18); beep(1320, 0.5, 0.15, 'sine', 0.36);
      toPhase('results');
      return true;
    }
    if (p === 'think') {
      if (k === keys.ok) { beep(880, 0.15, 0.14); toPhase('sing'); }
      else if (k === keys.right) { game.letter = newLetter(game.letter); game.note = teamName(game.team) + ' passed'; toPhase('next'); }
    } else if (p === 'sing') {
      if (k === keys.ok) {
        game.score[game.team]++;
        beep(880, 0.25, 0.18);
        beep(1320, 0.35, 0.16, 'sine', 0.14);
        game.note = 'Point to ' + teamName(game.team) + '!';
        game.letter = newLetter(game.letter);
        toPhase('next');
      } else if (k === keys.left) { game.note = 'No point'; game.letter = newLetter(game.letter); toPhase('next'); }
    } else if (p === 'timeup') {
      if (k === keys.ok) { game.letter = newLetter(game.letter); handOver(); }
    } else if (p === 'next') {
      if (k === keys.ok) handOver();
      else if (k === keys.up || k === keys.down) {
        var i = ALL_LETTERS.indexOf(game.letter);
        game.letter = ALL_LETTERS[(i + (k === keys.up ? ALL_LETTERS.length - 1 : 1)) % ALL_LETTERS.length];
        drawGame();
      }
    }
    return true;
  }

  function modes() {
    return [
      {label: night ? 'Tonight' : 'Today', symbol: 'sun', run: openToday},
      {label: 'Movies', symbol: 'play', run: function () { setMovie(!movie); }, on: movie},
      {label: 'Study', symbol: 'lightbulb', run: function () { startStudy(false); }},
      {label: 'Radio', symbol: 'radio', run: function () { startStudy(true); }},
      {label: 'Bollywood', symbol: 'speaker', run: bollywood},
      {label: 'Antakshari', symbol: 'sparkles', run: startGame},
      {label: 'Wi-Fi', symbol: 'wifi', run: openGuest}
    ];
  }

  // MARK: - The night screensaver: tonight's real sky (skysaver.js), instead of the space photos once it's dark

  var skySaver = stored('skySaver') !== false;   // Home Settings > Screensaver after dark: Live sky (default) or Space photos

  function skyNow() {
    if (!skySaver || !window.SkySaver || !window.SKYDATA || !window.Sky) return false;
    var c = coords();
    return Sky.sun(new Date(), c.lat, c.lon).alt < -6;   // after civil dusk, until dawn
  }

  function nextIss(now) {
    for (var i = 0; i < sky.iss.length; i++) {
      var p = sky.iss[i];
      if (p.set > now && p.rise < now + 3 * 3600000 && p.maxEl >= 10) return p;
    }
    return null;
  }

  function where(alt, az) {
    return (alt >= 55 ? 'high in the ' : alt < 18 ? 'low in the ' : 'in the ') + Sky.compass(az);
  }

  /** Draws tonight's sky into the screensaver and writes its caption in the clock panel. */
  function showSky(saver, clock) {
    var box = saver.querySelector('.skybox');
    if (!box) { box = el('div', 'skybox', null); saver.insertBefore(box, saver.firstChild); }
    setClass(saver, 'sky', true);
    var c = coords(), now = Date.now(), pass = nextIss(now);
    var facts = SkySaver.draw(box, c.lat, c.lon, {iss: pass});
    var w = null;
    try { w = Data.weather; } catch (e) {}
    var title = clock.querySelector('.title');
    title.className = 'title skycap';
    title.innerHTML = '';
    var city = '';
    try { city = Data.city || ''; } catch (e2) {}
    el('div', 'k', title, 'Tonight over ' + (city ? city.split(',')[0] : 'home') + (w && w.code >= 3 ? ' · behind the clouds' : ''));
    var lines = [], i;
    var pl = facts.planets.slice().sort(function (a, b) { return b.alt - a.alt; });
    if (pl.length) {
      var bits = [];
      for (i = 0; i < pl.length && i < 2; i++) bits.push(pl[i].name + ' ' + where(pl[i].alt, pl[i].az));
      lines.push(bits.join(' · '));
    }
    if (facts.moon) lines.push('The moon, ' + Math.round(facts.moon.lit * 100) + '% lit, ' + where(facts.moon.alt, facts.moon.az));
    if (pass) {
      lines.push(now >= pass.rise ? 'The space station is crossing now, ' + Sky.compass(pass.riseAz) + ' to ' + Sky.compass(pass.setAz) :
        'The space station passes at ' + Data.time(pass.rise) + ', from the ' + Sky.compass(pass.riseAz));
    }
    if (!lines.length) lines.push('The stars facing south, as they are right now');
    for (i = 0; i < lines.length && i < 3; i++) el('div', 'l', title, lines[i]);
    var credit = saver.querySelector('.credit') || el('div', 'credit', saver);
    credit.innerHTML = '';
    el('b', '', credit, 'Live sky');
    credit.appendChild(document.createTextNode('Facing south, turning with the Earth'));
  }

  /** How soon to draw it again: every minute, every few seconds while the space station crosses. */
  function skyEvery() {
    var p = nextIss(Date.now()), now = Date.now();
    return p && now >= p.rise - 60000 && now <= p.set ? 4000 : 60000;
  }

  function skySaverLabel() { return skySaver ? 'Live sky' : 'Space photos'; }
  function skySaverStep() { skySaver = !skySaver; store('skySaver', skySaver); }

  // MARK: - Performance read-out: the blue button on the home screen shows frame rate, memory and what's running

  var perfOn = false, perfFrames = [], perfRaf = 0, perfHitches = [], perfLast = {what: 'start', at: 0};

  /** What just ran (the big jobs mark themselves), so a hitch can be pinned on something. */
  window.fmtvMark = function (what) { perfLast = {what: what, at: Date.now()}; };

  function perfLoop(t) {
    if (!perfOn) return;
    var prev = perfFrames.length ? perfFrames[perfFrames.length - 1] : 0;
    if (prev && t - prev > 150) {   // a hitch you'd see: when, how long, and what ran just before it
      var d = new Date();
      perfHitches.unshift(pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) + '  ' + Math.round(t - prev) + ' ms' +
        (Date.now() - perfLast.at < 2000 ? '  ' + perfLast.what : ''));
      perfHitches.length = Math.min(perfHitches.length, 3);
    }
    perfFrames.push(t);
    while (perfFrames.length && t - perfFrames[0] > 10000) perfFrames.shift();
    perfRaf = requestAnimationFrame(perfLoop);
  }

  function perfDraw() {
    var box = $('perf');
    if (!box || !perfOn) return;
    var f = perfFrames, now = f.length ? f[f.length - 1] : 0, n1 = 0, worst = 0, i;
    for (i = f.length - 1; i > 0 && now - f[i] < 1000; i--) n1++;
    for (i = 1; i < f.length; i++) worst = Math.max(worst, f[i] - f[i - 1]);
    var secs = f.length > 1 ? (f[f.length - 1] - f[0]) / 1000 : 0, avg = secs ? (f.length - 1) / secs : 0;
    var mem = window.performance && performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) + ' MB' : 'n/a';
    var v = $('diovid'), fx = $('fx'), lights = document.querySelectorAll('#diolights > div'), lit = 0;
    for (i = 0; i < lights.length; i++) if (lights[i].style.display !== 'none') lit++;
    var rows = [
      ['Frames now', n1 + ' fps'],
      ['Average, 10 s', avg.toFixed(0) + ' fps'],
      ['Longest frame', Math.round(worst) + ' ms'],
      ['Memory (code)', mem],
      ['Scene', dioShown || '-'],
      ['Video', v && v.getAttribute('src') ? (v.paused ? 'paused' : 'playing') : 'none'],
      ['Effect layers', fx ? String(fx.children.length) : '0'],
      ['Light layers', lit + ' of ' + lights.length],
      ['Lite mode', /(^| )lite( |$)/.test(document.documentElement.className) ? 'yes' : 'no']
    ];
    if (study && study.visMode === 'milkdrop' && study.mkViz) {
      var tier = MK_TIERS[study.mkTierAt];
      rows.push(['MilkDrop', (study.mkFps || '…') + ' fps · ' + tier.w + '×' + tier.h + ' · tier ' + (study.mkTierAt + 1) + ' of ' + MK_TIERS.length]);
      rows.push(['Look', (study.mkName || '-').slice(0, 30)]);
      rows.push(['Skipped as too heavy', String((stored('mkSlow') || []).length)]);
    }
    box.innerHTML = '';
    for (i = 0; i < rows.length; i++) {
      var r = el('div', 'r', box);
      el('span', 'k', r, rows[i][0]);
      el('span', 'v', r, rows[i][1]);
    }
    el('div', 'h', box, perfHitches.length ? 'Hitches over 150 ms' : 'No hitches over 150 ms');
    for (i = 0; i < perfHitches.length; i++) el('div', 'hl', box, perfHitches[i]);
  }

  function togglePerf() {
    perfOn = !perfOn;
    var box = $('perf');
    if (!box) { box = el('div', '', $('stage')); box.id = 'perf'; }
    setClass(box, 'on', perfOn);
    perfFrames = [];
    if (perfOn) { perfHitches = []; perfRaf = requestAnimationFrame(perfLoop); perfDraw(); setTimeout(perfDraw, 1100); }
    else cancelAnimationFrame(perfRaf);
  }

  // MARK: - Set up

  function init(h) {
    hooks = h || {};
    var sky = $('sky');
    if (sky && !$('wall')) {
      el('div', '', sky).id = 'wall';
      el('div', '', sky).id = 'wallshade';
    }
    if (sky && !$('stars')) {
      var c = el('canvas', '', sky);
      c.id = 'stars';
      c.width = 2080;
      c.height = 1200;
    }
    var stage = $('stage');
    if (!$('wallcap')) el('div', '', stage).id = 'wallcap';
    if (!$('alertbar')) el('div', '', stage).id = 'alertbar';
    if (!$('diowx')) el('div', '', stage).id = 'diowx';
    if (!$('study')) el('div', '', stage).id = 'study';
    if (!$('overlay')) el('div', '', stage).id = 'overlay';   // Guest Wi-Fi and Antakshari
    try { ['apod', 'apodBad', 'apodGood', 'space', 'space2', 'space3'].forEach(function (k) { localStorage.removeItem('fmtv.my.' + k); }); } catch (e) {}   // the old feed's leftovers
    setClass(document.documentElement, 'movie', movie);
    applyLook();
    refresh();
    setInterval(refresh, 5 * 60000);
  }

  function refresh() {
    if (window.fmtvMark) fmtvMark('5-minute refresh');
    refreshSpace();
    checkNext();
    refreshAlerts();
    refreshFilm();
    refreshHistory();
    refreshSky();
    if (hasDio() && dioShown) showDio();   // the clock moves the lights and the special scenes on
  }

  return {
    hidePicks: true,
    init: init,
    refresh: refresh,
    nightChanged: function (on) { if (on !== night) { night = on; applyLook(); if (hooks.redraw) hooks.redraw(); } },   // Today becomes Tonight
    _dio: function () { return dioShown; },
    _pool: pool,
    movie: function () { return movie; },
    modes: modes,
    filmOn: function () { return true; },
    renderFilm: renderFilm,
    keyChanged: function () { film = null; store('film', null); filmTriedAt = 0; refreshFilm(); history = null; historyTriedAt = 0; refreshHistory(); },
    saverItems: saverItems,
    saverSeconds: function () { return saverSecs; },
    saverLabel: saverLabel,
    saverStep: saverStep,
    fxLabel: fxLabel,
    soundLabel: soundLabel,
    soundStep: soundStep,
    fxStep: fxStep,
    busy: function () { return !!study || !!overlay; },
    onKey: function (k, keys) {
      try { if (amb.ctx && amb.ctx.state === 'suspended') amb.ctx.resume(); } catch (e) {}
      if (k === 406) { togglePerf(); return true; }   // the blue button: the performance read-out
      if (overlay === 'guest') return guestKey(k, keys);
      if (overlay === 'game') return gameKey(k, keys);
      if (overlay === 'today') return todayKey(k, keys);
      return study ? studyKey(k, keys) : false;
    },
    // for checking in a browser
    _showAlerts: showAlerts,
    _sky: function () { return sky; },
    _pill: renderPill,
    _perf: togglePerf,
    skyNow: skyNow,
    showSky: showSky,
    skyEvery: skyEvery,
    skySaverLabel: skySaverLabel,
    skySaverStep: skySaverStep
  };
})();
