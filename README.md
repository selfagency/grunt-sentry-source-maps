# grunt-sentry-source-maps

Automatically creates release info for and pushes JS source maps to [Sentry.io](https://sentry.io).

## Getting Started
This plugin requires Grunt `~0.4.5`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
yarn add grunt-sentry-source-maps --dev || npm install grunt-sentry-source-maps --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-sentry-source-maps');
```

## The "sentry_source_maps" task

### Overview
In your project's Gruntfile, add a section named `sentry_source_maps` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  sentry_source_maps: {
    options: {
      scriptsUrl: 'https://yourwebsite.com/path/to/scripts',
      repo: 'your-git-username/your-repo-name',
      orgSlug: 'your-sentry-org-name',
      projectSlug: 'your-sentry-project-slug',
      token: 'your-sentry-api-token'
    },
    files: ['array']
  },
});
```

### Options

#### options.sourceFiles
Type: `Array`

An array of filenames for your bundled scripts that have source maps.

#### options.scriptsUrl
Type: `String`

The full path to your *online* scripts folder.

#### options.repo
Type: `String`

The name of your Git repository.

#### options.repo
Type: `String`

The name of your Git repository.

#### options.orgSlug
Type: `String`

Your Sentry organization name.

#### options.projectSlug
Type: `String`

Your Sentry project name.

#### options.token
Type: `String`

Your Sentry API token.

## Tests

Sorry, tests not presently configured.
