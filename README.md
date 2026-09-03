<h1 align="center">ASCII Profile Card</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.12+-5dc9f2?style=flat-square&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/github/actions/workflow/status/pangeran-droid/ascii-profile-card/generate-card.yml?style=flat-square&label=build&logo=github" alt="Build">
  <img src="https://img.shields.io/github/license/pangeran-droid/ascii-profile-card?style=flat-square&color=e8384f" alt="License">
</p>

<p align="center">A Kali-Linux-terminal-styled Neofetch profile card generator for your GitHub README. It converts your
avatar into ASCII art (or falls back to a procedural dragon motif if you don't provide one), animates
a typing prompt, and pulls in live GitHub stats — all rendered as a single self-contained SVG.</p>

![Example card](https://raw.githubusercontent.com/pangeran-droid/ascii-profile-card/refs/heads/main/assets/profile.svg)

<details>
<summary>ascii-profile-card v2</summary>
<br>

<img src="assets/profile_v2.svg" alt="Example card V2">

</details>

## Quick start

This repo is a **template**, not a published Action — you fork/copy it, edit a few values, and let
the included workflow keep the card fresh.

1. Click **"Use this template"** (or fork this repo).
2. If you want this to appear on your GitHub profile page, rename the repo to match your username
   exactly (e.g. `yourname/yourname`).
3. Replace `assets/avatar.jpg` with your own photo (`.jpg` / `.png`).
4. Open `scripts/generate_card.py` and edit `PROFILE_FIELDS` with your own info:

   ```python
   PROFILE_FIELDS = [
       ("Role", "informatics student"),
       ("Focus", "junior web developer & cybersecurity enthusiast"),
       ("Stack.Frontend", "html, css, javascript"),
       ("Stack.Backend", "php, laravel, codeigniter"),
       ("Contact.GitHub", f"github.com/{LOGIN}"),
       ("Contact.Telegram", "t.me/yourhandle"),
       # add / remove / reorder rows as you like — each tuple is (label, value)
   ]
   ```

5. Open `.github/workflows/generate-card.yml` and update `GITHUB_LOGIN` to your username — it's the
   only line you need to touch:

   ```yaml
   env:
     GITHUB_LOGIN: yourname          # <- change this to your username
     GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
     OUT_PATH: assets/profile.svg
   ```

   See [Workflow](#workflow) below for the full file and what each trigger does.

6. Push to `main`. The workflow generates `assets/profile.svg` and commits it back automatically.
7. Embed it in your profile README:

   ```md
   <p align="center">
   <img src="https://raw.githubusercontent.com/yourname/yourname/refs/heads/main/assets/profile.svg" alt="animated ascii profile card" width="100%" />
   </p>
   ```

   > Use `raw.githubusercontent.com`, not a `github.com/.../blob/...` link — the latter is an HTML
   > page and won't render inside an `<img>` tag.

The scheduled run refreshes live stats and re-renders the card once a day. No extra secrets are
needed — the workflow uses the repo's default `GITHUB_TOKEN`.

## How it works

`scripts/generate_card.py` does the whole pipeline in one pass:

1. Loads `assets/avatar.*` (via `Pillow`), crops it square, and downsamples it into a shaded ASCII
   grid using a fixed character ramp — or generates a procedural dragon silhouette if no avatar is
   found.
2. Fetches live stats (repos, stars, followers, top languages) from the GitHub REST API via
   `requests`, when `GITHUB_TOKEN` is set.
3. Builds a single SVG: terminal window chrome (title bar, traffic-light dots), the ASCII art, a
   Kali-style `login@github` header, a field list, a color swatch strip, and an animated typing
   prompt — all pure CSS `@keyframes`, no JavaScript.
4. Writes the result to `OUT_PATH` (default `assets/profile.svg`).

## Workflow

`.github/workflows/generate-card.yml` ships in this template and runs on three triggers:

| Trigger | When |
| --- | --- |
| `schedule` | Every day at 00:00 UTC, to refresh live stats and re-render the card |
| `push` to `main` | On every push, except changes to `assets/profile.svg` itself (`paths-ignore`) — this prevents the commit-back step from triggering an infinite loop |
| `workflow_dispatch` | Manually, from the **Actions** tab |

It needs `contents: write` permission so it can commit the regenerated SVG back to the repo using the
default `secrets.GITHUB_TOKEN` — no extra token setup required. `timeout-minutes: 20` caps a stuck run.

<details>
<summary>Full workflow file</summary>

```yaml
name: Generate animated ascii profile card

on:
  # run automatically every 24 hours
  schedule:
    - cron: "0 0 * * *"

  # allows to manually run the job at any time
  workflow_dispatch:

  # run on every push on the main branch
  push:
    branches:
      - main

    paths-ignore:
      - 'assets/profile.svg'

permissions:
  contents: write

jobs:
  generate:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - name: Install dependencies
        run: pip install pillow requests numpy
      - name: Generate animated ASCII profile card
        env:
          GITHUB_LOGIN: yourname          # <- change this to your username
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          OUT_PATH: assets/profile.svg
        run: python scripts/generate_card.py
      - name: Commit and push if changed
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add assets/profile.svg
          git diff --staged --quiet || git commit -m "chore: refresh ascii profile card"
          git push
```

</details>

## Configuration

Everything is a plain Python value at the top of `scripts/generate_card.py` — no separate config
file. The most commonly edited ones:

**Prompt commands** — what "types" itself out in the terminal prompt:

```python
PROMPT_COMMANDS = [
    "informatics student",
    "junior web developer",
    "cybersecurity enthusiast",
]
```

**Colors** — swap these to re-theme the card away from the default Kali red/cyan/navy palette:

```python
BG_COLOR = "#0b1120"          # terminal window background
TITLEBAR_COLOR = "#141c30"    # title bar strip
ACCENT = "#5dc9f2"             # ASCII art color
HEADER_COLOR = "#e8384f"       # "login@github" header + prompt text
LABEL_COLOR = "#ffffff"        # bold field labels (e.g. "Role:")
VALUE_COLOR = "#5dc9f2"        # field values (e.g. "informatics student")
PALETTE = ["#0b1120", "#e8384f", "#3ddc84", "#ffd166", "#4d8cff",
           "#b16cff", "#39e0d0", "#e8e8e8"]   # swatch strip at the bottom
```

**ASCII art size and animation speed:**

```python
ART_COLS = 34                  # width of the ASCII art, in characters

PROMPT_TYPE_SPEED = 0.08       # seconds per character while typing
PROMPT_DELETE_SPEED = 0.045    # seconds per character while deleting
PROMPT_HOLD_TIME = 1.1         # pause after a command finishes typing
PROMPT_GAP_TIME = 0.4          # pause before the next command starts
```

Full reference of every tunable value:

| What to change | Variable |
| --- | --- |
| Info field labels/values | `PROFILE_FIELDS` |
| Commands typed in the prompt | `PROMPT_COMMANDS` |
| Terminal background color | `BG_COLOR` |
| Header / prompt color | `HEADER_COLOR` |
| ASCII art color | `ACCENT` |
| Field value color | `VALUE_COLOR` |
| Swatch strip colors | `PALETTE` |
| ASCII art width (columns) | `ART_COLS` |
| Typing / deleting speed | `PROMPT_TYPE_SPEED`, `PROMPT_DELETE_SPEED` |

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `GITHUB_LOGIN` | Yes | GitHub username shown in the header and used to fetch stats |
| `GITHUB_TOKEN` | Recommended | Without it, GitHub stats fall back to `N/A` |
| `AVATAR_PATH` | No | Explicit path to an avatar image; otherwise auto-detects `assets/avatar.*` |
| `OUT_PATH` | No | Output SVG path (default: `assets/profile.svg`) |

## Development

Requirements:

- Python 3.12+
- `pillow`, `requests`, `numpy`

```bash
pip install pillow requests numpy

export GITHUB_LOGIN="your-username"
export GITHUB_TOKEN="ghp_xxxxxxxxxxxx"   # optional, enables live stats
export AVATAR_PATH="assets/avatar.jpg"   # optional
export OUT_PATH="assets/profile.svg"

python scripts/generate_card.py
```

Without `AVATAR_PATH` / `GITHUB_TOKEN`, the script still runs — it just uses the default dragon motif
and reports stats as `N/A`.

## Repository structure

```
.
├── LICENSE
├── README.md
├── assets/
│   ├── avatar.jpg              # your photo (optional)
│   └── profile.svg             # generated output, auto-updated
├── scripts/
│   └── generate_card.py        # generator script
└── .github/
    └── workflows/
        └── generate-card.yml   # daily/on-push workflow
```

## Showcase

Made something cool with this template? Add yourself to the [gallery](GALLERY.md) — see
[CONTRIBUTING.md](CONTRIBUTING.md) for how.

## License

MIT — use, modify, and share freely. A credit back to this repo is appreciated but not required.
