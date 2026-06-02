define(["knockout"],
    function(ko) {
        function DocumentModel(interaction, content, header, options, overrides) {
            var self = this;
            this.content = content; //this is the document content that contains the group placeholders
            this.header = header; //text header above the options list
            this.options = ko.observableArray(options); //array of options
            this.interaction = interaction || 'drag-drop'; //options are drag-drop|click
            this.addHtml = '<span class="add">Add</span>';
            this.removeHtml = '';
            this.selections = ko.observableArray();

            this.getState = function() {
              return self.selections();
            }

            this.setState = function(state) {
              if (typeof state == 'Array') {
                self.selections = state;
              }
            }

            Object.merge(this, overrides);
        };

        function OptionModel(id, content, group, target, overrides) {
            if (String.isEmpty(id)) throw new Error("Invalid DocumentBuilder.Option Id");
            this.id = id; //unique id
            this.content = content; //content of the option
            this.group = group || '0'; //group id is the group this option belongs to. the default '0' is defined as any group. string as id can range from 1 to 1.1 etc      
            Object.merge(this, overrides); //optional overrides
        };

        return {
            Document: DocumentModel,
            Option: OptionModel
        };
    });
