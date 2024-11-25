
L.LeafletGeotiff.VectorArrows = L.LeafletGeotiffRenderer.extend({
  options: {
    arrowSize: 20,
    colors: ['red', 'yellow', 'green', 'blue', 'purple'],
    colorStep: 12,
  },

  initialize: function(options) {
    this.name = "Vector";
    L.setOptions(this, options);
  },

  setArrowSize: function(colorScale) {
    this.options.colorScale = colorScale;
    this.parent._reset();
  },

  render: function(raster, canvas, ctx, args) {

    var gradientColors = [
      { value: 0.00, color: '#B2FCFF' },
      { value: 0.10, color: '#2AD8FE' },
      { value: 0.20, color: '#4AB8FE' },
      { value: 0.30, color: '#91D587' },
      { value: 0.40, color: '#E2F700' },
      { value: 0.50, color: '#E6D400' },
      { value: 0.60, color: '#EAB500' },
      { value: 1.00, color: '#EE9000' },
      { value: 1.30, color: '#F26F00' },
      { value: 1.60, color: '#F64A00' },
      { value: 1.80, color: '#FB2500' },
      { value: 2.00, color: '#FF0000' },
      // { value: 0.00, color: '#8000f1' },
      // { value: 0.20, color: '#800080' },
      // { value: 0.40, color: '#c71585' },
      // { value: 0.60, color: '#ff00f1' },
      // { value: 0.80, color: '#00adf5' },
      // { value: 1.00, color: '#00ddf3' },
      // { value: 1.20, color: '#00ff10' },
      // { value: 1.40, color: '#80ff10' },
      // { value: 1.60, color: '#ffff00' },
      // { value: 1.80, color: '#ff8800' },
      // { value: 2.00, color: '#ff0000' },
    ];

    var arrowSize = this.options.arrowSize;
    var gridPxelSize =
      (args.rasterPixelBounds.max.x - args.rasterPixelBounds.min.x) /
      raster.width;
    var stride = Math.max(1, Math.floor((1.2 * arrowSize) / gridPxelSize));

    for (var y = 0; y < raster.height; y = y + stride) {
      for (var x = 0; x < raster.width; x = x + stride) {
        var rasterIndex = y * raster.width + x;
        if (raster.data[1][rasterIndex] >= 0) {
          //Ignore missing values
          //calculate lat-lon of of this point
          var currentLng =
            this.parent._rasterBounds._southWest.lng + (x + 0.5) * args.lngSpan;
          var currentLat =
            this.parent._rasterBounds._northEast.lat - (y + 0.5) * args.latSpan;

          //convert lat-lon to pixel cordinates
          var projected = this.parent._map.latLngToContainerPoint(
            L.latLng(currentLat, currentLng)
          ); //If slow could unpack this calculation
          var xProjected = projected.x;
          var yProjected = projected.y;

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


          //draw an arrow
          ctx.save();
          ctx.translate(xProjected, yProjected);
          ctx.rotate(((90 + raster.data[1][rasterIndex]) * Math.PI) / 180);
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
      var rgb1 = parseColor(color1);
      var rgb2 = parseColor(color2);
    
      if (!rgb1 || !rgb2) {
        return '#ffffff'; // 적절한 기본값으로 변경 가능
      }
    
      var r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * t);
      var g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * t);
      var b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * t);

      if (isNaN(r) || isNaN(g) || isNaN(b)) {
        return '#ffffff';
      }
    
      return rgbToHex(r, g, b);
    }
    
    function parseColor(color) {
      var hex = color.replace('#', '');
      if (hex.length !== 6) {
        return null;
      }
    
      var r = parseInt(hex.substring(0, 2), 16);
      var g = parseInt(hex.substring(2, 4), 16);
      var b = parseInt(hex.substring(4, 6), 16);
    
      if (isNaN(r) || isNaN(g) || isNaN(b)) {
        return null;
      }
    
      return { r: r, g: g, b: b };
    }
    
    function rgbToHex(r, g, b) {
      var rHex = r.toString(16).padStart(2, '0');
      var gHex = g.toString(16).padStart(2, '0');
      var bHex = b.toString(16).padStart(2, '0');

      return '#' + rHex + gHex + bHex;
    }
  }
});

L.LeafletGeotiff.vectorArrows = function(options) {
  return new L.LeafletGeotiff.VectorArrows(options);
};
