const layoutOptions = {
    '1x3': { shots: 4, select: 3, grid: [3, 1] },
    '2x2': { shots: 5, select: 4, grid: [2, 2] },
    '2x3': { shots: 7, select: 6, grid: [2, 3] }
};

let currentLayout = '1x3';
let shotsRequired = 4;
let selectCount = 3;
let gridConfig = [1, 3];
let thumbnails = [];
let selected = [];

const layoutSelect = document.getElementById('layoutSelect');
const startBtn = document.getElementById('startBtn');
const video = document.getElementById('video');
const snapBtn = document.getElementById('snapBtn');
const thumbnailsDiv = document.getElementById('thumbnails');
const composeBtn = document.getElementById('composeBtn');
const resultCanvas = document.getElementById('resultCanvas');
const downloadBtn = document.getElementById('downloadBtn');

// Reset everything
function resetPhotobooth() {
    thumbnails = [];
    selected = [];
    thumbnailsDiv.innerHTML = '';
    resultCanvas.style.display = 'none';
    downloadBtn.style.display = 'none';
    composeBtn.style.display = 'none';
}

// Update layout when select changes
layoutSelect.addEventListener('change', function () {
    currentLayout = layoutSelect.value;
    shotsRequired = layoutOptions[currentLayout].shots;
    selectCount = layoutOptions[currentLayout].select;
    gridConfig = layoutOptions[currentLayout].grid;
    resetPhotobooth();
});

let photoCount = 0;

startBtn.addEventListener('click', function () {
    resetPhotobooth();
    document.getElementById('cameraPane').style.display = 'block';
    snapBtn.style.display = 'inline-block';
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => { video.srcObject = stream; })
        .catch(err => { alert('Could not access camera: ' + err); });
    snapBtn.disabled = false;
    photoCount = 0;
});

snapBtn.addEventListener('click', function () {
    if (photoCount >= shotsRequired) return;

    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, 320, 240);

    thumbnails.push(canvas.toDataURL('image/png'));
    renderThumbnails();

    photoCount++;
    if (photoCount === shotsRequired) {
        snapBtn.disabled = true;

        // Automatically select the first selectCount photos
        selected = Array.from({length: selectCount}, (_, k) => k);

        // Stop the camera stream for cleanup
        if (video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
            video.srcObject = null;
        }

        // Hide composeBtn (optional, since we are auto-composing)
        composeBtn.style.display = 'none';

        // Directly compose and show the strip/grid in the right panel
        composePreview();
    }
});

function renderThumbnails() {
    thumbnailsDiv.innerHTML = '';
    thumbnails.forEach((img, idx) => {
        const thumb = document.createElement('img');
        thumb.src = img;
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

// Compose and preview function, used both for manual and automatic composition
function composePreview() {
    if (selected.length !== selectCount) {
        alert(`Please select ${selectCount} photos.`);
        return;
    }
    const [cols, rows] = gridConfig;

    // Panel limits (adjust these if your CSS sets different sizes)
    const maxPanelWidth = 320;
    const maxPanelHeight = 480;
    const aspectRatio = 4 / 3; // width : height

    // Compute max photo size that fits the grid
    const maxImageWidth = maxPanelWidth / cols;
    const maxImageHeight = maxPanelHeight / rows;

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

    let loadedImages = 0;
    selected.forEach((idx, i) => {
        const img = new window.Image();
        img.src = thumbnails[idx];
        img.onload = () => {
            const x = (i % cols) * w;
            const y = Math.floor(i / cols) * h;
            ctx.drawImage(img, x, y, w, h);

            loadedImages++;
            if (loadedImages === selected.length) {
                resultCanvas.style.display = 'block';
                downloadBtn.style.display = 'inline-block';
                downloadBtn.href = resultCanvas.toDataURL('image/png');
                downloadBtn.download = 'photobooth.png';
                downloadBtn.textContent = 'Download Strip/Grid';
            }
        };
    });
}

// Manual Compose (if you still want users to pick selection manually and click Compose)
composeBtn.addEventListener('click', composePreview);
