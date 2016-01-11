## Website Performance Optimization portfolio project

###  Optimizing critical rendering path of index.html 

#### Prerequisites:

* Node.js installed (comes with installed npm)
* Gulp.js installed 

```bash
  npm install gulp -g
 ```

#### Part 1: Check out the repository

#### Part 2: Restore node modules

* Run this command from the project's root folder

```bash
  npm install
 ```
 
#### Part 3: Build project and run PageSpeed gulp task

* Run this command from the project's root folder

```bash
  gulp
 ```
 
This will run the default task that will:

1. Build the project:
  * merge and minify css and js files
  * optimise images
  * output deployment artifacts to the build directory
2. Run PageSpeed for index.html performing the following steps:
  * Start local server from the build directory
  * Start ngrok tunnel to get a public URL for the site to be able to run it through PageSpeed
  * Run PageSpeed for index.html and capture the results
  * Analyse the PageSpeed results and output to the screen

Gulp process will exit with code 0 (zero) only if the PageSpeed results for desktop and mobile are under 90 point threshold.



### Optimising pizza.html performance

Main optimisations done (see code comments for details):

* Optimise changePizzaSizes function
* Optimise updatePositions function
* Use window.requestAnimationFrame in scroll event handler

