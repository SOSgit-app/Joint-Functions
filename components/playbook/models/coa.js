define(["knockout"],
    function (ko) {
      'use strict';

      function COA(instances) {
        var self = this;
        this.instances = instances || [];
        this.selected = ko.observable({
          coa: 0,
          levels: {}
        });

        this.getState = function () {
          return self.selected();
        }

        this.setState = function (state) {
          if (typeof state === 'object' && state.hasOwnProperty('coa') && state.hasOwnProperty('levels')){
            self.selected = ko.observable(state);
          }
        }
      }

      function InstanceModel(id, title, content, recommended, text, predictions, overrides) {
        var self = this;
        if (String.isEmpty(id)) throw new Error("Invalid COA Id");
        this.id = id;
        this.title = title || '';
        this.content = content || '';
        this.recommended = recommended || 0;
        this.text = text || '';
        this.predictions = predictions || [];

        Object.merge(this, overrides);
      };

      function PredictionModel(title, indicators, overrides) {
        var self = this;

        this.title = title || '';
        this.indicators = indicators || [];
        Object.merge(this, overrides);
      }

      function IndicatorModel(id, style, title, levels, overrides) {
        if (String.isEmpty(id)) throw new Error("Invalid COA.Indicator Id");
        this.id = id;
        this.style = style || 'radio';
        this.title = title || '';
        this.minText = 'Low';
        this.maxText = 'High';
        this.levels = levels || [];
        Object.merge(this, overrides);
      }

      function LevelModel(id, text, overrides) {
        if (String.isEmpty(id)) throw new Error("Invalid COA.Level Id");
        this.id = id;
        this.text = text || '';
        Object.merge(this, overrides);
      }


      return {
        COA :COA,
        Instance: InstanceModel,
        Prediction: PredictionModel,
        Indicator: IndicatorModel,
        Level: LevelModel
      };
    });
