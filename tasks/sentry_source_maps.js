/*
 * grunt-sentry-source-maps
 * git://github.com/selfagency/grunt-sentry-source-maps
 *
 * Copyright (c) 2017 Daniel Sieradski
 * Licensed under the GPLv3 license.
 */

'use strict'
require('whatwg-fetch')

const btoa     = require('abab').btoa
const desc     = 'Automatically creates release info for and pushes JS source maps to Sentry.io.'
const fs       = require('fs')
const git      = require('git-last-commit')
const sha1File = require('sha1-file')
const version  = require('package.json').version

module.exports = function(grunt) {
  grunt.registerMultiTask('sentry_source_maps', desc, () => {
    const release = btoa(`${options.project} v${version}`)
    const apiOpts  = {
      method: 'POST',
      headers: [`Authorization: Bearer ${options.token}`, 'Content-Type: application/json'],
      mode: 'cors',
      cache: 'default'
    }

    function configTest () {
      const optKeys = ['sourceFiles', 'scriptsUrl', 'repo', 'orgSlug', 'projectSlug', 'token']
      for (var key in optKeys) {
        if (!(key in options)) {
          let err = new Error(`Required option '${key}' is missing.`)
          grunt.log.writeln(err.message)
          throw err
        } else {
          if (options[key] == null) {
            let err = new Error(`Required option '${key}' is undefined.`)
            grunt.log.writeln(err.message)
            throw err
          }
        }
      }
    }

    const commit = () => {
      return git.getLastCommit((error, commit) => {
        return commit
      })
    }

    function createRelease() {
      const endpoint = `https://sentry.io/api/0/organizations/${options.orgSlug}/releases/`

      const body = {
        version: release,
        dateCreated: Date.toISOString(commit.commitedOn),
        refs: [{
          repository: options.repo,
          commit: commit.hash,
          project: options.project
        }],
        projects: [options.project]
      }

      grunt.log.writeln('Pushing release to Sentry.io')
      fetch (endpoint, apiOpts, body)
        .then(response => {
          return response.json()
        })
        .then(json => {
          grunt.log.writeln(JSON.stringify(json, undefined, 2))
        })
        .catch(err => {
          grunt.log.writeln(`Error pushing release: ${err.message}`)
          throw err
        })
    }

    function uploadMaps(fileObj) {
      const endpoint = `https://sentry.io/api/0/projects/${options.orgSlug}/${options.projectSlug}/releases/${release}/files/`

      let body = {
        headers: { 'Content-Type': 'application/octet-stream' },
        id: fileObj.id,
        dateCreated: fileObj.timestamp,
        file: fileObj.file,
        name: `${scriptsUrl}/${fileObj.name}`,
        sha1: fileObj.hash,
        size: fileObj.size
      }

      grunt.log.writeln('Uploading source maps to Sentry.io')
      fetch (endpoint, apiOpts, body)
        .then(response => {
          return response.json()
        })
        .then(json => {
          grunt.log.writeln(JSON.stringify(json, undefined, 2))
        })
        .catch(err => {
          grunt.log.writeln(`Error uploading source map: ${err.message}`)
          throw err
        })
    }

    function pushSourceMaps () {
      let i = 1

      options.sourceFiles.forEach(file => {
        let fileObj = {
          name: file,
          id: i
        }

        const stats = fs.statSync(file)
        fileObj.timestamp = Date.toISOString(stats.ctimeMs)
        fileObj.size = stats.size

        sha1File(file, (err, hash) => {
          if (err) {
            grunt.log.writeln(`Cannot get sha1 hash for ${file}: ${err.message}`)
            throw err
          }
          fileObj.hash = hash
        })

        fs.open(file, 'r', (err, fd) => {
          if (err) {
            grunt.log.writeln(`Cannot open ${file}: ${err.message}`)
            throw err
          } else {
            fileObj.file = fd
            uploadMaps(fileObj)
          }
        })

        i++
      })
    }

    configTest()
    createRelease()
    pushSourceMaps()
  })
}
