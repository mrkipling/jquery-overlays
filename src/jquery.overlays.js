/*
Overlay helpers

showOverlay
closeOverlay
dialog
*/

$.fn.extend({

/*
$.fn.showOverlay()
Display an element as an overlay.
Automatically sets position and z-index in the JS.
To set basic styling as well, use a class of generic_overlay.

USAGE:
$(element).showOverlay(settings);

settings is optional, and can contain the following:

fadeIn
    Type: bool or int
    Default: false
    Description: If true, the overlay will fade in. Can also be an integer (time taken to fade in, in milliseconds).

position
    Type: int or string
    Default: 75
    Description: If set to an integer, overlays will be this many pixels from the top of the window, relative to how far the screen is scrolled down. Can also be set to 'center', which is self-explanatory, and 'fixed', which is the same as center, but it will always stay centered even if you scroll.

close
    Type: string or bool (false)
    Default: '.close'
    Description: Selector within the overlay to bind $.closeOverlay() to (onclick). If set to false then this won't happen.

onClose
    Type: function
    Default: empty function
    Description: This function will be executed after the user clicks on the element targetted in 'close', but before the overlay is removed from the page.

escClose
    Type: bool
    Default: true
    Description: If set to true, pressing escape will close the overlay.

callback
    Type: function
    Default: empty function
    Description: Callback function to be executed once the overlay has been inserted on the page, and once faded in (if applicable).
*/

    showOverlay: function(usersettings) {
        var overlay = $(this).remove(); // remove from DOM (if it is in there)

        var settings = {
            'fadeIn': false,
            'position': 75,
            'close': '.close',
            'onClose': function(){},
            'escClose': true,
            'callback': function(){}
        };

        if (usersettings !== undefined) {
            jQuery.extend(settings, usersettings);
        }

        var fadeInSpeed = 0;
        if (settings.fadeIn) {
            fadeInSpeed = (typeof settings.fadeIn == 'number') ? settings.fadeIn : 200;
        }

        function displayOverlay() {
            // insert overlay into the DOM
            overlay.insertAfter(overlayBg);

            // fade in and execute callback afterwards (if necessary)
            if (settings.fadeIn) {
                overlay
                    .hide()
                    .fadeIn(fadeInSpeed, settings.callback());
            }

            // figure out the CSS top and position values based on settings.position

            var top = $(window).scrollTop();
            var position = 'absolute';

            if (typeof settings.position == 'number') {
                top += settings.position;
            } else {
                switch (settings.position) {
                    // center
                    case 'center':
                        top = $(window).scrollTop() + ($(window).height() / 2) - (overlay.outerHeight() / 2);
                        break;

                    // fixed
                    case 'fixed':
                        top = ($(window).height() / 2) - (overlay.outerHeight() / 2);
                        position = 'fixed';
                        break;
                }
            }

            // adjust the styling of the overlay
            overlay.css({
                'display': 'block',
                'left': '50%',
                'margin-left': (overlay.outerWidth() / 2) * -1,
                'z-index': 100,
                'position': position,
                'top': top
            });

            // if not fading in, execute callback
            if (!settings.fadeIn) {
                settings.callback();
            }
        }

        // blank out the screen
        var overlayBg = $('<div id="overlayBg" />')
            .appendTo('body')
            .hide()
            .height($(document).height());

        // bind close behaviour
        if (settings.close) {
            overlay.find(settings.close).bind('click', function(e) {
                settings.onClose();
                overlay.closeOverlay();
                e.preventDefault();
            });
        }

        // bind ESC-to-close behaviour
        if (settings.escClose) {
            $(document).bind('keydown.showOverlay', function(e) {
                if (e.which === 27) {
                    overlay.closeOverlay();
                }
            });
        }

        // display the overlay
        overlayBg.fadeTo(fadeInSpeed, 0.75, displayOverlay());
    },

/*
$.fn.closeOverlay()
Close an overlay that was previously opened with $.fn.showOverlay

USAGE:
$(element).closeOverlay()
*/

    closeOverlay: function() {
        $(this).remove();
        $('#overlayBg').remove();
        $(document).unbind('keydown.showOverlay');
    },

/*
$.fn.dialog()
Displays a confirmation dialog box.
Needs to be bound to an element (see usage) if you want to use the default 'yes' behaviour,
which is to submit the form or follow the link.
Can be bound to document if you just want to invoke a dialog. You will need to overwrite the 'yes' function.
You can also specify settings for showOverlay in the dialog settings, as they will be passed when invoking it.

USAGE:
$(element).dialog(settings)

settings is optional, and can contain the following:

text:
    Type: string
    Default: 'Are you sure?'
    Description: Heading text displayed in the dialog.

yesText:
    Type: string
    Default: 'Yes'
    Description: Text displayed on the 'yes' button. If set to null, no 'yes' button will be inserted and noText will be 'OK' by default.

noText:
    Type: string
    Default: 'No'
    Description: Text displayed on the 'no' button.

yes:
    Type: function
    Default: Function which either submits the button's form or follows the link.
    Description: Function that is executed when the user clicks 'yes'.

no:
    Type: function
    Default: Function which closes the dialog.
    Description: Function that is executed when the user clicks 'no'.
*/

    dialog: function(usersettings) {
        var settings = {
            'ele': $(this),
            'text': 'Are you sure?',
            'yesText': 'Yes',
            'noText': 'No',
            'yes': function() {
                if (settings.ele.is('button')) {
                    settings.ele.closest('form').submit();
                    return;
                }

                else if (settings.ele.is('a')) {
                    window.location = settings.ele.attr('href');
                }
            },
            'no': function() {
                $(this).closest('.generic_dialog').closeOverlay();
            },
            'position': 'center'
        };

        if (usersettings !== undefined) {
            jQuery.extend(settings, usersettings);
        }

        if (usersettings.yesText === null && usersettings.noText === undefined) {
            settings.noText = 'OK';
        }

        var yesButton = settings.yesText === null ? '' : '<li class="yes">' + settings.yesText + '</li>';

        var dialog = $('<div class="generic_dialog"><h1>' + settings.text + '</h1><ul class="choices">' + yesButton + '<li class="no">' + settings.noText + '</li></ul></div>');

        dialog.showOverlay(settings);

        dialog.find('.yes').click(settings.yes);
        dialog.find('.no').click(settings.no);
    }
});

/*
Allows dialogs to be assigned to buttons and anchors simply by adding data-dialog="true".
You can also specify data-yesText and data-noText (although the defaults will be used if not specified).
*/

$('a[data-dialog=true], button[data-dialog=true]').on('click', function(e) {
    var usersettings = { fadeIn: true };
    if ($(this).data('text'))    { usersettings.text = $(this).data('text'); }
    if ($(this).data('yesText')) { usersettings.yesText = $(this).data('yesText'); }
    if ($(this).data('noText'))  { usersettings.noText = $(this).data('noText'); }
    $(this).dialog(usersettings);
    e.preventDefault();
});
