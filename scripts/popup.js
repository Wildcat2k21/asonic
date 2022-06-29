// function popup(){
let options, tts, tabs, $svg = document.querySelector('svg');
['mouseover', 'mouseout', 'click'].forEach(function(i) {
  $svg.addEventListener(i, hover);
});

function hover(event){
  switch(event.type){
    case 'mouseover':
      $svg.style.transform = "rotate(90deg)"
      $svg.style.opacity = "0.5"
      break

    case 'mouseout':
      $svg.style.transform = "rotate(0deg)"
      $svg.style.opacity = "1"
      break

    case 'click':
      window.open("options.html");
      window.close();
      break

  }
}

function preload(){
  getTabs().then(_tabs => {
    tabs = _tabs;
    main();
  });
}

function main(){
  let $language = $('#v-language')[0];
    options = localStorage.getItem("options");
    options = JSON.parse(options);
    tts = options["text-to-voice"].originals;

    Object.keys(tts).forEach(function(key){
      let code = tts[key].code;
      let $options = $(`<option class='right' value='${code}'>${key}<option/>`)[0];
      $language.append($options);
    });
  
    for(let key in options){
      let etypes = "change", $el = $('#' + key);
      if(options.hasOwnProperty(key) && $el[0] != null){
        let el = $el[0];
      
        if(el.type=="checkbox"){
          el.checked = options[key];
          if(options[key]) disabledSelection();
        }
        
        el.value = options[key];
        if(key == "v-language")
        updateVoiceList($language.value);
        
        etypes = el.type == "range" ? "input" : "change";
        $el.on(etypes, changeOptions);
      }
    }
}

function updateVoiceList(code){
  let voices;
  for(let key in tts){
    if(tts.hasOwnProperty(key) && tts[key].code == code){
      voices = tts[key].tts;
    }
  }

  $(".voice").remove();
  voices.forEach(function(voice){
    let $option = $(`<option class='right voice' value='${voice.val}'>${voice.name}</option>`)[0];
    $('#voice')[0].append($option);
  })
}

function sendMessage(type, body){
  return browser.runtime.sendMessage("Asonic.Wildcat2k21@gmail.com", {
    type, body
  });
}

async function getTabs(){
  let _tabs = [], tab_obj = await browser.windows.getAll({
    populate: true,
    windowTypes: ["normal"]
  });

  tab_obj.forEach(function(wind, wIndex){
    wind.tabs.forEach(function(tab, tIndex){
      _tabs.push(tab);
    })
  });

  return _tabs;
}

function sendMessageToAllTabs() {
  for (let tab of tabs) {
    browser.tabs.sendMessage(
      tab.id, {type: "2jk-preload", ...options}
    ).catch(e => undefined)
  }
}

function disabledSelection(){
  let $chk = $('#auto-text-detect');
  let $lan = $('#v-language');
  let $voc = $('#voice');

  if($chk[0].checked){
    $lan.add($voc).attr("disabled", true);
    $lan.add($voc).css("background-color", "#CCCCCC");
  }else{
    $lan.add($voc).css("background-color", "#fafafa");
    $lan.add($voc).removeAttr("disabled");
  }
}

browser.runtime.onMessage.addListener(function(mess){
	if(mess.type == "options-loaded"){
    console.log("options loaded");
    preload();
  }
});

function changeOptions(event){
  if(event.target.id == "v-language"){
    updateVoiceList(event.target.value);
    options["voice"] = $("#voice")[0].value;
  }

  if(event.target.id == "auto-text-detect")
  disabledSelection();

  if(event.target.type == "checkbox")
  options[event.target.id] = event.target.checked;
  else options[event.target.id] = event.target.value;
  localStorage.setItem("options", JSON.stringify(options));

  if(event.target.id == "volume")
  sendMessageToAllTabs();
}

if(localStorage.getItem("options") != null) preload();