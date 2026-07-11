export const VIEWS = [
  'overview',
  'requests',
  'release',
  'inventory',
  'lending',
  'restocking',
  'procurement',
  'reports',
];

export function createRouter({ onNavigate }) {
  const requestOnly =
    new URLSearchParams(location.search).get('mode') === 'request' || location.hash === '#request-only';
  const route = () => {
    const hash = location.hash.replace(/^#\/?/, '');
    const view = requestOnly ? 'requests' : VIEWS.includes(hash) ? hash : 'overview';
    onNavigate(view, { requestOnly });
  };
  addEventListener('hashchange', route);
  return {
    start: route,
    navigate(view) {
      location.hash = view;
    },
    requestOnly,
  };
}
