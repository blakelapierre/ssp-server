const browserify = require('browserify'),
      gulp = require('gulp'),
      minimist = require('minimist'),
      source = require('vinyl-source-stream');

const {
  cached,
  clean,
  concat,
  jshint,
  pipe,
  print,
  run,
  sequence,
  sourcemaps,
  tasks,
  traceur,
  uglify
} = require('gulp-load-plugins')();

const args = minimist(process.argv.slice(2));

const result = tasks(gulp, require);
if (typeof result === 'string') console.log(result);

gulp.task('default', ['build']);

gulp.task('build', sequence('clean', 'runtime'));

gulp.task('dev', ['runtime'], () => gulp.watch(paths.scripts, ['runtime']));

gulp.task('run', () => run(`node ${paths.dist}/index.js ${args.args || ''}`).exec());
gulp.task('test', () => run(`node ${paths.dist}/tests/index.js ${args.args || ''}`).exec());

gulp.task('transpile', //['jshint'],
  () => pipe([
    gulp.src(paths.scripts)
    ,cached('transpile')
    ,print()
    ,sourcemaps.init()
    // ,to5()
    ,traceur({modules: 'commonjs', asyncGenerators: true, forOn: true, asyncFunctions: true})
    ,sourcemaps.write('.')
    ,gulp.dest(paths.dist)
  ])
  .on('error', function(e) { console.log(e); }));

gulp.task('runtime', ['transpile'],
  () => pipe([
    gulp.src([traceur.RUNTIME_PATH])
    ,print()
    ,concat('traceur-runtime.js')
    ,gulp.dest(paths.dist)
  ])
  .on('error', function(e) { console.log(e); }));

gulp.task('bundle', ['browserify'],
  () => pipe([
    gulp.src(['./.dist/app.js'])
    ,uglify()
    ,print()
    ,gulp.dest(paths.dist)
  ]));

gulp.task('browserify', ['jshint'],
  () => pipe([
    browserify({
      entries: ['./.dist/index.js'],
      builtins: false,
      detectGlobals: false
    }).bundle()
    ,source('app.js')
    ,print()
    ,gulp.dest(paths.dist)
  ]));

gulp.task('jshint',
  () => pipe([
    gulp.src(paths.scripts)
    ,cached('jshint')
    ,print()
    ,jshint()
    ,jshint.reporter('jshint-stylish')
    ,jshint.reporter('fail')
  ]));

gulp.task('clean',
  () => pipe([
    gulp.src(paths.dist, {read: false})
    ,clean()
  ]));

const paths = {
  scripts: ['src/**/*.js'],
  dist: '.dist'
};
