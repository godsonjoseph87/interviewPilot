import type {
  Question,
  QuestionEvaluation,
  DsaSubmission,
  CategoryScoreItem,
  HiringRecommendation,
} from '@/types';

export interface CalculatedScores {
  overallScore100: number;
  totalEarned: number;
  totalPossible: number;
  categoryScores: CategoryScoreItem[];
  dsaAverageScore: number;
  recommendedHiringStatus: HiringRecommendation;
}

/**
 * Deterministically computes question scores, category breakdowns, and overall percentage.
 * Excludes skipped questions from penalizing the candidate (as requested in Section 6).
 */
export function calculateInterviewScores(
  questions: Question[],
  evaluations: QuestionEvaluation[],
  dsaSubmissions: DsaSubmission[]
): CalculatedScores {
  const evalMap = new Map<string, QuestionEvaluation>();
  evaluations.forEach((ev) => evalMap.set(ev.questionId, ev));

  const categoryMap = new Map<string, { earned: number; possible: number }>();
  let totalTechnicalEarned = 0;
  let totalTechnicalPossible = 0;

  for (const q of questions) {
    const ev = evalMap.get(q.id);
    const category = q.category || 'General';

    if (!categoryMap.has(category)) {
      categoryMap.set(category, { earned: 0, possible: 0 });
    }

    const currentCat = categoryMap.get(category)!;

    // Skipped questions are excluded from scored responses (Section 6)
    if (ev?.status === 'skipped') {
      continue;
    }

    const maxScore = q.maxScore || 10;
    let earned = 0;

    if (ev?.status === 'correct') {
      earned = maxScore;
    } else if (ev?.status === 'partially_correct') {
      earned = ev.score !== undefined ? ev.score : maxScore * 0.5;
    } else if (ev?.status === 'incorrect') {
      earned = 0;
    }

    currentCat.earned += earned;
    currentCat.possible += maxScore;
    totalTechnicalEarned += earned;
    totalTechnicalPossible += maxScore;
  }

  // DSA calculations
  let dsaTotal = 0;
  let dsaCount = 0;
  for (const sub of dsaSubmissions) {
    if (sub.review) {
      // Use interviewer adjusted score if present, else AI score
      const finalDsaScore = sub.review.interviewerAdjustedScore ?? sub.review.overallScore100;
      dsaTotal += finalDsaScore;
      dsaCount++;
    }
  }

  const dsaAverageScore = dsaCount > 0 ? Math.round(dsaTotal / dsaCount) : 0;

  // Add DSA category
  if (dsaCount > 0) {
    categoryMap.set('Data Structures & Algorithms', {
      earned: dsaTotal,
      possible: dsaCount * 100,
    });
  }

  // Convert categories to array
  const categoryScores: CategoryScoreItem[] = [];
  categoryMap.forEach((val, cat) => {
    const pct = val.possible > 0 ? Math.round((val.earned / val.possible) * 100) : 0;
    categoryScores.push({
      category: cat,
      earned: Math.round(val.earned * 10) / 10,
      possible: val.possible,
      percentage: pct,
    });
  });

  // Calculate weighted overall score (75% Technical questions, 25% DSA if present)
  let overallScore100 = 0;
  const techPct = totalTechnicalPossible > 0 ? (totalTechnicalEarned / totalTechnicalPossible) * 100 : 0;

  if (dsaCount > 0) {
    overallScore100 = Math.round(techPct * 0.7 + dsaAverageScore * 0.3);
  } else {
    overallScore100 = Math.round(techPct);
  }

  // Deterministic hiring recommendation baseline:
  // 85+ Strong Hire, 70-84 Hire, 55-69 Lean Hire, 40-54 Lean No Hire, <40 No Hire
  let recommendedHiringStatus: HiringRecommendation = 'No Hire';
  if (overallScore100 >= 85) {
    recommendedHiringStatus = 'Strong Hire';
  } else if (overallScore100 >= 70) {
    recommendedHiringStatus = 'Hire';
  } else if (overallScore100 >= 55) {
    recommendedHiringStatus = 'Lean Hire';
  } else if (overallScore100 >= 40) {
    recommendedHiringStatus = 'Lean No Hire';
  } else {
    recommendedHiringStatus = 'No Hire';
  }

  return {
    overallScore100,
    totalEarned: Math.round(totalTechnicalEarned * 10) / 10,
    totalPossible: totalTechnicalPossible,
    categoryScores,
    dsaAverageScore,
    recommendedHiringStatus,
  };
}

