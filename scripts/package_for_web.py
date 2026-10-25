from __future__ import annotations

import shutil
from pathlib import Path

ROOT = Path(r"C:\Users\User\Desktop\TP")
OUTPUTS = ROOT / "outputs"
DOCS = ROOT / "docs"

def package_web():
    """Packages all HTML web dashboard files and weekly assets into a clean docs/ folder for GitHub Pages / Netlify deployment."""
    DOCS.mkdir(parents=True, exist_ok=True)

    # Copy index.html -> docs/index.html
    if (OUTPUTS / "index.html").exists():
        shutil.copy2(OUTPUTS / "index.html", DOCS / "index.html")

    # Copy weekly_articles.html -> docs/weekly_articles.html
    if (OUTPUTS / "weekly_articles.html").exists():
        shutil.copy2(OUTPUTS / "weekly_articles.html", DOCS / "weekly_articles.html")

    # Copy the offline SVG review chart asset.
    if (OUTPUTS / "weekly-review.js").exists():
        shutil.copy2(OUTPUTS / "weekly-review.js", DOCS / "weekly-review.js")

    # Copy weekly folder
    if (OUTPUTS / "weekly").exists():
        shutil.copytree(OUTPUTS / "weekly", DOCS / "weekly", dirs_exist_ok=True)

    predictor_src = Path(r"C:\Users\User\tri-race-predictor\static")
    if predictor_src.exists():
        shutil.copytree(predictor_src, OUTPUTS / "predictor", dirs_exist_ok=True)
        shutil.copytree(predictor_src, DOCS / "predictor", dirs_exist_ok=True)
        print("Tri Race Predictor copied into:", DOCS / "predictor")

    print("Web site successfully packaged into deployment folder:", DOCS)

if __name__ == "__main__":
    package_web()
