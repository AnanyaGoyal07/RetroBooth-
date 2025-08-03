// RetroBooth Script - Fixed bugs and enhanced features including doodle, stickers, GIF export, sounds, QR code

const layoutOptions = {
  '1x3': { shots: 4, select: 3, grid: [1, 3] },
  '2x2': { shots: 5, select: 4, grid: [2, 2] },
  '2x3': { shots: 7, select: 6, grid: [2, 3] }
};

let currentLayout = '1x3';
let shotsRequired = 4;
let selectCount = 3;
let gridConfig = [1, 3];

let thumbnails = [];
let selected = [];
let photoCount = 0;

const layoutSelect = document.getElementById('layoutSelect');
const startBtn = document.getElementById('startBtn');
const video = document.getElementById('video');
const snapBtn = document.getElementById('snapBtn');
const thumbnailsDiv = document.getElementById('thumbnails');
const composeBtn = document.getElementById('composeBtn');
const resultCanvas = document.getElementById('resultCanvas');
const downloadBtn = document.getElementById('downloadBtn');
const shareGifBtn = document.getElementById('shareGifBtn');

// Sound Effects
const shutterSound = document.getElementById('shutterSound');
const beepSound = document.getElementById('beepSound');
const doneSound = document.getElementById('doneSound');

// Countdown display
const countdown = document.getElementById('countdown');

// QR Code Section
const qrSection = document.getElementById('qrSection');
const qrcodeContainer = document.getElementById('qrcode');

// Doodle support
const doodleCanvas = document.getElementById('doodleCanvas');
const colorPicker = document.getElementById('colorPicker');
const brushSizeInput = document.getElementById('brushSize');
const clearDoodleBtn = document.getElementById('clearDoodle');

let doodleCtx, isDrawing = false;

function resetPhotobooth() {
  thumbnails = [];
  selected = [];
  thumbnailsDiv.innerHTML = '';
  resultCanvas.style.display = 'none';
  downloadBtn.style.display = 'none';
  composeBtn.style.display = 'none';
  shareGifBtn.style.display = 'none';
  countdown.textContent = '';
  qrSection.style.display = 'none';
  qrcodeContainer.innerHTML = '';
  photoCount = 0;
  snapBtn.disabled = false;

  if (video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
    video.srcObject = null;
  }

  // Clear doodle canvas
  if(doodleCtx) {
    doodleCtx.clearRect(0, 0, doodleCanvas.width, doodleCanvas.height);
  }

  selectedStickers = [];
}

layoutSelect.addEventListener('change', () => {
  currentLayout = layoutSelect.value;
  shotsRequired = layoutOptions[currentLayout].shots;
  selectCount = layoutOptions[currentLayout].select;
  gridConfig = layoutOptions[currentLayout].grid;
  resetPhotobooth();
});

// Initialize doodle canvas size and context
function setupDoodleCanvas() {
  doodleCanvas.width = video.clientWidth;
  doodleCanvas.height = video.clientHeight;
  doodleCanvas.style.top = video.offsetTop + 'px';
  doodleCanvas.style.left = video.offsetLeft + 'px';
  doodleCanvas.style.pointerEvents = 'auto';
  doodleCtx = doodleCanvas.getContext('2d');
  doodleCtx.strokeStyle = colorPicker.value;
  doodleCtx.lineWidth = brushSizeInput.value;
  doodleCtx.lineCap = 'round';
}

colorPicker.addEventListener('change', () => {
  if (doodleCtx) doodleCtx.strokeStyle = colorPicker.value;
});
brushSizeInput.addEventListener('change', () => {
  if (doodleCtx) doodleCtx.lineWidth = brushSizeInput.value;
});
clearDoodleBtn.addEventListener('click', () => {
  if(doodleCtx) {
    doodleCtx.clearRect(0, 0, doodleCanvas.width, doodleCanvas.height);
  }
});

// Doodle drawing events - fixed coordinate issue
function getMousePos(canvas, evt) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}

function startDrawing(e) {
  isDrawing = true;
  const pos = getMousePos(doodleCanvas, e);
  doodleCtx.beginPath();
  doodleCtx.moveTo(pos.x, pos.y);
}
function draw(e) {
  if (!isDrawing) return;
  const pos = getMousePos(doodleCanvas, e);
  doodleCtx.lineTo(pos.x, pos.y);
  doodleCtx.stroke();
}
function stopDrawing() {
  isDrawing = false;
}

// Touch support for mobiles
function getTouchPos(canvas, touchEvent) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: touchEvent.touches[0].clientX - rect.left,
    y: touchEvent.touches[0].clientY - rect.top
  };
}
function touchStart(e) {
  e.preventDefault();
  isDrawing = true;
  const pos = getTouchPos(doodleCanvas, e);
  doodleCtx.beginPath();
  doodleCtx.moveTo(pos.x, pos.y);
}
function touchMove(e) {
  e.preventDefault();
  if (!isDrawing) return;
  const pos = getTouchPos(doodleCanvas, e);
  doodleCtx.lineTo(pos.x, pos.y);
  doodleCtx.stroke();
}
function touchEnd(e) {
  e.preventDefault();
  isDrawing = false;
}

// Attach mouse and touch events

doodleCanvas.addEventListener('mousedown', startDrawing);
doodleCanvas.addEventListener('mousemove', draw);
doodleCanvas.addEventListener('mouseup', stopDrawing);
doodleCanvas.addEventListener('mouseout', stopDrawing);

doodleCanvas.addEventListener('touchstart', touchStart);
doodleCanvas.addEventListener('touchmove', touchMove);
doodleCanvas.addEventListener('touchend', touchEnd);


// Start camera and Pre-Timed Burst Capture Implementation
startBtn.addEventListener('click', async () => {

  resetPhotobooth();
  qrSection.style.display = 'none';
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
video.srcObject = stream;
video.onloadedmetadata = function() {
  video.play();
  setupDoodleCanvas();
  doodleCanvas.style.pointerEvents = 'auto';
};
  } catch (err) {
    alert('Could not access camera: ' + err);
    return;
  }

  snapBtn.style.display = 'none';
  composeBtn.style.display = 'none';
  shareGifBtn.style.display = 'none';

  // Pre-timed burst capture: shotsRequired shots with countdown
  photoCount = 0;
  thumbnails = [];
  selected = [];

  async function takePhotoCountdown() {
    for(let i = 3; i >= 1; i--) {
      countdown.textContent = i;
      beepSound.play().catch(() => {});
      await new Promise(r => setTimeout(r, 1000));
    }
    countdown.textContent = '';
    capturePhoto();
  }

  async function capturePhoto() {
    shutterSound.play().catch(() => {});

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Draw doodles on top
    if (doodleCtx) {
      ctx.drawImage(doodleCanvas, 0, 0, canvas.width, canvas.height);
    }

    // Draw selected stickers if any
    selectedStickers.forEach(sticker => {
      const img = new Image();
      img.src = sticker.src;
      ctx.drawImage(img, sticker.x, sticker.y, sticker.width, sticker.height);
    });

    thumbnails.push(canvas.toDataURL('image/png'));
    renderThumbnails();

    photoCount++;
    if (photoCount < shotsRequired) {
      await takePhotoCountdown();
    } else {
      countdown.textContent = '';
      snapBtn.style.display = 'none';
      composeBtn.style.display = 'inline-block';
      if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
      }
      doneSound.play().catch(() => {});
    }
  }

  takePhotoCountdown();
});

// Stickers support
let selectedStickers = [];
const stickersDiv = document.getElementById('stickers');
stickersDiv.addEventListener('click', e => {
  if (e.target.classList.contains('sticker')) {
    // Add sticker in the center (demo)
    const rect = video.getBoundingClientRect();
    const stickerObj = {
      src: e.target.src,
      x: Math.floor(rect.width / 2 - 40),
      y: Math.floor(rect.height / 2 - 40),
      width: 80,
      height: 80
    };
    selectedStickers.push(stickerObj);
    alert('Sticker added! (Position editing not implemented)');
  }
});

// Render thumbnails
function renderThumbnails() {
  thumbnailsDiv.innerHTML = '';
  thumbnails.forEach((imgSrc, idx) => {
    const thumb = document.createElement('img');
    thumb.src = imgSrc;
    thumb.className = 'thumbnail' + (selected.includes(idx) ? ' selected' : '');
    thumb.onclick = () => {
      if (selected.includes(idx)) {
        selected = selected.filter(i => i !== idx);
      } else if (selected.length < selectCount) {
        selected.push(idx);
      }
      renderThumbnails();
    };
    thumbnailsDiv.appendChild(thumb);
  });
}

// Compose preview of selected photos into strip/grid
function composePreview() {
  if (selected.length !== selectCount) {
    alert(`Please select ${selectCount} photos.`);
    return;
  }

  const [cols, rows] = gridConfig;

  const maxPanelWidth = 320;
  const maxPanelHeight = 480;
  const aspectRatio = 4 / 3;

  let maxImageWidth = maxPanelWidth / cols;
  let maxImageHeight = maxPanelHeight / rows;

  let w, h;
  if (maxImageWidth / maxImageHeight > aspectRatio) {
    h = Math.floor(maxImageHeight);
    w = Math.floor(h * aspectRatio);
  } else {
    w = Math.floor(maxImageWidth);
    h = Math.floor(w / aspectRatio);
  }

  resultCanvas.width = w * cols;
  resultCanvas.height = h * rows;

  const ctx = resultCanvas.getContext('2d');
  ctx.fillStyle = '#dbc994';
  ctx.fillRect(0, 0, resultCanvas.width, resultCanvas.height);

  // Draw each selected image
  let loadedImages = 0;
  selected.forEach((idx, i) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = thumbnails[idx];
    img.onload = () => {
      const x = (i % cols) * w;
      const y = Math.floor(i / cols) * h;
      ctx.drawImage(img, x, y, w, h);

      loadedImages++;
      if (loadedImages === selected.length) {
        // Draw stickers and doodle if needed on composed strip
        selectedStickers.forEach(sticker => {
          const imgSticker = new Image();
          imgSticker.src = sticker.src;
          imgSticker.onload = () => {
            ctx.drawImage(imgSticker, sticker.x, sticker.y, sticker.width, sticker.height);
          };
        });

        // For doodle, we don't overlay again here - we assume they are merged in photos.

        resultCanvas.style.display = 'block';
        downloadBtn.style.display = 'inline-block';
        shareGifBtn.style.display = 'inline-block';
        downloadBtn.href = resultCanvas.toDataURL('image/png');
        downloadBtn.download = 'photobooth.png';
        downloadBtn.textContent = 'Download Strip/Grid';
        generateQRCode(resultCanvas.toDataURL('image/png'));
      }
    };
  });
}

composeBtn.addEventListener('click', composePreview);

// Generate QR Code for the final strip
function generateQRCode(dataURL) {
  if (!window.QRCode) {
    console.warn('QRCode library not loaded');
    return;
  }
  qrSection.style.display = 'block';
  qrcodeContainer.innerHTML = '';
  // For demo, encode dataURL (in real use: link to hosted download page)
  new QRCode(qrcodeContainer, {
    text: dataURL,
    width: 160,
    height: 160
  });
}

// Share GIF button - create animated GIF from selected thumbnails
shareGifBtn.addEventListener('click', () => {
  if (selected.length !== selectCount) {
    alert(`Please select ${selectCount} photos to make GIF.`);
    return;
  }
  const gif = new GIF({
    workers: 2,
    quality: 10,
    width: resultCanvas.width,  // Ensures uniform size
    height: resultCanvas.height
  });

  let images = [];
  let loaded = 0;
  selected.forEach(idx => {
    const img = new window.Image();
    img.crossOrigin = 'Anonymous';
    img.src = thumbnails[idx];
    img.onload = function() {
      images.push(img);
      loaded++;
      if (loaded === selected.length) {
        // Draw each image onto a temp canvas for same size
        images.forEach(frame => {
          const c = document.createElement('canvas');
          c.width = resultCanvas.width;
          c.height = resultCanvas.height;
          const ct = c.getContext('2d');
          ct.fillStyle = '#dbc994';
          ct.fillRect(0,0,c.width,c.height);
          ct.drawImage(frame, 0, 0, c.width, c.height);
          gif.addFrame(c, {delay: 1000});
        });
        gif.render();
      }
    };
  });

  gif.on('finished', function(blob) {
    const url = URL.createObjectURL(blob);
    downloadBtn.href = url;
    downloadBtn.download = 'photobooth.gif';
    downloadBtn.textContent = 'Download Animated GIF';
    shareGifBtn.style.display = 'none';
    resultCanvas.style.display = 'block';
    downloadBtn.style.display = 'inline-block';
  });
});

// Snap button for manual capture if needed (hidden by default, enable if desired)
snapBtn.addEventListener('click', () => {
  if (photoCount >= shotsRequired) return;

  shutterSound.play().catch(() => {});

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 320;
  canvas.height = video.videoHeight || 240;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Draw doodles on top
  if (doodleCtx) {
    ctx.drawImage(doodleCanvas, 0, 0, canvas.width, canvas.height);
  }

  // Draw stickers
  selectedStickers.forEach(sticker => {
    const img = new Image();
    img.src = sticker.src;
    ctx.drawImage(img, sticker.x, sticker.y, sticker.width, sticker.height);
  });

  thumbnails.push(canvas.toDataURL('image/png'));
  renderThumbnails();

  photoCount++;
  if (photoCount === shotsRequired) {
    snapBtn.disabled = true;
    composeBtn.style.display = 'inline-block';
    if (video.srcObject) {
      video.srcObject.getTracks().forEach(track => track.stop());
      video.srcObject = null;
    }
  }
});
