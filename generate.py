import os
import json
import argparse
import re

# =========================
# CONFIG
# =========================

OUTPUT_DIR = "gear"
BASE_URL = "https://pedalplex.com"

CATEGORY_COLOR_MAP = {
    "distortion": "red",
    "overdrive": "orange",
    "fuzz": "magenta",
    "delay": "blue",
    "reverb": "cyan",
    "chorus": "teal",
    "flanger": "purple",
    "phaser": "green",
    "compressor": "cool-gray",
    "eq": "warm-gray",
    "filter": "yellow",
    "utility": "gray"
}

# =========================
# HELPERS
# =========================

def slugify(text):
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')

def build_tags(brand, category):
    tags_html = []

    # BRAND → sempre purple
    tags_html.append(
        f'<span style="font-size:12px" class="bx--tag bx--tag--purple">{brand}</span>'
    )

    # CATEGORY (multi)
    if category:
        categories = [c.strip().lower() for c in category.split("/")]

        for cat in categories:
            color = CATEGORY_COLOR_MAP.get(cat, "gray")
            tags_html.append(
                f'<span style="font-size:12px" class="bx--tag bx--tag--{color}">{cat}</span>'
            )

    return "\n".join(tags_html)

# =========================
# HTML GENERATOR
# =========================

def generate_html(entry):
    pedal_id = entry["pedalplex_id"]
    brand = entry.get("brand", "")
    category = entry.get("category", "")
    description = entry.get("seo_description", "")
    fxdb_url = entry.get("fxdb_url", "")
    status = entry.get("status", "missing")

    slug = slugify(pedal_id)
    page_url = f"{BASE_URL}/gear/{slug}.html"

    tags_html = build_tags(brand, category)

    fxdb_button = ""
    same_as_json = ""

    if status == "found" and fxdb_url:
        fxdb_button = f"""
<div style="text-align:center;">
<a class="js-openFXDB bx--btn"
   style="background-color:#659BCD!important;color:#ffffff;"
   href="{fxdb_url}"
   target="_blank"
   rel="noopener noreferrer">
Open in FXDB
<img src="../logos/fxdb_icon.png" class="bx--btn__icon" style="width:32px;height:32px;" />
</a>
</div>
"""
        same_as_json = f'"sameAs": "{fxdb_url}",'

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>

<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>

<title>{pedal_id} – Controls, Specs & Pedalboard Builder | PedalPlex</title>

<meta name="description" content="{description}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta name="author" content="PedalPlex">
<meta name="theme-color" content="#0f0f0f">

<meta property="og:type" content="product">
<meta property="og:title" content="{pedal_id}">
<meta property="og:description" content="{description}">
<meta property="og:url" content="{page_url}">
<meta property="og:site_name" content="PedalPlex">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{pedal_id}">
<meta name="twitter:description" content="{description}">

<link rel="canonical" href="{page_url}">
<link rel="icon" href="../logos/pedalplex_logo_gradient.png">

<link rel="dns-prefetch" href="https://1.www.s81c.com">
<link rel="preconnect" href="https://1.www.s81c.com" crossorigin>

<link rel="stylesheet" href="../css/carbon-components.min.css"/>
<link rel="stylesheet" href="../css/style.css"/>

<script src="https://unpkg.com/carbon-components/scripts/carbon-components.min.js"></script>
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>

<script>
window.PEDAL_ID = "{pedal_id}";
window.FXDB_URL = "{fxdb_url if status == "found" else ""}";
</script>

<!-- PRODUCT -->
<script type="application/ld+json">
{{
"@context": "https://schema.org",
"@type": "Product",
"name": "{pedal_id}",
"description": "{description}",
"brand": {{
"@type": "Brand",
"name": "{brand}"
}},
"category": "{category}",
"url": "{page_url}",
{same_as_json}
"offers": {{
"@type": "Offer",
"price": "0",
"priceCurrency": "EUR",
"availability": "https://schema.org/InStock"
}}
}}
</script>

<!-- BREADCRUMB -->
<script type="application/ld+json">
{{
"@context": "https://schema.org",
"@type": "BreadcrumbList",
"itemListElement": [
{{"@type": "ListItem","position": 1,"name": "PedalPlex","item": "https://pedalplex.com"}},
{{"@type": "ListItem","position": 2,"name": "Guitar Pedals","item": "https://pedalplex.com/gears"}},
{{"@type": "ListItem","position": 3,"name": "{pedal_id}","item": "{page_url}"}}
]
}}
</script>

<!-- WEBSITE -->
<script type="application/ld+json">
{{
"@context": "https://schema.org",
"@type": "WebSite",
"name": "PedalPlex",
"url": "https://pedalplex.com",
"potentialAction": {{
"@type": "SearchAction",
"target": "https://pedalplex.com/gears?q={{search_term_string}}",
"query-input": "required name=search_term_string"
}}
}}
</script>

</head>

<body>

<div id="pedalboard-controls" style="display:flex;align-items:center;gap:8px;width:100%;">

<a href="../gears" class="bx--btn bx--btn--tertiary">
Back to Catalog
</a>

<a id="addToRig" href="#" class="bx--btn bx--btn--primary" style="margin-left:auto;">
Add to a Rig
</a>

</div>

<br>

<h1 style="text-align:center;font-size:1.5rem;font-weight:400">
{pedal_id}
</h1>

<br><br>

<h2 style="text-align:center;">Controls & Features</h2>

<div id="pedal-render-wrapper" style="position:relative;min-height:200px;">

<div class="bx--loading-overlay" id="pedalSpinner">
  <div class="bx--loading">
    <svg class="bx--loading__svg" viewBox="-75 -75 150 150">
      <circle class="bx--loading__background" cx="0" cy="0" r="37.5"></circle>
      <circle class="bx--loading__stroke" cx="0" cy="0" r="37.5"></circle>
    </svg>
  </div>
</div>

<div id="results"></div>

</div>

<br><br>

{fxdb_button}

<br><br>

<h2 style="text-align:center;">Description</h2>

<p style="max-width:700px;margin:auto;text-align:center;">
{description}

<br><br>
{tags_html}
</p>

<br>

<div style="text-align:center;">
<a href="{BASE_URL}/view-gear?search={slugify(brand)}" class="bx--btn bx--btn--secondary">
View more {brand} pedals
</a>
</div>

<script src="../helpers.js"></script>
<script src="../utils.js"></script>
<script src="../subplexes.js"></script>
<script src="../gears.js"></script>
<script src="../fullscreen-menu.js"></script>
<script src="../add-to-rig.js"></script>
<script src="../nav-view.js"></script>
<script src="../view.js"></script>
<script src="../edit-handler.js"></script>

<script>
// Spinner OFF quando il pedale è pronto
document.addEventListener("DOMContentLoaded", function () {{
  const observer = new MutationObserver(() => {{
    const results = document.getElementById("results");
    if (results && results.children.length > 0) {{
      const spinner = document.getElementById("pedalSpinner");
      if (spinner) spinner.style.display = "none";
      observer.disconnect();
    }}
  }});

  observer.observe(document.getElementById("results"), {{ childList: true }});
}});
</script>

<nav style="display:none">
<a href="https://pedalplex.com/gears">Guitar Pedal Catalog</a>
<a href="https://pedalplex.com/rigs">Pedalboard Builder</a>
</nav>

</body>
</html>
"""
    return html

# =========================
# MAIN
# =========================

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, help="Limit number of pedals")
    parser.add_argument("--overwrite", action="store_true")

    args = parser.parse_args()

    with open("mapping.json") as f:
        data = json.load(f)

    if args.limit:
        data = data[:args.limit]

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    for entry in data:
        slug = slugify(entry["pedalplex_id"])
        filepath = os.path.join(OUTPUT_DIR, f"{slug}.html")

        if os.path.exists(filepath) and not args.overwrite:
            print(f"Skipping {slug}")
            continue

        html = generate_html(entry)

        with open(filepath, "w", encoding="utf-8") as f:
            f.write(html)

        print(f"Generated {filepath}")

if __name__ == "__main__":
    main()