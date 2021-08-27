// @flow
import * as React from "react";
import { Switch } from "react-router-dom";
import DelayedMount from "components/DelayedMount";
import FullscreenLoading from "components/FullscreenLoading";
import Route from "components/ProfiledRoute";
import { matchDocumentSlug as slug } from "utils/routeHelpers";

const Authenticated = React.lazy(() =>
  import(/* webpackChunkName: "authenticated" */ "components/Authenticated")
);
const AuthenticatedRoutes = React.lazy(() =>
  import(/* webpackChunkName: "authenticated-routes" */ "./authenticated")
);
const KeyedDocument = React.lazy(() =>
  import(
    /* webpackChunkName: "keyed-document" */ "scenes/Document/KeyedDocument"
  )
);
const Login = React.lazy(() =>
  import(/* webpackChunkName: "login" */ "scenes/Login")
);
const LoginPrompt = React.lazy(() =>
  import(/* webpackChunkName: "login-prompt" */ "scenes/LoginPrompt")
);
const Logout = React.lazy(() =>
  import(/* webpackChunkName: "logout" */ "scenes/Logout")
);

export default function Routes() {
  return (
    <React.Suspense
      fallback={
        <DelayedMount delay={2000}>
          <FullscreenLoading />
        </DelayedMount>
      }
    >
      <Switch>
        <Route exact path="/" component={Login} />
        <Route exact path="/login/prompt" component={LoginPrompt} />
        <Route exact path="/create" component={Login} />
        <Route exact path="/logout" component={Logout} />
        <Route exact path="/share/:shareId" component={KeyedDocument} />
        <Route
          exact
          path={`/share/:shareId/doc/${slug}`}
          component={KeyedDocument}
        />
        <Authenticated>
          <AuthenticatedRoutes />
        </Authenticated>
      </Switch>
    </React.Suspense>
  );
}
