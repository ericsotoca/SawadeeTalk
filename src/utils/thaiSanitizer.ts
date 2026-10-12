/**
 * Utility to detect and clean Thai script characters.
 * Guarantees that ZERO Thai script characters are ever displayed:
 * "Aucun mot ne doivent être écrit en écriture thaïlandaise dans cette application."
 */

import { StudySheet, WordItem, ExpressionItem, StructureItem, ParticleItem } from '../types';

// Thai Unicode block range: \u0E00 - \u0E7F
const THAI_UNICODE_REGEX = /[\u0E00-\u0E7F]/g;

export function hasThaiScript(text?: string | null): boolean {
  if (!text) return false;
  return THAI_UNICODE_REGEX.test(text);
}

/**
 * Strips all Thai Unicode script characters (\u0E00-\u0E7F) from any string.
 * If only Thai characters were present, returns fallbackPhonetic or empty string.
 */
export function removeThaiScript(text?: string | null, fallbackPhonetic?: string): string {
  if (!text) return fallbackPhonetic || '';
  if (!hasThaiScript(text)) return text.trim();

  // Strip all Thai characters
  const cleaned = text.replace(/[\u0E00-\u0E7F]/g, '').replace(/\s+/g, ' ').trim();
  return cleaned || fallbackPhonetic || '';
}

/**
 * Deeply sanitizes a StudySheet to guarantee that ZERO Thai script characters exist in it.
 */
export function sanitizeStudySheet(sheet: StudySheet): StudySheet {
  const sanitizedWords: WordItem[] = sheet.words.map((w) => ({
    ...w,
    thai: removeThaiScript(w.thai, w.phonetic),
    exampleThai: removeThaiScript(w.exampleThai, w.phonetic),
  }));

  const sanitizedExpressions: ExpressionItem[] = sheet.expressions.map((e) => ({
    ...e,
    thai: removeThaiScript(e.thai, e.phonetic),
    exampleThai: removeThaiScript(e.exampleThai, e.phonetic),
  }));

  const sanitizedStructures: StructureItem[] = sheet.structures.map((s) => ({
    ...s,
    structureThai: removeThaiScript(s.structureThai, s.meaningFrench),
    exampleThai: removeThaiScript(s.exampleThai, s.exampleFrench),
  }));

  const sanitizedParticles: ParticleItem[] = sheet.particles.map((p) => ({
    ...p,
    thai: removeThaiScript(p.thai, p.phonetic),
    exampleUsage: removeThaiScript(p.exampleUsage, p.phonetic),
  }));

  const sanitizedTop5Words = sheet.stats.top5Words.map((tw) => ({
    ...tw,
    thai: removeThaiScript(tw.thai, tw.phonetic),
  }));

  const sanitizedTop5Expressions = sheet.stats.top5Expressions.map((te) => ({
    ...te,
    thai: removeThaiScript(te.thai, te.phonetic),
  }));

  return {
    ...sheet,
    title: removeThaiScript(sheet.title),
    stats: {
      ...sheet.stats,
      top5Words: sanitizedTop5Words,
      top5Expressions: sanitizedTop5Expressions,
      segmentationNote: removeThaiScript(sheet.stats.segmentationNote),
    },
    words: sanitizedWords,
    expressions: sanitizedExpressions,
    structures: sanitizedStructures,
    particles: sanitizedParticles,
    pedagogicalAdvice: removeThaiScript(sheet.pedagogicalAdvice),
    summary: removeThaiScript(sheet.summary),
    keyPoints: sheet.keyPoints?.map((kp) => removeThaiScript(kp)),
    discussionHighlights: sheet.discussionHighlights?.map((dh) => removeThaiScript(dh)),
  };
}
