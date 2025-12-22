fetch("/partials/nav.html")
  .then(res => res.text())
  .then(html => {
    document.body.insertAdjacentHTML("afterbegin", html);

    // Optional: auto-highlight active page
    const links = document.querySelectorAll(".main-nav a");
    links.forEach(link => {
      if (link.href === window.location.href) {
        link.classList.add("active");
      }
    });
  });
