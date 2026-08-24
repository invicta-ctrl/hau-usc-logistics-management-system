import type { AuthRoute, Route } from '../../app/appTypes';
import { AuthPlaceholderRoute } from '../../app/auth/AuthPlaceholderRoute';
import { ProfileRoute } from '../../app/profile/ProfileRoute';
import { InventoryRoute } from '../../app/inventory/InventoryRoute';
import { InternalRequestHub } from '../../app/request/InternalRequestHub';
import { InternalLendingHub } from '../../app/lending/InternalLendingHub';
import { ExternalRequestCenter } from '../../app/request/ExternalRequestCenter';
import { AuthenticatedShell } from '../../app/shell/AuthenticatedShell';
import { LOCAL_PREVIEW_OPERATOR } from '../../app/shell/presentation';
import { PREVIEW_PROFILE, PREVIEW_REQUESTER_PORTAL } from './previewData';

export function PreviewInspectionRoute({
  route,
  dark,
  onToggleTheme,
  onBackToIndex,
  onExitToHome,
  onOpenRoute,
}: {
  route: Route;
  dark: boolean;
  onToggleTheme: () => void;
  onBackToIndex: () => void;
  onExitToHome: () => void;
  onOpenRoute: (route: Route) => boolean;
}) {
  if (route === 'external-request') {
    return (
      <div data-preview-inspection="true" data-preview-route="external-request">
        <section
          className="mx-4 mt-4 rounded-[8px] px-4 py-3 flex flex-wrap items-center justify-between gap-3"
          style={{ background: '#fff4d6', border: '1px solid #d1b478', color: '#40070a' }}
          role="note"
          aria-label="Preview inspection"
        >
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '0.35px' }}>
            PREVIEW INSPECTION · Local fixture only. No backend authorization has been granted.
          </p>
          <button type="button" className="preview-action" onClick={onBackToIndex}>
            Back to Preview Index
          </button>
        </section>
        <ExternalRequestCenter
          presentation={{ displayName: 'Preview Requester', internalOperator: false }}
          dark={dark}
          onToggleTheme={onToggleTheme}
          onHome={onExitToHome}
          onOpenLogisticsHub={onBackToIndex}
          onSignOut={async () => undefined}
          requesterMode={false}
          previewPortal={PREVIEW_REQUESTER_PORTAL}
          inspection
        />
      </div>
    );
  }

  const authRoute = route as AuthRoute;
  return (
    <AuthenticatedShell
      presentation={LOCAL_PREVIEW_OPERATOR}
      route={authRoute}
      navigate={(next) => {
        onOpenRoute(next);
      }}
      onHome={onExitToHome}
      onSignOut={onExitToHome}
      dark={dark}
      onToggle={onToggleTheme}
      inspection
      onBackToPreview={onBackToIndex}
    >
      {authRoute === 'profile' ? (
        <ProfileRoute dark={dark} onToggle={onToggleTheme} previewProfile={PREVIEW_PROFILE} />
      ) : authRoute === 'inventory' ? (
        <InventoryRoute dark={dark} navigate={onOpenRoute} inspection />
      ) : authRoute === 'request-center' ? (
        <InternalRequestHub dark={dark} navigate={onOpenRoute} inspection canReviewRequests />
      ) : authRoute === 'lending' ? (
        <InternalLendingHub
          dark={dark}
          navigate={onOpenRoute}
          inspection
          canApproveLending
          canHandoffLending
          canReturnLending
          canUploadLendingEvidence
        />
      ) : (
        <AuthPlaceholderRoute route={authRoute} />
      )}
    </AuthenticatedShell>
  );
}
