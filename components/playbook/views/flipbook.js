(function ($) {
    'use strict';
    $.fn.flipbook = function () {
        var elem = $(this),
        pagePanels = elem.find('.pagePanel'),
        prevBtn = $('<span>').addClass('prevBtn').on('click', function () { prev(); }),
        nextBtn = $('<span>').addClass('nextBtn').on('click', function () { next(); }),
        currentPanel = 0;

        pagePanels.each(function (index) {
            $(this).addClass('panel' + index);
        });

        elem.append(prevBtn).append(nextBtn);
        prevBtn.hide();

        function next() {
            currentPanel++;
            if (currentPanel === pagePanels.length - 1) {                
                nextBtn.hide();
            }
            if (currentPanel > 0) { prevBtn.show(); }
            pagePanels.hide();
            elem.find('.panel' + currentPanel).show();
        }

        function prev() {
            currentPanel--;
            if (currentPanel === 0) {
                prevBtn.hide();
            }

            if (currentPanel < pagePanels.length - 1) { nextBtn.show(); }
            pagePanels.hide();
            elem.find('.panel' + currentPanel).show();
        }

        return this;
    };
})(jQuery);