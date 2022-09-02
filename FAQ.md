# Questions fréquentes (FAQ)

## Quelle taille pour mon artwork ?

Un artwork de 16x16 pixels qui n'est pas un carré plein, qui a des pixels transparents sur les bords, ça sera surement quelque chose comme 200 crédits pour le dessiner (équivalent à un don de 20€). Sachant qu'il risque de falloir le défendre (+ de crédits donc). Sachant aussi que plusieurs personnes vont peut être d'associer pour le dessiner s'il est dans un overlay publié et bien géré (donc moins de crédits nécessaire pour chaque dessinateur.

## Quelle taille pour mon overlay ( = taille totale de Zevent/Place)

La fresque initialement devrait faire 500x500 pixel et sera aggrandie probablemetn pendant l'évènement, peut être une ou deux fois genre 500x1000 puis 1000x1000 si vraiment ça devient hype.

## Transformation d'une image existante à la palette (couleurs indexées)

Dans le webtool, pour chaque pixel, la couleur la plus proche dans la paellete du pixel d'origine est utilisée.

Dans GIMP, si on glisse-dépose un artwork sur une image déjà paramétrée en couleurs indexées ça fait pareil. Si on glisse l'image sur une image en RVB et qu'après on applique la palette (Image > Mode > Couleurs indexées, on a plusieurs choix d'algorithme pour choisir les couleurs des pixels. Floyd-Steinberg est le standard en impression papier, mais pour le pixel art c'est moins optimal (beaucoup de motifs 1 pixel sur 2).

Souvent il est plus esthétique de redessiner avec la bonne palette que d'essayer de transformer des images existantes. 
