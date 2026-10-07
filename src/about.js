window.duo.getAbout().then(info => {
  if (info) document.querySelector('#version').textContent = info.version;
});
document.querySelector('#author-website').addEventListener('click', event => {
  event.preventDefault();
  window.duo.openAuthorWebsite();
});
