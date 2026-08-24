(function () {
  'use strict';

  var GRID = document.getElementById('skin-grid');
  var STATUS = document.getElementById('skin-status');
  var MAX_GALLERY = 5; // Gallery1.png … Gallery5.png (all optional)

  // ---- Lightbox state ----
  var lb = document.getElementById('lightbox');
  var lbImg = document.getElementById('lb-img');
  var lbCaption = document.getElementById('lb-caption');
  var lbClose = document.getElementById('lb-close');
  var lbPrev = document.getElementById('lb-prev');
  var lbNext = document.getElementById('lb-next');
  var current = { shots: [], name: '', index: 0 };

  function openLightbox(shots, name, index) {
    current = { shots: shots, name: name, index: index || 0 };
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    renderLightbox();
  }
  function closeLightbox() {
    lb.hidden = true;
    document.body.style.overflow = '';
    lbImg.src = '';
  }
  function step(delta) {
    if (!current.shots.length) return;
    current.index = (current.index + delta + current.shots.length) % current.shots.length;
    renderLightbox();
  }
  function renderLightbox() {
    var total = current.shots.length;
    var multi = total > 1;
    var shot = current.shots[current.index];
    lbPrev.hidden = !multi;
    lbNext.hidden = !multi;
    lbImg.src = shot.src;
    lbImg.alt = shot.caption || (current.name + ' — screenshot ' + (current.index + 1));
    var parts = [current.name];
    if (shot.caption) parts.push(shot.caption);
    if (multi) parts.push((current.index + 1) + ' / ' + total);
    parts.push('click outside to close');
    lbCaption.textContent = parts.join(' · ');
  }

  lbClose.addEventListener('click', closeLightbox);
  lbPrev.addEventListener('click', function (e) { e.stopPropagation(); step(-1); });
  lbNext.addEventListener('click', function (e) { e.stopPropagation(); step(1); });
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target.tagName === 'FIGURE') closeLightbox(); });
  window.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
  });

  // ---- Load: probe whether an image exists (static hosts can't list folders) ----
  function imageExists(url) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { resolve(true); };
      img.onerror = function () { resolve(false); };
      img.src = url;
    });
  }

  // Find Gallery1..N sequentially; stop at the first gap.
  function findGallery(folder) {
    var shots = [];
    var i = 1;
    function next() {
      if (i > MAX_GALLERY) return Promise.resolve(shots);
      var url = folder + '/Gallery' + i + '.png';
      return imageExists(url).then(function (ok) {
        if (!ok) return shots; // stop at first missing index
        shots.push(url);
        i++;
        return next();
      });
    }
    return next();
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function buildCard(info, folder, headline, shots) {
    var name = info.name || folder;
    var card = document.createElement('article');
    card.className = 'skin-card';

    var captions = info.screenshots || {};
    var shotObjs = shots.map(function (src) {
      var file = src.slice(src.lastIndexOf('/') + 1);
      return { src: src, caption: captions[file] || '' };
    });

    var media = document.createElement('button');
    media.className = 'skin-card__media';
    media.type = 'button';
    media.setAttribute('aria-label', 'View screenshots of ' + name);

    var slider = document.createElement('div');
    slider.className = 'skin-slider';
    var track = document.createElement('div');
    track.className = 'skin-slider__track';
    shotObjs.forEach(function (shot, i) {
      var img = document.createElement('img');
      img.className = 'skin-slider__slide';
      img.alt = shot.caption || (name + ' skin preview ' + (i + 1));
      img.decoding = 'async';
      if (i === 0) { img.src = shot.src; img.loading = 'lazy'; }
      else { img.dataset.src = shot.src; } // extra shots load on first hover
      track.appendChild(img);
    });
    slider.appendChild(track);
    media.appendChild(slider);

    var idx = 0;
    if (shots.length > 1) {
      var badge = document.createElement('span');
      badge.className = 'skin-card__count';
      badge.textContent = shots.length + ' shots';
      media.appendChild(badge);

      var dots = document.createElement('div');
      dots.className = 'skin-slider__dots';
      shots.forEach(function () { dots.appendChild(document.createElement('span')); });
      media.appendChild(dots);

      var setDots = function () {
        for (var d = 0; d < dots.children.length; d++) {
          dots.children[d].className = (d === idx) ? 'is-active' : '';
        }
      };
      var go = function (i) {
        idx = i;
        track.style.transform = 'translateX(' + (-i * 100) + '%)';
        setDots();
      };
      var timer = null, loaded = false;
      var loadRest = function () {
        if (loaded) return;
        loaded = true;
        for (var c = 0; c < track.children.length; c++) {
          var el = track.children[c];
          if (el.dataset.src) el.src = el.dataset.src;
        }
      };
      setDots();
      media.addEventListener('mouseenter', function () {
        loadRest();
        clearInterval(timer);
        timer = setInterval(function () { go((idx + 1) % shots.length); }, 1500);
      });
      media.addEventListener('mouseleave', function () {
        clearInterval(timer);
        timer = null;
        go(0);
      });
    }

    media.addEventListener('click', function () { openLightbox(shotObjs, name, idx); });

    var body = document.createElement('div');
    body.className = 'skin-card__body';
    var meta = '<h2 class="skin-card__name">' + escapeHtml(name) + '</h2>';
    meta += '<p class="skin-card__author">by ' + escapeHtml(info.author || 'Unknown') +
            (info.version ? ' · v' + escapeHtml(info.version) : '') + '</p>';
    if (info.description) {
      meta += '<p class="skin-card__desc">' + escapeHtml(info.description) + '</p>';
    }
    body.innerHTML = meta;

    var dl = document.createElement('a');
    dl.className = 'btn btn--primary btn--md skin-card__dl';
    dl.href = folder + '/' + folder + '.skin';
    dl.setAttribute('download', '');
    dl.textContent = 'Download';
    body.appendChild(dl);

    card.appendChild(media);
    card.appendChild(body);
    return card;
  }

  function loadSkin(folder) {
    var base = 'skins/' + folder;
    var headline = base + '/Headline.png';
    return fetch(base + '/' + folder + '.info')
      .then(function (r) { return r.ok ? r.json() : {}; })
      .catch(function () { return {}; })
      .then(function (info) {
        return Promise.all([imageExists(headline), findGallery(base)])
          .then(function (res) {
            var headlineOk = res[0];
            var gallery = res[1];
            if (!headlineOk) return null; // no preview → skip
            var shots = [headline].concat(gallery);
            return buildCard(info, base, headline, shots);
          });
      });
  }

  fetch('skins/index.json')
    .then(function (r) {
      if (!r.ok) throw new Error('No manifest');
      return r.json();
    })
    .then(function (folders) {
      if (!Array.isArray(folders) || !folders.length) {
        STATUS.textContent = 'No skins available yet — check back soon.';
        return;
      }
      return Promise.all(folders.map(loadSkin)).then(function (cards) {
        GRID.innerHTML = '';
        var shown = 0;
        cards.forEach(function (c) { if (c) { GRID.appendChild(c); shown++; } });
        if (!shown) GRID.innerHTML = '<p class="skins-status">No skins available yet — check back soon.</p>';
      });
    })
    .catch(function () {
      STATUS.textContent = 'Could not load the skin gallery.';
    });
})();
