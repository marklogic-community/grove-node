# ML-UI-Resources (MUIR) Node Server

This contains the Node implementation of a ML-UI-Resources (MUIR) middle-tier. It is currently the default middle-tier for that project.

## Running

    npm start

## Configuration

This project can be configured via environment variables or via configuration files. Environment variables will take precedence.

### Configuration files

**Be careful not to commit any configuration file containing application secrets into version control.** You should use environment variables or `.gitignore`-d configuration files for that.

This project looks for options within a `muir.json` file. You can override or extend that configuration using a `muir-{NODE_ENV}.json` file. This is advisable in development, for example, for developer-specific `muir-development.json` configuration that is kept out of version control. It can also be used for production, with a `muir-production.json` file. Environment-specific files will take override `muir.json` properties.

These configuration files can be located in this directory, or in the parent directory. A local file will override a file in the parent directory of the same name.

You will find the allowable options in `utils/options.js`. You are advised to use the `muir config` command-line tool to update those, rather than changing them yourself. This allows any MUIR-configured UI to stay in sync.

Those allowable options currently include:

- `appName`: The name of this MUIR application. It is used to set cookies and is provided to the middle-tier as server metadata during authentication.
- `appPort`: The port this middle-tier will listen on.
- `mlHost`: The host on which the MarkLogic REST server with which this server will communicate is available.
- `mlRestPort`: The port on which the MarkLogic REST server with which this server will communicate is available.
- `disallowUpdates`: An optional setting, allowing this application to inform the front-end that the user should not be allowed to update data.

### Environment variables

You can use environment variables to override specific pieces of configuration, or even to provide all the configuration for your MUIR application.

There are influential schools of thought in current Web development that advocate keeping all of your configuration in environment variables. You can adopt that practice with this application.

You can find the environment variables this application looks for in `utils/options.js`. Those environment variables currently include:

- `MUIR_APP_NAME`: The name of this MUIR application. It is used to set cookies and is provided to the middle-tier as server metadata during authentication.
- `MUIR_APP_PORT`: The port this middle-tier will listen on.
- `ML_HOST`: The host on which the MarkLogic REST server with which this server will communicate is available.
- `ML_REST_PORT`: The port on which the MarkLogic REST server with which this server will communicate is available.
- `MUIR_DISALLOW_UPDATES`: An optional setting, allowing this application to inform the front-end that the user should not be allowed to update data.
