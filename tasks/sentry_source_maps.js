/*
 * grunt-sentry-source-maps
 * git://github.com/selfagency/grunt-sentry-source-maps
 *
 * Copyright (c) 2017 Daniel Sieradski
 * Licensed under the GPLv3 license.
 */

'use strict'
require('core-js')
require('whatwg-fetch')

const cwd      = process.cwd()
const btoa     = require('abab').btoa
const desc     = 'Automatically creates release info for and pushes JS source maps to Sentry.io.'
const fs       = require('fs')
const Git      = require('nodegit')
const sha1File = require('sha1-file')
const version  = require(`${cwd}/package.json`).version

module.exports = function(grunt) {
  grunt.registerTask('sentry_source_maps', desc, () => {
    const options = grunt.task.current.options()
    const files = options.sourceFiles
    const release = btoa(`${options.project} v${version}`)
    const apiOpts  = {
      method: 'POST',
      headers: [`Authorization: Bearer ${options.token}`, 'Content-Type: application/json'],
      mode: 'cors',
      cache: 'default'
    }

    function configTest () {
      const optKeys = ['sourceFiles', 'scriptsUrl', 'repo', 'orgSlug', 'projectSlug', 'token']
      optKeys.forEach(key => {
        if (options[key] == null) {
          grunt.fail.warn(`Required configuration setting '${options[key]} is undefined.`)
        }
      })
    }

    function createRelease() {
      const endpoint = `https://sentry.io/api/0/organizations/${options.orgSlug}/releases/`
      const body = {
        version: release,
        dateCreated: new Date(commit.committedOn).toISOString(),
        refs: [{
          repository: options.repo,
          commit: commit.hash,
          project: options.project
        }],
        projects: [options.project]
      }

      grunt.log.subhead('Pushing release to Sentry.io')
      fetch (endpoint, apiOpts, body)
        .then(response => {
          return response.json()
        })
        .then(json => {
          grunt.ok.writeln(JSON.stringify(json, undefined, 2))
        })
        .catch(err => {
          grunt.fail.warn(`Error pushing release: ${err.message}`)
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

      grunt.log.subhead('Uploading source maps to Sentry.io')
      fetch (endpoint, apiOpts, body)
        .then(response => {
          return response.json()
        })
        .then(json => {
          grunt.ok.writeln(JSON.stringify(json, undefined, 2))
        })
        .catch(err => {
          grunt.fail.warn(`Error uploading source map: ${err.message}`)
        })
    }

    function pushSourceMaps () {
      let i = 1

      files.forEach(file => {
        file = `${file}.map`
        filepath = `${cwd}/${file}`

        let fileObj = {
          name: file,
          id: i
        }

        const stats = fs.statSync(filepath)
        fileObj.timestamp = new Date(stats.ctimeMs).toISOString()
        fileObj.size = stats.size

        sha1File(filepath, (err, hash) => {
          if (err) {
            grunt.fail.warn(`Cannot get sha1 hash for ${file}: ${err.message}`)
          }
          fileObj.hash = hash
        })

        fs.open(filepath, 'r', (err, fd) => {
          if (err) {
            grunt.fail.warn(`Cannot open ${file}: ${err.message}`)
          } else {
            fileObj.file = fd
            uploadMaps(fileObj)
          }
        })

        i++
      })
    }

    configTest()
    let commit = {}
    Git.Repository.open(cwd)
      .then(repo => {
        return repo.getHeadCommit()
      })
      .then(head => {
        commit.hash = head.sha()
        commit.timestamp = head.timeMs()
      })
      .then(() => {
        createRelease()
        pushSourceMaps()
      })

  })
}
