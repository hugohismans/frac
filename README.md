# Fractio

Deux jeux web pour comprendre les fractions en les manipulant (8 à 12 ans).

- **La Pizzeria** : couper des pizzas et servir les bonnes parts aux clients.
- **Fraction 2048** : fusionner des fractions égales jusqu'à faire une pizza entière.

## Développement

```sh
npm install
npm run dev      # serveur local
npm test         # tests Vitest
npm run check    # vérification des types
npm run build    # site statique dans build/
```

Toutes les constantes de gameplay et de ressenti sont dans `src/lib/settings.ts`.

## Déploiement

Chaque push sur `main` lance les tests puis publie le site sur GitHub Pages
(Settings > Pages > Source : GitHub Actions).
