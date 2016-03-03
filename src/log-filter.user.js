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
      dom = null,
      logView = {
        dom: null,
        logs: [
          {
            id: 'all',
            dom: null,
            log: {},
            status: {}
          },
          {
            id: 'faction',
            dom: null,
            log: {},
            status: {}
          },
          {
            id: 'alerts',
            dom: null,
            log: {},
            status: {}
          }
        ]
      },
      input = {
        dom: null
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

    var logsTable = $('table', box);
    // box[0].offsetHeight - logsTable[0].offsetHeight
    var offset = box.outerHeight() - logsTable.outerHeight();

    if(offset > 0) {
      logsTable.css('margin-bottom', offset + 'px');
    }

    var statusView = $('.status', box); 
    statusView.text('');

    if(scrollBefore === 0 || isOldMsgs) {
      box.data('ignoreNextScroll', true);
      box.scrollTop(box.scrollTop() + (scrollBottom(box)-scrollBefore)
        + statusView.outerHeight());
      statusView.text('Now loading...');
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
    
    logView.dom = document.getElementById('chat');
    logView.dom.insertBefore(dom, logView.dom.firstElementChild);
    
    for(var i = 0; i < logView.logs.length; i++) {
      logView.logs[i].dom = logView.dom.querySelector('#chat' + logView.logs[i].id);
      logView.logs[i].status.dom = document.createElement('div');
      logView.logs[i].status.dom.className = 'status';
      logView.logs[i].dom.insertBefore(logView.logs[i].status.dom, logView.logs[i].dom.firstChildElement);
    }
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
