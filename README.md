# RetroBooth
RetroBooth is a browser-based interactive photobooth that allows users to:
-Access their webcam
-Select a photobooth layout (1x3 strip, 2x2 grid, or 2x3 grid)
-Take a set number of photos
-Apply retro-style filters to each photo
-Automatically arrange them into the selected layout
-Download the final image as a styled photo collage

# Layout Types:
-1x3 strip (4 pictures allowed, user can choose 3 pictures from them)
-2x2 grid (5 pictures allowed)
-2x3 grid (7 pictures allowed)

| Stack              | Tool                    |
| ------------------ | ----------------------- |
| Language           | HTML, CSS, JavaScript   |
| Webcam             | WebRTC (`getUserMedia`) |
| Image Filters      | CamanJS / Canvas API    |
| Layout Engine      | HTML Canvas API         |
| Export             | `canvas.toDataURL()`    |
| Hosting (optional) | GitHub Pages / Netlify  |


#Filter options:
( CamanJS )