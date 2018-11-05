// ==UserScript==
// @id             iitc-plugin-hello@udnp
// @name           IITC plugin: hello
// @category       Hello
// @version        0.0.2.20160328.150652
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      none
// @downloadURL    none
// @description    [udnp-2016-03-28-150652] Hello!
// @include        https://*.ingress.com/intel*
// @include        http://*.ingress.com/intel*
// @match          https://*.ingress.com/intel*
// @match          http://*.ingress.com/intel*
// @include        https://*.ingress.com/mission/*
// @include        http://*.ingress.com/mission/*
// @match          https://*.ingress.com/mission/*
// @match          http://*.ingress.com/mission/*
// @grant          none
// ==/UserScript==


function wrapper(plugin_info) {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};

//PLUGIN AUTHORS: writing a plugin outside of the IITC build environment? if so, delete these lines!!
//(leaving them in place might break the 'About IITC' page or break update checks)
plugin_info.buildName = 'udnp';
plugin_info.dateTimeVersion = '20160328.150652';
plugin_info.pluginId = 'hello';
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
    .html("#PLUGIN_HELLO.mobile {\n  background: transparent;\n  border: 0 none !important;\n  height: 100% !important;\n  width: 100% !important;\n  left: 0 !important;\n  top: 0 !important;\n  position: absolute;\n  overflow: auto;\n}\n")
    .appendTo("head");
};

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


