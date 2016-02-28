// ==UserScript==
// @id             iitc-plugin-log-filter@udnp
// @name           IITC plugin: Log Filter
// @category       Log
// @version        0.0.1.20160228.144629
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      none
// @downloadURL    none
// @description    [local-2016-02-28-144629] Log Filter
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
plugin_info.dateTimeVersion = '20160228.144629';
plugin_info.pluginId = 'log-filter';
//END PLUGIN AUTHORS NOTE



// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.logfilter = (function() {
  var ID = 'PLUGIN_LOG_FILTER',
      DESCRIPTIONS = "log filter plug-in",
      input = {
        dom: null,
      };
  
  function filterLog(logRowDom, s) {
    var agentDom = logRowDom.querySelector('.nickname'); 
    if(!agentDom) return;
    
    if(agentDom.textContent.search(s) !== 0) {
      logRowDom.hidden = true;
    } else {
      logRowDom.hidden = false;
    }
  }

  function createInput() {
    input.dom = document.createElement('input');
    input.dom.id = ID;
    input.dom.placeholder = 'agent name';
    input.dom.addEventListener('keyup', function() {
      var tableDom = document.querySelector('#chatall table');
      
      if(!tableDom) return;
      
      for(var i = 0; i < tableDom.rows.length; i++) {
        filterLog(tableDom.rows[i], input.dom.value);
      }
    });
    
    return input;
  }

  function setup() {
    createInput();
    document.getElementById('chat').appendChild(input.dom);
  }

  return {
    setup: setup
  };

}());

var setup = (function(plugin) {
  return function(){
    plugin.setup();
      
    $("<style>")
      .prop("type", "text/css")
      .html("#PLUGIN_LOG_FILTER {\n  position: absolute;\n  top: 0;\n  width: 50%;\n}\n")
      .appendTo("head");
  };
}(window.plugin.logfilter));

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


