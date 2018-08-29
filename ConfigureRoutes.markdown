Inside this directory, there is a `routes` directory. Open it up. Take a look at `index.js` (`index.js` is used by Node as default)

There is  line:

    router.use('/api', require('./api')) 

Notice and open the `api/index.js` file.
 
Find the search route, which is created using the `defaultSearchRoute` factory function. There are a number of configuration options, which are documented in that file.
