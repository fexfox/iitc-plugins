// ==UserScript==
// @id             iitc-plugin-hello@udnp
// @name           IITC plugin: hello
// @category       Hello
// @version        0.0.1.20160227.112756
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      none
// @downloadURL    none
// @description    [local-2016-02-27-112756] Hello!
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


function wrapper(plugin_info) {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};

//PLUGIN AUTHORS: writing a plugin outside of the IITC build environment? if so, delete these lines!!
//(leaving them in place might break the 'About IITC' page or break update checks)
plugin_info.buildName = 'local';
plugin_info.dateTimeVersion = '20160227.112756';
plugin_info.pluginId = 'log-filter';
//END PLUGIN AUTHORS NOTE



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
  
  return {
    ID: ID,
    TITLE: TITLE,
    DESCRIPTIONS: DESCRIPTIONS,
    open: open,
    close: close,
    onPaneChanged: onPaneChanged 
  };

}());

var setup = (function(plugin) {
  return function(){
    if(window.useAndroidPanes()) {
      android.addPane(plugin.ID, plugin.TITLE, "ic_action_paste");
      addHook("paneChanged", plugin.onPaneChanged);
    } else {
      var dom = document.createElement('a');
      dom.textContent = plugin.TITLE; 
      dom.title = plugin.DESCRIPTIONS;
      dom.accessKey = 'h';
      dom.addEventListener('click', plugin.open);
      
      document.getElementById('toolbox').appendChild(dom);
    }

    $("<style>")
      .prop("type", "text/css")
      .html("#PLUGIN_HELLO.mobile {\n  background: transparent;\n  border: 0 none !important;\n  height: 100% !important;\n  width: 100% !important;\n  left: 0 !important;\n  top: 0 !important;\n  position: absolute;\n  overflow: auto;\n}\n")
      .appendTo("head");
  };
}(window.plugin.hello));

// PLUGIN END //////////////////////////////////////////////////////////


setup.info = plugin_info; //add the script info data to the function as a property
if(!window.bootPlugins) window.bootPlugins = [];
window.bootPlugins.push(setup);
// if IITC has already booted, immediately run the 'setup' function
if(window.iitcLoaded && typeof setup === 'function') setup();
} // wrapper end
// inject code into site context
var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);


