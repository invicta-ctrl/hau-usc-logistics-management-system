export function overflowMenu(id, actions) {
  return `<div class="overflow"><button class="icon-button" type="button" data-overflow-toggle="${id}" aria-haspopup="menu" aria-expanded="false" aria-label="More actions for ${id}">⋯</button><div class="overflow-menu hidden" role="menu" data-overflow-menu="${id}">${actions.map((action) => `<button type="button" role="menuitem" data-action="${action.action}" data-id="${id}">${action.label}</button>`).join('')}</div></div>`;
}
