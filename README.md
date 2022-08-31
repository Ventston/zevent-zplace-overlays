# Scripts pour la fresque pixel art ZEvent /place 2022

Remarque: ceci n'est pas adapté à la fresque du zUnivers de Zerator (z/place), relisez le titre.

Ce dépot contient des scripts pour faciliter de production et l'affichage de calques (overlays) sur https://place.zevent.fr.

## Liens directs (si vous avez déjà lu la doc en bas de page)

### Script d'affichage des calques (overlays)
- pré-requis avant de cliquer : installer l'extension TamperMonkey
- https://github.com/ludolpif/overlay-zevent-place/raw/main/browser-script/zevent-place-overlay.user.js
- si ça affiche du code sans aucun bouton "Install" ou "Update", vérifier l'installation de l'extension TamperMonkey

### ZIP pour installer le script GIMP d'export d'overlay
- il faut avoir installé et lancé GIMP 2.10.XX une premère fois (crée des répertoires au lancement)
- https://github.com/ludolpif/overlay-zevent-place/archive/refs/heads/main.zip
- fusionner depuis le ZIP overlay-zevent-place-main\GIMP\2.10 dans C:\Users\votrenom\AppData\Roaming\GIMP\2.10

### Alternative à GIMP (en ligne) pour les exports d'overlay
- https://overlay-zplace.4each.dev/

## Documentation

### S'organiser sur le Discord inter-commu ZEvent/Place

Si vous voulez, pour la fresque ZEvent/Place (au choix) :
- juste un guide pour dépenser vos crédits/pixels
- proposer des artworks à dessiner à plusieurs
- gérer un overlay (calque, ensemble d'artworks) d'une commu

C'est ICI pour collaborer : https://discord.gg/SbqEHZ47

**Important** : Il y a 50 commus, il faut absolument rester en dessous de 100 overlays. Idéal : 1 seul overlay par commu, 3 personnes qui se relaient pour être gestionnaire d'overlay durant l'évènement. @ludolpif va gérer un "overlay de secours" commun à toutes les commus qui n'ont pas assez de volontaires. 

### Vocabulaire pour ZEvent/Place
- La **palette** : l'ensemble des 32 couleurs disponibles (après connexion, le rond cliquable)
- Un **artwork** : une image qui représente 1 élément à dessiner collectivement.
Exemple : un personnage d'un streamer, une emote, un petit panneau avec un message ...
- Un **artwork en couleurs indexées** : artwork qui utilise exclusivement les couleurs de la palette (+transparence), et non pas toutes les couleurs qu'un écran peut afficher.
- Un **overlay** : un fichier GIMP .xcf (ou export json de l'outil en ligne https://overlay-zplace.4each.dev/) de la taille de la fresque complète de ZEvent/Place (au début 500x500) qui contient plusieurs artworks et qui a un fond transparent.
- Un **export d'overlay** : fichier .png spécial qui fait 9 fois la taille de la fresque complète (par ex 1500x1500). Chaque pixel initial est remplacé par 3x3 pixels, le pixel central est opaque de la couleur à dessiner, les 8 autour sont 100% transparents. (c'est pour voir plus facilement les pixels à modifier)
- Le **browser-script** : script fourni pour afficher les exports d'overlay sur ZEvent/Place, pour guider les gens qui veulent dessiner 

### Organisation et rôles suggérés
- créatif : prépare des artworks en couleur indexées et les suggère à un gestionnaire d'overlay
- facilitateur/diplomate : personne qui va sur les discord des streamers informer de l'existence de ce discord inter-commu et le cas échéant signaler des contradictions : 2 overlays suggèrent de dessiner 2 artworks différent au moment endroit
- gestionnaire d'overlay : personne qui utilise le 🎨-plugin-gimp ou le 🧰-webtool-overlays  et publie régulièrement un export de cet overlay (sans changer l'url à chaque version, par exemple via github ou un drive et pas des sites de GIF ou CDN discord).

 
### Afficher des overlays sur le site https://place.zevent.fr

### Créer et gérer un overlay avec GIMP


