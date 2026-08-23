export const LEDGER_STEPS = [
  { num: "01", label: "Request", body: "Someone states what is needed, what it is for, and when." },
  { num: "02", label: "Review", body: "The committee checks scope, stock and timing." },
  { num: "03", label: "Reserve", body: "Approved lines are held against inventory." },
  { num: "04", label: "Release", body: "Items are handed over and the handover is recorded." },
  { num: "05", label: "Return", body: "Borrowed items come back and their condition is noted." },
  { num: "06", label: "Ledger", body: "Every step is recorded; the evidence is permanent." },
] as const;
