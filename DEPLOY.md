# 🚀 Guide de Déploiement Automatisé (Zéro Gestion Manuelle sur Mobile)

Ce guide vous explique comment déployer **Sawasdee Talk** de façon 100% automatique via **GitHub Actions** pour que chaque modification soit instantanément en ligne, prête à être utilisée sur votre smartphone sans aucune commande manuelle.

---

## 🎯 Le Principe : Comment ça fonctionne ?

1. Vous modifiez votre code ou ajoutez des fonctionnalités depuis votre ordinateur.
2. Vous faites un `git push` vers votre dépôt GitHub.
3. **GitHub Actions prend le relais automatiquement** :
   - Vérifie la syntaxe et compile le projet.
   - Construit une image Docker de production et la publie sur le registre GitHub.
   - Déclenche la mise à jour immédiate de votre serveur d'hébergement.
4. **Sur votre smartphone** : vous ouvrez votre lien HTTPS (ou l'icône sur votre écran d'accueil). L'application est déjà à jour, avec le micro activé et la dernière version en place !

---

## 🌟 Option Recommandée : Déploiement Gratuit sur Render (en 3 étapes)

[Render](https://render.com) est un hébergeur cloud moderne très simple qui supporte nativement Node.js/Express, offre une URL HTTPS gratuite (indispensable pour que le microphone fonctionne sur smartphone), et se connecte directement à GitHub.

### Étape 1 : Créer votre compte Render et connecter le dépôt
1. Allez sur **[render.com](https://render.com)** et connectez-vous avec votre compte **GitHub**.
2. Cliquez sur **New +** > **Blueprint**.
3. Sélectionnez votre dépôt GitHub `sawasdee-talk`.
4. Render détectera automatiquement le fichier `render.yaml` que nous avons préparé !

### Étape 2 : Renseigner votre clé Gemini API
1. Lors de la configuration du Blueprint (ou dans l'onglet **Environment** du service sur Render) :
2. Ajoutez la variable :
   - **Nom** : `GEMINI_API_KEY`
   - **Valeur** : votre clé gratuite obtenue sur [Google AI Studio](https://aistudio.google.com/app/apikey).
3. Cliquez sur **Apply** (ou **Create Web Service**).

### Étape 3 : Activer le déploiement automatique via GitHub Actions (Optionnel mais recommandé)
1. Dans le tableau de bord Render de votre application, allez dans **Settings**.
2. Cherchez la section **Deploy Hook** et copiez l'URL du webhook (ex: `https://api.render.com/deploy/srv-xxxx?key=yyyy`).
3. Sur votre dépôt **GitHub** :
   - Allez dans **Settings** > **Secrets and variables** > **Actions**.
   - Cliquez sur **New repository secret**.
   - Nom : `RENDER_DEPLOY_HOOK_URL`
   - Valeur : collez l'URL copiée depuis Render.
4. 🎉 **C'est tout !** Désormais, chaque `git push` sur la branche `main` déclenche automatiquement le build et le déploiement. Vous pouvez aussi relancer un déploiement depuis l'application mobile GitHub d'un simple clic sur **« Run workflow »**.

---

## 📱 Utilisation sur Smartphone (Android & iOS)

Grâce à la prise en charge **PWA (Progressive Web App)** :

1. Ouvrez votre URL Render (ex: `https://sawasdee-talk.onrender.com`) dans **Google Chrome** sur Android (ou **Safari** sur iPhone).
2. Cliquez sur le menu du navigateur (les 3 petits points sur Android ou le bouton Partager sur iOS).
3. Choisissez **« Ajouter à l'écran d'accueil »** ou **« Installer l'application »**.
4. L'icône **Sawasdee Talk** apparaît sur l'écran d'accueil de votre téléphone :
   - Elle s'ouvre en plein écran comme une application native.
   - Elle a un accès sécurisé au microphone pour enregistrer les conversations.
   - Elle se met à jour toute seule à chaque fois que vous la lancez !

---

## 🛠️ Autres Alternatives d'Hébergement Disponibles

- **Railway.app** : Déploiement automatique en connectant le dépôt GitHub (détecte automatiquement le `Dockerfile`).
- **Google Cloud Run** : Déploiement via le conteneur Docker publié automatiquement sur GitHub Container Registry (`ghcr.io/VOTRE_NOM/sawasdee-talk`).
- **Fly.io** : Déploiement instantané avec la commande `fly launch`.
