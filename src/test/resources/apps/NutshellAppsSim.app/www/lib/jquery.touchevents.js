(function($) {
       $.fn.registerClick = function(fn) {             
              $(this).bind('touchstart click', function(e) {
                     e.stopPropagation();
                     e.preventDefault();
                     if (e.handled !== true)
                     {
                           fn.call(this, e);
                           e.handled = true;
                     }
                     else
                           return false;
              });
       
              return $(this);
       };
       
       $.fn.unregisterClick = function(fn) {
              $(this).unbind('touchstart click');
              
              return $(this);
       };

       /* Double click custom function is created so it can be upgraded later to double tap event */
       $.fn.registerdblClick = function(fn) {          
              $(this).bind('dblclick', function(e) {
                     e.stopPropagation();
                     e.preventDefault();
                     if (e.handled !== true)
                     {
                           fn.call(this, e);
                           e.handled = true;
                     }
                     else
                           return false;
              });
       
              return $(this);
       };
       
       $.fn.unregisterdblClick = function(fn) {
              $(this).unbind('dblclick');
              
              return $(this);
       };
}(jQuery));
