export type PublicSubRoute = "request" | "tracking" | "borrow";

export type AuthRoute =
  | "overview"
  | "inventory"
  | "request-center"
  | "lending"
  | "release"
  | "restocking"
  | "procurement"
  | "events"
  | "administration"
  | "profile";

export type Route = "landing" | "staff-signin" | PublicSubRoute | AuthRoute;

export type AuthGateState =
  | "signed-out"
  | "auth-required"
  | "loading"
  | "authorized"
  | "denied"
  | "activation-required"
  | "service-error";

export type Session = {
  authenticated: true;
  displayName: string;
  role: string;
  initials: string;
  capabilities: AuthRoute[];
};
