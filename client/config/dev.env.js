'use strict'
const merge = require('webpack-merge')
const prodEnv = require('./prod.env')

module.exports = merge(prodEnv, {
  NODE_ENV: '"development"',
  API_BASE_URL: `'${process.env.API_BASE_URL}'`
  S3_UPDATES_DATA_BUCKET: `'perfsys-cloud-crm-updates-data'`
})
