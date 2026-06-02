define(["knockout"],
    function (ko) {
      'use strict';

      //wireframe url here

      function Information(cssprefix, imageroot, sections, steps, audio, overrides) {
        var self = this;
        this.imageroot = imageroot || '';
        this.cssprefix = cssprefix || '';
        this.sections = sections || [];
        this.steps = steps || [];
        this.audio = audio || false;
        this.complete = ko.observable(false);

        Object.merge(this, overrides);

        this.getState = function () {
          return self.complete();
        }
        this.setState = function (state) {
          self.complete(state);
        }
      }

      function Content(html) {
        this.html = html || '';
      }

      function ImageRotator(images) {
        this.images = images || [];
      }

      function Image(path, title, description, toggle) {
          this.path = path || '';
          this.title = title || '';
          this.description = description || '';
          this.toggle = toggle || false;
      }

      function Flipbook(panels) {
          this.panels = panels || [];
      }

      function Video(paths, autoplay) {
          this.paths = paths || [];
          this.autoplay = autoplay || false;
      }

      return {
          Information: Information,
          ImageRotator: ImageRotator,
          Image: Image,
          Video: Video,
          Content: Content,
          Flipbook: Flipbook
      };


    });
