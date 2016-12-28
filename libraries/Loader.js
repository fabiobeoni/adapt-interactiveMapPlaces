define(function () {
    return {
        /**
         * Loads all given scripts from their URLs, when
         * all of them are ready invokes the callback.
         * @param urls {Array}: string array
         * @param callback {Function}
         */
        loadScript:function(urls,callback){
            var head = document.querySelector('head');
            var counter = 0;
            for(var i in urls){
                var script = document.createElement('script');
                script.type = 'text/javascript';
                script.onload = function(){
                    counter++;
                    if(counter==urls.length)
                        callback();
                };

                script.src = urls[i];
                head.appendChild(script);
            }
        }
    };
});
