define(["knockout", "durandal/system"], function (ko, System) {
    var DocumentAnalysis = new function () {

        this.Document = function(id, title, description, url, selectables, active, isDocument) {
            var self = this;

            this.id = id;                           // This is the ID of the document
            this.title = title;                     // This is the title/name of the document
            this.description = description;         // This is a short descriptiom that appears below the title on Document List
            this.active = active;                   // This tells whether the document is active (listed) or not
            this.url = url;                         // The URL of the HTML file for the document contents
            this.selectables = selectables || [];   // An array of Selectables that store selection data and user choices
            this.isDocument = isDocument;           /* A boolean used to determine if this is a document. Only used for the dummy objects
                                                       The document list when there is less than 5 documents */
            this.visited = ko.observable(false);    // This is changed to true once the user has viewed the document at least once

            this.getState = function () {
                // If not a document then don't bother
                if (!self.isDocument)
                    return;

                var selState = null;
                for (var i = 0, len = self.selectables.length, sel; i < len; i++) {
                    sel = self.selectables[i];
                    if (sel && sel.selectedBucket) {
                        selState = selState || {};
                        selState[i] = sel.selectedBucket;
                    }
                }

                return { s: (selState ? selState : 0), v: (self.visited() ? 1 : 0) };
            };

            this.setState = function (state) {
                if (state) {
                    if (state.hasOwnProperty("s")) {
                        for (var s in state.s) {
                            var sel = self.selectables[s];
                            if (sel) {
                                sel.selectedBucket = (state.s[s] == 0 ? null : state.s[s]);
                            }
                        }
                    }
                    if (state.hasOwnProperty("v"))
                        self.visited(Boolean(state.v));
                }
            };
        };

        this.Selectable = function (id, bucket, override) {
            var self = this;

            this.id = id;                           // This is the ID of the Selectable
            this.bucket = bucket;                   // This is the string array of correct buckets for this selection
            this.selectedBucket = null;             // This is the bucket that this selection was categorized under
            Object.merge(this, override);           // This is for attaching additional options
        };

        this.Bucket = function (id, title, color, bwColor) {
             var self = this;

             this.id = id;                          // This is the ID of the bucket
             this.title = title;                    // This is the title/name of the bucket
             this.color = color;                    // This is the color of the bucket, e.g. red
             this.bwColor = bwColor;                // This is for use with black/white color schemes such as printing
         };
    }
    return DocumentAnalysis;
});