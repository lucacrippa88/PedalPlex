import json
import os
from datetime import datetime

BASE_URL = "https://pedalplex.com"
OUTPUT_DIR = "gear"
MAPPING_FILE = "mapping.json"

os.makedirs(OUTPUT_DIR, exist_ok=True)

with open(MAPPING_FILE, encoding="utf-8") as f:
    pedals = json.load(f)

TEMPLATE = """<!DOCTYPE html>
<html lang="en">

<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>

<title>{name} Pedal – Controls, Specs & Rig Builder | PedalPlex</title>

<meta name="description" content="{description}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta name="author" content="PedalPlex">
<meta name="theme-color" content="#0f0f0f">

<meta property="og:type" content="product">
<meta property="og:title" content="{name}">
<meta property="og:description" content="{description}">
<meta property="og:url" content="{url}">
<meta property="og:site_name" content="PedalPlex">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{name}">
<meta name="twitter:description" content="{description}">

<link rel="canonical" href="{url}">
<link rel="icon" href="../logos/pedalplex_logo_gradient.png" type="image/x-icon">

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

</head>

<body>

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
{description}
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

$('#page-content').show();

window.currentUser = Object.assign({{ role }}, userInfo);

if (typeof initNavCatalog === 'function')
initNavCatalog(role);

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
<a href="https://pedalplex.com/gears">Guitar Pedal Catalog</a>
<a href="https://pedalplex.com/rigs">Pedalboard Builder</a>
</nav>

</body>
</html>
"""

created = 0
skipped = 0
sitemap_urls = []

for pedal in pedals:

    name = pedal["pedalplex_id"]
    slug = pedal["pedalplex_url"].split("/")[-1]
    description = pedal.get("seo_description", "")

    status = pedal.get("status")
    fxdb = pedal.get("fxdb_url")

    url = f"{BASE_URL}/gear/{slug}.html"
    sitemap_urls.append(url)

    output_path = os.path.join(OUTPUT_DIR, f"{slug}.html")

    if os.path.exists(output_path):
        skipped += 1
        continue

    if status == "found" and fxdb:

        fxdb_button = f'''
<a class="js-openFXDB bx--btn bx--btn--danger"
href="{fxdb}" target="_blank" rel="noopener noreferrer">
Open in FXDB
</a>
'''

        fxdb_script = f'window.FXDB_URL = "{fxdb}";'

    else:
        fxdb_button = ""
        fxdb_script = ""

    html = TEMPLATE.format(
        name=name,
        description=description,
        url=url,
        fxdb_button=fxdb_button,
        fxdb_script=fxdb_script
    )

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html)

    created += 1
    print("Created:", slug)

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

with open("sitemap.xml", "w", encoding="utf-8") as f:
    f.write(sitemap)

print("\n-------------")
print("Pedals:", len(pedals))
print("Pages created:", created)
print("Pages skipped:", skipped)
print("Sitemap URLs:", len(sitemap_urls))
print("-------------")