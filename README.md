Vast — lightweight browser-based desktop environment.

Updates in this commit:
- Default search engine remains Google (https://www.google.com/search?q=). Because Google blocks embedding, Vast will open Google search queries in a normal browser tab instead of attempting to load them inside an iframe.
- Browser UI restyled to a cleaner, Google-like look: centered rounded search box, blue accent, simplified toolbar.
- Faster detection and clearer fallback when a site refuses to be embedded; explicit "Open in new tab" button is provided.

How Google searches are handled:
- If Google is selected as the search engine (default), searches entered in the address/search box will open in your real browser tab (external) because Google disallows embedding.
- Direct website URLs (not searches) are still attempted inside Vast's iframe. If the site refuses to embed (X-Frame-Options/CSP), you will see a friendly message and an "Open in new tab" button.

If you'd like Google to open inside a popup window or for searches to instead use a privacy-respecting engine that sometimes allows embedding (like DuckDuckGo), I can add a toggle in Settings to choose that behavior.
