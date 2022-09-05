# TODO List
## Fonctionnalités nécessaires
- avoir les boutons qui marchent (bugs sur le '-' ?)
- gérer le problème de 500,500 en dur ( new Image(...) ou img.onload() ? )
- afficher la date de la dernière génération du fichier des overlays
- avoir un bouton avec le lien du script pour update dans Tampermonkey
- avoir un lien d'invitation sur le discord dans l'UI

## Sécurisation :
- écrire jsonSanityCheck()
- différer le chargement du json à l'ouverture de l'UI (qui est différée d'une 1 sec sur le load de la page, ça évite les requetes si quelque mâche F5
- canceller une reuqête en cours du json si on en lance une nouvelle
- refactoring du script (déjà bien avancé)
- échappement de toutes chaine de caractère (bien avancé)
- téléchargement du fichier d'overlay à partir de Github, et en cas d'échec, téléchargement à partir de timeforzevent
- test de hack du serveur

## Bonus :
- Afficher la dernière version du script  (en fait ça fait des requetes dehors fausse bonne idée ptet)
- (Tri) (mais pas si important que ça je pense)
- (Recherche) (mais pas si important que ça je pense)
- Sauvegarder les overlays cochés dans un cookie/localStorage pour que ça puisse survivre à un f5 (prisque de fragilisation car demande permissions, bloquages par autres extensions etc? )
