// ==UserScript==
// @id             iitc-plugin-hello@udnp
// @name           IITC plugin: hello
// @category       Hello
// @version        0.0.2.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Hello!
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @include        https://www.ingress.com/mission/*
// @include        http://www.ingress.com/mission/*
// @match          https://www.ingress.com/mission/*
// @match          http://www.ingress.com/mission/*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.hello = (function() {
  var ID = 'PLUGIN_HELLO',
      TITLE = 'Hello',
      DESCRIPTIONS = "Hello IITC Plugin!";

  function open() {
    var dom = document.createElement('div');
    dom.id = ID;
    dom.textContent = DESCRIPTIONS;
    
    if(window.useAndroidPanes()) {
      dom.classList.add('mobile');
      document.body.appendChild(dom);
    } else {
      dialog({
        html: dom,
        dialogClass: 'ui-dialog-' + ID,
        title: TITLE,
        id: ID,
        width: 700
      });
    }
  }      
  
  function close() {
    $('#' + ID).remove();    
  }

  function onPaneChanged(pane) {
    if(pane == ID) open();
    else close();
  }
  
  function setup() {
    if(window.useAndroidPanes()) {
      android.addPane(ID, TITLE, "ic_action_paste");
      addHook("paneChanged", onPaneChanged);
    } else {
      var dom = document.createElement('a');
      dom.textContent = TITLE; 
      dom.title = DESCRIPTIONS;
      dom.accessKey = 'h';
      dom.addEventListener('click', open);
      
      document.getElementById('toolbox').appendChild(dom);
    }
  }
  
  return {
    ID: ID,
    TITLE: TITLE,
    DESCRIPTIONS: DESCRIPTIONS,
    open: open,
    close: close,
    onPaneChanged: onPaneChanged,
    setup: setup
  };

}());

var setup = function(){
  window.plugin.hello.setup();

  $("<style>")
    .prop("type", "text/css")
    .html("@@INCLUDESTRING:plugins/hello.css@@")
    .appendTo("head");
};

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
