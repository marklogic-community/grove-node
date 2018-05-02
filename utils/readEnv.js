'use strict'

var fs = require('fs')

module.exports = {
  readEnv: function readEnv() {
    var NODE_ENV = process.env.NODE_ENV
    if (!NODE_ENV) {
      throw new Error(
        'The NODE_ENV environment variable is required but was not specified.'
      )
    }

    var dotenv = './.env'
    var dotenvFiles = [
      dotenv + '.' + NODE_ENV + '.local',
      dotenv + '.' + NODE_ENV,
      // Don't include `.env.local` for `test` environment
      // since normally you expect tests to produce the same
      // results for everyone
      NODE_ENV !== 'test' && dotenv + '.local',
      dotenv
    ].filter(Boolean)

    // Load environment variables from .env* files.
    // https://github.com/motdotla/dotenv
    dotenvFiles.forEach(function(dotenvFile) {
      if (fs.existsSync(dotenvFile)) {
        require('dotenv').config({
          path: dotenvFile
        })
      }
    })
  }
}
