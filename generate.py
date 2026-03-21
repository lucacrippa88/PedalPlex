import json
import os
import re
from datetime import datetime

BASE_URL = "https://pedalplex.com"
OUTPUT_DIR = "gear"
MAPPING_FILE = "mapping.json"

LIMIT = 1
OVERWRITE = True

os.makedirs(OUTPUT_DIR, exist_ok=True)

CATEGORY_COLOR_MAP = {
    "distortion": "black",
    "fuzz": "gray",
    "overdrive": "orange",
    "delay": "purple",
    "reverb": "blue",
    "chorus": "cyan",
    "phaser": "teal",
    "flanger": "magenta",
    "compressor": "green",
    "boost": "yellow",
    "eq": "cool-gray",
    "filter": "warm-gray",
    "tremolo": "cyan",
    "vibrato": "green",
    "looper": "red"
}

def shorten_description(text, length=155):
    if len(text) <= length:
        return text
    return text[:length].rsplit(" ", 1)[0] + "..."

def build_brand_tag(brand):
    if not brand:
        return ""
    return f'<span style="font-size:12px" class="bx--tag bx--tag--purple">{brand}</span>'

def build_category_tags(category_raw):
    if not category_raw:
        return ""

    categories = [c.strip().lower() for c in category_raw.split("/")]
    tags = []

    for cat in categories:
        color = CATEGORY_COLOR_MAP.get(cat, "gray")
        tags.append(f'<span style="font-size:12px" class="bx--tag bx--tag--{color}">{cat}</span>')

    return "\n".join(tags)

with open(MAPPING_FILE, encoding="utf-8") as f:
    pedals = json.load(f)

if LIMIT:
    pedals = pedals[:LIMIT]

created = 0
skipped = 0
sitemap_urls = []

for pedal in pedals:

    name = pedal["pedalplex_id"]
    slug = pedal["pedalplex_url"].split("/")[-1]

    description_full = pedal.get("seo_description", "")
    description_short = shorten_description(description_full)

    brand = pedal.get("brand", "")
    category = pedal.get("category", "")

    brand_tag = build_brand_tag(brand)
    category_tags = build_category_tags(category)

    status = pedal.get("status")
    fxdb = pedal.get("fxdb_url")

    url = f"{BASE_URL}/gear/{slug}.html"
    sitemap_urls.append(url)

    output_file = os.path.join(OUTPUT_DIR, f"{slug}.html")

    if os.path.exists(output_file) and not OVERWRITE:
        skipped += 1
        continue

    # FXDB
    if status == "found" and fxdb:

        fxdb_button = f"""
<div style="text-align:center;">
<a class="js-openFXDB bx--btn" 
   style="background-color: #659BCD!important; color: #ffffff;"
   href="{fxdb}" target="_blank" rel="noopener noreferrer">
  Open in FXDB
  <img src="../logos/fxdb_icon.png"
       class="bx--btn__icon"
       style="width:32px;height:32px;object-fit:contain;" />
</a>
</div>
"""
        fxdb_script = f'window.FXDB_URL = "{fxdb}";'
        sameas = f'"sameAs": "{fxdb}",'

    else:
        fxdb_button = ""
        fxdb_script = ""
        sameas = ""

    # BRAND LINK BUTTON
    brand_link = f"{BASE_URL}/view-gear?search={brand}"

    brand_button = f"""
<div style="text-align:center;margin-top:20px;">
<a href="{brand_link}" class="bx--btn bx--btn--secondary">
View all {brand} pedals
</a>
</div>
"""

    html = f"""<!DOCTYPE html>
<html lang="en">

<head>

<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>

<title>{name} – Controls, Specs & Pedalboard Builder | PedalPlex</title>

<meta name="description" content="{description_short}">
<meta name="robots" content="index,follow,max-image-preview:large">

<meta property="og:type" content="product">
<meta property="og:title" content="{name}">
<meta property="og:description" content="{description_short}">
<meta property="og:url" content="{url}">
<meta property="og:site_name" content="PedalPlex">

<link rel="canonical" href="{url}">
<link rel="icon" href="../logos/pedalplex_logo_gradient.png">

<link rel="stylesheet" href="../css/carbon-components.min.css"/>
<script src="https://unpkg.com/carbon-components/scripts/carbon-components.min.js"></script>
<link rel="stylesheet" href="../css/style.css"/>

<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>

<script>
window.PEDAL_ID = "{name}";
{fxdb_script}
window.SUBPLEX_EDIT_MODE = false;
</script>

<script type="application/ld+json">
{{
"@context": "https://schema.org",
"@type": "Product",
"name": "{name}",
"description": "{description_short}",
"brand": {{
"@type": "Brand",
"name": "{brand}"
}},
"category": "{category}",
"url": "{url}",
{sameas}
"offers": {{
  "@type": "Offer",
  "price": "0",
  "priceCurrency": "EUR",
  "availability": "https://schema.org/InStock",
  "url": "{url}"
}},
"isRelatedTo": {{
"@type": "SoftwareApplication",
"name": "PedalPlex",
"url": "{BASE_URL}"
}}
}}
</script>

</head>

<body>

<div class="bx--loading-overlay" id="loadingSpinner">
  <div class="bx--loading"></div>
</div>

<div id="catalog" style="display:none;">
<div class="gear-item" data-id="{name}"></div>
</div>

<!-- ✅ ORA VISIBILE SERVER-SIDE -->
<div id="page-content">

<h1 style="text-align:center;">{name}</h1>

<h2 style="text-align:center;">Controls & Features</h2>

<div id="preset"></div>
<div id="results"></div>

<br>

{fxdb_button}

<h2 style="text-align:center;">Description</h2>

<p style="max-width:700px;margin:auto;text-align:center;">
{description_full}

<br><br>
{brand_tag}
{category_tags}
</p>

{brand_button}

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
$(document).ready(function () {{

$('#loadingSpinner').hide();

}});
</script>

</body>
</html>
"""

    with open(output_file, "w", encoding="utf-8") as f:
        f.write(html)

    created += 1
    print("Created:", slug)

# SITEMAP
today = datetime.utcnow().strftime("%Y-%m-%d")

sitemap = """<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
"""

for url in sitemap_urls:
    sitemap += f"""
<url>
<loc>{url}</loc>
<lastmod>{today}</lastmod>
</url>
"""

sitemap += "\n</urlset>"

with open("sitemap.xml", "w", encoding="utf-8") as f:
    f.write(sitemap)

print("\nDone")