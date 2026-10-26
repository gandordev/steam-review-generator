# Steam Review Generator

A small, dependency-free web app for creating BBCode reviews for Steam games.
Choose ratings and options for built-in review categories, add your own
categories, write review notes, and copy the generated BBCode.

The interface is available in Spanish and English. Categories and the selected
language are saved in the browser's local storage.

## Run locally

The app loads its HTML components with browser `fetch`, so open it through a
local web server rather than directly as a `file://` page. No package install or
build step is required. Python 3.14 was used to run the local server.

1. Open a terminal in the project folder.
2. Start Python's built-in web server with `uv`:

   ```bash
   uv run -m http.server 8000
   ```

3. Visit <http://localhost:8000> in your browser.
4. Stop the server with `Ctrl+C` when you are done.

You can also use any other static file server that serves the project root.

## Deploy to GitHub Pages

The GitHub Actions workflow in `.github/workflows/deploy.yml` publishes the
static site whenever a commit is pushed to `master`. It can also be started
manually from the repository's **Actions** tab.

### One-time setup

1. Push this project to a GitHub repository.
2. In the repository, open **Settings → Pages**.
3. Set **Build and deployment → Source** to **GitHub Actions**.
4. Push a commit to `master`. The **Deploy to GitHub Pages** workflow will
   publish the site; its deployment URL appears in the workflow run and under
   **Settings → Pages**.

### Branching and release flow

1. Start a change on a branch named `feature/<short-description>` or
   `fix/<short-description>`.
2. Push the branch and open a pull request targeting `master`.
3. Review and merge the pull request. The resulting push to `master` deploys
   the site automatically.

Do not push unfinished changes directly to `master` if they should not go live.

## Project structure

```text
.
├── components/              # HTML fragments loaded by the app
├── css/
│   ├── components/          # Styles scoped to individual UI components
│   ├── base.css             # Colors, typography, buttons, shared card styles
│   └── layout.css           # Page layout and responsive rules
├── js/
│   ├── components/          # Reusable UI rendering
│   ├── data/                # Default categories and language strings
│   └── app.js               # Application state, events, and BBCode generation
├── index.html               # Main page
└── LICENSE                  # Non-commercial use license
```

## Customize

- Edit `js/data/categories.js` to change the built-in categories.
- Edit `js/data/translations.js` to update interface text in either language.
- Edit a component's HTML in `components/` and its styles in
  `css/components/`.
- Edit `css/base.css` for shared colors and styles, or `css/layout.css` for
  page layout and responsive behavior.
- Edit `js/app.js` for interactions and BBCode output.

Custom categories are stored in local storage for the current browser. To clear
them, clear this site's local storage in your browser's developer tools.

## License

This project is available under the non-commercial terms in [LICENSE](LICENSE).
You may use, modify, and share it for non-commercial purposes. Commercial use is
not permitted.
