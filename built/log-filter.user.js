// ==UserScript==
// @id             iitc-plugin-log-filter@udnp
// @name           IITC plugin: Log Filter
// @category       Log
// @version        0.0.1.20160302.165714
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      none
// @downloadURL    none
// @description    [local-2016-03-02-165714] Log Filter
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
plugin_info.dateTimeVersion = '20160302.165714';
plugin_info.pluginId = 'log-filter';
//END PLUGIN AUTHORS NOTE



// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.logfilter = (function() {
  var ID = 'PLUGIN_LOG_FILTER',
      DESCRIPTIONS = "log filter plug-in",
      dom = null,
      input = {
        dom: null,
      };
  
  //// copied from original code/chat.js @ rev.5298c98
  // renders data from the data-hash to the element defined by the given
  // ID. Set 3rd argument to true if it is likely that old data has been
  // added. Latter is only required for scrolling.
  var renderData = function(data, element, likelyWereOldMsgs) {
    var elm = $('#'+element);
    if(elm.is(':hidden')) return;

    // discard guids and sort old to new
  //TODO? stable sort, to preserve server message ordering? or sort by GUID if timestamps equal?
    var vals = $.map(data, function(v, k) { return [v]; });
    vals = vals.sort(function(a, b) { return a[0]-b[0]; });

    // render to string with date separators inserted
    var msgs = '';
    var prevTime = null;
    $.each(vals, function(ind, msg) {
      var nextTime = new Date(msg[0]).toLocaleDateString();
      if(prevTime && prevTime !== nextTime)
        msgs += chat.renderDivider(nextTime);
      msgs += msg[2];
      prevTime = nextTime;
    });

    var scrollBefore = scrollBottom(elm);
    //elm.html('<table>' + msgs + '</table>');
    elm.append(renderTableDom($(msgs)));
    chat.keepScrollPosition(elm, scrollBefore, likelyWereOldMsgs);
  }
  
  //// copied from original code/chat.js @ rev.5298c98
  // contains the logic to keep the correct scroll position.
  var keepScrollPosition = function(box, scrollBefore, isOldMsgs) {
    // If scrolled down completely, keep it that way so new messages can
    // be seen easily. If scrolled up, only need to fix scroll position
    // when old messages are added. New messages added at the bottom don’t
    // change the view and enabling this would make the chat scroll down
    // for every added message, even if the user wants to read old stuff.

    if(box.is(':hidden') && !isOldMsgs) {
      box.data('needsScrollTop', 99999999);
      return;
    }

    var chatDom = document.querySelector('#chat' + window.chat.getActive());
    var tableDom = chatDom.querySelector('table');
    var margin = window.getComputedStyle(tableDom).marginTop;
    var offset = chatDom.offsetHeight - tableDom.offsetHeight;

    if(offset > 0) {
      tableDom.style.marginBottom = offset + 'px';
    }

    if(scrollBefore === 0 || isOldMsgs) {
      box.data('ignoreNextScroll', true);
      box.scrollTop(box.scrollTop() + (scrollBottom(box)-scrollBefore)
        + Number(margin.match(/\d+/)));
    }
  }

  function renderTableDom(rowDoms) {
    var dF = document.createDocumentFragment();

    for(var i = 0; i < rowDoms.length; i++) {
      filterLogWithInput(rowDoms[i]);
      dF.appendChild(rowDoms[i]);
    }
    
    var oldTableDom = document.querySelector('#chat' + window.chat.getActive() + ' table'); 
    if(oldTableDom) {
      oldTableDom.parentElement.removeChild(oldTableDom);
      oldTableDom = null;
    }
    
    var tableDom = document.createElement('table'); 
    tableDom.appendChild(dF);
    
    return tableDom;
  }
  
  function filterLogWithInput(logRowDom) {
    if(!input.dom) return;
    filterLog(logRowDom, input.dom.value);
  }

  function filterLog(logRowDom, s) {
    var agentDom = logRowDom.querySelector('.nickname'); 
    if(!agentDom) return;
    
    if(agentDom.textContent.toLowerCase().search(s.toLowerCase()) !== 0) {
      logRowDom.hidden = true;
    } else {
      logRowDom.hidden = false;
    }
  }

  function createInput() {
    input.dom = document.createElement('input');
    input.dom.type = 'text';
    input.dom.name = 'agent';
    input.dom.placeholder = 'agent name';
    input.dom.addEventListener('keyup', function() {
      switch(window.chat.getActive()) {
        case 'all':
          window.chat.renderPublic(false);
          break;
          
        case 'faction':
          window.chat.renderFaction(false);
          break;
          
        case 'alerts':
          window.chat.renderAlerts(false);
          break;
          
        default:
          break;
      }
    });
    
    return input;
  }

  function setup() {
    // override original function following:
    window.chat.renderData = renderData;
    window.chat.keepScrollPosition = keepScrollPosition;
    
    dom = document.createElement('form');
    dom.id = ID;

    createInput();
    dom.appendChild(input.dom);
    
    var chatDom = document.getElementById('chat');
    chatDom.insertBefore(dom, chatDom.firstElementChild);
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
      .html("#PLUGIN_LOG_FILTER>input {\n  width: 30%;\n  height: 24px;\n}\n\n#chat {\n  padding-bottom: 24px;\n}\n\n#chatall>table, #chatfaction>table, #chatalerts>table {\n  margin-top: 20px;\n}")
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


