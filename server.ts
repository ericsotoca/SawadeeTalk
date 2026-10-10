import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { DEMO_SHEETS } from './src/data/demoScenarios';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// High payload limit for audio recordings (up to 5 min of audio is typically 5-25 MB in webm/wav)
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Server-side initialization of Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const SYSTEM_INSTRUCTION = `Tu es un expert linguiste et didacticien bilingue franco-thaïlandais, spécialisé dans l'acquisition du thaï oral pour les francophones.
Ton rôle est d'analyser une conversation audio réelle franco-thaïlandaise enregistrée (durée <= 1 minute).

RÈGLE FONDAMENTALE ET ABSOLUE :
NE JAMAIS RESTITUER NI AFFICHER LA TRANSCRIPTION INTÉGRALE DU DIALOGUE. L'application doit uniquement extraire les mots les plus fréquents, les expressions utiles, les structures et les statistiques.

Traitement attendu :
1. Identifier les mots thaïs et français réellement prononcés.
2. Reconnaître les expressions thaïes complètes.
3. Corriger les erreurs manifestes de reconnaissance vocale sans inventer de mots.
4. Regrouper les variantes orthographiques ou formes équivalentes si linguistiquement justifié.
5. Effectuer une segmentation linguistique rigoureuse du thaï (car le thaï s'écrit sans espaces réguliers entre les mots).
6. Compter les occurrences réelles et exactes de chaque mot et de chaque expression. Ne jamais inventer des fréquences fictives.
7. Éliminer les répétitions sans intérêt pédagogique, les hésitations et les bruits de conversation.
8. Distinguer le vocabulaire principal (mots lexicaux) des mots-outils et particules. Les particules de politesse (ครับ / ค่ะ), marqueurs interrogatifs (ไหม / หรือ / อะไร) et petits mots de conversation doivent être placés dans leur section dédiée ("particles").
9. Pour chaque mot thaï (jusqu'à 20 mots classés par fréquence décroissante) :
   - thai : mot en alphabet thaï
   - phonetic : translittération latine (système RTGS clair)
   - pronunciationFr : prononciation simplifiée pour un francophone avec l'indication des tons (ex: "Sà-wàt-dee [ton bas, ton plat]")
   - tone : mention du ou des tons (ton plat, bas, tombant/descendant, haut, montant)
   - french : traduction française précise
   - occurrences : nombre réel d'occurrences détectées
   - category : catégorie grammaticale ou thématique (ex: "Salutation", "Nourriture", "Verbe d'action", "Quantité", etc.)
   - exampleThai : court exemple naturel fiable
   - exampleFrench : traduction française de l'exemple
10. Pour chaque expression thaïe (jusqu'à 15 expressions) :
   - thai : expression complète en thaï
   - phonetic : translittération latine
   - pronunciationFr : prononciation guidée pour francophone
   - french : traduction française naturelle
   - occurrences : nombre réel d'occurrences
   - context : contexte d'utilisation réel (ex: "Commander un plat", "Demander l'addition", "Saluer poliment", "Exprimer son accord", "Demander le prix au marché")
   - contextTag : valeur parmi "salutation" | "question" | "accord" | "demande" | "quotidien" | "reaction" | "autre"
   - exampleThai : exemple pratique différent pour mémoriser
   - exampleFrench : traduction française
11. Pour les structures linguistiques (jusqu'à 5 structures) :
   - structureThai : formule clé (ex: "อยาก + [Verbe]", "ขอ + [Nom] + หน่อย", "ไม่ + [Verbe/Adj]")
   - meaningFrench : sens en français
   - grammarExplanation : explication grammaticale courte et concrète
   - exampleThai : exemple modèle avec un autre mot
   - exampleFrench : traduction française
12. Pour les particules et mots de liaison :
   - thai : particule ou mot
   - phonetic : prononciation latine
   - role : explication claire de son rôle
   - category : "politesse" | "interrogation" | "accord" | "hesitation" | "liaison" | "reaction"
   - speakerRegister : explication du registre ou si l'emploi dépend du genre/locuteur (ex: politesse masculine ครับ krap vs féminine ค่ะ/คะ kha)
   - exampleUsage : exemple court
13. Statistiques :
   - durationFormatted : durée au format "X min YY s"
   - totalSpokenWordsApprox : total approximatif de mots prononcés
   - distinctThaiWords : nombre de mots thaïs distincts
   - distinctThaiExpressions : nombre d'expressions distinctes
   - repeatedExpressionsCount : nombre d'expressions apparues plus d'une fois
   - totalOccurrencesCount : somme des occurrences comptées
   - top5Words : liste des 5 mots les plus fréquents [{ thai, phonetic, french, count }]
   - top5Expressions : liste des 5 expressions les plus fréquentes [{ thai, phonetic, french, count }]
   - segmentationNote : note brève sur la segmentation
14. Titre de la conversation : un intitulé concis résumant la scène (ex: "Conversation au restaurant street food", "Négociation au marché de Chatuchak", "Échange quotidien avec un ami thaïlandais").
15. Conseils pédagogiques (pedagogicalAdvice) : 2-3 phrases de conseils concrets pour un francophone sur les points de vigilance repérés.`;

// API route for audio analysis
app.post('/api/analyze-audio', async (req, res) => {
  try {
    const { audioBase64, mimeType, durationSeconds } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: "Aucun flux audio reçu." });
    }

    // Robust base64 extraction: strip any data URL header regardless of codec or parameters
    let cleanBase64 = audioBase64;
    let detectedMime = mimeType || 'audio/webm';

    if (cleanBase64.includes(';base64,')) {
      const parts = cleanBase64.split(';base64,');
      const dataHeader = parts[0];
      if (dataHeader.startsWith('data:')) {
        detectedMime = dataHeader.replace(/^data:/, '').split(';')[0].trim();
      }
      cleanBase64 = parts[1];
    } else if (cleanBase64.startsWith('data:')) {
      const commaIdx = cleanBase64.indexOf(',');
      if (commaIdx !== -1) {
        cleanBase64 = cleanBase64.slice(commaIdx + 1);
      }
    }

    cleanBase64 = cleanBase64.replace(/\s+/g, '').trim();

    // Ensure standard clean MIME type without codecs parameters for Gemini
    let effectiveMimeType = (mimeType || detectedMime).split(';')[0].trim().toLowerCase();
    if (!effectiveMimeType || effectiveMimeType === 'audio/*' || !effectiveMimeType.startsWith('audio/')) {
      effectiveMimeType = 'audio/webm';
    }

    const effectiveDuration = typeof durationSeconds === 'number' ? Math.round(durationSeconds) : 60;

    const audioPart = {
      inlineData: {
        data: cleanBase64,
        mimeType: effectiveMimeType,
      },
    };

    const textPrompt = `Analyse cet enregistrement audio d'une conversation réelle de ${effectiveDuration} secondes entre locuteurs parlant thaï et/ou français.
Effectue l'extraction statistique et linguistique demandée selon les consignes strictes.
RAPPEL : Ne jamais fournir la transcription continue de la conversation.
Retourne exclusivement un document JSON valide avec la structure suivante :
{
  "title": string,
  "stats": {
    "durationSeconds": number,
    "durationFormatted": string,
    "totalSpokenWordsApprox": number,
    "distinctThaiWords": number,
    "distinctThaiExpressions": number,
    "repeatedExpressionsCount": number,
    "totalOccurrencesCount": number,
    "top5Words": [{"thai": string, "phonetic": string, "french": string, "count": number}],
    "top5Expressions": [{"thai": string, "phonetic": string, "french": string, "count": number}],
    "segmentationNote": string
  },
  "words": [
    {
      "thai": string,
      "phonetic": string,
      "pronunciationFr": string,
      "tone": string,
      "french": string,
      "occurrences": number,
      "category": string,
      "exampleThai": string,
      "exampleFrench": string
    }
  ],
  "expressions": [
    {
      "thai": string,
      "phonetic": string,
      "pronunciationFr": string,
      "french": string,
      "occurrences": number,
      "context": string,
      "contextTag": "salutation" | "question" | "accord" | "demande" | "quotidien" | "reaction" | "autre",
      "exampleThai": string,
      "exampleFrench": string
    }
  ],
  "structures": [
    {
      "structureThai": string,
      "meaningFrench": string,
      "grammarExplanation": string,
      "exampleThai": string,
      "exampleFrench": string
    }
  ],
  "particles": [
    {
      "thai": string,
      "phonetic": string,
      "role": string,
      "category": "politesse" | "interrogation" | "accord" | "hesitation" | "liaison" | "reaction",
      "speakerRegister": string,
      "exampleUsage": string
    }
  ],
  "pedagogicalAdvice": string
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          audioPart,
          { text: textPrompt },
        ],
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        temperature: 0.2, // low temperature for precise counting and faithful phonetic analysis
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }, // Minimize latency
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Réponse vide reçue du modèle.");
    }

    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      // Remove any surrounding markdown backticks if present
      const cleaned = responseText.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    // Assign unique ID and timestamps
    const studySheet = {
      id: 'sheet_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      createdAt: new Date().toISOString(),
      dateFormatted: new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'full',
        timeStyle: 'short',
      }).format(new Date()),
      title: parsedData.title || 'Conversation en thaï',
      durationSeconds: effectiveDuration,
      stats: {
        ...parsedData.stats,
        durationSeconds: effectiveDuration,
        durationFormatted: parsedData.stats?.durationFormatted || `${Math.floor(effectiveDuration / 60)} min ${effectiveDuration % 60} s`,
      },
      words: Array.isArray(parsedData.words) ? parsedData.words : [],
      expressions: Array.isArray(parsedData.expressions) ? parsedData.expressions : [],
      structures: Array.isArray(parsedData.structures) ? parsedData.structures : [],
      particles: Array.isArray(parsedData.particles) ? parsedData.particles : [],
      pedagogicalAdvice: parsedData.pedagogicalAdvice || '',
    };

    return res.json({ success: true, sheet: studySheet });
  } catch (error: any) {
    console.error('Erreur lors de l\'analyse audio:', error);
    return res.status(500).json({
      error: error.message || 'Une erreur est survenue pendant l\'analyse de la conversation audio.',
    });
  }
});

// Demo / Simulation scenario generator for instant testing without mic
app.post('/api/demo-scenario', async (req, res) => {
  try {
    const { scenarioId } = req.body;
    const key = scenarioId || 'streetfood';

    // Instant resolution for curated pre-recorded scenarios
    if (DEMO_SHEETS[key]) {
      const template = DEMO_SHEETS[key];
      const now = new Date();
      const studySheet = {
        ...template,
        id: 'demo_' + Date.now(),
        createdAt: now.toISOString(),
        dateFormatted: new Intl.DateTimeFormat('fr-FR', {
          dateStyle: 'full',
          timeStyle: 'short',
        }).format(now),
      };
      return res.json({ success: true, sheet: studySheet });
    }

    let scenarioDescription = "Une conversation réelle de 2 minutes et 40 secondes entre un touriste francophone et un vendeur de rue thaïlandais à Bangkok commandant un Pad Thaï et deux bouteilles d'eau, en demandant le niveau d'épice 'pas trop épicé', demandant l'addition et remerciant poliment avec 'krap' et 'ka'.";

    if (scenarioId === 'market') {
      scenarioDescription = "Une conversation de 3 minutes et 15 secondes au marché de Chatuchak : négociation amicale de deux chemises en lin, demande de prix 'combien ça coûte' (thao rai), 'cher' (phaeng), proposition de rabais 'peut-on réduire un peu' (lot noi dai mai), accord mutuel 'd'accord' (dai khrap) et salutations.";
    } else if (scenarioId === 'taxi') {
      scenarioDescription = "Une conversation de 3 minutes et 50 secondes avec un chauffeur de taxi à Bangkok : indication de la destination (aéroport Suvarnabhumi), demande de mise en route du compteur (pööt meter), instructions 'tout droit' (trong pai), 'tourner à droite' (liao khwa), embouteillages (rot tit) et paiement en espèces.";
    }

    const textPrompt = `Génère une analyse pédagogique statistique complète et réaliste basée sur cette conversation orale réelle franco-thaïlandaise :
"${scenarioDescription}"

RÈGLES STRICTES :
- Ne JAMAIS fournir la transcription intégrale du dialogue.
- Extraire au moins 12 à 18 mots fréquents classés par fréquence réelle décroissante.
- Extraire 8 à 12 expressions utiles réutilisables.
- Extraire 3 à 5 structures linguistiques grammaticales indispensables.
- Extraire les particules de politesse et marqueurs conversationnels.
- Calculer des statistiques cohérentes et précises.
- Prononciation phonétique simplifiée pour francophones avec indication des tons.
Réponds exclusivement au format JSON respectant la structure de StudySheet.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: textPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        temperature: 0.3,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Réponse vide du modèle.");
    }
    const parsedData = JSON.parse(responseText.trim());
    const durationSeconds = scenarioId === 'market' ? 195 : scenarioId === 'taxi' ? 230 : 160;

    const studySheet = {
      id: 'demo_' + Date.now(),
      createdAt: new Date().toISOString(),
      dateFormatted: new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'full',
        timeStyle: 'short',
      }).format(new Date()),
      title: parsedData.title || (scenarioId === 'market' ? 'Négociation au marché de Chatuchak' : scenarioId === 'taxi' ? 'Course en taxi & Trajet à l\'aéroport' : 'Commande de Pad Thaï au street food'),
      durationSeconds,
      stats: {
        ...parsedData.stats,
        durationSeconds,
        durationFormatted: `${Math.floor(durationSeconds / 60)} min ${durationSeconds % 60} s`,
      },
      words: parsedData.words || [],
      expressions: parsedData.expressions || [],
      structures: parsedData.structures || [],
      particles: parsedData.particles || [],
      pedagogicalAdvice: parsedData.pedagogicalAdvice || '',
    };

    return res.json({ success: true, sheet: studySheet });
  } catch (error: any) {
    console.error('Erreur scénario démo:', error);
    return res.status(500).json({ error: error.message || 'Erreur scénario démo.' });
  }
});

// Setup Vite middleware in dev or static files in prod
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Sawasdee Talk] Serveur démarré sur http://0.0.0.0:${PORT}`);
  });
}

startServer();
