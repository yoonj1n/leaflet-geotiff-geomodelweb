import L from "leaflet";
import chroma from "chroma-js";

L.LeafletGeotiff.Chroma = L.LeafletGeotiffRenderer.extend({
  options: {
    applyDisplayRange: true,
    colorScale: ['#f00', '#0f0', '#00f'], // 기본 색상 배열
    clampLow: true,
    clampHigh: true,
    displayMin: 0,
    displayMax: 1,
    noDataValue: -9999,
    useWebGL: false
  },

  initialize: function(options) {
    this.name = "Chroma";
    L.setOptions(this, options);
    this._preLoadColorScale();
  },

  setColorScale: function(colorScaleArray) {
    this.options.colorScale = colorScaleArray;
    this.parent._reset();
  },

  setDisplayRange: function(min, max) {
    this.options.displayMin = min;
    this.options.displayMax = max;
    this.parent._reset();
  },

  setClamps: function(clampLow, clampHigh) {
    this.options.clampLow = clampLow;
    this.options.clampHigh = clampHigh;
    this.parent._reset();
  },

  getColorbarOptions() {
    return ["Custom Chroma Scale"];
  },

  getColorbarDataUrl(paletteName) {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 1;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.createImageData(256, 1);

    const scale = chroma.scale(this.options.colorScale).domain([0, 255]);
    for (let i = 0; i < 256; i++) {
      const [r, g, b] = scale(i).rgb();
      imageData.data[i * 4] = r;
      imageData.data[i * 4 + 1] = g;
      imageData.data[i * 4 + 2] = b;
      imageData.data[i * 4 + 3] = 255;
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
  },

  _preLoadColorScale: function() {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const plot = new chroma.scale(this.options.colorScale).domain([this.options.displayMin, this.options.displayMax]);
    this.colorScaleData = canvas.toDataURL();
  },

  render: function(raster, canvas, ctx, args) {
    const plottyCanvas = document.createElement("canvas");
    const width = raster.width;
    const height = raster.height;
    plottyCanvas.width = width;
    plottyCanvas.height = height;

    const colorScale = chroma.scale(this.options.colorScale).domain([this.options.displayMin, this.options.displayMax]);
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let i = 0; i < raster.data[0].length; i++) {
      const value = raster.data[0][i];
      if (value !== this.options.noDataValue) {
        const [r, g, b] = colorScale(value).rgb();
        data[i * 4] = r;
        data[i * 4 + 1] = g;
        data[i * 4 + 2] = b;
        data[i * 4 + 3] = 255; // 불투명도
      } else {
        data[i * 4 + 3] = 0; // noDataValue일 경우 투명
      }
    }

    ctx.putImageData(imageData, args.xStart, args.yStart);
  }
});

L.LeafletGeotiff.chroma = function(options) {
  return new L.LeafletGeotiff.Chroma(options);
};