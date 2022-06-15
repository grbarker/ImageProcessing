
/*
 After you have changed the settings at "Your code goes here",
 run this with one of these options:
  "grunt" alone creates a new, completed images directory
  "grunt clean" removes the images directory
  "grunt responsive_images" re-processes images without removing the old ones
*/

module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    responsive_images: {
      dev: {
        options: {
          sizes: [{
            name:'thumb_small_center',
            width: '200px',
            height: '200px',
            quality: 99,
            aspectRatio: false,
            gravity: 'center',
            upscale: true,
          },{
            name:'thumb_small_n',
            width: '200px',
            height: '200px',
            quality: 99,
            aspectRatio: false,
            gravity: 'North',
            upscale: true,
          },{
            name:'thumb_small_ne',
            width: '200px',
            height: '200px',
            quality: 99,
            aspectRatio: false,
            gravity: 'NorthEast',
            upscale: true,
          },{
            name:'thumb_small_e',
            width: '200px',
            height: '200px',
            quality: 99,
            aspectRatio: false,
            gravity: 'East',
            upscale: true,
          },{
            name:'thumb_small_s',
            width: '200px',
            height: '200px',
            quality: 99,
            aspectRatio: false,
            gravity: 'South',
            upscale: true,
          },{
            name:'thumb_small_w',
            width: '200px',
            height: '200px',
            quality: 99,
            aspectRatio: false,
            gravity: 'West',
            upscale: true,
          },{
            name:'thumb_large_n',
            width: '200px',
            height: '200px',
            quality: 99,
            aspectRatio: false,
            gravity: 'North',
            upscale: true,
          },{
            name:'thumb_large_w',
            width: '200px',
            height: '200px',
            quality: 99,
            aspectRatio: false,
            gravity: 'West',
            upscale: true,
          },{
            name:'thumb_large_e',
            width: '200px',
            height: '200px',
            quality: 99,
            aspectRatio: false,
            gravity: 'East',
            upscale: true,
          },{
            name:'thumb_large_s',
            width: '200px',
            height: '200px',
            quality: 99,
            aspectRatio: false,
            gravity: 'South',
            upscale: true,
          }]
        },

        /*
        You don't need to change this part if you don't change
        the directory structure.
        */
        files: [{
          expand: true,
          src: ['*.{gif,jpg,JPG,png}'],
          cwd: 'images_src/',
          dest: 'images/'
        }]
      }
    },

    /* Clear out the images directory if it exists */
    clean: {
      dev: {
        src: ['images'],
      },
    },

    /* Generate the images directory if it is missing */
    mkdir: {
      dev: {
        options: {
          create: ['images']
        },
      },
    },

    /* Copy the "fixed" images that don't go through processing into the images/directory */
    copy: {
      dev: {
        files: [{
          expand: true,
          src: 'images_src/fixed/*.{gif,jpg,JPG,png}',
          dest: 'images/'
        }]
      },
    },
  });

  grunt.loadNpmTasks('grunt-responsive-images');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-mkdir');
  grunt.registerTask('default', ['clean', 'mkdir', 'copy', 'responsive_images']);
  grunt.registerTask('responsive-images', ['responsive_images']);


};