(function (factory) {
  typeof define === 'function' && define.amd ? define(factory) :
  factory();
}((function () { 'use strict';

  L.LeafletGeotiff.VectorArrows = L.LeafletGeotiffRenderer.extend({
    options: {
      arrowSize: 20
    },
    initialize: function (options) {
      this.name = "Vector";
      L.setOptions(this, options);
    },
    setArrowSize: function (colorScale) {
      this.options.colorScale = colorScale;

      this.parent._reset();
    },
    render: function (raster, canvas, ctx, args) {
      var arrowSize = this.options.arrowSize;
      var gridPxelSize = (args.rasterPixelBounds.max.x - args.rasterPixelBounds.min.x) / raster.width;
      var stride = Math.max(1, Math.floor(1.2 * arrowSize / gridPxelSize));

      // Define the gradient colors and corresponding values
      var gradientColors = [
        { value: 0.00, color: 'white' },
        { value: 0.50, color: 'blue' },
        { value: 1.00, color: 'green' },
        { value: 1.50, color: 'red' },
        { value: 2.00, color: 'black' },
      ];

      for (var y = 0; y < raster.height; y = y + stride) {
        for (var x = 0; x < raster.width; x = x + stride) {
          var rasterIndex = y * raster.width + x;

          if (raster.data[1][rasterIndex] >= 0) {
            //Ignore missing values
            //calculate lat-lon of of this point
            var currentLng = this.parent._rasterBounds._southWest.lng + (x + 0.5) * args.lngSpan;
            var currentLat = this.parent._rasterBounds._northEast.lat - (y + 0.5) * args.latSpan; //convert lat-lon to pixel cordinates

            var projected = this.parent._map.latLngToContainerPoint(L.latLng(currentLat, currentLng)); //If slow could unpack this calculation


            var xProjected = projected.x;
            var yProjected = projected.y; //draw an arrow

            // get speed value
            var value = raster.data[0][rasterIndex];

            // determine color
            var color;

            // color set
            if (value <= gradientColors[0].value) {
              color = gradientColors[0].color;
            } else if (value >= gradientColors[gradientColors.length - 1].value) {
              color = gradientColors[gradientColors.length - 1].color;
            } else {
              for (var i = 0; i < gradientColors.length - 1; i++) {
                if (value >= gradientColors[i].value && value <= gradientColors[i + 1].value) {
                  var t = (value - gradientColors[i].value) / (gradientColors[i + 1].value - gradientColors[i].value);
                  color = interpolateColor(gradientColors[i].color, gradientColors[i + 1].color, t);
                  break;
                }
              }
            }

            ctx.save();
            ctx.translate(xProjected, yProjected);
            ctx.rotate((90 + raster.data[1][rasterIndex]) * Math.PI / 180);
            ctx.beginPath();
            ctx.moveTo(-arrowSize / 2, 0);
            ctx.lineTo(+arrowSize / 2, 0);
            ctx.moveTo(arrowSize * 0.25, -arrowSize * 0.25);
            ctx.lineTo(+arrowSize / 2, 0);
            ctx.lineTo(arrowSize * 0.25, arrowSize * 0.25);
            ctx.strokeStyle = color;

            ctx.stroke();
            ctx.restore();
          }
        }
      }
      // Function to interpolate color between two colors
      function interpolateColor(color1, color2, t) {
        var hex1 = color1.substring(1);
        var hex2 = color2.substring(1);
        var r1 = parseInt(hex1.substring(0, 2), 16);
        var g1 = parseInt(hex1.substring(2, 4), 16);
        var b1 = parseInt(hex1.substring(4, 6), 16);
        var r2 = parseInt(hex2.substring(0, 2), 16);
        var g2 = parseInt(hex2.substring(2, 4), 16);
        var b2 = parseInt(hex2.substring(4, 6), 16);
        var r = Math.round(r1 + (r2 - r1) * t);
        var g = Math.round(g1 + (g2 - g1) * t);
        var b = Math.round(b1 + (b2 - b1) * t);
        return '#' + r.toString(16) + g.toString(16) + b.toString(16);
      }
    }
  });

  L.LeafletGeotiff.vectorArrows = function (options) {
    return new L.LeafletGeotiff.VectorArrows(options);
  };

})));
