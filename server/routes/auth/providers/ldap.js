// @flow
import passport from "@outlinewiki/koa-passport";
import Router from "koa-router";
import crypto from "crypto";

import accountProvisioner from "../../../commands/accountProvisioner";
import { Strategy as LdapStrategy } from "passport-ldapauth";
import { LdapLookupError } from "../../../errors";
import passportMiddleware from "../../../middlewares/passport";
import { StateStore } from "../../../utils/passport";
import { signIn } from "../../../utils/authentication";

const router = new Router();
const providerName = "ldap";
const LDAP_HOSTNAME = process.env.LDAP_HOSTNAME;
const LDAP_SEARCH_BASE = process.env.LDAP_SEARCH_BASE;
const LDAP_SEARCH_FILTER = process.env.LDAP_SEARCH_FILTER;
const LDAP_DEFAULT_TEAM_UID = process.env.LDAP_DEFAULT_TEAM_UID; // TODO: support ldap DIT based teams
const LDAP_DEFAULT_TEAM_NAME = process.env.LDAP_DEFAULT_TEAM_NAME; // TODO: support ldap DIT based teams
const LDAP_DEFAULT_TEAM_DOMAIN = process.env.LDAP_DEFAULT_TEAM_DOMAIN; // TODO: support ldap DIT based teams
const LDAP_DEFAULT_TEAM_SUBDOMAIN = process.env.LDAP_DEFAULT_TEAM_SUBDOMAIN; // TODO: support ldap DIT based teams
const LDAP_USER_DISPLAY_NAME = process.env.LDAP_USER_DISPLAY_NAME || "uid";

const extract_object = (cookie_str) => {
  return cookie_str.split('; ').reduce((prev, current) => {
      const [name, ...value] = current.split('=');
      prev[name] = value.join('=');
      return prev;
    }, {});
}

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

export const config = {
  name: "LDAP",
  enabled: !!LDAP_HOSTNAME,
};

if (LDAP_HOSTNAME) {
  // Reference: https://www.passportjs.org/packages/passport-ldapauth/
  passport.use('ldap', new LdapStrategy(
    {
      server: {
        url: LDAP_HOSTNAME,
        searchBase: LDAP_SEARCH_BASE,
        searchFilter: LDAP_SEARCH_FILTER,
        searchAttributes: undefined
      },
      store: new StateStore()
    },
    async function(user, done) {
      // Called when passport.authenticate(...) is successful

      if (!!!user.mail) {
        throw new LdapLookupError(
          "'email' property is required but could not be found in user profile."
        );
      }
      if (!!!user.uid) {
        throw new LdapLookupError(
          "'uid' property is required but could not be found in user profile."
        );
      }
      if (!!!user[LDAP_USER_DISPLAY_NAME]) {
        throw new LdapLookupError(
          "'" + LDAP_USER_DISPLAY_NAME + "' property is required but could not be found in user profile."
        );
      }

      // FIXME Constants
      const req_ip = "0.0.0.0";
      const team_name = LDAP_DEFAULT_TEAM_NAME;
      const team_domain = LDAP_DEFAULT_TEAM_DOMAIN;
      const team_subdomain = LDAP_DEFAULT_TEAM_SUBDOMAIN;
      const team_uid = crypto.createHash('sha256').update(
                          [LDAP_DEFAULT_TEAM_UID, team_domain, team_subdomain].join('.')
                        ).digest('hex'); // This just needs to be unique, so we generate a hash

      // Provision user
      try {
        // Email and username are treated as the global unique identifiers
        const result = await accountProvisioner({
          ip: req_ip,
          user: {
            name: user[LDAP_USER_DISPLAY_NAME],
            email: user.mail,
          },
          team: {
            name: team_name,
            domain: team_domain,
            subdomain: team_subdomain,
          },
          authenticationProvider: {
            name: providerName,
            providerId: team_uid,
          },
          authentication: {
            providerId: user.uid,
            scopes: [],
          },
        });
        return done(null, result.user, result);
      } catch (err) {
        return done(err, null);
      }
    }
  ));

  // [get] auth/ldap
  // This is the default entrypoint for when the user clicks authenticate with LDAP
  // on the login page. Use this to redirect to login/prompt
  router.get("ldap", function(ctx){
    ctx.redirect('/login/prompt');
  });

  // [post] auth/ldap
  // Authentication endpoint where request body has the username and password
  router.post("ldap", function(ctx) {
    // Check to see if request is coming from LoginPrompt
    const cookies = extract_object(ctx.request.header.cookie);
    if (!!!cookies['ldap-prompt'] || (!!cookies['ldap-prompt'] && cookies['ldap-prompt'] == 'false')) {
      // Prompt has not been displayed; respond with precondition failed
      ctx.status = 412;
      return;
    }

    // If any processing needs to be done to the username or password
    // ctx.request.body.username = // modify the username before passing it to authenticate
    // ctx.request.body.password = // decrypt or modify password before passing it to authenticate

    return passport.authenticate(providerName, async function(err, user, info) {
      if (err) {
        ctx.status = 400;
        ctx.body = err;
        return;
      }
      if (!!!user) {
        ctx.status = 401;
        ctx.body = "Invalid username or password!"
        return;
      }
      await user.update({ lastActiveAt: new Date() });
      // set cookies on response and redirect to team subdomain
      await signIn(ctx, user, info.team, providerName, false, false);
      ctx.status = 200; // This is technically unnecessary
    })(ctx);
  });
}

export default router;
