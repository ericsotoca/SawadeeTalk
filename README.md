# Sawasdee Talk (สวัสดี) — Apprentissage du Thaï par la Conversation Réelle

Application Web moderne et réactive conçue pour les francophones débutants ou intermédiaires, permettant d'apprendre le thaï oral à partir de conversations réelles d'une minute maximum enregistrées au micro.

---

## 🎯 Objectif et Philosophie Pédagogique

1. **Règle fondamentale de confidentialité** : L'application ne restitue **jamais** la transcription intégrale de la conversation. Elle extrait uniquement :
   - Les mots les plus fréquents (avec décompte exact d'occurrences).
   - Les expressions clés réutilisables du quotidien.
   - Les structures syntaxiques et grammaticales fondamentales.
   - Les particules de politesse et marqueurs conversationnels naturels.
2. **Segmentation linguistique rigoureuse** : Le thaï s'écrit traditionnellement sans espaces entre les mots. Le modèle réalise une segmentation lexicale précise et distingue les mots réels des particules et mots-outils.
3. **Phonétique adaptée aux francophones** : Chaque terme dispose d'une prononciation simplifiée en français intégrant les 5 tons du thaï (*plat, bas, descendant, haut, montant*), ainsi que d'une synthèse vocale audio (Web Speech API).
4. **Calculs statistiques réels** : Aucun chiffre inventé. Les fréquences et occurrences sont mesurées sur l'audio analysé.

---

## 📱 Fonctionnalités

### Étape A — Enregistrement Audio (Max 1 min)
- Enregistrement direct depuis le microphone du smartphone ou ordinateur (avec demande d'autorisation explicite).
- Chronomètre précis `MM:SS` avec temps écoulé et temps restant (sur 01:00 max).
- Arrêt automatique à 1 minute.
- Visualiseur audio interactif (analyseur de spectre et volume en temps réel).
- Boutons : *Démarrer*, *Mettre en pause / Reprendre*, *Arrêter*, *Recommencer*.
- Solution de repli intégrée : importation de fichiers audio existants (`.mp3`, `.wav`, `.m4a`, `.webm`) ou lancement de démos types (Street Food, Marché de Chatuchak, Taxi).

### Étape B — Analyse par Intelligence Artificielle Multimodale
- Analyse directe du flux audio via le SDK `@google/genai` (modèle `gemini-3.8-flash` côté serveur).
- Élimination des bruits parasites, hésitations et hésitations orales.
- Regroupement des variantes et comptage rigoureux des occurrences.

### Étape C — Fiche d'Apprentissage Structurée
- **Résumé Statistique** : durée analysée, mots parlés approximatifs, mots distincts, expressions distinctes et répétées, Top 5 mots et Top 5 expressions.
- **Section 1 : Mots les plus utilisés (jusqu'à 20)** : alphabet thaï, phonétique RTGS, prononciation française avec tons, traduction, occurrences exactes, exemple naturel avec traduction, bouton audio.
- **Section 2 : Expressions les plus utiles (jusqu'à 15)** : contexte réel d'emploi, filtres rapides par thématique (*Salutations, Questions, Accords, Demandes, etc.*), exemple pratique alternatif.
- **Section 3 : Structures linguistiques (jusqu'à 5)** : formule clé en thaï, explication grammaticale concise, exemple modèle substituable.
- **Section 4 : Particules et mots de liaison** : particules de politesse (*ครับ krap / ค่ะ ka* avec mention du registre et locuteur), marqueurs de question (*ไหม mai / หรือ reu*), réactions.

### Étape D — Flashcards Orales depuis l'Historique ou l'Import
- Création automatique de paquets de flashcards pour réviser toutes les expressions de l'historique ou d'une conversation précise.
- **Priorité absolue à la prononciation orale** : affichage en grand de la phonétique internationale (RTGS) et de la prononciation guidée française avec les tons, **sans écriture en thaïlandais** pour focaliser l'apprentissage sur l'oralité et la fluidité.
- **Importation multi-fiches (jusqu'à 5 fiches simultanées)** : importez vos fichiers `.txt` de fiches précédemment téléchargées pour enrichir instantanément votre deck de flashcards.
- **2 modes d'entraînement** :
  - *🗣️ Prononciation ➔ 🇫🇷 Sens français* : écouter ou lire la phonétique et retrouver le sens.
  - *🇫🇷 Sens français ➔ 🗣️ Prononciation* : s'entraîner à la production orale et aux tons à partir du contexte.
- Auto-évaluation (À revoir / Maîtrisé), répétition des cartes manquées, mélange aléatoire.
- Synthèse vocale intégrée pour écouter la prononciation authentique.
- Export compatible **Anki & Quizlet** au format `.tsv`.

### Exportation & Importation de Fiches
- **Exportation** : génération d'un fichier `.txt` UTF-8 normé `thai_vocabulaire_AAAA-MM-JJ_HH-MM.txt` prêt pour Android, iOS, Windows et Google Docs.
- **Importation multiple** : importez jusqu'à 5 fiches sauvegardées pour générer vos flashcards ou enrichir votre session.
- **Copie rapide** : copie complète dans le presse-papiers.

---

## 🛠️ Stack Technique

- **Frontend** : React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Google Fonts (*Sarabun* pour le thaï, *Plus Jakarta Sans* pour le français).
- **Backend** : Node.js, Express, TSX, `@google/genai` (Gemini 3.8 Flash).
- **Audio** : MediaStream API, MediaRecorder avec détection de format (`audio/webm`, `audio/mp4`, `audio/ogg`, `audio/wav`), AudioContext AnalyserNode, Web Speech API (TTS thaï `th-TH`).

---

## 🚀 Publication sur GitHub

Le projet est 100% prêt à être publié sur GitHub :
- `.gitignore` est déjà configuré (vos clés API et fichiers `.env` ne seront **jamais** exposés).
- Le build TypeScript et Vite compile sans aucune erreur.
- La documentation et le Dockerfile sont prêts.

### Pour publier sur votre compte GitHub :

1. **Créez un nouveau dépôt vide sur [GitHub](https://github.com/new)** (ex: `sawasdee-talk`), sans cocher « Add a README » ou « Add .gitignore ».
2. **Dans le terminal de votre projet, lancez :**
   ```bash
   git add .
   git commit -m "feat: initial release Sawasdee Talk"
   git branch -M main
   git remote add origin https://github.com/VOTRE_NOM_UTILISATEUR/sawasdee-talk.git
   git push -u origin main
   ```

---

## 💻 Installation Locale

1. **Cloner le projet** :
   ```bash
   git clone https://github.com/VOTRE_NOM_UTILISATEUR/sawasdee-talk.git
   cd sawasdee-talk
   ```

2. **Installer les dépendances** :
   ```bash
   npm install
   ```

3. **Configurer la clé API Gemini** :
   Obtenez une clé API gratuite sur [Google AI Studio](https://aistudio.google.com/app/apikey).
   Créez un fichier `.env` à la racine :
   ```env
   GEMINI_API_KEY="votre_cle_api_gemini_ici"
   PORT=3000
   ```

4. **Lancer le serveur de développement** :
   ```bash
   npm run dev
   ```
   Ouvrez votre navigateur sur `http://localhost:3000`.

---

## 📦 Construction et Déploiement

1. **Compiler l'application pour la production** :
   ```bash
   npm run build
   ```

2. **Démarrer en mode production** :
   ```bash
   NODE_ENV=production npm start
   ```

---

## 📜 Licence
Apache-2.0
