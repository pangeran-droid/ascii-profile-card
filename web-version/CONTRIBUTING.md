# Contributing

Thanks for wanting to contribute to **ASCII Profile Card**! There are two very different ways to
contribute, depending on what you want to do:

- **Improving the generator itself** (bug fixes, new features, better ASCII rendering, etc.) — see
  [Contributing code](#contributing-code) below.
- **Showing off a card you made with this template** — you don't need to touch any code, just add
  yourself to the [gallery](GALLERY.md). See [Adding your card to the gallery](#adding-your-card-to-the-gallery).

## Adding your card to the gallery

This repo is a *template* — most people who use it fork or copy it into their own `username/username`
repo rather than contributing directly here. If you've set up your own animated ASCII card and want
to show it off:

1. Fork **this** repo (`ascii-profile-card`, not your personal copy).
2. Open [`GALLERY.md`](GALLERY.md) and add a new row to the table with:
   - A link to your GitHub profile.
   - A `raw.githubusercontent.com` link to your generated `profile.svg`.
3. Open a pull request titled `gallery: add @yourname`.

Keep the entry to one row — no extra commentary, badges, or promotional text in the table itself.

## Contributing code

1. Fork and clone the repo.
2. Create a branch: `git checkout -b fix/short-description`.
3. Make your changes in `scripts/generate_card.py` (or the workflow file, if relevant).
4. Test locally before opening a PR:

   ```bash
   pip install pillow requests numpy
   export GITHUB_LOGIN="your-username"
   export GITHUB_TOKEN="ghp_xxxxxxxxxxxx"   # optional, enables live stats
   python scripts/generate_card.py
   ```

   Open the generated `assets/profile.svg` in a browser to confirm it renders and animates correctly.
5. Keep changes focused — one feature/fix per PR makes review much faster.
6. If you change a configurable value (color, timing, field, etc.), update the relevant table in
   `README.md` so the docs stay accurate.
7. Open a PR with a short description of *what* changed and *why*.

### Style notes

- Keep the script dependency-free beyond `pillow`, `requests`, and `numpy`.
- No JavaScript in the generated SVG — animations must stay pure CSS `@keyframes`, since GitHub's
  README sandbox strips `<script>` tags.
- Prefer editing the tunable variables at the top of `generate_card.py` over hardcoding new magic
  numbers deeper in the script.

## Reporting issues

Open a GitHub issue with:

- What you expected to happen.
- What actually happened (include the generated SVG or a screenshot if it's a rendering issue).
- Your Python version and OS, if it's a local run failing.

## License

By contributing, you agree your contributions are licensed under the same MIT license as the rest of
the repo.
