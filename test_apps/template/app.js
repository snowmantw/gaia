 /*global OpenLayers, Promise */
(function(exports) {
'use strict';
    var App = function() {
      var defaultCenter =
            new OpenLayers.LonLat(...this.configs.defaults.center),
          markers = new OpenLayers.Layer.Markers('Markers');

      this.layers.markers = markers;
      this.map = new OpenLayers.Map('mapdiv');
      this.map.addLayer(new OpenLayers.Layer.OSM());
      this.map.setCenter(defaultCenter, this.configs.defaults.zoom);
      this.map.addLayer(markers);
    };

    App.prototype = {
      configs: {
        defaults: {
          zoom: 16,
          center: [-0.1279688, 51.5077286]
        }
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
            );
      this.markers.addMarker(new OpenLayers.Marker(lonLat));
      this.map.setCenter(lonLat, this.configs.defaults.zoom);
    };

    App.prototype.getLocation = function() {
      if (navigator.geolocation) {
        var promise = new Promise((resolve, reject)=>{
          // When get the result, continue the Promise.
          navigator.geolocation
          .getCurrentPosition(function(r){console.log('>> r', r); resolve(r);});
        });
        return promise;
      } else {
         alert('Geo Location is not supported');
      }
    };

    App.prototype.main = function() {
      document.getElementById('submit')
        .addEvent('click', (evt) => {
          this.getLocation().then(()=>{console.log('OK');});
        });
    };

    exports.App = App;
    exports.app = new App();
})(window);
