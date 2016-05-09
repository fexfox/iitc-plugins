// ==UserScript==
// @id             iitc-plugin-comm-filter@udnp
// @name           IITC plugin: COMM Filter
// @author         udnp
// @category       COMM
// @version        0.5.5.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @source         https://github.com/udnp/iitc-plugins
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] COMM Filter
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
window.plugin.commfilter = (function() {
  'use strict';
  
  var ID = 'PLUGIN_COMM_FILTER',
      DESCRIPTIONS = "COMM Filter plug-in",
      config = {
        filter: {
          deployed: true,
          captured: true,
          linked: true,
          created: true,
          destroyed: true,
          public: true,
          faction: true,
          alert: false
        }
        // filtering_between_agents_and_actions: 'OR' // AND, OR
      },
      comm = null,
      // inputAgent,
      // inputAction,
      inputAgentsOrPortals,
      filterSwitches = [];
  
  comm = (function() {
    var dom = null,
        channels = {}; // all, faction, alerts
    
    function Channel(name) {
      return {
        name: name,
        dom: null,
        hasLogs: function() {
          if(this.dom && this.dom.querySelector('table')) {
            return true;
          } else {
            return false;
          }
        }
      };
    }
    
    function create() {
      dom = document.getElementById('chat');
      if(!dom) return null;
      
      channels = [new Channel('all'), new Channel('faction'), new Channel('alerts')];
      
      for(var i = 0; i < channels.length; i++) {
        channels[i].dom = dom.querySelector('#chat' + channels[i].name);
        
        if(channels[i].dom) {
          insertStatusViewTo(channels[i].dom);
        }
        
        channels[channels[i].name] = channels[i];
      }
      
      // filtering by agent name clicked/tapped in COMM       
      dom.addEventListener('click', function(event){
        if(!event.target.classList.contains('nickname')) return;
        
        // tentative: to avoid a problem on Android that causes cached chat logs reset,
        //            call event.stopImmediatePropagation() in this.
        //            So IITC default action that inputs @agentname automatically 
        //            to the #chattext box is blocked.
        //TODO related to issue#5
        event.stopImmediatePropagation();

        var channel = window.chat.getActive();
        
        if(channels[channel] && channels[channel].hasLogs()) {
          if(!inputAgentsOrPortals.value) {
            inputAgentsOrPortals.value = event.target.textContent + ' ';
          } else {
            inputAgentsOrPortals.value = inputAgentsOrPortals.value + ' ' + event.target.textContent + ' ';
          }

          inputAgentsOrPortals.fireInputEvent();
        }
      });
      
      // refreshing filtered logs on COMM tabs changed
      document.getElementById('chatcontrols').addEventListener('click', function(event) {
        var channel = window.chat.getActive();
        if(channels[channel] && channels[channel].hasLogs()) renderLogs(channel);
      });
      
      if(window.useAndroidPanes()) {
        // in order to provide common UI as same as Desktop mode for Android.  
        dom.classList.add('expand');
      }
      
      return comm;
    }
    
    function insertStatusViewTo(channelDom) {
      var dom = document.createElement('div');
      dom.className = 'status';
      channelDom.insertBefore(dom, channelDom.firstChildElement);
    }
    
    return {
      get dom() {return dom;},
      get channels() {return channels;},
      create: create
    };
    
  })();

  var Input = (function Input() {
    var Constr = function(prop) {
      var df = document.createDocumentFragment(),
          textbox = {
            dom: null,
            create: function(prop) {
              var dom = document.createElement('input');
              dom.type = 'text';
              dom.placeholder = prop.placeholder || '';

              this.dom = dom;
              return this;
            }
          },
          reset = {
            dom: null,
            create: function() {
              var dom = document.createElement('button');
              dom.type = 'button';
              dom.textContent = 'X';
              
              this.dom = dom;
              return this;
            }
          };
      
      textbox.create(prop);
      reset.create();
      reset.dom.addEventListener('click', this.clear.bind(this));
      
      df.appendChild(textbox.dom);
      df.appendChild(reset.dom);      

      Object.defineProperties(this, {
        name: {
          get: function name() {return textbox.dom ? textbox.dom.name : null;},
          set: function name(value) {if(textbox.dom) textbox.dom.name = value;}
        },
        value: {
          get: function value() {return textbox.dom ? textbox.dom.value : null;},
          set: function value(value) {if(textbox.dom) textbox.dom.value = value;},
        },
        defaultValue: {
          get: function defaultValue() {return textbox.dom ? textbox.dom.defaultValue : null;},
          set: function defaultValue(value) {if(textbox.dom) textbox.dom.defaultValue = value;},
        }
      });    

      this.dom = df;
      this.name = prop.name || '';
      this.defaultValue = '';
      this.value = this.defaultValue;
      this.oldValue = null;
      this.fireInputEvent = function() {
        if(textbox.dom) textbox.dom.dispatchEvent(new Event('input', {bubbles: true}));
      };      
    };
    
    Constr.prototype = {
      constructor: Input,
      
      get wordsList() {
        return this.value.trim().split(/\s+/);
      },
      
      clear: function() {
        this.oldValue = this.value;
        this.value = this.defaultValue;
        this.fireInputEvent();
        
        //TODO related to issue#5
        //document.getElementById('chattext').value = '';
      },
      
      isValueChanged: function(){
        if(this.value !== this.oldValue){
          this.oldValue = this.value; 
          return true;
        }
        else return false;
      },
      
      isWordsListChanged: function(){
        var oldWordsList = (this.oldValue !== null) ? this.oldValue.trim().split(/\s+/) : null;
        
        if(!this.isValueChanged()) return false;
        if(!oldWordsList) return (this.value.trim() === '') ? false : true;
                
        if(oldWordsList.length !== this.wordsList.length) {
          return true;
        } else {
          for(var i = 0; i < oldWordsList.length; i++) {
            if(oldWordsList[i] !== this.wordsList[i]) return true;
          }
          
          return false;
        }
      }      
    };

    return Constr;
  })();

  var FilterSwitch = (function FilterSwitch() {
    var Constr = function(action) {
      if(!action) return null;
      
      var switchDom = document.createElement('input');
      switchDom.type = 'checkbox';
      
      Object.defineProperties(this, {
        name: {
          get: function() {return switchDom ? switchDom.name : null;},
          set: function(val) {if(switchDom) switchDom.name = val;}
        },
        checked: {
          get: function() {return switchDom ? switchDom.checked : null;},
          set: function(val) {if(switchDom) switchDom.checked = val;}
        }
      });
      
      this.name = action;
      this.checked = config.filter[action];
      
      this.dom = document.createElement('label');
      this.dom.className = 'switch';
      this.dom.textContent = action;
      this.dom.insertBefore(switchDom, this.dom.firstChild);
    };
    
    Constr.prototype = {
      constructor: FilterSwitch,
      
      toggle: function() {
        if(this.checked) config.filter[this.name] = true;
        else config.filter[this.name] = false;
      }
    };
    
    return Constr;
  })();

  function filterAgent(log, agent) {
    if(checkWordPrefix(agent.toLowerCase(), log.toLowerCase())) {
      return true;
    } else {
      return false;
    }
  }
  
  function filterPortal(log, portal) {
    if(checkWord(portal.toLowerCase(), log.toLowerCase())) {
      return true;
    } else {
      return false;
    }
  }
  
  function filterOutDeployed(log) {
    if(!config.filter.deployed) {
      return isDeployedLog(log);
    }    
    
    return false;
  }
      
  function isDeployedLog(log) {
    if(checkWordPrefix('deployed', log.trim())) {
      return true;
    } else {
      return false;
    }
  }
  
  function filterOutCaptured(log) {
    if(!config.filter.captured) {
      return isCapturedLog(log);
    }    
    
    return false;
  }
      
  function isCapturedLog(log) {
    if(checkWordPrefix('captured', log.trim())) {
      return true;
    } else {
      return false;
    }
  }
  
  function filterOutLinked(log) {
    if(!config.filter.linked) {
      return isLinkedLog(log);
    }    
    
    return false;
  }
      
  function isLinkedLog(log) {
    if(checkWordPrefix('linked', log.trim())) {
      return true;
    } else {
      return false;
    }
  }
  
  function filterOutCreated(log) {
    if(!config.filter.created) {
      return isCreatedLog(log);
    }    
    
    return false;
  }
      
  function isCreatedLog(log) {
    if(checkWordPrefix('created', log.trim())) {
      return true;
    } else {
      return false;
    }
  }
  
  function filterOutDestroyed(log) {
    if(!config.filter.destroyed) {
      return isDestroyedLog(log);
    }    
    
    return false;
  }
      
  function isDestroyedLog(log) {
    if(checkWordPrefix('destroyed', log.trim())) {
      return true;
    } else {
      return false;
    }
  }
  
  function filterOutFaction(log) {
    if(!config.filter.faction) {
      return isFactionLog(log);
    }    
    
    return false;
  }
      
  function isFactionLog(log) {
    if(checkWordPrefix(/\[faction\]/, log.trim())) {
      return true;
    } else {
      return false;
    }
  }
      
  function filterOutPublic(log) {
    if(!config.filter.public) {
      return isPublicLog(log);
    }    
    
    return false;
  }
      
  function isPublicLog(log) {
    if(checkWordPrefix(/\[public\]/, log.trim())) {
      return true;
    } else {
      return false;
    }
  }
      
  function filterOutAlert(log) {
    if(!config.filter.alert) {
      return isAlertLog(log);
    }    
    
    return false;
  }
  
  function isAlertLog(log) {
    if(checkWordPrefix('your', log.trim().toLowerCase())) {
    // if(checkWord('attack', log.toLowerCase())) {}
    // if(checkWord('neutralized', log.toLowerCase())) {}
    // if(checkWord('destroyed', log.toLowerCase())) {}
      return true;
    } else {
      return false;
    }
  }
  
  function checkWord(s, word) {
    if(word.search(s) !== -1) return true;
    else return false;
  }
  
  function checkWordPrefix(prefix, word) {
    if(word.search(prefix) === 0) return true;
    else return false;
  }
  
  function renderLogs(channel) {
    switch(channel) {
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
  }
  
  function setup() {
    if(!comm.create()) return;
        
    $("<style>")
      .prop("type", "text/css")
      .html("@@INCLUDESTRING:plugins/comm-filter.css@@")
      .appendTo("head");
    
    var rootDom = document.createElement('header');
    rootDom.id = ID;
    
    var titleDom = document.createElement('b');
    titleDom.className = 'title';
    titleDom.textContent = 'Filter';
    titleDom.title = DESCRIPTIONS;
    rootDom.appendChild(titleDom);

    inputAgentsOrPortals = new Input({name: 'agents_or_portals', placeholder: 'agents or portals'});
    rootDom.appendChild(inputAgentsOrPortals.dom);
    
    rootDom.addEventListener('input', function(event) {
      if(event.target.name === inputAgentsOrPortals.name) {
        var channel = window.chat.getActive();
        
        if((comm.channels[channel] && comm.channels[channel].hasLogs()) 
          && inputAgentsOrPortals.isWordsListChanged()) {
            renderLogs(channel);
        }
      }
    });
    
    // var selectorAndOrDom = document.createElement('select');
    // selectorAndOrDom.disabled = true;
    // selectorAndOrDom.options[0] = document.createElement('option');
    // selectorAndOrDom.options[0].textContent = 'AND';
    // selectorAndOrDom.options[1] = document.createElement('option');
    // selectorAndOrDom.options[1].textContent = 'OR';
    // if(config.filtering_between_agents_and_actions === 'AND') selectorAndOrDom.options[0].selected = true;
    // else if(config.filtering_between_agents_and_actions === 'OR') selectorAndOrDom.options[1].selected = true;
    // rootDom.appendChild(selectorAndOrDom);

    // inputAction = new Input({name: 'action', placeholder: 'portal name'});
    // rootDom.appendChild(inputAction.dom);
    
    // rootDom.addEventListener('input', function(event) {
    //   if(event.target.name === inputAction.name) {
    //     var channel = window.chat.getActive();
        
    //     if((comm.channels[channel] && comm.channels[channel].hasLogs()) 
    //       && inputAction.isWordsListChanged()) {
    //         renderLogs(channel);
    //     }
    //   }
    // });
    
    filterSwitches = [
      new FilterSwitch('deployed'), 
      new FilterSwitch('captured'), 
      new FilterSwitch('linked'), 
      new FilterSwitch('created'), 
      new FilterSwitch('destroyed')];
    
    var switchesDom = document.createElement('span');
    switchesDom.className = 'switchgroup';
    
    for(var i = 0; i < filterSwitches.length; i++) {
      switchesDom.appendChild(filterSwitches[i].dom);
    }
    
    rootDom.appendChild(switchesDom);
    rootDom.addEventListener('change', function(event){
      for(var i = 0; i < filterSwitches.length; i++) {
        if(event.target.name === filterSwitches[i].name) {
          filterSwitches[i].toggle();
          renderLogs(window.chat.getActive());
          break;
        }
      }    
    });
    
    comm.dom.insertBefore(rootDom, comm.dom.firstElementChild);
  }

  return {
    filterAgent: filterAgent,
    filterPortal: filterPortal,
    filterOutAlert: filterOutAlert,
    filterOutCaptured: filterOutCaptured,
    filterOutCreated: filterOutCreated,
    filterOutDeployed: filterOutDeployed,
    filterOutDestroyed: filterOutDestroyed,
    filterOutFaction: filterOutFaction,
    filterOutLinked: filterOutLinked,
    filterOutPublic: filterOutPublic,
    get input() {return inputAgentsOrPortals;},
    setup: setup
  };

}());

var setup = function(){
  if(!window.chat) return; 
  
  /*
   * override following functions for the window.chat 
   */
  //// based on original iitc/code/chat.js @ rev.5298c98
  // renders data from the data-hash to the element defined by the given
  // ID. Set 3rd argument to true if it is likely that old data has been
  // added. Latter is only required for scrolling.
  window.chat.renderData = function(data, element, likelyWereOldMsgs) {
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
    if(!window.plugin.commfilter) elm.html('<table>' + msgs + '</table>');    
    else elm.append(chat.renderTableDom($(msgs)));
    chat.keepScrollPosition(elm, scrollBefore, likelyWereOldMsgs);
  }

  //// based on original iitc/code/chat.js @ rev.5298c98
  // contains the logic to keep the correct scroll position.
  window.chat.keepScrollPosition = function(box, scrollBefore, isOldMsgs) {
    // If scrolled down completely, keep it that way so new messages can
    // be seen easily. If scrolled up, only need to fix scroll position
    // when old messages are added. New messages added at the bottom don’t
    // change the view and enabling this would make the chat scroll down
    // for every added message, even if the user wants to read old stuff.

    if(box.is(':hidden') && !isOldMsgs) {
      box.data('needsScrollTop', 99999999);
      return;
    }

    chat.fitLogsTableToBox(box);

    var statusView = $('.status', box); 
    statusView.text('');

    if(scrollBefore === 0 || isOldMsgs) {
      box.data('ignoreNextScroll', true);
      box.scrollTop(box.scrollTop() + (scrollBottom(box)-scrollBefore)
        + statusView.outerHeight());
      statusView.text('Now loading...');
    }
  }

  //// based on original iitc/code/chat.js @ rev.5298c98
  window.chat.renderDivider = function(text) {
    return '<tr class="divider"><td colspan="3"><summary>' + text + '</summary></td></tr>';
  }
  
  /*
   * append following functions for the window.chat 
   */
  window.chat.fitLogsTableToBox = function(box) {
    var logsTable = $('table', box);
    if(!logsTable) return;
    
    // box[0].offsetHeight - logsTable[0].offsetHeight
    var offset = box.outerHeight() - logsTable.outerHeight();

    if(offset > 0) {
      logsTable.css('margin-bottom', offset + 'px');
    } else {
      logsTable.css('margin-bottom', '0');
    }
  }
  
  $('#chatcontrols a:first').click(function(){
    window.chat.fitLogsTableToBox($('#chat > div:visible'));
  });
  
  window.chat.renderTableDom = function(rowDoms) {
    var dF = document.createDocumentFragment();

    for(var i = 0; i < rowDoms.length; i++) {
      chat.filter(rowDoms[i]);
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

  window.chat.filter = function(rowDom) {
    var filter = window.plugin.commfilter;
    
    if(!filter || !filter.input) return;
    if(!rowDom || rowDom.classList.contains('divider')) return;
    
    var wordsList = filter.input.wordsList;
    var agentLogDom = rowDom.cells[1].querySelector('.nickname');
    var actionLogDom = rowDom.cells[2];
    var actionLogAgentsDomList = actionLogDom.querySelectorAll('.pl_nudge_player, .pl_nudge_me');
    var portalsDomList = rowDom.cells[2].querySelectorAll('.help');

    if(chat.getActive() === 'all') {
      var actionLog = actionLogDom.textContent;
      if(filter.filterOutCaptured(actionLog)
        || filter.filterOutDeployed(actionLog)
        || filter.filterOutLinked(actionLog)
        || filter.filterOutCreated(actionLog)
        || filter.filterOutDestroyed(actionLog)
        || filter.filterOutFaction(actionLog)
        || filter.filterOutPublic(actionLog)
        || filter.filterOutAlert(actionLog)) {
          rowDom.hidden = true;
          // AND filtering
          return;
      }
    } else if(chat.getActive() === 'alerts') {
      var actionLog = actionLogDom.textContent;
      if(filter.filterOutFaction(actionLog)
        || filter.filterOutPublic(actionLog)) {
          rowDom.hidden = true;
          // AND filtering
          return;
      }
    }
    
    for(var i = wordsList.length - 1; -1 < i; i--) {
      // filtering agent
      if(agentLogDom && filter.filterAgent(agentLogDom.textContent, wordsList[i])) {
        rowDom.hidden = false;
        return;
      }
      if(actionLogAgentsDomList.length) {
        for(var j = 0; j < actionLogAgentsDomList.length; j++) {
          if(filter.filterAgent(actionLogAgentsDomList[j].textContent, '@' + wordsList[i])) {
            rowDom.hidden = false;
            return;
          }
        }
      }
      
      // filtering portal
      // OR filtering
      if(portalsDomList.length) {
        for(var j = 0; j < portalsDomList.length; j++) {
          if(filter.filterPortal(portalsDomList[j].textContent, wordsList[i])) {
            rowDom.hidden = false;
            return;
          }
        }
      }
      
      rowDom.hidden = true;
    }    
  }

  window.plugin.commfilter.setup();
};

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
