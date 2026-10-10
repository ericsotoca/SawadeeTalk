import { StudySheet } from '../types';

/**
 * Formats a StudySheet into clean, readable UTF-8 text suitable for
 * Windows, Android, Google Docs, and plain text editors.
 * Guarantees that NO full dialogue transcript is included.
 */
export function formatStudySheetToText(sheet: StudySheet): string {
  const lines: string[] = [];

  const divider = '='.repeat(68);
  const subDivider = '-'.repeat(68);

  lines.push(divider);
  lines.push(` FICHE D'APPRENTISSAGE DU THAÏ — CONVERSATION RÉELLE`);
  lines.push(` Sawasdee Talk — Analyse Lexicale et Pédagogique`);
  lines.push(divider);
  lines.push('');
  lines.push(`Date de la conversation   : ${sheet.dateFormatted}`);
  lines.push(`Durée analysée            : ${sheet.stats.durationFormatted} (${sheet.stats.durationSeconds}s)`);
  lines.push(`Thème / Contexte          : ${sheet.title}`);
  lines.push(`Règle de confidentialité : Aucune transcription intégrale n'est restituée.`);
  lines.push('');

  // 1. STATISTIQUES
  lines.push(divider);
  lines.push(`1. STATISTIQUES DE LA CONVERSATION`);
  lines.push(divider);
  lines.push(`• Mots totaux approximatifs prononcés : ${sheet.stats.totalSpokenWordsApprox}`);
  lines.push(`• Mots thaïs distincts identifiés     : ${sheet.stats.distinctThaiWords}`);
  lines.push(`• Expressions distinctes identifiées  : ${sheet.stats.distinctThaiExpressions}`);
  lines.push(`• Expressions répétées                : ${sheet.stats.repeatedExpressionsCount}`);
  lines.push(`• Total des occurrences comptabilisées: ${sheet.stats.totalOccurrencesCount}`);
  if (sheet.stats.segmentationNote) {
    lines.push(`• Note linguistique                   : ${sheet.stats.segmentationNote}`);
  }
  lines.push('');
  lines.push(`[Top 5 Mots les plus fréquents]`);
  sheet.stats.top5Words.forEach((w, i) => {
    lines.push(`  ${i + 1}. ${w.thai} (${w.phonetic}) — "${w.french}" : ${w.count} occurrence(s)`);
  });
  lines.push('');
  lines.push(`[Top 5 Expressions les plus fréquentes]`);
  sheet.stats.top5Expressions.forEach((e, i) => {
    lines.push(`  ${i + 1}. ${e.thai} (${e.phonetic}) — "${e.french}" : ${e.count} occurrence(s)`);
  });
  lines.push('');

  // 2. MOTS THAÏS LES PLUS UTILISÉS
  lines.push(divider);
  lines.push(`2. MOTS THAÏS LES PLUS UTILISÉS (Classés par fréquence décroissante)`);
  lines.push(divider);
  if (sheet.words.length === 0) {
    lines.push(`Aucun mot distinct isolé répertorié.`);
  } else {
    sheet.words.forEach((w, index) => {
      lines.push(`${index + 1}. [${w.occurrences} occurrence(s)]  ${w.thai}`);
      lines.push(`   Phonétique (RTGS) : ${w.phonetic}`);
      lines.push(`   Prononciation FR  : ${w.pronunciationFr} (${w.tone})`);
      lines.push(`   Sens en français  : ${w.french}`);
      if (w.category) lines.push(`   Catégorie         : ${w.category}`);
      if (w.exampleThai) {
        lines.push(`   Exemple naturel   : ${w.exampleThai}`);
        lines.push(`   Traduction exemple: ${w.exampleFrench}`);
      }
      lines.push(subDivider);
    });
  }
  lines.push('');

  // 3. EXPRESSIONS THAÏES LES PLUS UTILISÉES
  lines.push(divider);
  lines.push(`3. EXPRESSIONS THAÏES LES PLUS UTILES`);
  lines.push(divider);
  if (sheet.expressions.length === 0) {
    lines.push(`Aucune expression distincte répertoriée.`);
  } else {
    sheet.expressions.forEach((e, index) => {
      lines.push(`${index + 1}. [${e.occurrences} occurrence(s)]  ${e.thai}`);
      lines.push(`   Phonétique (RTGS) : ${e.phonetic}`);
      lines.push(`   Prononciation FR  : ${e.pronunciationFr}`);
      lines.push(`   Traduction        : ${e.french}`);
      lines.push(`   Contexte d'emploi : ${e.context}`);
      if (e.exampleThai) {
        lines.push(`   Exemple pratique  : ${e.exampleThai}`);
        lines.push(`   Traduction exemple: ${e.exampleFrench}`);
      }
      lines.push(subDivider);
    });
  }
  lines.push('');

  // 4. STRUCTURES LINGUISTIQUES À RETENIR
  lines.push(divider);
  lines.push(`4. STRUCTURES LINGUISTIQUES ET GRAMMATICALES À RETENIR`);
  lines.push(divider);
  if (sheet.structures.length === 0) {
    lines.push(`Aucune structure particulière relevée.`);
  } else {
    sheet.structures.forEach((s, index) => {
      lines.push(`Structure ${index + 1} : ${s.structureThai}`);
      lines.push(`Signification         : ${s.meaningFrench}`);
      lines.push(`Règle grammaticale    : ${s.grammarExplanation}`);
      lines.push(`Exemple réutilisable  : ${s.exampleThai}`);
      lines.push(`Traduction de l'ex.   : ${s.exampleFrench}`);
      lines.push(subDivider);
    });
  }
  lines.push('');

  // 5. MOTS DE LIAISON ET PARTICULES
  lines.push(divider);
  lines.push(`5. PARTICULES ET MOTS DE LIAISON (Pour un thaï naturel)`);
  lines.push(divider);
  if (sheet.particles.length === 0) {
    lines.push(`Aucune particule répertoriée.`);
  } else {
    sheet.particles.forEach((p, index) => {
      lines.push(`• ${p.thai} (${p.phonetic}) [${p.category.toUpperCase()}]`);
      lines.push(`  Rôle               : ${p.role}`);
      lines.push(`  Registre / Emploi  : ${p.speakerRegister}`);
      if (p.exampleUsage) {
        lines.push(`  Exemple d'emploi   : ${p.exampleUsage}`);
      }
      lines.push('');
    });
  }

  if (sheet.pedagogicalAdvice) {
    lines.push(divider);
    lines.push(`CONSEILS PÉDAGOGIQUES DU LINGUISTE`);
    lines.push(divider);
    lines.push(sheet.pedagogicalAdvice);
    lines.push('');
  }

  lines.push(divider);
  lines.push(`Généré avec Sawasdee Talk — Conforme à l'apprentissage du thaï`);
  lines.push(divider);

  return lines.join('\n');
}

/**
 * Generates the required filename format: "thai_vocabulaire_AAAA-MM-JJ_HH-MM.txt"
 */
export function getExportFilename(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `thai_vocabulaire_${year}-${month}-${day}_${hours}-${minutes}.txt`;
}

/**
 * Triggers a browser download of the sheet as a UTF-8 text file.
 */
export function downloadSheetAsTxt(sheet: StudySheet): void {
  const textContent = formatStudySheetToText(sheet);
  // UTF-8 BOM to ensure seamless opening in Notepad/Windows as well as mobile & Unix editors
  const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
  const blob = new Blob([bom, textContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = getExportFilename(new Date(sheet.createdAt));
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
