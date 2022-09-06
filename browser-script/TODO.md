# TODO List
## Fonctionnalités nécessaires
- fini

## Fonctionnaités importantes
- ne pas conserver dans overlay actif une vielle version d'une url si on a reload les knownOverlays
- impémenter le event pour le boutons refresh sur wantedOverlays

## Sécurisation :
- sanityChecking : limiter la longueur des chaines (description = 260 dans form discord)
- mettre une url JSON bkp viable (qui a le header CORS)
- test de hack du serveur

## Bonus :
- afficher la date de la dernière génération du fichier des overlays (pour l'instant j'affiche la date de dernier download)
- Afficher la dernière version du script  (en fait ça fait des requetes dehors fausse bonne idée ptet)
- (Tri) (mais pas si important que ça je pense)
- (Recherche) (mais pas si important que ça je pense)
- Sauvegarder les overlays cochés dans un cookie/localStorage pour que ça puisse survivre à un f5 (risque de fragilisation car demande permissions, bloquages par autres extensions etc? )
