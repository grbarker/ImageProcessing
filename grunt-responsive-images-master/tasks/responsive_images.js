/**
 * grunt-responsive-images
 * https://github.com/andismith/grunt-responsive-images
 *
 * Copyright (c) 2014 andismith
 * Licensed under the MIT license.
 *
 * Create images at different sizes for responsive websites.
 *
 * @author Andi Smith (http://twitter.com/andismith)
 * @version 0.1.0
 */

'use strict';

module.exports = function(grunt) {

  var _     = require('lodash');
  var async = require('async');
  var gm    = require('gm');
  var path  = require('path');

  var DEFAULT_OPTIONS = {
    aspectRatio: true,          // maintain the aspect ratio of the image (when width and height are supplied)
    createNoScaledImage: false, // whether to create files if upscale is set to false and large sizes are specified
    density: 72,                // the output resolution (dpi) of the image
    engine: 'gm',               // gm or im
    concurrency: 1,             // Simultaneous gm processes to invoke.  CPU Cores - 1 is a reasonable choice.
    gravity: 'Center',          // gravity for cropped images: NorthWest, North, NorthEast, West, Center, East, SouthWest, South, or SouthEast
    newFilesOnly: true,         // NEW VALUE - whether to only run for new files/sizes only
    quality: 100,               // value between 1 and 100
    rename: true,               // whether file should keep its name
    separator: '-',             // separator between name and filesize
    tryAnimated: false,         // DEFAULT CHANGED - whether to try to resize animated files
    upscale: false,             // whether to upscale the image
    sample: false,
    customIn: null,             // array of graphics engine arguments
    customOut: null,            // array of graphics engine arguments
    sharpen: null,
    sizes: [{
      name: 'small',
      width: 320
    },{
      name: 'medium',
      width: 640
    },{
      name: 'large',
      width: 1024
    }]
  };

  var DEFAULT_UNIT_OPTIONS = {
    percentage: 'pc',
    pixel: '',
    multiply: 'x'
  };

  // details about the GFX rendering engines being used
  var GFX_ENGINES = {
    im: {
      name: 'ImageMagick',
      brewurl: 'imagemagick',
      url: 'http://www.imagemagick.org/script/binary-releases.php',
      alternative: {
        code: 'gm',
        name: 'GraphicsMagick'
      }
    },
    gm: {
      name: 'GraphicsMagick',
      brewurl: 'graphicsmagick',
      url: 'http://www.graphicsmagick.org/download.html',
      alternative: {
        code: 'im',
        name: 'ImageMagick'
      }
    }
  };

  var cache = {},
    gfxEngine = {};

  /**
   * Set the engine to ImageMagick or GraphicsMagick
   *
   * @private
   * @param  {string}          engine     im for ImageMagick, gm for GraphicsMagick
   */
  var getEngine = function(engine) {
    if (typeof GFX_ENGINES[engine] === 'undefined') {
      return grunt.fail.warn('Invalid render engine specified');
    }
    grunt.verbose.ok('Using render engine: ' + GFX_ENGINES[engine].name);

    if (engine === 'im') {
      return gm.subClass({ imageMagick: (engine === 'im') });
    }

    return gm;
  };

  /**
   * Checks for a valid array, and that there are items in the array.
   *
   * @private
   * @param   {object}          obj       The object to check
   * @return  {boolean}         Whether it is a valid array with items.
   */
  var isValidArray = function(obj) {
   return (_.isArray(obj) && obj.length > 0);
  };

  /**
   * Checks for a valid width and/or height.
   * We do not need both - one is sufficient, but if a value is supplied it must be a valid value.
   * If width is a percentage, height must also be a percentage - they cannot be mixed.
   *
   * @private
   * @param   {number/string}   width     The width, either as a number or a percentage (or as undefined)
   * @param   {number/string}   height    The height, either as a number or a percentage (or as undefined)
   * @return  {boolean}         Whether the size is valid.
   */
  var isValidSize = function(width, height) {
    // Valid values = 1, '1px', '1', '1%', '1.1%', '11.11111%', '111111%'
    // Invalid values = -1, '1.1.1%', '1a', 'a1'
    var pcRegExp = /^[0-9]*\.?[0-9]+%?$/,
      pxRegExp = /^[0-9]+(?:px)?$/,
      isValid = false;

    if ((width || height)) {
      // check if we have a valid percentage value
      if (!!(width || 0).toString().match(pcRegExp) &&
        !!(height || 0).toString().match(pcRegExp)) {
        isValid = true;
      // check if we have a valid pixel value
      } else if (!!(width || 0).toString().match(pxRegExp) &&
        !!(height || 0).toString().match(pxRegExp)) {
        isValid = true;
      } else {
        grunt.log.error('Width/height value is not valid. Percentages and pixels cannot be mixed.');
      }

    } else {
      grunt.log.error('Either width and/or height must be specified.');
    }

    return isValid;
  };

  /**
   * Checks value if is a valid quality between 1 and 100.
   *
   * @private
   * @param   {number}    quality The quality.
   * @return  {boolean}   Whether the quality is valid.
   */
  var isValidQuality = function(quality) {
    return (quality > 1) && (quality <= 100);
  };

  /**
   * Create a name to suffix to our file.
   *
   * @private
   * @param   {object}          properties Contains properties for name, width, height (where applicable)
   * @return  {string}          A new name
   */
  var getName = function(properties, options) {
    var widthUnit = '',
      heightUnit = '';

    // name takes precedence
    if (properties.name) {
      return properties.name;
    } else {
      // figure out the units for width and height (they can be different)
      widthUnit = ((properties.width || 0).toString().indexOf('%') > 0) ? options.units.percentage : options.units.pixel;
      heightUnit = ((properties.height || 0 ).toString().indexOf('%') > 0) ? options.units.percentage : options.units.pixel;

      if (properties.width && properties.height) {
        return parseFloat(properties.width) + widthUnit + options.units.multiply + parseFloat(properties.height) + heightUnit;
      } else {
        return (properties.width) ? parseFloat(properties.width) + widthUnit : parseFloat(properties.height) + heightUnit;
      }
    }
  };


  /**
   * Add a prefix and/or a suffix to a value.
   *
   * @private
   * @param   {string}          value         The value to prefix/suffix
   * @param   {string}          prefix        The required prefix (optional)
   * @param   {string}          suffix        The required suffix (optional)
   */
  var addPrefixSuffix = function(value, prefix, suffix, rename) {
    if (rename) {
      return (prefix || '') + value + (suffix || '');
    } else {
      return (suffix || '');
    }
  };

  /**
   * Check the target has been set up properly in Grunt.
   * Graceful handling of https://github.com/andismith/grunt-responsive-images/issues/2
   *
   * @private
   * @param   {object}          files         The files object
   */
  var checkForValidTarget = function(files) {
    var test;

    try {
      test = files.src;
    } catch (exception) {
      grunt.fail.fatal('Unable to read configuration.\n' +
      'Have you specified a target? See: http://gruntjs.com/configuring-tasks');
    }
  };

  /**
   * Check that there is only one source file in compact/files object format.
   *
   * @private
   * @param   {object}          files         The files object
   */
  var checkForSingleSource = function(files) {
    // more than 1 source.
    if (files.src.length > 1) {
      return grunt.fail.warn('Unable to resize more than one image in compact or files object format.\n'+
      'For multiple files please use the files array format.\nSee http://gruntjs.com/configuring-tasks');
    }
  };

  /**
   * Check if a directory exists, and create it if it doesn't.
   *
   * @private
   * @param   {string}          dirPath   The path we want to check
   */
  var checkDirectoryExists = function(dirPath) {
    if (!grunt.file.isDir(dirPath)) {
      grunt.file.mkdir(dirPath);
    }
  };

  /**
   * Removes characters from the values of the object keys specified
   *
   * @private
   * @param   {object}          obj       The object to inspect.
   * @param   {array}           keys      The keys to check the values of.
   * @param   {string}          remove    The string to remove.
   */
  var removeCharsFromObjectValue = function(obj, keys, remove) {
    var i = 0,
      l = keys.length;
    for (i = 0; i < l; i++) {
      if (obj[keys[i]] && obj[keys[i]].toString().indexOf(remove) > -1) {
      obj[keys[i]] = obj[keys[i]].toString().replace(remove, '');
      }
    }
    return obj;
  };

  /**
   * Handle showing errors to the user.
   *
   * @private
   * @param   {string}          error     The error message.
   * @param   {string}          engine    The graphics engine being used.
   */
  var handleImageErrors = function(error, engine) {

    if (error.message.indexOf('ENOENT') > -1) {
      grunt.log.error(error.message);

      grunt.fail.warn('\nPlease ensure ' + GFX_ENGINES[engine].name + ' is installed correctly.\n' +
      '`brew install ' + GFX_ENGINES[engine].brewurl + '` or see ' + GFX_ENGINES[engine].url + ' for more details.\n' +
      'Alternatively, set options.engine to \'' + GFX_ENGINES[engine].alternative.code + '\' to use ' + GFX_ENGINES[engine].alternative.name + '.\n');
    } else {
      grunt.fail.warn(error.message);
    }
  };

  var isAnimatedGif = function(data, dstPath, tryAnimated) {
    // GIF87 cannot be animated.
    // data.Delay and Scene can identify an animation GIF
    if (!tryAnimated && data && data.format && data.format.toUpperCase() === 'GIF' && data.Delay && data.Scene) {
      grunt.verbose.warn(dstPath + ' is animated - skipping');
      return true;
    }
  };

  /**
   * Outputs the result of the tally.
   *
   * @private
   * @param   {number}          count     The file count.
   * @param   {string}          name      Name of the image.
   */
  var outputResult = function(count, name) {
    if (count) {
      grunt.log.writeln('Resized ' + count.toString().cyan + ' ' +
      grunt.util.pluralize(count, 'file/files') + ' for ' + name);
    }
  };

  /**
   * Check whether a new version exists
   *
   * @private
   * @param   {string}          srcPath     File source path
   * @param   {string}          dstPath     File destination path
   */
  var isFileNewVersion = function(srcPath, dstPath) {
    return (!grunt.file.exists(dstPath));
  };

  var processImage = function(srcPath, dstPath, sizeOptions, tally, callback) {
    var image = gfxEngine(srcPath);

    image.identify("%m:%T:%s\n", function(err, dataRaw) {
      if(err){
        handleImageErrors(err, sizeOptions.engine);
      }

      var lastLineData = dataRaw.trim().split("\n").slice(-1)[0].split(":");
      if (lastLineData.length !== 3) {
        handleImageErrors(new Error("Could not parse identify output: " + dataRaw), sizeOptions.engine);
      }

      var data = {
        format: lastLineData[0],
        Delay: parseInt(lastLineData[1], 10),
        Scene: parseInt(lastLineData[2], 10)
      };

      if (!isAnimatedGif(data, dstPath, sizeOptions.tryAnimated)) {
      image.size(function(error, size) {
        var sizeTo = {
          width: sizeOptions.width,
          height: sizeOptions.height
        };
        var sizingMethod = '';
        var mode = 'resize';

        if (error) {
         handleImageErrors(error, sizeOptions.engine);
        } else {

        if (!sizeOptions.aspectRatio && sizeOptions.width && sizeOptions.height) {
          // crop image
          sizingMethod = '^';
          mode = 'crop';
        }

        if (sizeOptions.width > size.width || sizeOptions.height > size.height) {
          if (sizeOptions.upscale) {
            // upscale
            if (sizeOptions.aspectRatio) {
              sizingMethod = '^';
            } else {
              sizingMethod = '!';
            }
          } else if (sizeOptions.aspectRatio) {
            sizeTo.width = size.width;
            sizeTo.height = size.height;
          }

          if (sizeOptions.createNoScaledImage) {
            grunt.verbose.ok('Upscaled image ' + dstPath + ' will not be created');
            return callback();
          }
        }

        // Add custom Input arguments to the graphics engine command before filter or quality options.
        // customIn: ['-interlace', 'line']
        // yields the command
        // gm "convert" "-interlace" "line" "-quality" "60" "img/inputfile.jpg" ...
        if (isValidArray(sizeOptions.customIn)) {
          sizeOptions.customIn.forEach(function(val){ image.in(val); });
        } else if (sizeOptions.customIn) {
          image.in(sizeOptions.customIn);
        }

        if (sizeOptions.filter) {
          image.filter(sizeOptions.filter);
        }

        if (sizeOptions.sample) {
          image
            .sample(sizeTo.width, sizeTo.height, sizingMethod)
            .quality(sizeOptions.quality);
        } else {
          image
            .resize(sizeTo.width, sizeTo.height, sizingMethod)
            .quality(sizeOptions.quality);
        }

        if (mode === 'crop') {
          image
          .gravity(sizeOptions.gravity)
          .crop(sizeOptions.width, sizeOptions.height, 0, 0);
        }

        if (sizeOptions.sharpen) {
          image
            .sharpen(sizeOptions.sharpen.radius, sizeOptions.sharpen.sigma);
        }

        if (sizeOptions.density) {
          image.density(sizeOptions.density, sizeOptions.density);
        }

        // Add custom Output arguments to the graphics engine command after all other options, but before the output filename.
        // customOut: [
        //      '-gravity', 'SouthEast', '-font', "Arial", '-pointsize', '12',
        //      '-fill', '#445', '-draw', 'text 5,2 \'\u00A9 copyright\'',
        //      '-fill', '#ffe', '-draw', 'text 6,3 \'\u00A9 copyright\''
        // ]
        // yields the command
        // gm "convert" ... "img/inputfile.jpg" "-resize" "1280x" "-gravity" "SouthEast" "-font" "Arial" "-pointsize" "12" "-fill" "#445" "-draw" "text 5,2 '?? copyright'" "-fill" "#ffe" "-draw" "text 6,3 '?? copyright'" "tmp/img/outputfile.jpg"
        if (isValidArray(sizeOptions.customOut)) {
          sizeOptions.customOut.forEach(function(val){ image.out(val); });
        } else if (sizeOptions.customOut) {
          image.out(sizeOptions.customOut);
        }

        image.write(dstPath, function (error) {
          if (error) {
            handleImageErrors(error, sizeOptions.engine);
          } else {
            grunt.verbose.ok('Responsive Image: ' + srcPath + ' now '+ dstPath);
            tally[sizeOptions.id]++;
          }
          return callback();
        });
        }
      });
      } else {
      return callback();
      }
    });
  };


  /**
   * Gets the destination path
   *
   * @private
   * @param   {string}          srcPath   The source path
   * @param   {string}          filename  Image Filename
   * @param   {object}          sizeOptions
   * @param   {string}          customDest
   * @param   {string}          origCwd
   * @return                    The complete path and filename
   */
  var getDestination = function(srcPath, dstPath, sizeOptions, customDest, origCwd) {
    var baseName = '',
      dirName = '',
      extName = '';

    extName = path.extname(dstPath);
    baseName = path.basename(dstPath, extName); // filename without extension

    if (customDest) {

      sizeOptions.path = srcPath.replace(new RegExp(origCwd), "").replace(new RegExp(path.basename(srcPath)+"$"), "");

      grunt.template.addDelimiters('size', '{%', '%}');

      dirName = grunt.template.process(customDest, {
        delimiters: 'size',
        data: sizeOptions
      });

      checkDirectoryExists(path.join(dirName));
      return path.join(dirName, baseName + extName);
    } else {
      dirName = path.dirname(dstPath);
      checkDirectoryExists(path.join(dirName));
      return path.join(dirName, baseName + sizeOptions.outputName + extName);
    }
  };

  // let's get this party started

  grunt.registerMultiTask('responsive_images', 'Create images at different sizes for responsive websites.', function() {

    var done = this.async();
    var i = 0;
    var series = [];
    var options = this.options(DEFAULT_OPTIONS); // Merge task-specific and/or target-specific options with these defaults.
    var tally = {};
    var task = this;

    if (!isValidArray(options.sizes)) {
      return grunt.fail.fatal('No sizes have been defined.');
    }

    gfxEngine = getEngine(options.engine);

    options.units = _.extend(_.clone(DEFAULT_UNIT_OPTIONS), options.units);

    options.sizes.forEach(function(s) {
      var resizeparallel = [];
      var sizeOptions = _.extend({}, options, s);

      if (!isValidSize(sizeOptions.width, sizeOptions.height)) {
        // allow task to be by-passed if no images
        return grunt.log.warn('Size is invalid (' + sizeOptions.width + ', ' + sizeOptions.height + ')');
      }

      if (!isValidQuality(sizeOptions.quality)) {
        return grunt.log.warn('Quality configuration has changed to values between 1 - 100. Please update your configuration');
      }

      sizeOptions.id = i;
      i++;

      tally[sizeOptions.id] = 0;

      if (task.files.length === 0) {
        return grunt.log.warn('Unable to compile; no valid source files were found.');
      } else {

        // Iterate over all specified file groups.
        task.files.forEach(function(f) {

          var srcPath = '',
            dstPath = '';

          checkForValidTarget(f);
          checkForSingleSource(f);

          // create a name for our image based on name, width, height
          sizeOptions.name = getName({ name: sizeOptions.name, width: sizeOptions.width, height: sizeOptions.height }, options);

          // create an output name with prefix, suffix
          sizeOptions.outputName = addPrefixSuffix(sizeOptions.name, sizeOptions.separator, sizeOptions.suffix, sizeOptions.rename);

          srcPath = f.src[0];
          dstPath = getDestination(srcPath, f.dest, sizeOptions, f.custom_dest, f.orig.cwd);

          // remove pixels from the value so the gfx process doesn't complain
          sizeOptions = removeCharsFromObjectValue(sizeOptions, ['width', 'height'], 'px');

          // resize images in parallel if options.concurrency > 1
          resizeparallel.push(function(callback) {

            if (sizeOptions.newFilesOnly) {
              if (isFileNewVersion(srcPath, dstPath)) {
                return processImage(srcPath, dstPath, sizeOptions, tally, callback);
              } else {
                grunt.verbose.ok('File already exists: ' + dstPath);
                // defer the callback
                setImmediate(callback);
              }
            } else {
              return processImage(srcPath, dstPath, sizeOptions, tally, callback);
            }

          });
        });

        // resize images in parallel if options.concurrency > 1
        series.push(function(callback) {
          async.parallelLimit(resizeparallel, options.concurrency, callback);
        });

        series.push(function(callback) {
          outputResult(tally[sizeOptions.id], sizeOptions.name);
          return callback();
        });
      }
    });

    async.series(series, done);
  });

};
