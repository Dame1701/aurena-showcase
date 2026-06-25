class Component extends DCLogic {
  state = { gains: [6,5,3,0,-2,-1,1,2,4,6], lightbox: { open: false, src: '', alt: '' } };

  freqs = ['31','62','125','250','500','1k','2k','4k','8k','16k'];

  componentDidMount() {
    // Scroll reveal — content is visible by default; only hide+animate if JS runs.
    const els = Array.from(document.querySelectorAll('[data-reveal]'));
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.style.opacity = '1';
          e.target.style.transform = 'none';
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach(el => {
      const r = el.getBoundingClientRect();
      const inView = r.top < window.innerHeight * 0.92;
      if (inView) return; // already on screen — leave visible, no flash
      el.style.opacity = '0';
      el.style.transform = 'translateY(26px)';
      el.style.transition = 'opacity .7s cubic-bezier(.16,1,.3,1), transform .7s cubic-bezier(.16,1,.3,1)';
      io.observe(el);
    });

    // EQ drag
    this._dragI = null;
    this._dragRect = null;
    const move = (e) => {
      if (this._dragI == null) return;
      e.preventDefault();
      const y = e.touches ? e.touches[0].clientY : e.clientY;
      this._applyFromY(y);
    };
    const up = () => { this._dragI = null; this._dragRect = null; };
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up);

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.state.lightbox && this.state.lightbox.open) {
        this.setState({ lightbox: { open: false, src: '', alt: '' } });
        document.body.style.overflow = '';
      }
    });
  }

  _applyFromY(y) {
    const r = this._dragRect;
    if (!r) return;
    let p = (y - r.top) / r.height;
    p = Math.max(0, Math.min(1, p));
    const gain = Math.round((1 - p) * 24 - 12);
    const gains = this.state.gains.slice();
    gains[this._dragI] = gain;
    this.setState({ gains });
  }

  renderVals() {
    const gains = this.state.gains;
    const bands = gains.map((g, i) => {
      const handlePct = (1 - (g + 12) / 24) * 100;
      const fillT = Math.min(handlePct, 50);
      const fillH = Math.abs(50 - handlePct);
      return {
        i,
        freq: this.freqs[i],
        gain: g,
        label: g > 0 ? '+' + g : '' + g,
        handleT: handlePct.toFixed(1) + '%',
        fillT: fillT.toFixed(1) + '%',
        fillH: fillH.toFixed(1) + '%',
        onDown: (e) => {
          const track = e.currentTarget.querySelector('div');
          // measure the vertical track region (the relative slider area)
          const region = e.currentTarget.children[1];
          this._dragRect = region.getBoundingClientRect();
          this._dragI = i;
          const y = e.touches ? e.touches[0].clientY : e.clientY;
          this._applyFromY(y);
        }
      };
    });

    const setGains = (arr) => () => this.setState({ gains: arr.slice() });

    const lb = this.state.lightbox || { open: false, src: '', alt: '' };
    const openZoom = (src, alt) => () => { this.setState({ lightbox: { open: true, src, alt } }); document.body.style.overflow = 'hidden'; };
    const closeZoom = () => { this.setState({ lightbox: { open: false, src: '', alt: '' } }); document.body.style.overflow = ''; };

    return {
      bands,
      lightboxOpen: lb.open,
      lightboxAlt: lb.alt,
      lightboxImg: lb.open ? React.createElement('img', { src: lb.src, alt: lb.alt, style: { maxWidth: '96vw', maxHeight: '84vh', width: 'auto', height: 'auto', borderRadius: '12px', boxShadow: '0 40px 120px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.06)' } }) : null,
      zoomHero: openZoom('img/hero.webp', 'Aurena — the album wall with now playing'),
      zoomNow: openZoom('img/now-playing.webp', 'Now playing with VU & spectrum meters'),
      zoomMeta: openZoom('img/metadata.webp', 'Metadata editor with MusicBrainz confidence indicator'),
      zoomRetro: openZoom('img/retro.webp', 'Retro formats browser · SID now playing'),
      zoomPodcasts: openZoom('img/podcasts.webp', 'Podcast subscriptions & episode list'),
      zoomPhonePlayer: openZoom('img/phone-player.webp', 'Remote web player on a phone'),
      zoomPhoneJukebox: openZoom('img/phone-jukebox.webp', 'Jukebox guest request view'),
      zoomPlaylists: openZoom('img/smart-playlists.webp', 'Smart playlist editor with live match count'),
      zoomLibrary: openZoom('img/library.webp', 'Album grid library view'),
      zoomPi: openZoom('img/pi-kiosk.webp', 'Pi 5 hi-fi kiosk on a TV — now playing on the big screen'),
      closeZoom,
      autoLabel: 'Auto · genre-aware',
      setFlat: setGains([0,0,0,0,0,0,0,0,0,0]),
      setVocal: setGains([-2,-1,0,2,4,4,3,2,1,0]),
      setLoud: setGains([6,5,2,0,-1,-1,0,2,5,6]),

      vuBars: Array.from({ length: 52 }, (_, i) => ({
        dur: (0.7 + (i % 7) * 0.18).toFixed(2) + 's',
        delay: ((i % 11) * 0.13).toFixed(2) + 's'
      })),

      pillars: [
        { num: '01', title: 'Retro formats as first-class citizens', body: React.createElement(React.Fragment, null,
          'This is the one almost nobody does: cycle-accurate C64 SID ',
          React.createElement('em', { style: { fontStyle: 'italic' } }, 'and'),
          ' 100+ tracker/module formats — all thanks to integration with the wonderful ',
          React.createElement('a', { href: 'https://nostalgicplayer.dk/', target: '_blank', rel: 'noopener noreferrer', style: { color: '#5FE3DA', textDecoration: 'none', borderBottom: '1px solid rgba(95,227,218,.45)', textShadow: '0 0 10px rgba(95,227,218,.4)' } }, 'Nostalgic Player'),
          ' — scanned, searchable and playlist-able right alongside your FLACs, not bolted on as a playback plugin.'
        ) },
        { num: '02', title: 'A hi-fi appliance on a Raspberry Pi', body: 'Boots a Pi 5 straight into Aurena — no desktop needed — for a dedicated music system you drive from the TV or your phone. The kind of thing you\u2019d normally buy a £500 streamer for.' },
        { num: '03', title: 'Playlists from a plain-English vibe', body: React.createElement(React.Fragment, null,
          'Describe what you want and Aurena builds it from the ',
          React.createElement('em', { style: { fontStyle: 'italic' } }, 'actual sound'),
          ' of your tracks, not just tags — running fully private on a local Ollama, or on Gemini if you prefer.'
        ) },
        { num: '04', title: 'An EQ that drives itself', body: React.createElement(React.Fragment, null,
          'A 10-band EQ that reads the ',
          React.createElement('em', { style: { fontStyle: 'italic' } }, 'genre'),
          ' of each track and resolves the curve for you on every change — hundreds of genres mapped to tuned presets. Set it and forget it.'
        ) },
        { num: '05', title: 'Metadata that survives', body: React.createElement(React.Fragment, null,
          'A sidecar layer keeps your hard-won corrections ',
          React.createElement('em', { style: { fontStyle: 'italic' } }, 'next to your files'),
          ', so they ',
          React.createElement('strong', { style: { color: '#F4F2EE', fontWeight: 700 } }, "don't get wiped"),
          ' when tags are rewritten or a disc is re-ripped.'
        ) },
        { num: '06', title: 'The whole app, on every screen', body: React.createElement(React.Fragment, null,
          'A built-in web UI ',
          React.createElement('em', { style: { fontStyle: 'italic' } }, 'plus'),
          ' a real Subsonic-compatible server, with live desktop ⇄ web sync — stream your collection on any phone, with the clients you already love.'
        ) },
        { num: '07', title: 'A party jukebox built in', body: 'Guests queue tracks from their own phones, with per-person cooldowns so nobody hogs the decks.' },
        { num: '08', title: 'Local-first, no strings', body: React.createElement(React.Fragment, null,
          'Your music, your metadata, your machine. No accounts, no cloud lock-in, no subscription — and ',
          React.createElement('strong', { style: { color: '#F4F2EE', fontWeight: 700 } }, 'free to use'),
          '.'
        ) },
        { num: '09', title: 'Modular by design', body: 'A lean core that loads features as plugins — so it stays fast and focused instead of bloating.' }
      ],

      soundFeatures: [
        { title: 'Gapless advancement', body: 'live albums, DJ mixes and concept records flow track-to-track with no silence punched into the seams.' },
        { title: 'Configurable crossfade', body: 'overlap one track into the next over a window you choose — identical across normal albums and retro formats.' },
        { title: 'VU & spectrum metering', body: 'real-time visuals for people who like to watch the music too.' },
        { title: 'Smooth interpolated seek', body: 'scrubbing feels fluid, not steppy.' },
        { title: 'Plays everything', body: 'lossless FLAC to everyday MP3/AAC/OGG, no fuss.' }
      ],

      libraryFeatures: [
        { title: 'Media Pools', body: 'register multiple roots — local drives, NAS shares, external disks — and Aurena treats them as one unified library.' },
        { title: 'Album grid & list', body: 'browse a wall of artwork or use the intelligent search to find that album or track.' },
        { title: 'Multi-disc done right', body: 'box sets are modelled properly, not flattened into one blob.' },
        { title: 'Proper artwork management', body: 'folder-synced cover art and caching, not fragile embedded-only tags.' },
        { title: 'Fast fuzzy full-text search', body: 'Lucene-backed, so typos and near-misses still find the track.' },
        { title: 'Album tools', body: 'merge releases that scanned separately, fix bad durations, reveal files on disk.' }
      ],

      metaFeatures: [
        { title: 'Acoustic fingerprinting', body: 'Chromaprint generates a fingerprint of every track on Linux, Windows and macOS.' },
        { title: 'AcoustID → MusicBrainz', body: 'fingerprints resolve to full MusicBrainz metadata, with confidence scoring so you can see how sure a match is.' },
        { title: 'In-app status indicators', body: 'icons and tooltips show fingerprint state, match confidence and last-scan date right in the track view.' },
        { title: 'Sidecar metadata system', body: 'a per-track and per-album layer stored alongside your files — your edits survive tag rewrites, re-tagging and re-ripping.' },
        { title: 'Dedicated editors', body: 'clean, field-by-field track and album metadata editors.' }
      ],

      retroFeatures: [
        { title: 'Commodore 64 SID', body: 'cycle-accurate playback that is HVSC & STIL aware, so the High Voltage SID Collection plays with its song-length and info metadata intact.' },
        { title: '100+ tracker / module formats', body: 'MOD, XM, IT, S3M and the wider libxmp family, plus AHX/THX/HVL and TFMX. If it came off an Amiga, Atari or a demoscene release, it probably plays.' },
        { title: 'First-class citizens', body: 'retro tracks scan, browse, queue and go into playlists just like everything else. Mix a SID tune and a FLAC in the same playlist.' }
      ],

      retroFormats: ['SID','MOD','XM','IT','S3M','AHX/THX','HVL','TFMX'].map(n => ({ name: n })),

      playlistFeatures: [
        { title: 'Manual playlists', body: 'curate by hand with drag-and-drop reordering.' },
        { title: 'Smart playlists', body: 'define a playlist as a query over name, album, artist, genre, duration, rating, play count and dates — match all or any, sort, and cap results.' },
        { title: 'They keep themselves current', body: '"added in the last 14 days" and "not played in 6 months" roll forward on their own, every time you open them.' },
        { title: 'Live preview while editing', body: 'see a running match count and sample tracks before you save.' }
      ],

      podcastFeatures: [
        { title: 'Discovery across two directories', body: 'search both iTunes and PodcastIndex.' },
        { title: 'RSS subscriptions', body: 'follow any standard podcast feed.' },
        { title: 'Offline downloads', body: 'grab episodes for the commute.' },
        { title: 'Artwork & metadata', body: 'handled with the same care as the music library.' }
      ],

      ripFeatures: [
        { title: 'CD ripping', body: 'MusicBrainz disc-ID lookup to identify the disc and pull its tracklist, through a CD-Paranoia-style pipeline for accurate reads. (Linux-only.)' },
        { title: 'Encoding profiles', body: 'reusable encode settings for FLAC, MP3, AAC and OGG.' },
        { title: 'Track splitter', body: 'break one long file into tracks via automatic silence detection and a visual timeline editor for hand-placing split points.' }
      ],

      platforms: [
        { name: 'Linux', body: 'Primary target — even runs as a Raspberry Pi 5 hi-fi kiosk appliance.' },
        { name: 'Windows', body: 'Supported — audio runtime bundled, nothing extra to install.' },
        { name: 'macOS', body: 'Fully supported, on par with Linux (CD ripping is the one exception).' }
      ],

      stack: ['.NET 10','Avalonia','ReactiveUI','EF Core + SQLite','GStreamer','Lucene.NET','TagLibSharp','Chromaprint','AcoustID','MusicBrainz','Angular'].map(n => ({ name: n }))
    };
  }
}
