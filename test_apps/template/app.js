 /*global OpenLayers, Promise */
(function(exports) {
'use strict';
    var App = function() {
      var defaultCenter =
            new OpenLayers.LonLat(...this.configs.defaults.center),
          markers = new OpenLayers.Layer.Markers('Markers');

      this.layers.markers = markers;
      this.map = new OpenLayers.Map(this.configs.mapID);
      this.map.addLayer(new OpenLayers.Layer.OSM());
      this.map.setCenter(defaultCenter, this.configs.defaults.zoom);
      this.map.addLayer(markers);
    };

    App.prototype = {
      configs: {
        defaults: {
          zoom: 16,
          center: [-0.1279688, 51.5077286]
        },
        mapID: 'mapdiv',
        buttonID: 'submit'
      },
      map: null,
      layers: {
        markers: null
      }
    };

    App.prototype.recenter = function(lon, lat) {
      var lonLat = new OpenLayers.LonLat(lon, lat)
            .transform(
              new OpenLayers.Projection('EPSG:4326'), // transform from WGS 1984
              this.map.getProjectionObject() // to Spherical Mercator Projection
            ),
          markerIcon = new OpenLayers.Icon('marker.png'),
          marker = new OpenLayers.Marker(lonLat, markerIcon);
      this.layers.markers.addMarker(marker);
      this.map.setCenter(lonLat, this.configs.defaults.zoom);
      console.log('>> recenter done inner', lon, lat);
    };

    App.prototype.getLocation = function() {
      if (navigator.geolocation) {
        var promise = new Promise((resolve, reject)=>{
          // When get the result, continue the Promise.
          navigator.geolocation
          .getCurrentPosition(function(r){
            console.log('>> promise result', r); resolve(r);});
        });
        return promise;
      } else {
         alert('Geo Location is not supported');
      }
    };

    App.prototype.main = function() {
      document.getElementById(this.configs.buttonID)
        .addEventListener('click', (evt) => {
          console.log('>> button clicked');
          this.getLocation().then((pos)=>{
            this.recenter(pos.coords.longitude, pos.coords.latitude);
            console.log('>> recenter done');
          });
        });
    };

    exports.App = App;
    exports.app = new App();
    exports.app.main();
})(window);
