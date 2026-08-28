/** Status families from Figma HAU-USC / Semantic Color (correction R7). */
export type StatusTone = "neutral" | "info" | "progress" | "done" | "alert";

export type ExceptionItem = {
  id: string;
  /** Figma "Record" column: the identifier is the record, the title is its subtitle. */
  ref: string;
  title: string;
  /** Figma record subtitle, e.g. "Inventory · stock risk". */
  lane: string;
  /** Figma "Current state" column. */
  currentState: string;
  /** Figma "Evidence" column. */
  evidence: string;
  /** Figma "Next action" column — the short verb shown in gold, per row. */
  nextActionLabel: string;
  tone: StatusTone;
  age: string;
  // Inspector structure
  owner: string;
  consequence: string;
  /** The full sentence, shown only once a record is selected. */
  nextAction: string;
  locallyResolved?: boolean;
};
