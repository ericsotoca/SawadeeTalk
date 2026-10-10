export interface WordItem {
  thai: string;
  phonetic: string;
  pronunciationFr: string;
  tone: string;
  french: string;
  occurrences: number;
  category: string;
  exampleThai: string;
  exampleFrench: string;
}

export interface ExpressionItem {
  thai: string;
  phonetic: string;
  pronunciationFr: string;
  french: string;
  occurrences: number;
  context: string;
  contextTag: 'salutation' | 'question' | 'accord' | 'demande' | 'quotidien' | 'reaction' | 'autre';
  exampleThai: string;
  exampleFrench: string;
}

export interface StructureItem {
  structureThai: string;
  meaningFrench: string;
  grammarExplanation: string;
  exampleThai: string;
  exampleFrench: string;
}

export interface ParticleItem {
  thai: string;
  phonetic: string;
  role: string;
  category: 'politesse' | 'interrogation' | 'accord' | 'hesitation' | 'liaison' | 'reaction';
  speakerRegister: string;
  exampleUsage: string;
}

export interface TopItemSummary {
  thai: string;
  phonetic: string;
  french: string;
  count: number;
}

export interface ConversationStats {
  durationSeconds: number;
  durationFormatted: string;
  totalSpokenWordsApprox: number;
  distinctThaiWords: number;
  distinctThaiExpressions: number;
  repeatedExpressionsCount: number;
  totalOccurrencesCount: number;
  top5Words: TopItemSummary[];
  top5Expressions: TopItemSummary[];
  segmentationNote?: string;
}

export interface StudySheet {
  id: string;
  createdAt: string;
  dateFormatted: string;
  title: string;
  durationSeconds: number;
  stats: ConversationStats;
  words: WordItem[];
  expressions: ExpressionItem[];
  structures: StructureItem[];
  particles: ParticleItem[];
  pedagogicalAdvice?: string;
}

export interface FlashcardItem {
  id: string;
  sourceSheetTitle: string;
  sourceSheetId: string;
  thai: string;
  phonetic: string;
  pronunciationFr: string;
  french: string;
  context: string;
  contextTag: ExpressionItem['contextTag'];
  exampleThai: string;
  exampleFrench: string;
  occurrences: number;
}
