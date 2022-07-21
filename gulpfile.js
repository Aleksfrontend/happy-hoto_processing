const gulp = require('gulp'),
		del = require('del'),
		gulpPug = require('gulp-pug'),
		gulpPlumber = require('gulp-plumber'),
		gulpSass = require('gulp-sass')(require('sass')),
		gulpBabel = require('gulp-babel'),
		gulpUglify = require('gulp-uglify'),
		gulpImagemin = require('gulp-imagemin'),
		gulpAutoprefixer = require('gulp-autoprefixer'),
		gulpCleanCss = require('gulp-clean-css'),
		svgSprite = require('gulp-svg-sprite'),
		svgmin = require('gulp-svgmin'),
		cheerio = require('gulp-cheerio'),
		replace = require('gulp-replace'),
		browserSync = require('browser-sync').create(),
		// gulpConcat = require('gulp-concat'),
		gulpIf = require('gulp-if');

let isBuildFlag = false;

function clean() {
	return del('dist');
}

function pug2html() {
	return gulp.src('app/pug/pages/*.pug')
	.pipe(gulpPlumber())
	.pipe(gulpPug( {
		pretty: false
	}))
	.pipe(gulpPlumber.stop())
	.pipe(gulp.dest('dist/'));
 }

function scss2css() {
	return gulp.src('app/static/styles/styles.scss')
	.pipe(gulpPlumber())
	.pipe(gulpSass())
	.pipe(gulpCleanCss({
		level: 2
	}))
	.pipe(gulpAutoprefixer())
	.pipe(gulpPlumber.stop())
	.pipe(browserSync.stream())
	.pipe(gulp.dest('dist/static/css/'));
 }

function sctipt() {
	return gulp.src('app/static/js/main.js')
	.pipe(gulpBabel({
		presets: ['@babel/env']
	}))
	.pipe(gulpIf(isBuildFlag, gulpUglify()))
	.pipe(browserSync.stream())
	.pipe(gulp.dest('dist/static/js/'));
 }

function copyJquery() {
	return gulp.src('app/static/js/vendors/jquery-3.6.0.min.js')
	.pipe(gulp.dest('dist/static/js/vendors/'));
 }

//  function vendors() {
// 	return gulp.src(['node_modules\svg4everybody\dist\svg4everybody.min.js'])
// 	.pipe(gulpConcat('libs.js'))
// 	.pipe(gulp.dest('dist/static/js/vendors/'));
//  }

function imageMin() {
	return gulp.src(['app/static/images/**/*.{jpg,gif,png,svg}',
						'!app/static/images/sprite/*'])
	.pipe(gulpImagemin([
		gulpImagemin.gifsicle({interlaced: true}),
		gulpImagemin.mozjpeg({quality: 75, progressive: true}),
		gulpImagemin.optipng({optimizationLevel: 5}),
		gulpImagemin.svgo({
			plugins: [
				{removeViewBox: true},
				{cleanupIDs: false}
			]
		})
	]))
	.pipe(gulp.dest('dist/static/images/'));
}


function svgSpriteBuild() {
	return gulp.src('app/static/images/sprite/*.svg')
	// minify svg
		.pipe(svgmin({
			js2svg: {
				pretty: true
			}
		}))
		// remove all fill, style and stroke declarations in out shapes
		.pipe(cheerio({
			run: function ($) {
				$('[fill]').removeAttr('fill');
				$('[stroke]').removeAttr('stroke');
				$('[style]').removeAttr('style');
			},
			parserOptions: {xmlMode: true}
		}))
		// cheerio plugin create unnecessary string '&gt;', so replace it.
		.pipe(replace('&gt;', '>'))
		// build svg sprite
		.pipe(svgSprite({
			mode: {
				symbol: {
					sprite: "sprite.svg"
				}
			}
		}))
		.pipe(gulp.dest('dist/static/images/sprite'));
};

function fonts() {
	return gulp.src('app/static/fonts/**/*.*')
	.pipe(gulp.dest('dist/static/fonts/'));
 }

 function setMode(isBuild) {
	return cb => {
		isBuildFlag = isBuild;
		cb();
	}
 }

function watch () {
	browserSync.init({
		server: {
			baseDir: 'dist'
		}
	});

	gulp.watch("app/pug/**/*.pug", pug2html);
	gulp.watch("[app/static/images/**/*.{jpg,gif,png,svg}, !app/static/images/sprite/*]", imageMin);
	gulp.watch("app/static/images/sprite/* ", svgSpriteBuild);
	gulp.watch("app/static/styles/**/*.scss", scss2css);
	gulp.watch("app/static/fonts/**/*", fonts);
	gulp.watch("app/static/js/main.js", sctipt);
	gulp.watch("dist/*.html").on('change', browserSync.reload);
}

const dev = gulp.parallel( pug2html, scss2css, imageMin, svgSpriteBuild, copyJquery, sctipt, fonts)

exports.default = gulp.series(clean, dev, watch);
exports.build = gulp.series(clean, setMode(true), dev);