
define(function(require) {

    var Loader = require('../libraries/Loader');
    var ComponentView = require('coreViews/componentView');
    var Adapt = require('coreJS/adapt');

    //the current component, for return statement
    var component = {};

    //loads needed utilities and main
    // class for managing the maps
    Loader.loadScript([
        'https://cdn.rawgit.com/fabiobeoni/MapWrapper/8ae7b3040cfe4d6dbd189070f033dabfba91ff40/Utils.min.js',
        'https://cdn.rawgit.com/fabiobeoni/MapWrapper/8ae7b3040cfe4d6dbd189070f033dabfba91ff40/MapWrapper.min.js'
    ],function()
    {
        var Utils = interactiveMapPlaces.Utils; //namespace declared in loaded libs
        var MapWrapper = interactiveMapPlaces.MapWrapper; //namespace declared in loaded libs

        //local reference always available
        var _component;

        //model fields and other constants
        var F = {
            MAP_TAG : 'interactiveMapPlaces-map-',
            INVALID_ADDRESS_LIST_TAG : '-invalid-list',
            UNIQUE_NAME:'uniqueName',
            MAP_ID:'mapId',
            MAP_HEIGHT:'mapHeight',
            ITEMS:'_items',
            API_KEY:'apiKey',
            ADDRESS:'address',
            LANGUAGE:'language',
            ENABLE_COMPLETION_ON_CLICK:'enableCompletionOnClick'
        };

        //number of marker places that the learner has clicked
        //to display the marker content
        var clickedMarkers = [];

        //model value defining if clicking on marker
        //the component status has to change
        var isCompletionOnClickEnabled = true;

        //component definition
        component = ComponentView.extend({

            preRender: function () {

                //references the current comp to local scope for later use
                //where 'this' doesn't refer to the component it-self
                _component = this;

                //updates the model with a unique map ID needed to
                //select it with-in the document if other instances
                //of the component are there too
                this.model.set(F.MAP_ID, F.MAP_TAG + Utils.guid());

                //fill the value from model for later use in different context
                isCompletionOnClickEnabled = this.model.get(F.ENABLE_COMPLETION_ON_CLICK);
            },

            postRender: function () {

                //set-up the wrapper with map settings
                MapWrapper.ini({
                    apiKey:this.model.get(F.API_KEY),
                    language:this.model.get(F.LANGUAGE),
                    mapElemID:this.model.get(F.MAP_ID),
                    messageListElemID: this.model.get(F.MAP_ID) + F.INVALID_ADDRESS_LIST_TAG,
                    mapHeight:this.model.get(F.MAP_HEIGHT)
                });

                //Google Maps script is actually loaded once, multiple
                //instances of the component get a cached reference to it
                MapWrapper.load(function (map) {
                    if(map)
                        MapWrapper.addPlaces(_component.model.get(F.ITEMS),_component.trackMarkerClick);

                    //set the component completion status to true
                    //when the user is not requested to click on
                    //on each marker to complete the component
                    if(!isCompletionOnClickEnabled)
                        _component.setCompletionStatus();

                    _component.setReadyStatus();
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
                if(isCompletionOnClickEnabled){
                    //checks the marker by id, a guid attached
                    //on marker creation, add only once to the list
                    var markerId = marker.get('id');
                    if(clickedMarkers.indexOf(markerId)==-1)
                        clickedMarkers.push(markerId);

                    //when all markers are clicked, fires the completion
                    if(clickedMarkers.length==foundPlaces){
                        try{
                            _component.setCompletionStatus();
                        }
                        catch (err){
                            console.error(err);
                        }
                    }
                }
            }

        });

        Adapt.register('interactiveMapPlaces', component);
    });

    return component;
});
