# ML-UI-Resources (MUIR) Node Server

This contains the Node implementation of a ML-UI-Resources (MUIR) middle-tier. It is currently the default middle-tier for that project.

## Running

    npm start

## Configuration

This project is configured via environment variables, roughly following the [recommendations from "The Twelve-Factor App"](https://12factor.net/config). Following established practice in the Vue.js and React communities, among others, we modify those recommendations by allowing configuration groupings for "development", "production" or other custom environments.

### Environment variables

You can use environment variables to override specific pieces of configuration, or even to provide all the configuration for this MUIR-generated Node middle-tier.

You can find the environment variables this application looks for in `utils/options.js`. Those environment variables currently include:

- `MUIR_APP_NAME`: The name of this MUIR application. It is used to set cookies and is provided to the middle-tier as server metadata during authentication. It may also be used, for example, to establish which usernames are app-specific usernames. This can be used in conjunction with the `MUIR_APP_USERS_ONLY` setting to restrict the MarkLogic users considered valid by this middle-tier.
- `MUIR_SESSION_SECRET`: The [session secret for this application's Express session](https://github.com/expressjs/session#secret). For security, it is advisable to set a different secret in each of your deployments and to keep it out of version control (see section on .env\*.local files for one strategy).
- `MUIR_APP_PORT`: The port this middle-tier will listen on.
- `MUIR_ML_HOST`: The host on which the MarkLogic REST server with which this server will communicate is available.
- `MUIR_ML_REST_PORT`: The port on which the MarkLogic REST server with which this server will communicate is available.
- `MUIR_APP_USERS_ONLY`: An optional setting, instructing this middle-tier application not to authorize any users whose usernames do not being with `MUIR_APP_NAME`. This is particularly helpful in a situation where the backend MarkLogic instance has many users, and you do not wish to allow those other users (including administrators) to log into this application. During auth calls, this application may inform the front-end of this setting.
- `MUIR_DISALLOW_UPDATES`: An optional setting, instructing this middle-tier application not to allow any user to update data. During auth calls, this application may inform the front-end of this setting.

### `.env` Configuration files

There are many ways to set environment variables and those ways depend on the context within which your application is running. Feel free to use what fits your purposes.

For convenience, this project adopts the pattern of `.env` files. When starting via `npm start`, the application will load environment variables stored with a `.env` file. You can override or extend that configuration for specific application-environments, such as "development", "production", or "test".

 `.env` files **should be checked into version control** and **should not contain secrets**.**Be careful not to commit any configuration file containing application secrets into version control.** Such secrets could leak if the project repository was ever hosted publicly. Secrets belong in a `.env.local` file, or an application-environment-specific file such as `.env.development.local`. Such files are listed in this project's `.gitignore` file by default, and should remain there.

The following files in the root of this project's source code are valid. The existing environment is checked first, then the files in this list from bottom to top. The first value encountered will take precedence.

- `.env`: Default, project-wide settings.
- `.env.local`: Settings, ignored by git, which override those in `.env`. This is advisable to use in development, for example, for developer-specific configuration. **This file is not loaded when `NODE_ENV` = 'test'** because tests should be consistent across environments.
- `.env.{app-environment}`: Settings loaded only in a specific app-environment. This depends on the NODE_ENV. For example, `npm start` will load `.env.development` while `npm test` will load `.env.test`. `npm run build` will run in production by default and use `.env.production`
- `.env.{app-environment}.local`: Settings loaded only in a specific app-environment and ignored by git.

You will find the allowable options in `utils/options.js`. You are advised to use the `muir config` command-line tool to update those, rather than changing them yourself. This allows any MUIR-configured UI to stay in sync.

Upon generation, this application should already have a `.env` file, which as a simple `KEY=value` syntax:

    FOO=bar
    MUIR_APP_NAME=killer-demo

For more advanced usage and information, please see the [documentation for the dotenv project](https://github.com/motdotla/dotenv).
