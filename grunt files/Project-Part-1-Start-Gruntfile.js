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
            name: 'small',
            width: '25%',
            suffix: '_small',
            quality: 80
          },{
            name: 'medium_small',
            width: '30%',
            suffix: '_medium_small',
            quality: 75
          },{
            name: 'medium',
            width: '35%',
            suffix: '_medium',
            quality: 75
          },{
            name: 'medium_large',
            width: '40%',
            suffix: '_medium_large',
            quality: 70
          },{
            name: 'large',
            width: '45%',
            suffix: '_large',
            quality: 70
          },{
            name: 'xlarge',
            width: '55%',
            suffix: '_large',
            quality: 65
          },{
            name: 'xxlarge',
            width: '65%',
            suffix: '_large',
            quality: 65
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
