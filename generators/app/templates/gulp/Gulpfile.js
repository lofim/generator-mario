//optimze modules using https://github.com/gulpjs/plugins/blob/master/src/blackList.json
'use strict';
var LIVERELOAD_PORT = 35729;
var SERVER_PORT = 9001;
var Proxy = require('gulp-connect-proxy');
var pngquant = require('imagemin-pngquant');
var lrSnippet = require('connect-livereload')({
  port: LIVERELOAD_PORT
});
var mountFolder = function(connect, dir) {
  return connect.static(require('path').resolve(dir));
};

var gulp = require('gulp',{
  base: 'Gulpfile.js'
});

var del = require('del');

var gulpLoadPlugins = require('gulp-load-plugins');
var plugins = gulpLoadPlugins({
  pattern: ['gulp-*'],
  lazy: true,
  camelize: true
});

var files = [
  'app/*.html',
  'app/scripts/**/*.js'
];

gulp.task('less', function() {
  return gulp.src('app/styles/main.less')
  .pipe(plugins.less())
  .pipe(gulp.dest('.tmp/styles'))
  .pipe(plugins.connect.reload());
});

gulp.task('karma', function() {
  gulp.src('test.js')
  .pipe(plugins.karma({
    configFile: 'karma.conf.js',
    action: 'run',
    browsers: ['PhantomJS'],
    singleRun: true,
    coverageReporter: {
      dir: 'coverage',
      reporters: [
      {type: 'html', subdir: 'report-html'},
      {type: 'cobertura', subdir: '.', file: 'cobertura.txt'},
      {type: 'text', subdir: '.', file: 'text.txt'},
      {type: 'text-summary', subdir: '.', file: 'text-summary.txt'}
      ]
    }
  }))
  .pipe(plugins.exit())
  .on('error', function(err) {
    throw err;
  });
});

gulp.task('karma:browser', function() {
  gulp.src('test.js')
  .pipe(plugins.karma({
    configFile: 'karma.conf.js',
    action: 'run',
    browsers: ['PhantomJS', 'Chrome', 'Firefox'],
    singleRun: true,
    coverageReporter: {
      dir: 'coverage',
      reporters: [
      {type: 'html', subdir: 'report-html'},
      {type: 'cobertura', subdir: '.', file: 'cobertura.txt'},
      {type: 'text', subdir: '.', file: 'text.txt'},
      {type: 'text-summary', subdir: '.', file: 'text-summary.txt'}
      ]
    }
  }))
  .pipe(plugins.exit())
  .on('error', function(err) {
    throw err;
  });
});

gulp.task('jshint', function() {
  gulp.src(['app/scripts/**/*.js', 'test/spec/**/*.js', 'Gulpfile.js'])
  .pipe(plugins.jshint())
  .pipe(plugins.jshint.reporter('jshint-stylish'));
});

gulp.task('jscs', function() {
  gulp.src([
    'Gulpfile.js',
    'app/scripts/*',
    'test/spec/{,*/}*.js'
  ])
  .pipe(plugins.jscs({configPath: '.jscsrc'}))
  .pipe(plugins.jscsStylish());
});

gulp.task('watch', ['templates', 'less'], function() {
  gulp.watch('app/scripts/**/*.hbs', ['templates']);
  gulp.watch('app/styles/{,*/}*.less', ['less']);
  gulp.watch(files, ['clean-reload']);
});

gulp.task('clean-reload', function() {
  gulp.src(files)
  .pipe(plugins.connect.reload());
});

gulp.task('connect', function() {
  plugins.connect.server({
    root: 'app',
    livereload: true,
    port: SERVER_PORT,
    hostname: '0.0.0.0',
    proxies: [{
      context: ['/api'],
      host: 'localhost',
      port: 8081
    }, {
      context: ['/socket.io'],
      host: 'localhost',
      port: 8081,
      ws: true
    }],
    middleware: function(connect, opt) {
      var proxy = new Proxy(opt);
      return [
      proxy,
      lrSnippet,
      mountFolder(connect, '.tmp'),
      mountFolder(connect, 'app')
      ];
    }
  });
});

gulp.task('open', function() {
  gulp.src('').pipe(plugins.open({
    uri: 'http://localhost:9001'
  }));
});

gulp.task('clean', function() {
  return del(['.tmp/', 'dist']);
});

gulp.task('jsbeautifier', function() {
  gulp.src(['Gulpfile.js', 'app/scripts/{*/}*.js'])
  .pipe(plugins.prettify({config: '.jsbeautifyrc'}))
  .pipe(plugins.exit());
});

gulp.task('usemin', function() {
  gulp.src('app/scripts/{*/}*.html')
  .pipe(plugins.usemin({
    css: [plugins.minifyCss(), 'concat'],
    html: [plugins.minifyHtml()],
    js: [plugins.uglify(), plugins.rev()]
  }))
  .pipe(gulp.dest('dist'));
});

gulp.task('imagemin', function() {
  gulp.src('app/images/*')
  .pipe(plugins.imagemin({
    progressive: true,
    svgoPlugins: [{removeViewBox: false}],
    use: [pngquant()]
  }))
  .pipe(gulp.dest('dist/images'));
});

gulp.task('minify-css', ['copy'], function() {
  gulp.src('.tmp/styles/*.css')
  .pipe(plugins.minifyCss())
  .pipe(gulp.dest('dist/styles'));
});

gulp.task('minify-html', function() {
  gulp.src('app/scripts/{*/}*.html')
  .pipe(plugins.minifyHtml({collapseWhitespace: true}))
  .pipe(gulp.dest('dist'));
});

gulp.task('copy', ['requirejs'], function() {
  gulp.src([
    'app/*.{ico,txt}',
    'app/.htaccess',
    'app/jsondata/*.*',
    'app/images/*.*',
    'app/bower_components/font-awesome/fonts/{,*/}*.*',
    'app/bower_components/modernizr/modernizr.js',
    'app/bower_components/requirejs/*.js',
    'app/index.html'
  ], {base: 'app'})
  .pipe(gulp.dest('dist'));
});

gulp.task('bower', function() {
  plugins.bower()
  .pipe(gulp.dest('app/bower_components'));
});

gulp.task('templates', function() {
  return gulp.src('app/scripts/**/*.hbs')
    .pipe(plugins.handlebars())
    .pipe(plugins.wrap('Handlebars.template(<%= contents %>)'))
    .pipe(plugins.declare({
      namespace: 'JST',
      noRedeclare: true, // Avoid duplicate declarations
      //make handlebars namespace compliant with grunt version
      processName: function(filePath) {
        filePath = 'app/scripts/apps' + filePath.replace(/\\/g, '/').split(/app\/scripts\/apps/)[1];
        filePath = filePath.substring(0, filePath.length - 3) + '_hbs';

        return filePath;
      }
    }))
    .pipe(plugins.concat('templates.js'))
    //make handlebars file names compliant with grunt version
    .pipe(plugins.replace(/_hbs/g, '.hbs'))
      //make templates amd compatible
    .pipe(plugins.wrap('define([\'handlebars\'], function(Handlebars) { <%= contents %> return this["JST"]; });'))

    .pipe(gulp.dest('.tmp/scripts/'))
    .pipe(plugins.connect.reload());
});

gulp.task('requirejs', ['templates'], function() {
  gulp.src(['app/scripts/main.js'])
    .pipe(plugins.requirejsOptimize({
      baseUrl: 'app/scripts',
      out: 'main.js',
      name: 'main',
      mainConfigFile: 'app/scripts/main.js',
      optimize: 'uglify',
      paths: {
        'templates': '../../.tmp/scripts/templates'
      }
    }))
    .pipe(gulp.dest('dist/scripts'));
});

gulp.task('serve', [
  'clean',
  'analyze',
  'connect',
  'open',
  'watch'
]);

gulp.task('test', ['test:karma']);

gulp.task('test:browser', [
  'templates',
  'karma:browser'
]);

gulp.task('test:karma', [
  'templates',
  'karma'
]);

gulp.task('build', [
  'clean',
  'analyze',
  'less',
  'requirejs',
  'imagemin',
  'copy',
  'usemin',
  'minify-css'
]);

gulp.task('default', [
  'analyze',
  'test',
  'build'
]);

gulp.task('beautify', [
  'jsbeautifier:modify',
  'analyze'
]);

gulp.task('serve:alias', [
  'serve'
]);

gulp.task('analyze', [
  'jshint',
  'jscs'
]);
