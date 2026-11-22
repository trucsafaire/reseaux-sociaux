"""Kit d'une page départementale : photo de profil + bannière Facebook (avec vraies maquettes Apple).
   python3 social/outils/kit.py 58 [--site http://localhost:8765]
Le site Trucs à faire doit tourner en local (python3 -m http.server 8765 dans le dépôt du site).
Résultat : marque/reseaux/departements/<code>/profil.png et couverture.png"""
import asyncio, subprocess, sys, json, os
from pathlib import Path
from playwright.async_api import async_playwright

RACINE = Path(__file__).resolve().parents[2]
code = sys.argv[1]
site = sys.argv[sys.argv.index("--site") + 1] if "--site" in sys.argv else "http://localhost:8765"
sortie = RACINE / "marque/reseaux/departements" / code
tmp = Path("/tmp/kit-" + code)
sortie.mkdir(parents=True, exist_ok=True); tmp.mkdir(exist_ok=True)

ECRANS = [("ordi", 1280, 832, 2, False, "apple-macbook-air.png"),
          ("tablette", 820, 1180, 2, True, "apple-ipad-air.png"),
          ("tel", 402, 874, 3, True, "apple-iphone-17-pro.png")]

async def captures():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        for nom, w, h, dpr, mobile, _ in ECRANS:
            ctx = await b.new_context(viewport={"width": w, "height": h}, device_scale_factor=dpr, is_mobile=mobile,
                                      has_touch=mobile, locale="fr-FR", color_scheme="light")
            pg = await ctx.new_page()
            await pg.goto(f"{site}/index.html#dep={code}", wait_until="networkidle", timeout=60000)
            if nom == "tel":  # place pour l'heure et la Dynamic Island
                await pg.add_style_tag(content="body{padding-top:54px!important}")
            await pg.wait_for_timeout(2500)
            await pg.screenshot(path=str(tmp / f"capture-{nom}.png"))
            await ctx.close()
        await b.close()

asyncio.run(captures())
for nom, *_, cadre in ECRANS:
    subprocess.run(["python3", str(RACINE / "social/outils/maquettes.py"), str(RACINE / "marque/reseaux" / cadre),
                    str(tmp / f"capture-{nom}.png"), str(tmp / f"{nom}.png")], check=True)

page = json.loads(subprocess.run(["node", "-e", f"import('{RACINE}/social/src/departements.mjs').then(m=>console.log(JSON.stringify(m.nouvellePage('{code}'))))"],
                                 capture_output=True, text=True, check=True).stdout)
titre = f"Que faire|{page['dans']} ?"
subprocess.run(["node", str(RACINE / "social/src/banniere.mjs"), "--titre", titre, "--ecrans", str(tmp), "--sortie", str(sortie / "couverture.png")], check=True)
subprocess.run(["node", str(RACINE / "social/src/profil-departement.mjs"), code, str(sortie / "profil.png")], check=True)
print(f"✓ {sortie}/profil.png et couverture.png — « {titre.replace('|', ' ')} »")
