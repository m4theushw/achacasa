import { src, task, watch, dest, parallel } from 'gulp'
import babel from 'gulp-babel'
import uglify from 'gulp-uglify'
import sass from 'gulp-sass'
import sourcemaps from 'gulp-sourcemaps'
import autoprefixer from 'gulp-autoprefixer'
import concat from 'gulp-concat'
import * as jasmineBrowser from 'gulp-jasmine-browser'

const scripts = [
  './assets/js/utils.js',
  './assets/js/autocomplete.jsx',
  './assets/js/sidebar.jsx',
  './assets/js/navbar.jsx',
  './assets/js/app.jsx',
]

const testFiles = ['spec/setup.js', 'pages/static/js/*.js', 'spec/*_spec.js']

const runTests = () =>
  src(testFiles)
    .pipe(jasmineBrowser.specRunner())
    .pipe(jasmineBrowser.server({ port: 8888 }))

const buildScripts = () =>
  src(scripts)
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(uglify())
    .pipe(concat('app.js'))
    .pipe(sourcemaps.write('./'))
    .pipe(dest('./pages/static/js'))

const buildStyles = () =>
  src('./assets/sass/app.scss')
    .pipe(sass())
    .pipe(autoprefixer())
    .pipe(dest('./pages/static/css'))

const copyImages = () => src('./assets/img/*').pipe(dest('./pages/static/img/'))

const buildAssets = parallel(buildScripts, buildStyles, copyImages)

task('js', buildScripts)
task('sass', buildStyles)
task('img', copyImages)
task('jasmine', runTests)
task('default', buildAssets)
task('watch', () => watch('./assets', buildAssets))
