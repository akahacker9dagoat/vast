# vast

Vast — a lightweight browser-based desktop environment.

This repository was initialized with a minimal, self-contained SPA so it can be hosted on GitHub Pages.

Features implemented in this commit:
- Single-page desktop UI with draggable, resizable windows
- Simple Browser app with address/search bar, tabs, basic navigation and bookmark storage (localStorage)
- Settings app with theme and wallpaper choices
- Keyboard shortcuts: Ctrl+T, Ctrl+W, Ctrl+L, Ctrl+D
- Local persistence for settings and bookmarks

How to run locally:

1. Clone the repo

   git clone https://github.com/akahacker9dagoat/vast.git
   cd vast

2. Open index.html in your browser (no build step required):

   open index.html

Publishing to GitHub Pages:

- GitHub Pages can serve this repository as a static site from the main branch.
- Go to the repository Settings → Pages → Source and choose 'main' branch, / (root). Save.
- After a minute the site will be available at: https://akahacker9dagoat.github.io/vast/

Notes and limitations:
- The embedded browser uses iframes and cannot bypass X-Frame-Options or Content-Security-Policy restrictions. Sites that block embedding will show a friendly fallback and an 'Open in new tab' option.
- This is a lightweight, client-side implementation intended to be extensible. It deliberately avoids server-side proxying or any attempt to circumvent embedding restrictions.
- No external dependencies; everything is implemented in vanilla HTML/CSS/JS to keep the repo small and GitHub Pages-friendly.

Next steps you can ask me to do (examples):
- "Add more launcher apps and configurable app URLs"
- "Improve browser history and back/forward behavior"
- "Add a bookmarks manager UI"
