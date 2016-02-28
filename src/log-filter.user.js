// ==UserScript==
// @id             iitc-plugin-log-filter@udnp
// @name           IITC plugin: Log Filter
// @category       Log
// @version        0.0.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Log Filter
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
window.plugin.logfilter = (function() {
  var ID = 'PLUGIN_LOG_FILTER',
      DESCRIPTIONS = "log filter plug-in",
      input = {
        dom: null,
      };
  
  function filterLog(logRowDom, s) {
    if(!logRowDom.cells[1]) return;
    if(!logRowDom.cells[1].querySelector('.nickname')) return;
    
    if(logRowDom.cells[1].querySelector('.nickname').textContent.search(s) !== 0) {
      logRowDom.hidden = true;
    } else {
      logRowDom.hidden = false;
    }
  };

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
      .html("@@INCLUDESTRING:plugins/log-filter.css@@")
      .appendTo("head");
  };
}(window.plugin.logfilter));

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
