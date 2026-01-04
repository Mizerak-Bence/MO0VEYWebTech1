document.addEventListener("DOMContentLoaded", function () {
    const video = document.getElementById("exerciseVideo");
    const playBtn = document.getElementById("playVideo");
    const pauseBtn = document.getElementById("pauseVideo");
    const muteBtn = document.getElementById("muteVideo");
    const restartBtn = document.getElementById("restartVideo");
    const volDownBtn = document.getElementById("volDown");
    const volUpBtn = document.getElementById("volUp");
    const speedDownBtn = document.getElementById("speedDown");
    const speedUpBtn = document.getElementById("speedUp");
    const sizeDownBtn = document.getElementById("sizeDown");
    const sizeUpBtn = document.getElementById("sizeUp");
    const videoWrapper = document.querySelector(".video-frame-wrapper");

    let currentWidth = 420;
    const minWidth = 260;
    const maxWidth = 640;

    if (!video) {
        return;
    }

    if (videoWrapper) {
        videoWrapper.style.maxWidth = currentWidth + "px";
    }

    playBtn.addEventListener("click", function () {
        video.play();
    });

    pauseBtn.addEventListener("click", function () {
        video.pause();
    });

    muteBtn.addEventListener("click", function () {
        video.muted = !video.muted;
    });

    restartBtn.addEventListener("click", function () {
        video.currentTime = 0;
        video.play();
    });

    volDownBtn.addEventListener("click", function () {
        const newVol = Math.max(0, video.volume - 0.1);
        video.volume = newVol;
    });

    volUpBtn.addEventListener("click", function () {
        const newVol = Math.min(1, video.volume + 0.1);
        video.volume = newVol;
    });

    speedDownBtn.addEventListener("click", function () {
        const newRate = Math.max(0.25, video.playbackRate - 0.25);
        video.playbackRate = newRate;
    });

    speedUpBtn.addEventListener("click", function () {
        const newRate = Math.min(3, video.playbackRate + 0.25);
        video.playbackRate = newRate;
    });

    sizeDownBtn.addEventListener("click", function () {
        if (!videoWrapper) return;
        currentWidth = Math.max(minWidth, currentWidth - 40);
        videoWrapper.style.maxWidth = currentWidth + "px";
    });

    sizeUpBtn.addEventListener("click", function () {
        if (!videoWrapper) return;
        currentWidth = Math.min(maxWidth, currentWidth + 40);
        videoWrapper.style.maxWidth = currentWidth + "px";
    });
});
