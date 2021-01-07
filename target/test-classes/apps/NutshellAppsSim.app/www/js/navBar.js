// TODO: 19/05/2020 This needs to be an MVP component including management of all menu options.
const NavBar = (function() {

    function setupSidemenu() {

        updateAll();

        window.addEventListener("resize", () => {
            console.log(`NavBar resize event detected. updating side menu and header...`);
            updateAll();
        });

        window.addEventListener("orientationchange", () => {
            console.log(`NavBar orientationchange event detected. updating side menu and header...`);
           updateAll()
        });

    }

    function updateAll() {
        updateSideMenuSize();

        const appName = localStorage.getItem('appName');
        setHeaderTitle(appName);
    }


    function updateSideMenuSize() {
        const width = $(window).width();
        const sideBar = (width / 100) * 70;

        $('.side-menu').css({
            'display' : 'block',
            'left' : '-' + sideBar + 'px'
        });
    }

    function setHeaderTitle(title) {

        if (title === null || typeof title === 'undefined') {
            return;
        }

        if ($('.title_bar').width() <= 139) {
            const shortTitle = getWords(title);

            $('#title_header').html(shortTitle).css({
                'width': $('.title_bar').width(),
                'font-size': '13px'
            });

        } else {
            $('#title_header').html(title).css({'width': $('.title_bar').width(), 'font-size': '16px'});
        }
    }

    function toggleSidemenu(app) {
        var styleProps = parseFloat($('.side-menu').css("left"));
        var height = $(window).height();
        if (styleProps == 0)
        {
            var newStyle = parseFloat($('.side-menu').css("width"));
            $('#mask').fadeOut(500);

            if(!app)
            {
                $('body').css('overflow-y', 'auto');
            }
            else
                newStyle = newStyle + 2;

            $('.side-menu').animate({
                left: '-'+newStyle+'px',
            }, 250, function() {

            });
        }
        else
        {
            $('#mask').css('height', height+'px').fadeIn(500);
            if(!app)
            {
                $('body').css('overflow', 'hidden');
            }

            $('.side-menu').animate({
                left: '0',
            }, 250, function() {

            });
        }
    }

    function getWords(str) {
        if (str === null || typeof str === 'undefined') {
            return ""
        } else {
            return str.split(/\s+/).slice(0, 3).join(" ");
        }
    }


    return {
        init: setupSidemenu,
        toggle: toggleSidemenu,
        getWords: getWords,
        setHeaderTitle: setHeaderTitle
    };
})();
