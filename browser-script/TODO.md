# TODO List
## Fonctionnalités nécessaires
- gérer le problème de 500,500 en dur ( new Image(...) ou img.onload() ? )
- afficher la date de la dernière génération du fichier des overlays (pour l'instant j'affiche la date de dernier download)
- impémenter le event pour le des boutons refresh sur wantedOverlays

## Sécurisation :
- écrire jsonSanityCheck()
- refactoring du script (déjà bien avancé)
- échappement de toutes chaine de caractère (bien avancé)
- mettre une url JSON bkp viable (qui a le header CORS)
- test de hack du serveur

## Bonus :
- Afficher la dernière version du script  (en fait ça fait des requetes dehors fausse bonne idée ptet)
- (Tri) (mais pas si important que ça je pense)
- (Recherche) (mais pas si important que ça je pense)
- Sauvegarder les overlays cochés dans un cookie/localStorage pour que ça puisse survivre à un f5 (risque de fragilisation car demande permissions, bloquages par autres extensions etc? )
