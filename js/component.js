/**
 * Adapt Learning component to display interactive
 * maps based on Google Maps service.
 * The component displays a list of places on
 * the map, each place is clickable and displays
 * a custom content.
 *
 * @author Fabio Beoni: https://github.com/fabiobeoni | https://it.linkedin.com/in/fabio-beoni-6a7848101
 */
define(function(require) {

    //adapt api modules
    var ComponentView = require('coreViews/componentView');
    var Adapt = require('coreJS/adapt');

    //general js utility
    var Utils = require('../libraries/Utils');

    //the map manager who wraps the
    //google maps API and exposes
    //only domain specific features
    var MapWrapper = require('../libraries/MapWrapper');

    //model fields and other constants
    var F = {
        MAP_TAG : 'interactiveMapPlaces-map-', //ui tag
        INVALID_ADDRESS_LIST_TAG : '-invalid-list', //ui tag
        UNIQUE_NAME:'uniqueName', //model field: map unique name on ui
        MAP_ID:'mapId', //model field: auto generated guid for the map ui tag
        MAP_HEIGHT:'mapHeight', //model field: the height of the map box on ui
        ITEMS:'_items', //model field: the list of places to be displayed
        API_KEY:'apiKey', //model field: the API key to contact Google Maps
        LANGUAGE:'language', //model field: the language to display on map
        ENABLE_COMPLETION_ON_CLICK:'enableCompletionOnClick', //model field: boolean, true to ask Adap to track component completion only when the user has clicked on all places displayed on map
        CLICKED_MARKERS : 'clickedMarkers' //model field: stores the amount of marker places clicked by the user to count them and check for completion of the component
    };

    //The current component, for return statement
    //extending default adapt view component.
    //This definition is reused by the API between
    //many instances on the page, while overrides
    //of component methods can access instance
    //specific data (like data model)
    var component = ComponentView.extend({

        preRender: function () {

            //first of all checks that the editor
            //setup the API key needed by Google Map
            //(XXXXXXXX is the default value)
            var mapAPIKey = this.model.get(F.API_KEY);
            if(!mapAPIKey || mapAPIKey.trim().length===0 || mapAPIKey==='XXXXXXXX')
            {
                alert('You must provide a Google Maps API Key to display maps with this component.');
                return;
            }

            //create a model prop to track user
            //clicks on map markers, used later on
            //to verify if all markers have been clicked
            this.model.set(F.CLICKED_MARKERS, []);

            //updates the model with a unique map ID needed to
            //select it with-in the document if other instances
            //of the component are there too
            this.model.set(F.MAP_ID, (F.MAP_TAG + Utils.guid()));
        },

        postRender: function () {
            var self = this;

            //initializes a MapWrapper and passes
            //specific component model data object
            //to render and manage the map
            var mapWrapper = new MapWrapper();
            mapWrapper.ini({
                apiKey:this.model.get(F.API_KEY),
                language:this.model.get(F.LANGUAGE),
                mapElemID:this.model.get(F.MAP_ID),
                messageListElemID: this.model.get(F.MAP_ID) + F.INVALID_ADDRESS_LIST_TAG,
                mapHeight:this.model.get(F.MAP_HEIGHT)
            });

            //Google Maps script is actually loaded once, multiple
            //instances of the component get a cached reference to it
            mapWrapper.load(function (map) {
                if(map)
                {
                    //has the map, so now add all provided places to it
                    //and registers a click listener for each one
                    //that will track click performed
                    mapWrapper.addPlaces(self.model.get(F.ITEMS),function(marker, foundPlaces){
                        self.trackMarkerClick(marker, foundPlaces);
                    });

                    //set the component completion status to true
                    //when the user is not requested to click on
                    //on each marker to complete the component
                    if(!self.model.get(F.ENABLE_COMPLETION_ON_CLICK))
                        self.completeComponent();
                }
                else
                    alert('Cannot initialize the map as requested');


                self.setReadyStatus();
            });
        },

        /**
         * Function invoked when the user clicks on a marker on the map.
         * When enabled, this function checks that all markers have been clicked
         * and fires the completion call back when all are selected.
         * @param marker {Object}: google maps marker instance firing the on click event
         * @param foundPlaces {number}
         */
        trackMarkerClick:function(marker, foundPlaces){
            var clickedMarkers = this.model.get(F.CLICKED_MARKERS);
            if(this.model.get(F.ENABLE_COMPLETION_ON_CLICK)){
                //checks the marker by id, a guid attached
                //on marker creation, add only once to the list
                var markerId = marker.get('id');
                if(clickedMarkers.indexOf(markerId)===-1)
                    clickedMarkers.push(markerId);

                //when all markers are clicked, fires the completion
                if(clickedMarkers.length===foundPlaces){
                    this.completeComponent(); //
                }
            }
        },
        completeComponent:function () {
            try{
                this.setCompletionStatus();
            }
            catch (err){
                console.error(err);
            }
        }

    });

    Adapt.register('adaptInteractiveMapPlaces', component);

    return component;
});
