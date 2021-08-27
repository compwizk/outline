# README

This readme contains notes and changes separate from upstream Outline.

## Development

1. Start the container stack
1. Open a shell in `outline_outline_1`
1. Follow the `Makefile` `up` commands:
	```
	# Only needed the first time or if package dependencies are changed
	yarn install --pure-lockfile
	# Must be run every time the _container stack_ is restarted (or the DB reset)
	yarn sequelize db:migrate
	# Ensure the .env file exists and then start the hot reloading development server (http://localhost:3000)
	yarn dev
	```

> The `.env.dev` file has the current configuration template that can be used for development. This should NOT be used in production.


## Configuration changes

| Variable                    | Description                            | Default                                       | Sample Value          |
|-----------------------------|----------------------------------------|-----------------------------------------------|-----------------------|
| LDAP_HOSTNAME               | LDAP server address                    |                                               | ldap://127.0.0.1:389  |
| LDAP_SEARCH_BASE            | DIT search base                        |                                               | o=users,o=example.com |
| LDAP_SEARCH_FILTER          | DIT match condition                    |                                               | (uid={{username}})    |
| LDAP_DEFAULT_TEAM_NAME      | Instance team name                     |                                               | My Team               |
| LDAP_DEFAULT_TEAM_UID       | Instance team uid (lowercase)          |                                               | myteam                |
| LDAP_DEFAULT_TEAM_DOMAIN    | Instance team domain                   |                                               | example               |
| LDAP_DEFAULT_TEAM_SUBDOMAIN | Instance team subdomain                |                                               | myteam                |
| LDAP_USER_DISPLAY_NAME      | DIT user display name key              | uid                                           | displayName           |


## LDAP Limitations

LDAP support is added here for internal LDAP servers (slapd, etc) using [passport-ldapauth](https://www.passportjs.org/packages/passport-ldapauth/), but has a some limitations as noted below. If you are using a full-fledged LDAP SSO system that supports tokens, consider reaching out the the Outline team and paying for their enterprise service to get first-class support and to enable them to improve their amazing product!

- Authentication between client and server via login page transmits username/password in the clear. There is _some_ security if you are using HTTPS and are on a secured internal network, but this needs to be improved.
- Only default team configuration is currently supported. Pulling organization structure from DIT would enable support for multiple teams and eliminate the need to manually specify team information in the system-wide configuration
