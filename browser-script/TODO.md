# OLD list, to be updated

# TODO List
## bug fix
- nouveaux bugs à chercher

## Fonctionnalités nécessaires
- fini

## Fonctionnalités importantes
- fini

## Sécurisation :
- test de hack du serveur

## Bonus :
- afficher un message fourni par le json (communication de secours)
- ❓ pouvoir choisir de faire un tri en ordre alphabétique/ou en nombre de réactions (pour soutenir les petites communautés ?)
- faire un schéma flux de données (pour vérifier qu'on sanitize bien dans tous les points d'entrée)
- faire un schéma interactions (user, events, calls + states)
- (Tri) (mais pas si important que ça je pense)
- (Recherche) (mais pas si important que ça je pense)

## Pas vraiment sûr que ça soit une bonne idée

- escape js string pas fait correctement 😂
  - (enfait c'est security-ok, juste ça stripe + de caractères que désirable en français : la quote simple)
- mettre le logo commu plutôt qu'un simple lien
  -  ça n'indique pas que c'est cliquable ni que c'est un fil discord
  - le 1er gestionnaire d'overlay à passé son temps à ne pas rentrer dans le discord à cause des images de la liste
  -  et à ne pas lire les doc et à ne pas faire des choses qui fonctionnaient
- afficher la date de la dernière génération du fichier des overlays
  - pour l'instant j'affiche la date de dernier download et au moins les gens voient que le clic a marché
- déplacer le button commu à coté du button de maj du script
  - je pense qu'il vaut mieux le texte que j'ai changé (amélioré?)
- Afficher la dernière version du script
  - en fait ça fait des requetes dehors fausse bonne idée, TamperMonkey lui meme le fait mal... je ferai pas mieux
- Sauvegarder les overlays cochés dans un cookie/localStorage pour que ça puisse survivre à un f5
  - risque de fragilisation car demande permissions, bloquages par autres extensions etc?, implique complexité des cas de plusieurs onglets ouverts en //
