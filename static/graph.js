var D3Graph = function(options) {
  this.options = options || {};
  this.options.width |= 1200;
  this.options.height |= 700;
  this.options.scale |= 100;
  this.options.margin = 10;

  this.root = void 0;

  this.tree = d3.layout.tree().nodeSize([75, 50]);
  this.tree.separation(function (a, b) {
    var w1 = ((a.form || '').length > a.relation.length) ? a.form.length : a.relation.length;
    var w2 = ((b.form || '').length > b.relation.length) ? b.form.length : b.relation.length;
    var scale = 0.13; // TODO: ???
    return Math.ceil((w1 * scale) + (w2 * scale) / 2);
  });

  this.svg = d3.select('#graph')
    .append('svg')
    .attr('width', this.options.width)
    .attr('height', this.options.height)
    .style('overflow', 'auto')
    .append('g')
    .attr('transform', 'translate(' + this.options.width/2 + ',' + this.options.margin + ') scale(' + this.options.scale/100 + ')');
};

D3Graph.prototype.updateGraph = function(json) {
  this.tokens = json.tokens;
  this.root = this.buildGraph(json);

  return this.update(this.root);
};

D3Graph.prototype.buildGraph = function(json) {
  var tokens = {};
  var graphs = new Array();

  for (var i = 0; i < json.tokens.length; i++) {
    var attrs = json.tokens[i];

    tokens[attrs.id] = { id: attrs.id, form: attrs.form, relation: attrs.relation, children: [] };
  }

  for (var i = 0; i < json.tokens.length; i++) {
    var attrs = json.tokens[i];

    if (attrs.head_id)
      tokens[attrs.head_id].children.push(tokens[attrs.id]);
    else
      graphs.push(tokens[attrs.id]);
  }

  return { children: graphs }; // dummy root node that ties together multiple graphs
};

D3Graph.prototype.update = function(source) {
  var that = this;

  var diagonal = d3.svg.diagonal().projection(function(d) {
    return [d.x, d.y];
  });

  var duration = (d3.event && d3.event.altKey ? 5000 : 500);
  var nodes = this.tree.nodes(this.root).reverse();

  nodes.forEach(function(d) {
    d.y = d.depth * 75;
  });

  var node = this.svg.selectAll('g.node')
    .data(nodes, function(d, i) { return d.id; });


  var nodeEnter = node.enter()
    .append('g')
    .attr('class', 'node')
    .attr('transform', function(d) { return 'translate(' + source.x + ',' + source.y + ')'; })
    .on('click', function(d) {
      that.toggle(d);
      return that.update(d);
    });

  // Node
  nodeEnter.append('circle')
    .attr('r', 4.5)
    .style('fill', '#FFF')
    .style('stroke-width', '2px')
    .style('stroke', function(d) {
      if (d._children) {
        return '#f00';
      } else {
        return '#000';
      }
    });

  // Form label
  nodeEnter.append('text')
    .attr('y', 15)
    .attr('dy', '12px')
    .attr('text-anchor', 'middle')
    .style('fill', '#333')
    .style('font-style', 'italic')
    .style('letter-spacing', '0.5px')
    .style('font-size', '1em')
    .text(function(d) { return d.form; });

  // Relation label
  nodeEnter.append('text')
    .attr('y', -25)
    .attr('dy', '12px')
    .attr('text-anchor', 'middle')
    .style('fill', '#444')
    .style('letter-spacing', '1px')
    .style('font-size', '0.7em')
    .text(function (d) { return d.relation; });

  // Edge
  var link = this.svg.selectAll('path.link')
    .data(this.tree.links(nodes), function(d) { return d.target.id; });

  link.enter()
    .insert('path', 'g')
    .attr('class', 'link')
    .attr('d', function(d) {
      var o = { x: source.x, y: source.y };
      return diagonal({ source: o, target: o });
    });

  link.transition()
    .duration(duration)
    .attr('d', diagonal);


  var nodeUpdate = node.transition()
    .duration(duration)
    .attr('transform', function(d) { return 'translate(' + d.x + ',' + d.y + ')'; });

  nodeUpdate.select('circle')
    .attr('r', 4.5)
    .style('fill', '#FFF')
    .style('stroke-width', '2px')
    .style('stroke', function(d) {
      if (d._children) {
        return '#f00';
      } else {
        return '#000';
      }
    });

  nodeUpdate.select('text')
    .style('fill-opacity', 1);


  var nodeExit = node.exit()
    .transition()
    .duration(duration)
    .attr('transform', function(d) { return 'translate(' + source.x + ',' + source.y + ')'; })
    .remove();

  nodeExit.select("circle")
    .attr('r', 1e-6);

  nodeExit.select('text')
    .style('fill-opacity', 1e-6);

  link.exit()
    .transition()
    .duration(duration)
    .attr('d', function(d) {
      var o = { x: source.x, y: source.y };
      return diagonal({ source: o, target: o });
    })
    .remove();

  nodes.forEach(function(d) {
    d.x0 = d.x;
    d.y0 = d.y;
  });
};

D3Graph.prototype.toggle = function(d) {
  if (d.children) {
    d._children = d.children;
    return d.children = null;
  } else {
    d.children = d._children;
    return d._children = null;
  }
};
