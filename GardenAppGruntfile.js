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
            name:'xs',
            width: '400px',
            quality: 99
          },{
            name:'small',
            width: '500px',
            quality: 99
          },{
            name:'medium',
            width: '750px',
            suffix: '_750',
            quality: 95
          },{
            name:'large',
            width: '1000px',
            height: '477px',
            suffix: '_1000',
            quality: 95
          },{
            name:'large',
            width: '1200px',
            suffix: '_1200',
            quality: 95
          },{
            name:'xlarge',
            width: '1400px',
            suffix: '_1400',
            quality: 95
          },{
            name:'xxlarge',
            width: '1600px',
            suffix: '_1600',
            quality: 95
          }]
        },

        /*
        You don't need to change this part if you don't change
        the directory structure.
        */
        files: [{
          expand: true,
          src: ['*.{gif,jpg,png}'],
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
          src: 'images_src/fixed/*.{gif,jpg,png}',
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
  //grunt.registerTask('responsive-images', ['responsive_images']);


};