(function () {
  const scrollProgress = document.getElementById("progress");
  const progressValue = document.getElementById("progress-value");
  if (!scrollProgress) return; // nothing to do on pages without the progress widget

  const onClickTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  // attach click handler once
  scrollProgress.addEventListener("click", onClickTop);

  const calcScrollValue = () => {
    const pos = document.documentElement.scrollTop || document.body.scrollTop;
    const calcHeight =
      document.documentElement.scrollHeight -
      document.documentElement.clientHeight;
    const scrollValue = Math.round((pos * 100) / calcHeight);
    if (pos > 100) {
      scrollProgress.style.display = "grid";
    } else {
      scrollProgress.style.display = "none";
    }
    scrollProgress.style.background = `conic-gradient(var(--primary-color-dark-muted) ${scrollValue}%, #d7d7d7 ${scrollValue}%)`;
  };

  window.addEventListener("scroll", calcScrollValue);
  window.addEventListener("load", calcScrollValue);
})();
