import "server-only";

import {
  executeQuery,
  executeQueryFirst,
  executeMutation,
  generateId,
  type D1DatabaseLike,
} from "@/lib/d1-client";
import { getMCQWithChoices } from "./mcq-service";

export type MCQAttempt = {
  id: string;
  mcqId: string;
  userId: string;
  selectedChoiceIds: string[];
  isCorrect: boolean;
  score: number;
  completedAt: number;
};

export type CreateAttemptInput = {
  mcqId: string;
  userId: string;
  selectedChoiceIds: string[];
};

export type AttemptResult = {
  attempt: MCQAttempt;
  correctChoiceIds: string[];
  explanation: string;
};

type MCQAttemptRow = {
  id: string;
  mcq_id: string;
  user_id: string;
  selected_choice_ids: string;
  is_correct: number;
  score: number;
  completed_at: number;
};

function mapRowToAttempt(row: MCQAttemptRow): MCQAttempt {
  return {
    id: row.id,
    mcqId: row.mcq_id,
    userId: row.user_id,
    selectedChoiceIds: JSON.parse(row.selected_choice_ids),
    isCorrect: row.is_correct === 1,
    score: row.score,
    completedAt: row.completed_at,
  };
}

export async function createAttempt(
  db: D1DatabaseLike,
  input: CreateAttemptInput,
): Promise<AttemptResult> {
  const mcq = await getMCQWithChoices(db, input.mcqId);
  if (!mcq) {
    throw new Error("MCQ not found");
  }

  if (input.selectedChoiceIds.length === 0) {
    throw new Error("At least one choice must be selected");
  }

  const correctChoices = mcq.choices.filter((c) => c.isCorrect);
  const correctChoiceIds = correctChoices.map((c) => c.id);

  const selectedSet = new Set(input.selectedChoiceIds);
  const correctSet = new Set(correctChoiceIds);

  const allCorrectSelected = correctChoiceIds.every((id) => selectedSet.has(id));
  const noIncorrectSelected = input.selectedChoiceIds.every((id) =>
    correctSet.has(id)
  );

  const isCorrect = allCorrectSelected && noIncorrectSelected;
  const score = isCorrect ? 100 : 0;

  const attemptId = generateId();
  const timestamp = Date.now();

  await executeMutation(
    db,
    `INSERT INTO mcq_attempt (id, mcq_id, user_id, selected_choice_ids, is_correct, score, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      attemptId,
      input.mcqId,
      input.userId,
      JSON.stringify(input.selectedChoiceIds),
      isCorrect ? 1 : 0,
      score,
      timestamp,
    ],
  );

  const attempt = await getAttemptById(db, attemptId);
  if (!attempt) {
    throw new Error("Failed to load attempt after creation");
  }

  let explanation = "";
  if (isCorrect) {
    explanation = "Correct! You selected all the right answers.";
  } else if (!allCorrectSelected) {
    explanation = "Incorrect. You missed some correct answers.";
  } else {
    explanation = "Incorrect. You selected some wrong answers.";
  }

  return {
    attempt,
    correctChoiceIds,
    explanation,
  };
}

export async function getAttemptById(
  db: D1DatabaseLike,
  id: string,
): Promise<MCQAttempt | null> {
  const row = await executeQueryFirst<MCQAttemptRow>(
    db,
    "SELECT * FROM mcq_attempt WHERE id = ?",
    [id],
  );
  return row ? mapRowToAttempt(row) : null;
}

export async function getAttemptsByUser(
  db: D1DatabaseLike,
  userId: string,
): Promise<MCQAttempt[]> {
  const rows = await executeQuery<MCQAttemptRow>(
    db,
    "SELECT * FROM mcq_attempt WHERE user_id = ? ORDER BY completed_at DESC",
    [userId],
  );
  return rows.map(mapRowToAttempt);
}

export async function getAttemptsByMCQ(
  db: D1DatabaseLike,
  mcqId: string,
): Promise<MCQAttempt[]> {
  const rows = await executeQuery<MCQAttemptRow>(
    db,
    "SELECT * FROM mcq_attempt WHERE mcq_id = ? ORDER BY completed_at DESC",
    [mcqId],
  );
  return rows.map(mapRowToAttempt);
}

export async function getUserAttemptForMCQ(
  db: D1DatabaseLike,
  mcqId: string,
  userId: string,
): Promise<MCQAttempt[]> {
  const rows = await executeQuery<MCQAttemptRow>(
    db,
    "SELECT * FROM mcq_attempt WHERE mcq_id = ? AND user_id = ? ORDER BY completed_at DESC",
    [mcqId, userId],
  );
  return rows.map(mapRowToAttempt);
}

export async function getMCQStats(
  db: D1DatabaseLike,
  mcqId: string,
): Promise<{
  totalAttempts: number;
  correctAttempts: number;
  successRate: number;
}> {
  const row = await executeQueryFirst<{
    total: number;
    correct: number;
  }>(
    db,
    `SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct
     FROM mcq_attempt 
     WHERE mcq_id = ?`,
    [mcqId],
  );

  const totalAttempts = row?.total ?? 0;
  const correctAttempts = row?.correct ?? 0;
  const successRate = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;

  return {
    totalAttempts,
    correctAttempts,
    successRate,
  };
}
