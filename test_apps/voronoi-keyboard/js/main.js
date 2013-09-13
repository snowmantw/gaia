// TODO: vertics can't be the same!
// Duplicated SVGs!

const MIN_WEIGHT = 10;
const CANVAS_HEIGHT = 960;
const CANVAS_WIDTH  = 500;
const MAX_VHEIGHT = 100;
const MAX_VWIDTH  = 100;

var VoronoiKeyboard =  {

  elCanvas: null,
  weights: null,
  svg: null,

  init: function vk_init() {
    VoronoiKeyboard.weights = VoronoiKeyboard.demoWeightsCache();

    VoronoiKeyboard.svg = d3.select("#chart")
       .append("svg:svg")
       .attr("width", CANVAS_WIDTH)
       .attr("height", CANVAS_HEIGHT)
       .attr("class", "PiYG")
  },

  demoWeightsCache: function vk_demoWeightsCache() {
    demo = {
      't': [{'h': 50        }, {'e': 20        }, {'s': MIN_WEIGHT }, {'t': MIN_WEIGHT}, {'i': MIN_WEIGHT }],
      'h': [{'h': MIN_WEIGHT}, {'e': 30        }, {'s': MIN_WEIGHT }, {'t': MIN_WEIGHT}, {'i': 30         }],
      'e': [{'h': MIN_WEIGHT}, {'e': MIN_WEIGHT}, {'s': 60         }, {'t': MIN_WEIGHT}, {'i': MIN_WEIGHT }],
      's': [{'h': MIN_WEIGHT}, {'e': MIN_WEIGHT}, {'s': MIN_WEIGHT }, {'t': MIN_WEIGHT}, {'i': 60         }],
      'i': [{'h': MIN_WEIGHT}, {'e': MIN_WEIGHT}, {'s': 60         }, {'t': MIN_WEIGHT}, {'i': MIN_WEIGHT }],
    };
    return demo;
  },

  // Given height and weights of each polygon, then render it.
  // vertices: [ [Number (width), Number (height)] ]
  demoRenderKeyboard: function vk_demoRenderKeyboard(vertices) {

    console.log('++++ vs ++++', vertices);
    var svg = VoronoiKeyboard.svg;
    var vvs = d3.geom.voronoi(vertices);

      svg.selectAll("path")
         .data(vvs)
         .enter().append("svg:path")
         .attr("class", function(d, i) { return i ? "q" + (i % 9) + "-9" : null; })
         .attr("d", function(d) { return "M" + d.join("L") + "Z"; });

      svg.selectAll("circle")
         .data(vertices.slice(1))
         .enter().append("svg:circle")
         .attr("transform", function(d) { return "translate(" + d + ")"; })
         .attr("r", 2);

     function update() {
       vertices[0] = d3.svg.mouse(VoronoiKeyboard);
       svg.selectAll("path")
           .data(d3.geom.voronoi(vertices)
           .map(function(d) { return "M" + d.join("L") + "Z"; }))
           .filter(function(d) { return VoronoiKeyboard.getAttribute("d") != d; })
           .attr("d", function(d) { return d; });
     }
  },

  demoUpdateKeyboard: function vk_demoUpdateKeyboard(weights) {

    // From weight to h/w -> points.
    var vertices = [];
    weights.forEach(function(weight, idx) {
      var c = _.keys(weight)[0];
      var w = weight[c];

      // From weight to width & height.
      // TODO
      var wd  = (idx+1) * w;
      var h   = (idx+1) * w;
      vertices.push([wd, h]);
    });

    // Render it.
    VoronoiKeyboard.demoRenderKeyboard(vertices);
  },

  demoHandleInput: function vk_demoHandleInput(c) {
    // Get the weights and refresh the whole keyboard.
    VoronoiKeyboard.demoUpdateKeyboard(VoronoiKeyboard.weights[c]);
  },

  demoInputs: function vk_demoInputs() {
    var inputWaits = 3000;
    var inputs = ['t', 'h', 'e', 's', 'i', 's'];
    inputs.forEach( function vk_triggerInput(e, i, a) {
      setTimeout(function() { VoronoiKeyboard.demoHandleInput(e) }, inputWaits);
    });
  },
}

VoronoiKeyboard.init();
