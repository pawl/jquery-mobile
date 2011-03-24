(function($,window,undefined){
  $( window.document ).bind('mobileinit', function(){
    if ($.mobile.media("screen and (min-width: 768px)")) {
      $('div[data-role="panel"]').addClass('ui-mobile-viewport');
      $('div[data-id="menu"]').addClass('sticky-left border-right').css('width', '25%');
      $('div[data-id="main"]').addClass('sticky-right').css('width', '75%');
      $.mobile.firstPage=$('div[data-id="main"] > div[data-role="page"]:first').page().addClass($.mobile.activePageClass) 
      $.mobile.firstPage.children('div[data-role="footer"]').hide();
      //TODO: need to push the 1st page into urlHistory somewhere here
      $(function() {
        $(document).unbind('.toolbar');
        $('.ui-page').die('.toolbar');
      });

      $("a").die('click');
      $("a").live('click', function(event){
        var $this=$(this),
            $targetPanel=$this.attr('data-panel'),
            $targetContainer=$('div[data-id='+$targetPanel+']'),
            $targetPanelActivePage=$targetContainer.children('div.'+$.mobile.activePageClass),
            $currPanel=$this.parents('div[data-role="panel"]'),
            $currContainer=$.mobile.pageContainer,
            $currPanelActivePage=$currPanel.children('div.'+$.mobile.activePageClass),
            transition=$this.data('transition') || undefined,
            direction=($this.data('direction') == 'reverse') ? true : undefined,
            to=$this.attr('href'),
            to_href=to.replace(/^#/, "" ),
            from = null;

        //if link refers to an already active panel, stop propagation and default action and return
        if ($targetPanelActivePage.attr('data-url') == to_href || $currPanelActivePage.attr('data-url') == to_href) {
          event.stopPropagation();
          event.preventDefault();
          return;
        }
        //if link refers to a page on another panel, changePage on that panel
        if ($targetPanel && $targetPanel!=$this.parents('div[data-role="panel"]')) {
          from=$targetPanelActivePage;
          $.mobile.pageContainer=$targetContainer;
          //TODO: figure out how to let user define the transition for this
          transition = (transition == undefined) ? 'fade' : transition  
          $.mobile.changePage([from,to], 'fade', direction, true, undefined);
          //$.mobile.activePage=$('div[data-url="'+to_href+'"]');
          //$.mobile.pageContainer=$currContainer;
          event.stopPropagation();
          event.preventDefault();
        }
        //if link refers to a page inside the same panel, changePage on that panel 
        else {
          from=$currPanelActivePage;
          $.mobile.pageContainer=$currPanel;
          $.mobile.changePage([from,to], transition, direction, false, undefined);
          //FIX: temporary fix for a data-back="crumbs" - need to work on its todo below later
          var backBtn = $('div[data-url="'+to_href+'"]').find('a[data-rel="back"]')
          backBtn.removeAttr('data-rel')
                 .attr('href', from.attr('data-url'))
                 .attr('data-direction', 'reverse');
          backBtn.find('.ui-btn-text').html(from.find('div[data-role="header"] .ui-title').html());
          //$.mobile.activePage= TODO:link this to the activePage in main container;
          //$.mobile.pageContainer=$currContainer;
          event.stopPropagation();
          event.preventDefault();
        }
      });
      //TODO: bind hashchange with this plugin
      //TODO: bind form submit with this plugin

      //TODO: bind orientationchange and resize
      //In order to do this, we need to:
      //1. hide and resize menu panel
      //2. make main panel fullscreen
      //3. wrap design divs around menu panel
      //4. add menu button to top left of main panel
      //5. bind show() menu panel onclick of menu button

      //temporary toolbar mods to present better in tablet/desktop view
      //TODO: API this so that people can specify using data- attributes how they want their toolbars displayed
      $('div[data-id="menu"] div[data-role="page"]').live('pagebeforeshow.splitview', function() {
        $(this).find('div[data-role="footer"] > h2').hide(); 
      });
      $('div[data-id="main"] div[data-role="page"]').live('pagebeforeshow.splitview', function() {
        $(this).find('div[data-role="footer"]').hide();
      });

      //TODO: define data-backbtn="crumbs" - a method that creates a 'back' button that points to the previous page, 
      //not go back in urlHistory
      //TODO: define css scaling and columnizing using the cssgrid.net 1140px 12 column scalable grid css
    }
  });
})(jQuery,window);