import type { Session } from '../appTypes';
import { OperationalModuleRoute } from '../operations/OperationalModuleRoute';

export function OverviewRoute({ session }: { session: Session }) {
  return <OperationalModuleRoute module="overview" sessionName={session.displayName} />;
}
