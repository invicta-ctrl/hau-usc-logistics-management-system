import { taskRisk } from '../../domain/tasks.js';
import { statusChip, escapeHtml } from '../../components/status-chip.js';

export function renderTaskTracker(state) {
  return `<section class="panel"><div class="panel-head"><div><h2>Event task tracker</h2><p>DIY materials must be completed before event day.</p></div><span class="pill">${state.eventTasks.length} tasks</span></div><div class="list">${state.eventTasks.map((task) => `<div class="list-item"><span><strong>${escapeHtml(task.title)}</strong><small>${escapeHtml(task.owner)} · due ${task.dueDate}<br>${escapeHtml(task.blockedReason || 'No blocker')} · ${task.readinessImpact} readiness impact</small></span>${statusChip(taskRisk(task, state.demoToday) === 'DONE' ? 'COMPLETED' : taskRisk(task, state.demoToday) === 'OVERDUE' ? 'OVERDUE' : 'FOR_REVIEW', taskRisk(task, state.demoToday))}</div>`).join('')}</div></section>`;
}
