# Scripts pour la fresque pixel art ZEvent Place 2026

*English: detailed documentation have been translated, see "documentation" folder above. Download the PDF instead of viewing in a web preview, else the page scroll is poor.*

Ce dépot contient des scripts pour faciliter la production et l'affichage de calques (overlays) sur https://place.zevent.fr.

## Liens directs (lisez Vocabulaire en bas avant SVP)

### Afficher des overlays sur le site https://place.zevent.fr avec le 🌐-browser-script

- Sécurité : dédiez un navigateur secondaire uniquement pour ça
  - exemple : Twitch+dons sur Chrome ; ZEvent/Place sur Firefox
- Pré-requis avant de cliquer ci-après: installer l'extension TamperMonkey
  - Chrome: https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo
    - Vous devez activer le mode développeur pour installer cette extension: https://www.tampermonkey.net/faq.php#Q209
  - Firefox: https://addons.mozilla.org/fr/firefox/addon/tampermonkey/
- https://github.com/Ventston/zevent-zplace-overlays/raw/main/browser-script/zevent-place-overlay.user.js
- Si ça affiche du code sans aucun bouton "Installer", vérifier l'installation de l'extension TamperMonkey
- Diaporama détaillé (à télécharger) : https://github.com/Ventston/zevent-zplace-overlays/raw/main/documentation/use-overlays.pdf

Le script se met à jour tout seul : il vous prévient dans son panneau quand une nouvelle version est disponible.

### Créer et gérer un overlay avec le 🧰-webtool-overlays

- Juste aller sur : https://zevent-place.4each.dev/
- Pas de logiciel à installer : import d'image, conversion automatique à la palette, retouche au pixel, choix des coordonnées, publication
- Connexion Discord obligatoire : il faut être membre du serveur inter-commus ZEvent/Place (invitation plus bas)
- Les overlays des autres commus s'affichent en calque de référence pour aider au placement, et les chevauchements sont détectés avant publication
- L'éditeur demande un ordinateur (souris, écran d'au moins 768 px de large) ; le catalogue et la gestion de vos overlays marchent sur mobile

### Créer et gérer un overlay avec le 🎨-plugin-gimp

- Il faut avoir installé et lancé GIMP 2.10.XX une premère fois (crée des répertoires au lancement)
- https://github.com/Ventston/zevent-zplace-overlays/archive/refs/heads/main.zip
- Fusionner depuis le ZIP overlay-zevent-place-main\GIMP\2.10 dans C:\Users\votrenom\AppData\Roaming\GIMP\2.10
- Diaporama détaillé (à télécharger) : https://github.com/Ventston/zevent-zplace-overlays/raw/main/documentation/manage-overlays-with-gimp.pdf

## S'organiser sur le Discord inter-commu ZEvent/Place

Un serveur Discord Commu ZEvent/Place a été configuré pour l'occasion : https://discord.gg/sXe5aVW2jV

Il sert à deux choses : c'est lui qui **ouvre l'accès au webtool** (on se connecte au site avec son
compte Discord, il faut être membre du serveur), et c'est là que se discutent les placements entre
commus.

Si vous voulez, pour la fresque ZEvent/Place, vous pouvez (au choix) :
- Afficher un guide (overlay) pour vous aider à dessiner avec vos crédits/pixels
- Gérer un overlay (calque, ensemble d'artworks) d'une commu (idéalement en trinôme pour se relayer)
- Proposer des artworks à dessiner à plusieurs à un gestionnaire d'overlay

### Un fil de discussion par overlay, créé automatiquement

Vous n'avez plus à créer votre fil vous-même : dès qu'un overlay est publié sur le webtool, un bot
ouvre un **fil de discussion dédié** sur le Discord et y épingle sa fiche (nom, description,
position, taille, créateur, responsables, liens Twitch/Discord de la commu).

- Le créateur et les responsables sont ajoutés au fil automatiquement
- **Réagissez avec 🔗 sur le message du fil** pour le rejoindre et être prévenu des changements de
  cet overlay (une nouvelle réaction retirée vous en fait sortir)
- Chaque modification de l'overlay met la fiche à jour et notifie le fil
- Depuis le browser-script comme depuis le webtool, un bouton Discord ouvre directement le fil de
  l'overlay : c'est le bon endroit pour contacter une commu voisine en cas de conflit de placement

Les **responsables** d'un overlay se gèrent depuis le site (« Mes overlays »), pas sur le Discord :
ajouter quelqu'un lui donne le droit de modifier l'overlay et l'ajoute au fil.

### Overlays liés : voir l'œuvre des voisins avec la sienne

Deux commus qui dessinent côte à côte peuvent **lier leurs overlays**. Les overlays liés forment un
groupe indissociable : le browser-script les active et les retire d'un bloc, donc chaque commu voit
aussi bien le modèle de ses voisins que le sien.

- La demande part depuis « Mes overlays » ; elle est annoncée dans le fil Discord de l'overlay visé
- Elle ne prend effet qu'une fois **acceptée** par l'autre commu, qui répond depuis « Mes overlays »
- Chacun peut retirer la liaison à tout moment ; le fil est prévenu dans tous les cas
- Dans le panneau du script, un overlay lié porte une icône 🔗 qui nomme les autres membres du groupe

### Overlays épinglés par l'organisation

L'organisation peut mettre un overlay **en avant pour tout le monde** : il s'active tout seul chez
tous les utilisateurs du script et s'affiche avec un 📌 au lieu du bouton de retrait. C'est réservé
aux annonces communes (mot d'ordre, zone à défendre…). Les messages de l'orga s'affichent aussi
directement en haut du panneau du script.

### Vocabulaire pour ZEvent/Place

- La **palette** : l'ensemble des 32 couleurs disponibles (après connexion, le rond cliquable)
- Un **artwork** : une image qui représente 1 élément à dessiner collectivement.
Exemple : un personnage d'un streamer, une emote, un petit panneau avec un message ...
- Un **artwork en couleurs indexées** : artwork qui utilise exclusivement les couleurs de la palette (+transparence), et non pas toutes les couleurs qu'un écran peut afficher.
- Un **overlay** : un calque de la taille de la fresque complète de ZEvent/Place (au début 500x500), à fond transparent, qui contient plusieurs artworks. C'est ce qu'on prépare sur le webtool https://zevent-place.4each.dev/, ou dans un fichier GIMP .xcf.
- Un **export d'overlay** : fichier .png spécial qui fait 9 fois la taille de la fresque complète (par ex 1500x1500). Chaque pixel initial est remplacé par 3x3 pixels, le pixel central est opaque de la couleur à dessiner, les 8 autour sont 100% transparents. (c'est pour voir plus facilement les pixels à modifier)
- Le **browser-script** : script fourni pour afficher les exports d'overlay sur ZEvent/Place, pour guider les gens qui veulent dessiner
- Un **overlay lié** : overlay rattaché à celui d'une commu voisine ; les membres d'un même groupe s'activent et se retirent ensemble dans le browser-script
- Un **overlay perso** : image ajoutée par vous-même via une URL dans le panneau du script, visible de vous seul. À activer dans les paramètres du script (⚙️ « Afficher l'ajout via URL »)

## Le panneau du browser-script en bref

- **Overlays actifs** : ceux que vous affichez. Chacun peut être masqué à l'œil, ouvert dans un onglet, ou ouvert dans son fil Discord
- **Overlays disponibles** : le catalogue publié depuis le webtool, avec une recherche par nom
- **Touche H** : masque / réaffiche tous les overlays d'un coup (pratique pour vérifier ce qui est déjà dessiné)
- **Mode daltonien** : la case « Activer les symboles » remplace chaque couleur par un symbole distinct
- **⚙️ Paramètres** : ajout via URL, et statistiques d'usage anonymes (désactivables ; détail de ce qui est envoyé dans le panneau)

## Capture d'écran des outils

### browser-script (installation)

![browser-script install](/documentation/browser-script-install.png?raw=true "Installation de l'extension browser-script")

### browser-script (utilisation)

![browser-script demo](/documentation/browser-script-demo.png?raw=true "Capture d'écran du browser-script")

### Plugin GIMP

![plugin-gimp-demo](/documentation/plugin-gimp-demo.png?raw=true "Capture d'écran du plugin GIMP")
