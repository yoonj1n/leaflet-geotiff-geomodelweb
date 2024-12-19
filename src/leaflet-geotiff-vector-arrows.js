
import chroma from 'chroma-js';

L.LeafletGeotiff.VectorArrows = L.LeafletGeotiffRenderer.extend({
  options: {
    arrowSize: 20,
    colors: ['white','white'],
    displayMin: 0,
    displayMax: 2,
    dataRange: [0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2],
    colorStep: 11,
    noDataValue: 361,
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
    var currentZoom = this.parent._map.getZoom();
    // var debugElement = document.createElement("div");
    // debugElement.innerText = "Current Zoom Level: " + currentZoom;
    // document.body.appendChild(debugElement);
    var gradientScale = this.options.dataRange.length === this.options.colors.length ? this.options.colors :
     chroma.scale(this.options.colors).domain([this.options.displayMin, this.options.displayMax]).colors(this.options.colorStep);
    var gradientColors = gradientScale.map((color, index) => ({
      value: this.options.dataRange[index],
      color: color,
    }));

    // var arrowSize = currentZoom <= this.options.fixedZoomLevel?this.options.arrowSize:this.options.maxZoomArrowSize;
    var arrowSize = this.options.arrowSize
    var gridPixelSize =
      (args.rasterPixelBounds.max.x - args.rasterPixelBounds.min.x) /
      raster.width;
      const stride = Math.max(1, Math.floor((1.2 * this.options.arrowSize) / gridPixelSize));



    for (var y = 0; y < raster.height; y = y + stride) {
      for (var x = 0; x < raster.width; x = x + stride) {
        var rasterIndex = y * raster.width + x;
        if (raster.data[1][rasterIndex] >= 0 && raster[1][rasterIndex] !== this.options.noDataValue) {
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
          if (currentZoom <= 8) {
            ctx.moveTo(-arrowSize / 2, 0);
            ctx.lineTo(+arrowSize / 2, 0);
          } else {
            ctx.moveTo(-arrowSize, 0);
            ctx.lineTo(+arrowSize, 0);
          }
          ctx.moveTo(arrowSize * 0.25, -arrowSize * 0.25);
          currentZoom <= 8? ctx.lineTo(+arrowSize / 2, 0) : ctx.lineTo(+arrowSize, 0);
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
