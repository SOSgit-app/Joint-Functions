define(["knockout"],
    function(ko) {
      'use strict';

      //http://mscatalog/index.php/Confidence_Based_Assessment_(CBA)

        function Assessment(question, answers, selections, overrides){
        	var self = this;
        	this.question = question || '';
        	this.answers = answers || [];
        	this.selections = selections || [];
        	this.selection = '';

        	Object.merge(this, overrides);

        	this.getState = function(){
        		return this.selection;
        	}
        	this.setState = function(state){
        	  this.selection = state;
        	}
        }

        function Selection(value, text){
        	this.value = value || '';
        	this.text = text || '';
        }

        return {
          Assessment: Assessment,
          Selection: Selection
        };


    });
