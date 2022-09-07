# TODO List
## bug fix
- La description manque si champ commu_discord vide (for 1.7.1)
- "maj : 20h30" plutôt que "20:30"

## Fonctionnalités nécessaires
- fini

## Fonctionnaités importantes
- ne pas conserver dans overlay actif une vielle version d'une url si on a reload les knownOverlays
- impémenter le event pour le boutons refresh sur wantedOverlays

## Sécurisation :
- sanityChecking
  - limiter la longueur des chaines (description = 260 dans form discord)
  - les meta-caractères champ textes sont remplacés par '', mettre ' ' (for 1.7.1)
  - la quote simple est interdite, fréquente en français (description) (for 1.7.1)
- mettre une url JSON bkp viable (qui a le header CORS, backup.place.timeforzevent.fr) (for 1.7.1)
- test de hack du serveur

## Bonus :

- mettre le logo commu plutôt qu'un simple lien
- placeholder="https://somesite.com/someoverlay.png"  plutot que value="..."
- déplacer le button commu à coté du button de maj du script
- ne pas afficher le lien discord ou twitch si sa valeur est null
- ❓ pouvoir choisir de faire un tri en ordre alphabétique/ou en nombre de réactions (pour soutenir les petites communautés ?)
- escape js string pas fait correctement 😂
- afficher un message fourni par le json (communication de secours)

- faire un schéma flux de données (pour vérifier qu'on sanitize bien dans tous les points d'entrée)
- faire un schéma interactions (user, events, calls + states)

- afficher la date de la dernière génération du fichier des overlays (pour l'instant j'affiche la date de dernier download)
- Afficher la dernière version du script  (en fait ça fait des requetes dehors fausse bonne idée ptet)
- (Tri) (mais pas si important que ça je pense)
- (Recherche) (mais pas si important que ça je pense)
- Sauvegarder les overlays cochés dans un cookie/localStorage pour que ça puisse survivre à un f5 (risque de fragilisation car demande permissions, bloquages par autres extensions etc? )
