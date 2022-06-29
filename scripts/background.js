function background(){
if(localStorage.getItem("options") == null)
configureSettings().then(function(){
  sendMessageExten("options-loaded", null);
})

async function parseTTS(){
  try{
    let response = await fetch('tts.json');
    let json = await response.json();

    return json;

  }catch(e){
    throw e;
  }
}

async function configureSettings(){
    let index = {}, code, originals = await parseTTS();
    for(let key in originals){
      code = originals[key].code;
      index[code] = {
        voices: originals[key].tts,
        language: key
      }
    }

    let mainFormUrl = browser.runtime.getURL("main_form.html");

    options = {
        "translate": false,
        "language": "ru",
        "font-size": 13,
        "tr-api": "",
        "auto-text-detect": true,
        "volume": 1,
        "v-language": "en",
        "voice" : "usenglishfemale",
        "text-to-voice" : {originals, index},
        "formUrl" : mainFormUrl
    }

    localStorage.setItem("options", JSON.stringify(options));
  }
}

let localStorageOperaions = {
  changeItem: function(item, newItem){
    let options = localStorage.getItem("options");
    let json_options = JSON.parse(options);
    json_options[item] = newItem;
    localStorage.setItem("options", JSON.stringify(json_options));
  }
}

function sendMessageExten(type, body){
  try{
    return browser.runtime.sendMessage("Asonic.Wildcat2k21@gmail.com",{type, body});
  } catch(e) {
    throw e;
  }
}

browser.runtime.onMessage.addListener(function(mess){
	if(mess.type == "get-options"){
    let optionStr = localStorage.getItem("options");
    let options = JSON.parse(optionStr);
    return Promise.resolve(options);
  }

  if(mess.type == "options-update"){
    localStorageOperaions.changeItem("translate", mess.body.auto_translate);
  }
});

background();