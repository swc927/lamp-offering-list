# Lamp Offering List Generator

Browser-local generator for lamp-offering name labels. Paste or import one `M0001`-style lamp number and display name per row, validate the complete list, review living and deceased pages, then download the verified PDF.

The app does not upload the pasted list. It uses locally rendered HTML and client-side PDF generation. Serve the repository as static files; for local testing run `python3 -m http.server 4173` and open `http://127.0.0.1:4173/`.

Run the logic tests with `npm test`.
