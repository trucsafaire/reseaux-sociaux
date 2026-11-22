"""Place une capture d'écran dans une maquette officielle Apple (fichiers « Product Bezels » d'Apple Design Resources).
   python3 maquettes.py <maquette.png> <capture.png> <sortie.png>
L'écran de la maquette est la zone transparente au centre : on la retrouve par remplissage depuis le centre,
ce qui respecte exactement les coins arrondis et la Dynamic Island."""
import sys
from PIL import Image, ImageDraw

maquette, capture, sortie = sys.argv[1:4]
cadre = Image.open(maquette).convert("RGBA")
W, H = cadre.size
# masque binaire : blanc = transparent dans la maquette
m = cadre.getchannel("A").point(lambda v: 255 if v < 10 else 0)
ImageDraw.floodfill(m, (W // 2, H // 2), 128)          # la zone écran prend la valeur 128
ecran = m.point(lambda v: 255 if v == 128 else 0)
x0, y0, x1, y1 = ecran.getbbox()
cap = Image.open(capture).convert("RGBA")
# remplit la zone en gardant le haut de la page (recadrage, jamais de déformation)
r = max((x1 - x0) / cap.width, (y1 - y0) / cap.height)
cap = cap.resize((round(cap.width * r), round(cap.height * r)), Image.LANCZOS).crop((0, 0, x1 - x0, y1 - y0))
fond = Image.new("RGBA", (W, H), (0, 0, 0, 0))
fond.paste(cap, (x0, y0), ecran.crop((x0, y0, x1, y1)))
Image.alpha_composite(fond, cadre).save(sortie)
