define(["knockout"],
    function (ko) {
      function ImpactMap(defaultText, nodes, scaleMap, overrides) {
        var self = this;
        this.defaultText = defaultText || '';
        this.nodes = ko.observableArray(nodes); //array of nodes
        this.nodeState = ko.observableArray();
        this.scaleMap = scaleMap || function (node) {
          var dir, val = node.value, scale;
          if (val === 0) return;
          if (val <= -5) { dir = 'down'; scale = '5'; }
          else if (val <= -1) { dir = 'down'; scale = Math.abs(val).toFixed(0); }
          else if (val >= 5) { dir = 'up'; scale = '5'; }
          else if (val >= 1) { dir = 'up'; scale = Math.abs(val).toFixed(0); }
          return { id: node.id, dir: dir, impact: node.impact, scale: scale };
        };



        this.getState = function () {
          return self.nodeState();
        }

        this.setState = function (state) {
          if (typeof state == 'Array') {
            self.nodeState = state;
          }
        }

        Object.merge(this, overrides);
      };

      function Node(id, name, value, impact, description, title, overrides) {
        if (String.isEmpty(id)) throw new Error("Invalid ImpactMap.Node Id");

        this.id = id; //unique id
        this.name = name; //text in the node  
        this.value = value;
        this.impact = impact || 'good' //impact -  good|bad|neutral
        this.title = (title) ? title.replace(/{{value}}/g, value) : '';
        this.description = description; //description of the node        
        Object.merge(this, overrides); //optional overrides
      };

      return {
        Map: ImpactMap,
        Node: Node
      };
    });
