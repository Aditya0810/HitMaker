var convertBtn = document.querySelector('.uplvideo');
var URLinput = document.querySelector('.link');
convertBtn.addEventListener('click', () => {
    console.log(`URL: ${URLinput.value}`);
    sendURL(URLinput.value);
});
function sendURL(URL) {
    window.location.href = `http://localhost:8000/download?URL=${URL}`;
}