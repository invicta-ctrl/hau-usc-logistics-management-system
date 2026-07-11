export function taskRisk(task, today) {
  if (task.status === 'COMPLETED') return 'DONE';
  if (task.dueDate < today) return 'OVERDUE';
  const days = Math.ceil((new Date(`${task.dueDate}T12:00:00Z`) - new Date(`${today}T12:00:00Z`)) / 86400000);
  return days <= 3 || task.blockedReason ? 'AT_RISK' : 'ON_TRACK';
}
