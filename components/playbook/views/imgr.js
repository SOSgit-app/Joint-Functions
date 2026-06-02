(function (w, $) {
    'use strict';
    $.fn.imgr = function (options) {
        var settings = $.extend({
            speed: 1000,
            loop: false
        }, options),
            timer = w.setInterval(showNext, settings.speed),
            elem = $(this),
            currentIndex = 0;

        elem.find('img').first().addClass('active');

        function showNext() {
            var images = elem.find('img');
            currentIndex++;
            if (currentIndex > (images.length - 1)) {
                if (!settings.loop) { w.clearInterval(timer); }
                currentIndex = 0;
            }
            images.removeClass('active').hide();
            images.eq(currentIndex).addClass('active').show();
        }

        return this;
    };
})(window, jQuery);