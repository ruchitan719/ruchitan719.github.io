(function() {
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const mobileNav = document.getElementById('mobile-nav');
  let menuOpen = false;

  hamburgerBtn.addEventListener('click', function() {
    menuOpen = !menuOpen;
    hamburgerBtn.classList.toggle('open', menuOpen);
    mobileNav.classList.toggle('open', menuOpen);
    hamburgerBtn.setAttribute('aria-label', menuOpen ? 'Close menu' : 'Open menu');
  });

  mobileNav.querySelectorAll('a').forEach(function(link) {
    link.addEventListener('click', function() {
      menuOpen = false;
      hamburgerBtn.classList.remove('open');
      mobileNav.classList.remove('open');
    });
  });
})();