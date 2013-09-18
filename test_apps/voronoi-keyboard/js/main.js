// TODO: Graph traversal algorithm & seamless creating polygon

const MIN_WEIGHT = 10;
const CANVAS_HEIGHT = 200;
const CANVAS_WIDTH  = 350;
const MAX_VHEIGHT = 100;
const MAX_VWIDTH  = 100;

var VoronoiKeyboard =  {

  elCanvas: null,
  weights: null,
  kcoords: null,
  svg: null,
  keys: ['qwertyuiop', 'asdfghjkl', ' zxcvbnm '],
  demoWeight: {
      't': {'h': 2, 'e': 1},
      'th': {'e': 1, 'i': 3},
      'the': {'s': 2},
      'thes': {'i': 2},
      'thesi': {'s': 2}
    },
  keyHistory: [],
  vertexHistory: [],

  init: function vk_init() {
    VoronoiKeyboard.weights = VoronoiKeyboard.demoWeightsCache();
    VoronoiKeyboard.kcoords = VoronoiKeyboard.demoKeyOrigins();

    VoronoiKeyboard.svg = d3.select("#chart")
       .append("svg:svg")
       .attr("width", CANVAS_WIDTH)
       .attr("height", CANVAS_HEIGHT)
       .attr("class", "PiYG")

    document.getElementById('backspace')
      .addEventListener('click', function(){ 
        console.log('a++ ++b');
        VoronoiKeyboard.backspace(); });
  },

  // Give original coordinates of the keys.
  demoKeyOrigins: function vk_demoKeyOrigins() {
    demo = {
      't': [285, 8],
      'h': [230, 4],
      'e': [170, 32],
      's': [35, 80],
      'i': [100, 32]
    };
    return demo;
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

  demoRenderKeyboard: function vk_demoRenderKeyboard(cvertices) {

    var svg = VoronoiKeyboard.svg;

    var vertices = d3.range(6).map(function(d) {
      return [Math.random() * CANVAS_WIDTH, Math.random() * CANVAS_HEIGHT];
    });

    var voronoi = d3.geom.voronoi()
        .clipExtent([[0, 0], [CANVAS_WIDTH, CANVAS_HEIGHT]]);

    var path = svg.append("g").selectAll("path");
    redraw();

    svg.selectAll('text')
        .data(cvertices)
      .enter().append('text')
        .attr("x", function(d) { return d[0] - 6;})
        .attr("y", function(d) { return d[1] - 6;})
        .text( function(d) { return d[2];} );

    /*svg.selectAll("circle")
        .data(cvertices)
      .enter().append("circle")
        .attr("transform", function(d) { return "translate(" + d[0] + ',' + d[1] + ")"; })
        .attr("r", 2);*/

    var self = this;
    function redraw() {

      var keys = [];
      path = path.data(voronoi(cvertices).map(function(d, i) { keys.push(cvertices[i][2]);  return "M" + d.join("L") + "Z"; }), String);
      path.exit().remove();
      path.enter().append("path")
        .attr("class", function(d, i) {
          var vertix = cvertices[i];
          return vertix[3] > 1 ? "active" : (
               VoronoiKeyboard.keyHistory.indexOf(vertix[2]) > -1 ? "typed" : "normal");
        })
        .attr("key", function(d, i) {
          return keys[i];
        })
        .attr("d", String)
        .on("click", function() { DEBUG=this; console.log('++input++', this.getAttribute('key'));VoronoiKeyboard.inputKey(this.getAttribute('key')); });
      path.order();
    }
  },

  // Can print test and can show the circles but need heavy tunning.
  depracated__demoRenderKeyboard: function vk_demoRenderKeyboard(cvertices) {

    var svg = VoronoiKeyboard.svg;

    var voronoi = d3.geom.voronoi()
        .clipExtent([[0, 0], [CANVAS_WIDTH, CANVAS_HEIGHT]]);

    var vvs = voronoi(cvertices);
    redraw();
    svg.selectAll("circle")
        .data(cvertices)
      .enter().append("circle")
        .attr("transform", function(vc) { 
          var w = vc[0];
          var h = vc[1];
          return "translate(" + (w/2) + ',' + (h/2) + ")"; 
         })
        .attr("r", 4)

    var calcMid = function(p1, p2) {
      return [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2]
    };
    var vcs = voronoi(cvertices);
    var tds = [];
    vcs.forEach(function(d, i) { tds.push([ calcMid(d[0], d[1]), cvertices[i][2] ]) });
    svg.selectAll('text')
        .data(tds)
      .enter().append('text')
        .attr("x", function(d) { return d[0][0]})
        .attr("y", function(d) { return d[0][1]})
        .text( function(d) { return d[1] } );

    function redraw() {

      var path = svg.append("g").selectAll("path");
      var vcs = voronoi(cvertices);
      path = path.data(vcs.map(function(d) { return "M" + d.join("L") + "Z"; }), String);
      path.exit().remove();
      path.enter().append("path").attr("class", function(d, i) { return "q" + (i % 9) + "-9"; }).attr("d", String);
      path.order();
    }
  },

  demoUpdateKeyboard: function vk_demoUpdateKeyboard(weights) {

    // From weight to new polygon's center pointer.
    var cvertices = [];
    weights.forEach(function(weight, idx) {
      var c = _.keys(weight)[0];
      var w = weight[c];

      // From weight to new polygon's center pointer.
      // TODO: finish the algorithm.
      var wd = VoronoiKeyboard.kcoords[c][0];
      var h  =VoronoiKeyboard.kcoords[c][1];
      cvertices.push([wd, h, c]);
    });

    // Remove old one.
    var svg = document.querySelector('#chart svg');
    svg.innerHTML = '';

    // Render it.
    VoronoiKeyboard.demoRenderKeyboard(cvertices);
  },

  currentChar: function vk_currentChar(c) {
    document.querySelector('#user-input').textContent += c;
  },

  demoHandleInput: function vk_demoHandleInput(c) {
    // Get the weights and refresh the whole keyboard.
    VoronoiKeyboard.currentChar(c);
    VoronoiKeyboard.demoUpdateKeyboard(VoronoiKeyboard.weights[c]);
  },

  demoInputs: function vk_demoInputs() {
    var inputWaits = 3000;
    var inputs = ['t', 'h', 'e', 's', 'i', 's'];
    inputs.forEach( function vk_triggerInput(e, i, a) {
      setTimeout(function() { VoronoiKeyboard.demoHandleInput(e) }, inputWaits*i);
    });
  },

  backspace: function vk_backspace() {
    this.keyHistory.splice(this.keyHistory.length - 1, 1);
    this.drawKeyboard(this.demoWeight[this.keyHistory.join('')]);
    document.getElementById('user-input').textContent = VoronoiKeyboard.keyHistory.join("");
  },

  inputKey: function vk_inputKey(k) {
    this.keyHistory.push(k);
    this.drawKeyboard(this.demoWeight[this.keyHistory.join('')]);
    document.getElementById('user-input').textContent = VoronoiKeyboard.keyHistory.join("");
  },

  loopString: function vk_loopString(str, cb) {
    for (var j = 0; j < str.length; j++) {
      cb(str[j], j);
    }
  },

  drawKeyboard: function vk_drawKeyboard(weight) {
    if (!weight) {
      weight = {};
    }
    var vertices = [];
    var lineHeight = CANVAS_HEIGHT / this.keys.length;
    for (var i = 0; i < this.keys.length; i++) {
      var currentHeight = i * lineHeight + lineHeight / 2;

      var itemCounts = this.keys[i].length;
      this.loopString(this.keys[i], function(k, j) {
        itemCounts += (weight[k] ? weight[k] : 0);
      });

      var charWidth = CANVAS_WIDTH / itemCounts;
      var layoutCount = 0;
      this.loopString(this.keys[i], function(k, j) {
        var strWeight = 1 + (weight[k] ? weight[k] : 0);
        var currentWidth = layoutCount * charWidth + charWidth * strWeight / 2;
        layoutCount += strWeight;
        vertices.push([currentWidth, currentHeight, k, strWeight]);
      });
    }

    // Remove old one.
    var svg = document.querySelector('#chart svg');
    svg.innerHTML = '';

    this.demoRenderKeyboard(vertices);
  }
}

VoronoiKeyboard.init();

VoronoiKeyboard.drawKeyboard();
