const video = document.getElementById("camera");

navigator.mediaDevices.getUserMedia({ video: true })
  .then((stream) => {
    video.srcObject = stream;
  })
  .catch((err) => {
    console.error("Camera access denied:", err);
  });

const layoutButtons = document.querySelectorAll(".layout-btn");
layoutButtons.forEach(button => {
  button.addEventListener("click", () => {
    alert(`Layout ${button.id} selected`);
    // Add your layout change logic here
  });
});
