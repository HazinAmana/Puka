(function () {
  const bar = document.getElementById("myBar");
  if (!bar) return; // nothing to do on pages without the progress bar

  const updateScrollBar = () => {
    const winScroll =
      document.body.scrollTop || document.documentElement.scrollTop;
    const height =
      document.documentElement.scrollHeight -
      document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    bar.style.width = scrolled + "%";
  };

  window.addEventListener("scroll", updateScrollBar);
  window.addEventListener("load", updateScrollBar);
})();
