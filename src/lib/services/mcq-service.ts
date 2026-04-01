import "server-only";

import {
  executeQuery,
  executeQueryFirst,
  executeMutation,
  generateId,
  type D1DatabaseLike,
} from "@/lib/d1-client";

export type MCQ = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  question: string;
  createdAt: number;
  updatedAt: number;
};

export type MCQChoice = {
  id: string;
  mcqId: string;
  choiceText: string;
  isCorrect: boolean;
  choiceOrder: number;
};

export type MCQWithChoices = MCQ & {
  choices: MCQChoice[];
};

export type CreateMCQInput = {
  userId: string;
  title: string;
  description?: string;
  question: string;
  choices: {
    choiceText: string;
    isCorrect: boolean;
  }[];
};

export type UpdateMCQInput = {
  title?: string;
  description?: string;
  question?: string;
  choices?: {
    choiceText: string;
    isCorrect: boolean;
  }[];
};

type MCQRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  question: string;
  created_at: number;
  updated_at: number;
};

type MCQChoiceRow = {
  id: string;
  mcq_id: string;
  choice_text: string;
  is_correct: number;
  choice_order: number;
};

function mapRowToMCQ(row: MCQRow): MCQ {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    question: row.question,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRowToChoice(row: MCQChoiceRow): MCQChoice {
  return {
    id: row.id,
    mcqId: row.mcq_id,
    choiceText: row.choice_text,
    isCorrect: row.is_correct === 1,
    choiceOrder: row.choice_order,
  };
}

export async function getMCQById(
  db: D1DatabaseLike,
  id: string,
): Promise<MCQ | null> {
  const row = await executeQueryFirst<MCQRow>(
    db,
    "SELECT * FROM mcq WHERE id = ?",
    [id],
  );
  return row ? mapRowToMCQ(row) : null;
}

export async function getMCQWithChoices(
  db: D1DatabaseLike,
  id: string,
): Promise<MCQWithChoices | null> {
  const mcq = await getMCQById(db, id);
  if (!mcq) return null;

  const choiceRows = await executeQuery<MCQChoiceRow>(
    db,
    "SELECT * FROM mcq_choice WHERE mcq_id = ? ORDER BY choice_order ASC",
    [id],
  );

  return {
    ...mcq,
    choices: choiceRows.map(mapRowToChoice),
  };
}

export async function listMCQsByUser(
  db: D1DatabaseLike,
  userId: string,
): Promise<MCQ[]> {
  const rows = await executeQuery<MCQRow>(
    db,
    "SELECT * FROM mcq WHERE user_id = ? ORDER BY created_at DESC",
    [userId],
  );
  return rows.map(mapRowToMCQ);
}

export async function listAllMCQsWithChoices(
  db: D1DatabaseLike,
  userId: string,
): Promise<MCQWithChoices[]> {
  const mcqs = await listMCQsByUser(db, userId);
  
  const mcqsWithChoices = await Promise.all(
    mcqs.map(async (mcq) => {
      const choiceRows = await executeQuery<MCQChoiceRow>(
        db,
        "SELECT * FROM mcq_choice WHERE mcq_id = ? ORDER BY choice_order ASC",
        [mcq.id],
      );
      return {
        ...mcq,
        choices: choiceRows.map(mapRowToChoice),
      };
    })
  );

  return mcqsWithChoices;
}

export async function createMCQ(
  db: D1DatabaseLike,
  input: CreateMCQInput,
): Promise<MCQWithChoices> {
  if (input.choices.length < 2 || input.choices.length > 4) {
    throw new Error("MCQ must have between 2 and 4 choices");
  }

  const hasCorrectAnswer = input.choices.some((c) => c.isCorrect);
  if (!hasCorrectAnswer) {
    throw new Error("At least one choice must be marked as correct");
  }

  const mcqId = generateId();
  const timestamp = Date.now();

  await executeMutation(
    db,
    `INSERT INTO mcq (id, user_id, title, description, question, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      mcqId,
      input.userId,
      input.title,
      input.description ?? null,
      input.question,
      timestamp,
      timestamp,
    ],
  );

  for (let i = 0; i < input.choices.length; i++) {
    const choice = input.choices[i];
    await executeMutation(
      db,
      `INSERT INTO mcq_choice (id, mcq_id, choice_text, is_correct, choice_order)
       VALUES (?, ?, ?, ?, ?)`,
      [
        generateId(),
        mcqId,
        choice.choiceText,
        choice.isCorrect ? 1 : 0,
        i + 1,
      ],
    );
  }

  const created = await getMCQWithChoices(db, mcqId);
  if (!created) {
    throw new Error("Failed to load MCQ after creation");
  }
  return created;
}

export async function updateMCQ(
  db: D1DatabaseLike,
  id: string,
  input: UpdateMCQInput,
): Promise<MCQWithChoices> {
  const existing = await getMCQById(db, id);
  if (!existing) {
    throw new Error("MCQ not found");
  }

  const timestamp = Date.now();
  const updates: string[] = [];
  const params: unknown[] = [];

  if (input.title !== undefined) {
    updates.push("title = ?");
    params.push(input.title);
  }
  if (input.description !== undefined) {
    updates.push("description = ?");
    params.push(input.description);
  }
  if (input.question !== undefined) {
    updates.push("question = ?");
    params.push(input.question);
  }

  if (updates.length > 0) {
    updates.push("updated_at = ?");
    params.push(timestamp);
    params.push(id);

    await executeMutation(
      db,
      `UPDATE mcq SET ${updates.join(", ")} WHERE id = ?`,
      params,
    );
  }

  if (input.choices !== undefined) {
    if (input.choices.length < 2 || input.choices.length > 4) {
      throw new Error("MCQ must have between 2 and 4 choices");
    }

    const hasCorrectAnswer = input.choices.some((c) => c.isCorrect);
    if (!hasCorrectAnswer) {
      throw new Error("At least one choice must be marked as correct");
    }

    await executeMutation(db, "DELETE FROM mcq_choice WHERE mcq_id = ?", [id]);

    for (let i = 0; i < input.choices.length; i++) {
      const choice = input.choices[i];
      await executeMutation(
        db,
        `INSERT INTO mcq_choice (id, mcq_id, choice_text, is_correct, choice_order)
         VALUES (?, ?, ?, ?, ?)`,
        [
          generateId(),
          id,
          choice.choiceText,
          choice.isCorrect ? 1 : 0,
          i + 1,
        ],
      );
    }
  }

  const updated = await getMCQWithChoices(db, id);
  if (!updated) {
    throw new Error("Failed to load MCQ after update");
  }
  return updated;
}

export async function deleteMCQ(
  db: D1DatabaseLike,
  id: string,
): Promise<void> {
  await executeMutation(db, "DELETE FROM mcq WHERE id = ?", [id]);
}

export async function verifyMCQOwnership(
  db: D1DatabaseLike,
  mcqId: string,
  userId: string,
): Promise<boolean> {
  const mcq = await getMCQById(db, mcqId);
  return mcq !== null && mcq.userId === userId;
}
