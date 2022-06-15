
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
            name:'1200px',
            width: '1200px',
            quality: 85,
            upscale: true,
          },{
            name:'1000px',
            width: '1000px',
            quality: 85,
            upscale: true,
          },{
            name:'30px',
            width: '30px',
            quality: 85,
            upscale: true,
          },{
            name:'28px',
            width: '28px',
            quality: 85,
            upscale: true,
          },{
            name:'26px',
            width: '26px',
            quality: 85,
            upscale: true,
          },{
            name:'24px',
            width: '24px',
            quality: 85,
            upscale: true,
          },{
            name:'22px',
            width: '22px',
            quality: 85,
            upscale: true,
          },{
            name:'20px',
            width: '20px',
            quality: 85,
            upscale: true,
          },{
            name:'18px',
            width: '18px',
            quality: 85,
            upscale: true,
          },{
            name:'16px',
            width: '16px',
            quality: 85,
            upscale: true,
          },{
            name:'14px',
            width: '14px',
            quality: 85,
            upscale: true,
          },{
            name:'12px',
            width: '12px',
            quality: 85,
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