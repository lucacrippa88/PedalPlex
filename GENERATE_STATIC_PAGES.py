import json
import os
import re
from datetime import datetime

BASE_URL = "https://pedalplex.com"
OUTPUT_DIR = "gear"
MAPPING_FILE = "mapping.json"

# --- Limite per test (None = tutti, oppure un numero intero) ---
LIMIT = None  # prova con 10 pedali, poi metti None per tutti

# --- Flag interno per sovrascrivere file esistenti ---
OVERWRITE = True  # se False, salta i file già esistenti

os.makedirs(OUTPUT_DIR, exist_ok=True)

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

def shorten_description(text, length=155):
    if len(text) <= length:
        return text
    return text[:length].rsplit(" ",1)[0] + "..."

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
    description_full = pedal.get("seo_description","")
    description_short = shorten_description(description_full)

    brand = pedal.get("brand","")
    category = pedal.get("category","guitar effects pedal")

    status = pedal.get("status")
    fxdb = pedal.get("fxdb_url")

    url = f"{BASE_URL}/gear/{slug}.html"
    sitemap_urls.append(url)

    output_file = os.path.join(OUTPUT_DIR, f"{slug}.html")

    if os.path.exists(output_file) and not OVERWRITE:
        skipped += 1
        continue

    if status == "found" and fxdb:

        fxdb_button = f"""
<a class="js-openFXDB bx--btn bx--btn--danger"
href="{fxdb}" target="_blank" rel="noopener noreferrer">
Open in FXDB
</a>
"""

        fxdb_script = f'window.FXDB_URL = "{fxdb}";'

        sameas = f'"sameAs": "{fxdb}",'

    else:

        fxdb_button = ""
        fxdb_script = ""
        sameas = ""

    html = f"""<!DOCTYPE html>
<html lang="en">

<head>

<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>

<title>{name} – Controls, Specs & Pedalboard Builder | PedalPlex</title>

<meta name="description" content="{description_short}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta name="author" content="PedalPlex">
<meta name="theme-color" content="#0f0f0f">

<meta property="og:type" content="product">
<meta property="og:title" content="{name}">
<meta property="og:description" content="{description_short}">
<meta property="og:url" content="{url}">
<meta property="og:site_name" content="PedalPlex">
<meta property="og:image" content="{BASE_URL}/img/pedals/{slug}.jpg">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{name}">
<meta name="twitter:description" content="{description_short}">
<meta name="twitter:image" content="{BASE_URL}/img/pedals/{slug}.jpg">

<link rel="canonical" href="{url}">
<link rel="icon" href="../logos/pedalplex_logo_gradient.png">

<link rel="dns-prefetch" href="https://1.www.s81c.com">
<link rel="preconnect" href="https://1.www.s81c.com" crossorigin>

<link rel="stylesheet" href="../css/carbon-components.min.css"/>
<script src="https://unpkg.com/carbon-components/scripts/carbon-components.min.js"></script>

<link rel="stylesheet" href="../css/style.css"/>

<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>

<script>
window.PEDAL_ID = "{name}";
{fxdb_script}
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
"isRelatedTo": {{
"@type": "SoftwareApplication",
"name": "PedalPlex",
"applicationCategory": "MusicApplication",
"url": "{BASE_URL}"
}}
}}
</script>

<script type="application/ld+json">
{{
"@context": "https://schema.org",
"@type": "BreadcrumbList",
"itemListElement": [
{{
"@type": "ListItem",
"position": 1,
"name": "PedalPlex",
"item": "{BASE_URL}"
}},
{{
"@type": "ListItem",
"position": 2,
"name": "Guitar Pedals",
"item": "{BASE_URL}/gears"
}},
{{
"@type": "ListItem",
"position": 3,
"name": "{name}",
"item": "{url}"
}}
]
}}
</script>

<script type="application/ld+json">
{{
"@context": "https://schema.org",
"@type": "WebSite",
"name": "PedalPlex",
"url": "{BASE_URL}",
"potentialAction": {{
"@type": "SearchAction",
"target": "{BASE_URL}/gears?q={{search_term_string}}",
"query-input": "required name=search_term_string"
}}
}}
</script>

</head>

<body>

<!-- SPINNER DI CARICAMENTO -->
<div id="loadingSpinner" class="bx--inline-loading" data-active>
  <svg class="bx--inline-loading__svg" viewBox="0 0 10 10">
    <circle class="bx--inline-loading__background" cx="5" cy="5" r="5"></circle>
    <circle class="bx--inline-loading__stroke" cx="5" cy="5" r="5"></circle>
  </svg>
  <span class="bx--inline-loading__text">Loading pedal...</span>
</div>

<div id="catalog" style="display:none;">
<div class="gear-item" data-id="{name}"></div>
</div>

<div id="page-content" style="display:none;">

<div id="pedalboard-controls" style="display:flex;align-items:center;gap:8px;width:100%;">

<a id="backToCatalog" href="../gears" class="bx--btn bx--btn--tertiary">
Back to Catalog
</a>

<a id="addToRig" href="#" class="bx--btn bx--btn--primary"
style="margin-left:auto!important;display:block;">
Add to a Rig
</a>

{fxdb_button}

</div>

<br>

<h1 id="gearName" style="text-align:center;font-size:1.5rem;font-weight:400">
{name}
</h1>

<br><br>

<div id="preset"></div>
<div id="results"></div>

<br><br>

<p style="max-width:700px;margin:auto;text-align:center;">
{description_full}
</p>

<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
<script src="../helpers.js"></script>
<script src="../utils.js"></script>
<script src="../subplexes.js"></script>
<script src="../gears.js"></script>
<script src="../fullscreen-menu.js"></script>
<script src="../add-to-rig.js"></script>
<script src="../nav-view.js"></script>
<script src="../view.js"></script>
<script src="../edit-handler.js"></script>

</div>

<script>

$(document).ready(function () {{

const token = localStorage.getItem('authToken');

function startAppAs(role, userInfo = {{}}) {{

window.currentUser = Object.assign({{ role }}, userInfo);

if (typeof initNavCatalog === 'function')
initNavCatalog(role);

$('#loadingSpinner').hide();  // hide spinner
$('#page-content').show();

}}

if (!token) {{
startAppAs('guest');
return;
}}

$.ajax({{

url: 'https://api.pedalplex.com/USER_CHECK_AUTH_JWT.php',
method: 'GET',
dataType: 'json',
headers: {{ 'Authorization': 'Bearer ' + token }},

success: function (userFromServer) {{
startAppAs(userFromServer.role, userFromServer);
}},

error: function () {{
localStorage.removeItem('authToken');
startAppAs('guest');
}}

}});

}});
</script>

<nav style="display:none">
<a href="{BASE_URL}/gears">Guitar Pedal Catalog</a>
<a href="{BASE_URL}/rigs">Pedalboard Builder</a>
</nav>

</body>
</html>
"""

    with open(output_file,"w",encoding="utf-8") as f:
        f.write(html)

    created += 1
    print("Created:",slug)

today = datetime.utcnow().strftime("%Y-%m-%d")

sitemap = """<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
"""

for url in sitemap_urls:

    sitemap += f"""
<url>
<loc>{url}</loc>
<lastmod>{today}</lastmod>
<changefreq>monthly</changefreq>
<priority>0.8</priority>
</url>
"""

sitemap += "\n</urlset>"

with open("sitemap.xml","w",encoding="utf-8") as f:
    f.write(sitemap)

print("\n-------------------")
print("Pedals:",len(pedals))
print("Pages created:",created)
print("Pages skipped:",skipped)
print("Sitemap URLs:",len(sitemap_urls))
print("-------------------")