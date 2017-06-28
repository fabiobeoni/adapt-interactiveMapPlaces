/**
 * Google Maps wrapper class to expose only context related features.
 *
 * @author Fabio Beoni: https://github.com/fabiobeoni | https://it.linkedin.com/in/fabio-beoni-6a7848101
 */
define(function () {

    var MapWrapper = function () {

            /**
             * google key needed to invoke the service
             */
            this.apiKey=null;

            /**
             * Map language to use, default English.
             */
            this.language = 'en';

            /**
             * Map GeoCoder to look for places
             */
            this.geocoder = null;

            /**
             * Current map object
             */
            this.map=null;

            /**
             * Array of all markers objects added to map
             */
            this.markers=[];

            /**
             * Marker information window factory
             */
            this.infowindow=null;

            /**
             * Number of places returned by the query to google api
             * that are actually found by the query, can be smaller
             * than the requestedPlaces.
             */
            this.foundPlaces = 0;

            /**
             * Number of places requested to google api
             */
            this.requestedPlaces = 0;

            /**
             * Place request result status
             */
            this.geoCodeStatus = {
                OK:"OK", //indicates that no errors occurred; the address was successfully parsed and at least one geocode was returned.
                ZERO_RESULTS:"ZERO_RESULTS", //indicates that the geocode was successful but returned no results. This may occur if the geocoder was passed a non-existent address.
                OVER_QUERY_LIMIT:"OVER_QUERY_LIMIT", //indicates that you are over your quota.
                REQUEST_DENIED:"REQUEST_DENIED", //indicates that your request was denied.
                INVALID_REQUEST:"INVALID_REQUEST", //generally indicates that the query (address, components or latlng) is missing.
                UNKNOWN_ERROR:"UNKNOWN_ERROR" //indicates that the request could not be processed due to a server error. The request may succeed if you try again.
            };

            /**
             * Domains used to load the map, China has his own.
             */
            this.googleDomains={
                'general':'maps.googleapis.com',
                'zh-CN':'maps.googleapis.cn'
            };

            this.mapElemID=null;
            this.messageListElemID=null;

            /**
             * Ui elements expected to be in client UI.
             */
            this.Ui = {
                $mapBox:null,
                $listBox:null
            };

            /**
             * Initialize the map object with needed settings.
             * @param opts {Object} : apiKey, language, mapElemID, messageListElemID
             */
            this.ini=function (opts) {
                this.apiKey = opts.apiKey;
                this.language = opts.language;
                this.mapElemID = opts.mapElemID;
                this.messageListElemID = opts.messageListElemID;

                //for China, changes the api url domain
                if(this.language==='zh-CN')
                    this.googleDomain = this.googleDomains['zh-CN'];
                else
                    this.googleDomain = this.googleDomains.general;

                //HTML rendered, so lets instantiate the UI
                this.Ui.$mapBox = $('#'+this.mapElemID);
                this.Ui.$listBox = $('#'+this.messageListElemID);

                //apply style to map container before creating the map (if any)
                if(!$.isNumeric(opts.mapHeight) || opts.mapHeight<=0)
                    opts.mapHeight = 30; //default value needed

                this.Ui.$mapBox.css('height', (opts.mapHeight+'rem'));
            };

            /**
             * Loads google maps script (if not available yet), creates
             * the map instance and returns to client.
             * @param callback {Function}: (map).
             */
            this.load=function (callback){
                var _this = this;

                if(window.google && window.google.maps)
                    return callback(this.createMap(this.Ui.$mapBox.attr('id')));
                else
                {
                    this.mapReadyObservers.push({
                        mapWrapperInstance:this,
                        callback:callback
                    });

                    if(this.mapReadyObservers.length===1){
                        var script = document.createElement('script');
                        script.type = 'text/javascript';
                        script.async = true;
                        script.onload = function(){
                            _this.onMapAPILoaded(_this);
                        };
                        script.src = 'https://'+this.googleDomain+'/maps/api/js?&key='+this.apiKey+'&language='+this.language+'&libraries=places';
                        document.querySelector('head').appendChild(script);
                    }

                }
            };

            /**
             * Creates and returns the google map geodecoder.
             * @returns {Object}
             */
            this.getGeocoder=function () {
                if(!this.geocoder)
                    this.geocoder = new google.maps.Geocoder();

                return this.geocoder;
            };

            /**
             * Creates and returns the google map marker InfoWindow.
             * @returns {Object}
             */
            this.getInfoWindow=function () {
                if(!this.infowindow)
                    this.infowindow = new google.maps.InfoWindow();

                return this.infowindow;
            };

            /**
             * Creates and set the map on wrapper.
             * @param elemId {String}: id of the HTML element that will host the map on client UI.
             * @param [opts] {Object}: google map creation options. Has some default.
             * @returns {Object}
             */
            this.createMap=function (elemId, opts) {
                if(!opts) opts = {
                    center: {lat: -33.8688, lng: 151.2195},
                    zoom: 13,
                    mapTypeId: 'roadmap'
                };

                this.map = new google.maps.Map(document.getElementById(elemId), opts);

                return this.map;
            };

            /**
             * Add places to the map by clickable markers.
             * @param places {Array}: string array of querying places (addresses or names of places)
             * @param [markerClickCallback] {Function}: callback function to invoke when a marker gets clicked.
             */
            this.addPlaces=function (places, markerClickCallback) {

                //the function to be invoked when a place marker gets clicked by the user
                var _markerClickCallback = function (marker,totalFoundPlaces) {
                    if(markerClickCallback)
                        markerClickCallback(marker,totalFoundPlaces);
                };

                //found places will be decreased if some
                //places are not found by google maps
                this.foundPlaces = places.length;
                this.requestedPlaces = places.length;

                this.getGeocoder();

                var _this = this;
                $(places).each(function (i, item) {
                    //looks for a place based on model address
                    _this.geocoder.geocode({address: item.address}, function (results,status) {
                        switch (status){
                            //place found, add a marker icon with click behaviour
                            case _this.geoCodeStatus.OK:
                                //defines the callback on current marker to be invoked on click
                                item.callback = _markerClickCallback;
                                for(var r in results)
                                    _this.addMarker(results[r], item);

                                //alerts the editor that the address string is probably too generic
                                if(results.length>1)
                                    alert('Found multiple results for address '+item.address);
                                break;

                            //place address doesn't correspond to any google
                            //known place, display a message to the editor
                            //to change the place query
                            case _this.geoCodeStatus.ZERO_RESULTS:
                                _this.foundPlaces--;
                                _this.Ui.$listBox.find('ul').append('<li>'+item.address+'</li>');
                                break;

                            //any other error case, logged and alerts
                            // the users (both editor or learner)
                            default:
                                _this.foundPlaces--;
                                console.error('adapt-interactiveMapPlaces: geodecode status '+status);
                                alert('Error looking to address '+item.address+' on Google Maps.');
                        }

                        //when all markers are displayed on map
                        //make sure to zoom the map to have them
                        //visible to the user
                        _this.displayMarkersOnCompleted();

                        //displays the alert box when some places couldn't be found
                        _this.Ui.$listBox.css({display:((_this.foundPlaces!==_this.requestedPlaces) ? "block" : "none")});
                    });
                });
            };

            /**
             * Add a marker to the map, makes it clickable and sets his info window contents.
             * @param markerData {Object}: a single item result of a query to google map geocoder.geocode() function. See addPlaces().
             * @param otherInfo {Object}: [content] {String}, [extreference] {String}, [picture] {string}.
             */
            this.addMarker=function (markerData,otherInfo) {
                var marker = new google.maps.Marker({
                    position: markerData.geometry.location,
                    map: this.map,
                    title: markerData.formatted_address
                });

                //set a unique id to the marker to identify it on UI if needed
                marker.set('id', Date.now().toString());

                //sets a default content for the window object
                otherInfo.content = otherInfo.content || '(No content)';

                //when picture is available adds it to content
                //with a link to open it in a new tab
                if(otherInfo.picture)
                    otherInfo.content = otherInfo.content +
                        '<p>' +
                            '<a href="'+otherInfo.picture+'" target="_blank">' +
                                '<img src="'+otherInfo.picture+'" style="width: 100%;"/>' +
                            '</a>' +
                        '</p>';

                //when an external URL reference is available adds it to content
                //with a link to open it in a new tab
                if(otherInfo.extreference)
                    otherInfo.content = otherInfo.content +
                        '<p>' +
                            '<a href="'+otherInfo.extreference+'" target="_blank">'+otherInfo.extreference+'</a>' +
                        '</p>';


                //attaches the event listener for marker clicking
                var _this = this;
                google.maps.event.addListener(marker, 'click', function() {
                    var infowindow = _this.getInfoWindow();
                    infowindow.setContent(otherInfo.content);
                    infowindow.open(_this.map,marker);
                    otherInfo.callback(marker,_this.foundPlaces);
                });

                //tracks all added markers
                this.markers.push(marker);
            };

            /**
             * Fit the map zoom to display all markers
             */
            this.displayMarkersOnCompleted=function () {
                if(this.markers.length===this.foundPlaces){
                    var bounds = new google.maps.LatLngBounds();
                    for (var m in this.markers)
                        bounds.extend(this.markers[m].getPosition());

                    //center the map to the geometric center of all markers
                    this.map.setCenter(bounds.getCenter());
                    this.map.fitBounds(bounds);

                    //sets teh best zoom possible to display all markers
                    if(this.markers.length===1)
                        this.map.setZoom(this.map.getZoom()-5);
                    else
                    //remove one zoom level to ensure no marker is on the edge.
                        this.map.setZoom(this.map.getZoom()-1);

                    //clean
                    this.markers = [];
                }
            }
        };

    /**
     * List of observers to be notified when
     * when the Google Maps API is ready to use.
     * @type {Array}: mapWrapperInstance {MapWrapper}, callback {function}
     */
    MapWrapper.prototype.mapReadyObservers = [];

    /**
     * Invoked when the Google Maps script is included
     * and fully loaded.
     * @param mapWrapper {MapWrapper}: instance of MapWrapper
     */
    MapWrapper.prototype.onMapAPILoaded = function(mapWrapper){
        for(var i in mapWrapper.mapReadyObservers){
            var obs = mapWrapper.mapReadyObservers[i];
            //creates the google maps instance with-in the
            //the ui map box when script is ready
            obs.mapWrapperInstance.createMap(obs.mapWrapperInstance.Ui.$mapBox.attr('id'));
            //invokes the callbacks on each map api ready listener
            obs.callback(obs.mapWrapperInstance.map);
        }
    };

    return MapWrapper;
});