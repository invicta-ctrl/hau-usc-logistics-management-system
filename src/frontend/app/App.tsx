import { AppRouteRenderer } from "./AppRouteRenderer";
import { useAppController } from "./useAppController";

export default function App() {
  const controller = useAppController();
  return <AppRouteRenderer controller={controller} />;
}
