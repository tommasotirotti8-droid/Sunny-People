#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SUNNY PEOPLE — GENERATORE DEL "TELAIO" DEL SITO
===============================================

Copia header, footer e meta tag (canonical, Open Graph, Twitter, favicon,
dati strutturati) dentro ogni pagina, e riscrive robots.txt e sitemap.xml.

Serve a non avere lo stesso menu copiato a mano in 4 file diversi:
si modifica  partials/header.html  o  partials/footer.html  una volta sola,
poi si lancia:

    python3 tools/build.py

Le pagine restano HTML statico normale: nessun JavaScript o server
necessario per vederle. Il file va rilanciato solo dopo aver cambiato
i partial o il dominio qui sotto.

COME AGGIUNGERE UNA PAGINA
--------------------------
1. nel <head> metti i due marker:

       <!--#META#-->
       <!--/#META#-->

2. nel <body> metti i marker di header e footer:

       <header><!--#HEADER#--><!--/#HEADER#--></header>
       <footer><!--#FOOTER#--><!--/#FOOTER#--></footer>

3. aggiungi il file all'elenco PAGES qui sotto e rilancia lo script.
"""

import json
import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# ---------------------------------------------------------------------------
# DATI DEL SITO — questo è l'unico punto da modificare
# ---------------------------------------------------------------------------

# TODO: metti qui il tuo dominio definitivo (senza slash finale).
# Da questo valore dipendono canonical, Open Graph, robots.txt e sitemap.
DOMAIN = "https://www.sunnypeopleevents.com"

SITE_NAME = "Sunny People"
SITE_TAGLINE = "Where vibes meet people."
CONTACT_EMAIL = "info@sunnypeopleevents.com"

SOCIAL_LINKS = [
    "https://www.instagram.com/sunnypeople.events/",
    "https://www.tiktok.com/@sunny.people.events",
]

OG_IMAGE = "/images/og-image.jpg"
OG_IMAGE_WIDTH = 1200
OG_IMAGE_HEIGHT = 630

# Merch: alimenta i dati strutturati Product della pagina merch.html
PRODUCTS = [
    {
        "name": "Sunny Club T-shirt",
        "alternate": "The classic.",
        "color": "Black",
        "image": "/images/sunny-club-front.png",
        "description": "Black oversized T-shirt with the Sunny People signature graphics.",
    },
    {
        "name": "Cool Kids T-shirt",
        "alternate": "For the ones who get it.",
        "color": "Cream",
        "image": "/images/cool-kids-front.png",
        "description": "Cream oversized T-shirt made for good nights, good people and good chaos.",
    },
]

# Evento: Google mostra il risultato arricchito solo con data e luogo.
# Finché date e location sul sito sono "COMING SOON" questi campi restano
# vuoti e la pagina NON dichiara un Event (uno schema incompleto viene
# segnalato come errore dalla Search Console). Appena le annunci:
#   EVENT_START = "2026-07-11T22:00:00+02:00"
#   EVENT_END   = "2026-07-12T04:00:00+02:00"
#   EVENT_PLACE = "Milano, Italia"
#   EVENT_VENUE = "Nome della location"
# e rilancia  python3 tools/build.py
EVENT_START = ""
EVENT_END = ""
EVENT_PLACE = ""
EVENT_VENUE = ""

# file, percorso pubblico, voce di menu attiva, in sitemap, priorità sitemap
PAGES = [
    ("index.html", "/", "home", True, "1.0"),
    ("merch.html", "/merch.html", "merch", True, "0.8"),
    ("event.html", "/event.html", "events", True, "0.9"),
    ("collab.html", "/collab.html", "collab", True, "0.7"),
    ("privacy.html", "/privacy.html", None, True, "0.3"),
    ("404.html", "/404.html", None, False, "0.0"),
]

LOCALES = {"it": "it_IT", "en": "en_US"}

# ---------------------------------------------------------------------------


def read_partial(name):
    path = ROOT / "partials" / name
    if not path.exists():
        sys.exit("ERRORE: manca %s" % path)
    return path.read_text(encoding="utf-8").strip()


def fill_region(html, name, payload):
    """Sostituisce quello che sta tra <!--#NAME#--> e <!--/#NAME#-->."""
    pattern = re.compile(
        r"(<!--#%s#-->)(.*?)(<!--/#%s#-->)" % (name, name),
        re.S,
    )
    if not pattern.search(html):
        sys.exit("ERRORE: mancano i marker %s nella pagina" % name)
    return pattern.sub(lambda m: m.group(1) + "\n" + payload + "\n" + m.group(3), html)


def page_title(html):
    match = re.search(r"<title>\s*(.+?)\s*</title>", html, re.S)
    return match.group(1).strip() if match else SITE_NAME


def page_description(html):
    match = re.search(
        r'<meta\s+name="description"\s+content="(.*?)"', html, re.S
    )
    return re.sub(r"\s+", " ", match.group(1)).strip() if match else SITE_TAGLINE


def page_lang(html):
    match = re.search(r'<html[^>]*lang="([a-zA-Z-]+)"', html)
    return match.group(1).lower() if match else "en"


def absolute(path):
    return DOMAIN.rstrip("/") + path


def meta_block(title, description, path, lang, noindex, extra):
    url = absolute(path)
    locale = LOCALES.get(lang.split("-")[0], "en_US")
    image = absolute(OG_IMAGE)

    lines = [
        '<link rel="canonical" href="%s">' % url,
        "",
        '<link rel="icon" href="/favicon.ico" sizes="any">',
        '<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png">',
        '<link rel="icon" type="image/png" sizes="96x96" href="/favicon-96.png">',
        '<link rel="icon" type="image/png" sizes="144x144" href="/favicon-144.png">',
        '<link rel="icon" type="image/png" sizes="192x192" href="/favicon-192.png">',
        '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">',
        '<meta name="theme-color" content="#FFF8EF">',
        "",
        '<meta property="og:type" content="website">',
        '<meta property="og:site_name" content="%s">' % SITE_NAME,
        '<meta property="og:locale" content="%s">' % locale,
        '<meta property="og:title" content="%s">' % title,
        '<meta property="og:description" content="%s">' % description,
        '<meta property="og:url" content="%s">' % url,
        '<meta property="og:image" content="%s">' % image,
        '<meta property="og:image:width" content="%d">' % OG_IMAGE_WIDTH,
        '<meta property="og:image:height" content="%d">' % OG_IMAGE_HEIGHT,
        '<meta property="og:image:alt" content="%s — %s">' % (SITE_NAME, SITE_TAGLINE),
        "",
        '<meta name="twitter:card" content="summary_large_image">',
        '<meta name="twitter:title" content="%s">' % title,
        '<meta name="twitter:description" content="%s">' % description,
        '<meta name="twitter:image" content="%s">' % image,
    ]

    if noindex:
        lines.insert(0, '<meta name="robots" content="noindex, follow">')
        lines.insert(1, "")

    lines.append("")
    lines.append(structured_data(lang, path, title, noindex, extra))

    return "\n".join(lines).strip()


def extra_nodes(path):
    """Dati strutturati specifici di una pagina (Product, Event)."""
    nodes = []

    if path == "/merch.html":
        items = []
        for index, product in enumerate(PRODUCTS, start=1):
            items.append(
                {
                    "@type": "ListItem",
                    "position": index,
                    "item": {
                        "@type": "Product",
                        "name": product["name"],
                        "alternateName": product["alternate"],
                        "description": product["description"],
                        "image": absolute(product["image"]),
                        "color": product["color"],
                        "brand": {"@type": "Brand", "name": SITE_NAME},
                        "url": absolute(path),
                    },
                }
            )
        nodes.append(
            {
                "@type": "ItemList",
                "@id": absolute(path) + "#products",
                "name": "Sunny People — Drop 01",
                "itemListElement": items,
            }
        )

    if path == "/event.html" and EVENT_START and EVENT_PLACE:
        event = {
            "@type": "Event",
            "@id": absolute(path) + "#event",
            "name": "Sunny People Reopening Party",
            "description": "A new Sunny People experience: music, people and memories.",
            "startDate": EVENT_START,
            "image": absolute(OG_IMAGE),
            "url": absolute(path),
            "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
            "eventStatus": "https://schema.org/EventScheduled",
            "location": {
                "@type": "Place",
                "name": EVENT_VENUE or EVENT_PLACE,
                "address": EVENT_PLACE,
            },
            "organizer": {"@id": absolute("/") + "#organization"},
        }
        if EVENT_END:
            event["endDate"] = EVENT_END
        nodes.append(event)

    return nodes


def structured_data(lang, path, title, noindex=False, extra=None):
    data = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Organization",
                "@id": absolute("/") + "#organization",
                "name": SITE_NAME,
                "url": absolute("/"),
                "logo": absolute("/images/logo.png"),
                "email": CONTACT_EMAIL,
                "description": "%s — %s" % (SITE_NAME, SITE_TAGLINE),
                "sameAs": SOCIAL_LINKS,
            },
            {
                "@type": "WebSite",
                "@id": absolute("/") + "#website",
                "name": SITE_NAME,
                "url": absolute("/"),
                "inLanguage": lang.split("-")[0],
                "publisher": {"@id": absolute("/") + "#organization"},
            },
        ],
    }

    # Le pagine interne hanno in più WebPage + breadcrumb: aiuta Google a
    # mostrare "sunnypeopleevents.com › Merch" al posto dell'URL nudo.
    if path != "/" and not noindex:
        name = title.split("|")[-1].strip()
        data["@graph"].append(
            {
                "@type": "WebPage",
                "@id": absolute(path) + "#webpage",
                "url": absolute(path),
                "name": title,
                "inLanguage": lang.split("-")[0],
                "isPartOf": {"@id": absolute("/") + "#website"},
                "breadcrumb": {"@id": absolute(path) + "#breadcrumb"},
            }
        )
        data["@graph"].append(
            {
                "@type": "BreadcrumbList",
                "@id": absolute(path) + "#breadcrumb",
                "itemListElement": [
                    {
                        "@type": "ListItem",
                        "position": 1,
                        "name": "Home",
                        "item": absolute("/"),
                    },
                    {
                        "@type": "ListItem",
                        "position": 2,
                        "name": name,
                        "item": absolute(path),
                    },
                ],
            }
        )
    for node in extra or []:
        data["@graph"].append(node)

    payload = json.dumps(data, ensure_ascii=False, indent=2)
    return '<script type="application/ld+json">\n%s\n</script>' % payload


def header_payload(active, is_home):
    header = read_partial("header.html").replace("{{P}}", "" if is_home else "index.html")
    if active:
        header = header.replace(
            'data-page="%s"' % active,
            'data-page="%s" class="active" aria-current="page"' % active,
        )
    return header


def build_page(filename, path, active, in_sitemap, priority):
    path_on_disk = ROOT / filename
    if not path_on_disk.exists():
        sys.exit("ERRORE: manca la pagina %s" % filename)

    html = path_on_disk.read_text(encoding="utf-8")
    original = html

    title = page_title(html)
    description = page_description(html)
    lang = page_lang(html)

    html = fill_region(
        html,
        "META",
        meta_block(
            title, description, path, lang, not in_sitemap, extra_nodes(path)
        ),
    )
    html = fill_region(html, "HEADER", header_payload(active, path == "/"))
    html = fill_region(html, "FOOTER", read_partial("footer.html"))

    if html != original:
        path_on_disk.write_text(html, encoding="utf-8")
        return True
    return False


def build_robots():
    content = (
        "User-agent: *\n"
        "Allow: /\n"
        "\n"
        "Sitemap: %s\n" % absolute("/sitemap.xml")
    )
    (ROOT / "robots.txt").write_text(content, encoding="utf-8")


def build_sitemap():
    today = date.today().isoformat()
    entries = []
    for filename, path, active, in_sitemap, priority in PAGES:
        if not in_sitemap:
            continue
        entries.append(
            "  <url>\n"
            "    <loc>%s</loc>\n"
            "    <lastmod>%s</lastmod>\n"
            "    <priority>%s</priority>\n"
            "  </url>" % (absolute(path), today, priority)
        )
    content = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(entries)
        + "\n</urlset>\n"
    )
    (ROOT / "sitemap.xml").write_text(content, encoding="utf-8")


def main():
    changed = 0
    for filename, path, active, in_sitemap, priority in PAGES:
        if build_page(filename, path, active, in_sitemap, priority):
            changed += 1
            print("aggiornata  %s" % filename)
        else:
            print("ok          %s" % filename)

    build_robots()
    build_sitemap()
    print("riscritti    robots.txt, sitemap.xml")

    if "TODO" in DOMAIN or "example" in DOMAIN:
        print("\nATTENZIONE: imposta il tuo dominio in tools/build.py (DOMAIN).")

    print("\n%d pagine aggiornate su %d." % (changed, len(PAGES)))


if __name__ == "__main__":
    main()
