# Lamp Offering List Generator

Browser-local generator for lamp-offering name labels. Paste or import one `M0001`-style lamp number and display name per row, validate the complete list, review living and deceased pages, then download the verified PDF. Valid suffixed references such as `M0683A` are accepted. Repeated identical number/name rows create multiple physical labels, while conflicting names for the same offering number are rejected.

Names are kept on one line whenever they fit at the verified readable-size floor. A longer name uses a meaningful fallback split only when necessary, preserving comma-separated English names, parenthetical names, and the supplied name order. Company names that fit remain on one line. Deceased wording, including an explicit `Deceased` description, is placed on the yellow deceased layout.
Every label also reserves a 20 px horizontal and 12 px vertical safe inset so long names do not visually touch the printed box border.

The app does not upload the pasted list. It uses locally rendered HTML and client-side PDF generation. Serve the repository as static files; for local testing run `python3 -m http.server 4173` and open `http://127.0.0.1:4173/`.

Run the logic tests with `npm test`.
