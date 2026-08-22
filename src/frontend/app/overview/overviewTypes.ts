export type ExceptionItem = {
  id: string;
  title: string;
  ref: string;
  badge: string;
  badgeStyle: { background: string; color: string };
  age: string;
  // Inspector structure
  state: string;
  owner: string;
  consequence: string;
  nextAction: string;
  locallyResolved?: boolean;
};
