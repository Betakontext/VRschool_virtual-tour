AFRAME.registerComponent('set-image', {
  schema: { on: { type: 'string', default: 'click' }, src: { type: 'string' } },
  init() {
    const el = this.el;
    const skyCurrent = document.getElementById('sky-current');
    const skyNext = document.getElementById('sky-next');
    const extensions = ['jpg', 'jpeg', 'JPG']; // Unterstützte Endungen
    const cache = {};
    const progressBar = document.getElementById('progress');
    const loadingBar = document.querySelector('.loading-bar');

    function showProgress() {
      loadingBar.style.opacity = '1';
      progressBar.style.width = '30%';
    }

    function updateProgress(amt) {
      progressBar.style.width = amt + '%';
    }

    function hideProgress() {
      progressBar.style.width = '100%';
      setTimeout(() => {
        loadingBar.style.opacity = '0';
        progressBar.style.width = '0%';
      }, 300);
    }

    function updateMaterial(skyEl) {
      const mesh = skyEl.getObject3D('mesh');
      if (mesh && mesh.material && mesh.material.map) {
        mesh.material.map.needsUpdate = true;
      }
    }

    function swapSkies(src) {
      skyNext.setAttribute('src', src);
      updateMaterial(skyNext);

      skyCurrent.setAttribute('animation', { property: 'material.opacity', to: 0, dur: 800, easing: 'linear' });
      skyNext.setAttribute('animation', { property: 'material.opacity', to: 1, dur: 800, easing: 'linear', from: 0 });

      skyNext.addEventListener('animationcomplete', function onAnimComplete() {
        skyCurrent.setAttribute('src', src);
        skyCurrent.setAttribute('material', 'opacity', 1);
        skyNext.setAttribute('material', 'opacity', 0);
        skyNext.setAttribute('visible', false);
        skyNext.removeAttribute('animation');
        skyNext.removeEventListener('animationcomplete', onAnimComplete);
        hideProgress();
      });
    }

    el.addEventListener(this.data.on, () => {
      const baseSrc = this.data.src; // z. B. "img/Klassenraum"
      if (skyCurrent.getAttribute('src') === baseSrc) return;

      showProgress();

      if (cache[baseSrc]) {
        swapSkies(cache[baseSrc]);
        updateProgress(100);
        return;
      }

      skyNext.setAttribute('src', '#placeholder');
      skyNext.setAttribute('visible', true);
      updateMaterial(skyNext);

      const img = new Image();
      img.crossOrigin = 'anonymous';

      let tryIndex = 0;
      const tryLoad = () => {
        if (tryIndex >= extensions.length) {
          console.error('Keine unterstützte Bildendung gefunden:', baseSrc);
          hideProgress();
          return;
        }
        const src = `${baseSrc}.${extensions[tryIndex]}`;
        img.src = src;
        img.onerror = () => { tryIndex++; tryLoad(); };
      };

      img.onload = () => {
        const finalSrc = img.src;
        const texture = document.createElement('img');
        texture.id = finalSrc;
        texture.src = finalSrc;
        document.querySelector('a-assets').appendChild(texture);
        cache[baseSrc] = finalSrc;
        updateProgress(80);
        swapSkies(finalSrc);
      };

      tryLoad();
    });
  }
});
