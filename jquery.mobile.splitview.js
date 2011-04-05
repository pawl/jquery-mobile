//TODO: need to set panel widths according to media width - is this necessary?
//ISSUE: activeBtnClass not removed when a new link is given this class - causing a lot of active buttons.
//ISSUE: history doesn't change when links in main panel is clicked, and the back button points to
//       the previous page which don't make sense. idea: use data-history="false,crumb" on panel div
//ISSUE: clicking on a navbar link twice ruins the entire hash history. need to see what happened. 
//ISSUE: line 1872 in jqm, in transitionPages adds a history entry anyways - does this affect the transition path for history? 

(function($,window,undefined){
  $( window.document ).bind('mobileinit', function(){
    if ($.mobile.media("screen and (min-width:480px)")) {
      $('div[data-role="panel"]').addClass('ui-mobile-viewport');
      if( !$.mobile.hashListeningEnabled || !$.mobile.path.stripHash( location.hash ) ){
        var firstPage=$('div[data-id="main"] > div[data-role="page"]:first').page().addClass($.mobile.activePageClass) 
        firstPage.children('div[data-role="footer"]').hide();
      }
      $(function() {
        $(document).unbind('.toolbar');
        $('.ui-page').die('.toolbar');
        $(window).trigger('orientationchange');
      });

      //DONE: link click event binding for changePage
      $("a").die('click');
      //this will mostly be a copy of the original handler with some modifications
      $("a").live('click', function(event){
        var $this=$(this),
            href = $this.attr( "href" ) || "#",
            hadProtocol = $.mobile.path.hasProtocol( href ),
            url = $.mobile.path.clean( href ),
            isRelExternal = $this.is( "[rel='external']" ),
            isEmbeddedPage = $.mobile.path.isEmbeddedPage( url ),
            isExternal = $.mobile.path.isExternal( url ) || (isRelExternal && !isEmbeddedPage),
            hasTarget = $this.is( "[target]" ),
            hasAjaxDisabled = $this.is( "[data-ajax='false']" ),
            
            $targetPanel=$this.attr('data-panel'),
            $targetContainer=$('div[data-id='+$targetPanel+']'),
            $targetPanelActivePage=$targetContainer.children('div.'+$.mobile.activePageClass),
            $currPanel=$this.parents('div[data-role="panel"]'),
            //not sure we need this. if you want the container of the element that triggered this event, $currPanel 
            $currContainer=$.mobile.pageContainer, 
            $currPanelActivePage=$currPanel.children('div.'+$.mobile.activePageClass),
            from = null;

        if( $this.is( "[data-rel='back']" ) ){
          window.history.back();
          return false;
        }

        if( url.replace($.mobile.path.get(), "") == "#"  ){
          event.preventDefault();
          return;
        }

        //temporary fix to remove activeBtnClass
        $(".ui-btn."+$.mobile.activeBtnClass).removeClass($.mobile.activeBtnClass);
        $activeClickedLink = $this.closest( ".ui-btn" ).addClass( $.mobile.activeBtnClass );

        if( isExternal || hasAjaxDisabled || hasTarget || !$.mobile.ajaxEnabled ||
          // TODO: deprecated - remove at 1.0
          !$.mobile.ajaxLinksEnabled ){
          //remove active link class if external (then it won't be there if you come back)
          //BUG: removeActiveLinkClass not defined. crap :)
          window.setTimeout(function() {removeActiveLinkClass(true);}, 200);

          if( hasTarget ){
            window.open( url );
          }
          else if( hasAjaxDisabled ){
            return;
          }
          else{
            location.href = url;
          }
        }
        else {
          var transition=$this.data('transition') || undefined,
              direction = $this.data("direction"),
              hash=$currPanel.data('hash'),
              reverse = (direction && direction === "reverse") ||
                        // deprecated - remove by 1.0
                        $this.data( "back" );
          
          $.mobile.nextPageRole = $this.attr( "data-rel" );

          if( $.mobile.path.isRelative( url ) && !hadProtocol ){
            url = $.mobile.path.makeAbsolute( url );
          }

          url = $.mobile.path.stripHash( url );
          
          //if link refers to an already active panel, stop default action and return
          if ($targetPanelActivePage.attr('data-url') == url || $currPanelActivePage.attr('data-url') == url) {
            event.preventDefault();
            return;
          }
          //if link refers to a page on another panel, changePage on that panel
          else if ($targetPanel && $targetPanel!=$this.parents('div[data-role="panel"]')) {
            from=$targetPanelActivePage;
            $.mobile.pageContainer=$targetContainer;
            $.mobile.changePage([from,url], transition, reverse, true, undefined);
          }
          //if link refers to a page inside the same panel, changePage on that panel 
          else {
            //BUG: this setting is panel insensitive - so links in main panel also behave as specified below
            // need to define more data attributes in panels to allow custom panel behaviour
            from=$currPanelActivePage;
            $.mobile.pageContainer=$currPanel;
            var hashChange= (hash == 'false' || hash == 'crumbs')? false : true;
            $.mobile.changePage([from,url], transition, reverse, hashChange, undefined);
            //FIX: temporary fix for a data-back="crumbs" - need to work on its todo below later
            if (hash == 'crumbs') {
              var backBtn = $('div[data-url="'+url+'"]').find('a[data-rel="back"]')
              backBtn.removeAttr('data-rel')
                     .attr('href', '#'+from.attr('data-url'))
                     .attr('data-direction', 'reverse');
              backBtn.find('.ui-btn-text').html(from.find('div[data-role="header"] .ui-title').html());
            }
            //active page must always point to the active page in main - for history purposes.
            $.mobile.activePage=$('div[data-id="main"] > div.'+$.mobile.activePageClass);
          }
        }
        event.preventDefault();
      });

      //DONE: bind form submit with this plugin
      $("form").die('submit');
      $("form").live('submit', function(){
        if( !$.mobile.ajaxEnabled ||
          //TODO: deprecated - remove at 1.0
          !$.mobile.ajaxFormsEnabled ||
          $(this).is( "[data-ajax='false']" ) ){ return; }

        var $this = $(this);
            type = $this.attr("method"),
            url = $.mobile.path.clean( $this.attr( "action" ) ),
            $currPanel=$this.parents('div[data-role="panel"]'),
            $currPanelActivePage=$currPanel.children('div.'+$.mobile.activePageClass);

        if( $.mobile.path.isExternal( url ) ){
          return;
        }

        if( $.mobile.path.isRelative( url ) ){
          url = $.mobile.path.makeAbsolute( url );
        }

        //temporarily put this here- eventually shud just set it immediately instead of an interim var.
        $.mobile.activePage=$currPanelActivePage;
        $.mobile.pageContainer=$currPanel;
        $.mobile.changePage({
            url: url,
            type: type || "get",
            data: $this.serialize()
          },
          undefined,
          undefined,
          true
        );
        event.preventDefault();
      });

      //DONE: bind hashchange with this plugin
      //hashchanges are defined only for the main panel - other panels should not support hashchanges to avoid ambiguity
      $(window).unbind("hashchange");
      $(window).bind( "hashchange", function( e, triggered ) {
        var to = $.mobile.path.stripHash( location.hash ),
            transition = $.mobile.urlHistory.stack.length === 0 ? false : undefined,
            $mainPanel=$('div[data-id="main"]'),
            $mainPanelFirstPage=$mainPanel.children('div[data-role="page"]').first(),
            $mainPanelActivePage=$mainPanel.children('div.ui-page-active'),
            $menuPanel=$('div[data-id="menu"]'),
            $menuPanelFirstPage=$menuPanel.children('div[data-role="page"]').first(),
            $menuPanelActivePage=$menuPanel.children('div.ui-page-active'),
            //FIX: temp var for dialogHashKey
            dialogHashKey = "&ui-state=dialog";

        if( !$.mobile.hashListeningEnabled || !$.mobile.urlHistory.ignoreNextHashChange ){
          if( !$.mobile.urlHistory.ignoreNextHashChange ){
            $.mobile.urlHistory.ignoreNextHashChange = true;
          }
          return;
        }

        if( $.mobile.urlHistory.stack.length > 1 &&
            to.indexOf( dialogHashKey ) > -1 &&
            !$.mobile.activePage.is( ".ui-dialog" ) ){

          $.mobile.urlHistory.directHashChange({
            currentUrl: to,
            isBack: function(){ window.history.back(); },
            isForward: function(){ window.history.forward(); }
          });

          return;
        }

        //if to is defined, load it
        if ( to ){
          $.mobile.pageContainer=$menuPanel;
          //if this is initial deep-linked page setup, then changePage sidemenu as well
          if (!$('div.ui-page-active').length) {
            $.mobile.changePage($menuPanelFirstPage, transition, true, false, true);
          }
          $.mobile.pageContainer=$mainPanel;
          $.mobile.activePage=$mainPanelActivePage.length? $mainPanelActivePage : undefined;
          $.mobile.changePage(to, transition, undefined, false, true );
        }
        //there's no hash, go to the first page in the dom, and set all other panels to its first page.
        else {
          //temp fix - need to get an array of panels and set their first pages to show.
          $.mobile.pageContainer=$mainPanel;
          $.mobile.activePage=$mainPanelActivePage? $mainPanelActivePage : undefined;
          //temp: set false for fromHashChange due to isPageTransitioning causing pageContainer settings to be overriden
          $.mobile.changePage($mainPanelFirstPage, 'none', true, false, false ); 
          $.mobile.pageContainer=$menuPanel;
          $.mobile.activePage=$menuPanelActivePage? $menuPanelActivePage : undefined;
          $.mobile.changePage($menuPanelFirstPage, 'none', false, false, false);
        }
      });

      //DONE: pageshow binding for scrollview
      $('div[data-role="page"]').live('pagebeforeshow', function(event){
        var $page = $(this);
        $page.find('div[data-role="content"]').attr('data-scroll', 'true');
        if ($.support.touch) {
          $page.find("[data-scroll]:not(.ui-scrollview-clip)").each(function(){
            var $this = $(this);
            // XXX: Remove this check for ui-scrolllistview once we've
            //      integrated list divider support into the main scrollview class.
            if ($this.hasClass("ui-scrolllistview"))
              $this.scrolllistview();
            else
            {
              var st = $this.data("scroll") + "";
              var paging = st && st.search(/^[xy]p$/) != -1;
              var dir = st && st.search(/^[xy]/) != -1 ? st.charAt(0) : null;

              var opts = {};
              if (dir)
                opts.direction = dir;
              if (paging)
                opts.pagingEnabled = true;

              var method = $this.data("scroll-method");
              if (method)
                opts.scrollMethod = method;

              $this.scrollview(opts);
            }
          });
        }
      });

      //popover button click handler - from http://www.cagintranet.com/archive/create-an-ipad-like-dropdown-popover/
      $('#popover-btn').live('click', function(e){ 
        e.preventDefault(); 
        $('.panel-popover').fadeToggle('fast'); 
        if ($('#popover-btn').hasClass($.mobile.activeBtnClass)) { 
            $('#popover-btn').removeClass($.mobile.activeBtnClass); 
        } else { 
            $('#popover-btn').addClass($.mobile.activeBtnClass); 
        } 
      });

      $('body').live('vclick', function(event) { 
        if (!$(event.target).closest('.panel-popover').length && !$(event.target).closest('#popover-btn').length) { 
            $(".panel-popover").stop(true, true).hide(); 
            $('#popover-btn').removeClass($.mobile.activeBtnClass); 
        }; 
      });

      //TODO: bind orientationchange and resize
      //In order to do this, we need to:
      //1. hide and resize menu panel
      //2. make main panel fullscreen
      //3. wrap design divs around menu panel
      //4. add menu button to top left of main panel
      //5. bind show() menu panel onclick of menu button
      $(window).bind('orientationchange resize', function(event){
        var $menu=$('div[data-id="menu"]'),
            $main=$('div[data-id="main"]'),
            $mainHeader=$main.find('div.'+$.mobile.activePageClass+'> div[data-role="header"]'),
            $window=$(window);
        
        function popoverBtn(header) {
          if(!header.children('#popover-btn').length){
            if(header.children('a.ui-btn-left').length){
              header.children('a.ui-btn-left').replaceWith('<a id="popover-btn">Navigation</a>');
              header.children('a#popover-btn').addClass('ui-btn-left').buttonMarkup();
            }
            else{
              header.prepend('<a id="popover-btn">Navigation</a>');
              header.children('a#popover-btn').addClass('ui-btn-left').buttonMarkup()          
            }
          }
        }

        function popover(){
          $menu.addClass('panel-popover')
               .removeClass('sticky-left border-right')
               .css({'width':'25%', 'min-width':'250px', 'display':''});     
          if(!$menu.children('.popover_triangle').length){ 
            $menu.prepend('<div class="popover_triangle"></div>'); 
          }
          $main.removeClass('sticky-right')
               .css('width', '');
          popoverBtn($mainHeader);

          $main.delegate('div[data-role="page"]','pageshow.popover', function(){
            var $thisHeader=$(this).children('div[data-role="header"]');
            popoverBtn($thisHeader);
          });
        };

        function splitView(){
          $menu.removeClass('panel-popover')
               .addClass('sticky-left border-right')
               .css({'width':'25%', 'min-width':'250px', 'display':''});
          $menu.children('.popover_triangle').remove();
          $main.addClass('sticky-right')
               .width(function(){
                 return $(window).width()-$('div[data-id="menu"]').width();  
               });
          $mainHeader.children('#popover-btn').remove();
          $('div[data-role="page"]').die('.popover');

        }

        if(event.orientation){
          if(event.orientation == 'portrait'){
            popover();            
          } 
          else if(event.orientation == 'landscape') {
            splitView();
          } 
        }
        else if($window.width() < 768 && $window.width() > 480){
          popover();
        }
        else if($window.width() > 768){
          splitView();
        }
      });

      //temporary toolbar mods to present better in tablet/desktop view
      //TODO: API this so that people can specify using data- attributes how they want their toolbars displayed
      //potential toolbar behaviour:
      // 1) has a data-display="top, bottom, inline" attribute
      // 2) 
      $('div[data-id="menu"] div[data-role="page"]').live('pagebeforeshow.splitview', function() {
        $(this).find('div[data-role="footer"] > h2').hide(); 
      });
      $('div[data-id="main"] div[data-role="page"]').live('pagebeforeshow.splitview', function() {
        $(this).find('div[data-role="footer"]').hide();
      });

      //TODO: define data-backbtn="crumbs" - a method that creates a 'back' button that points to the previous page, 
      //not go back in urlHistory. also include data-history="crumbs" for more general panel area behaviour

      //TODO: define css scaling and columnizing using the cssgrid.net 1140px 12 column scalable grid css
    }
  });
})(jQuery,window);