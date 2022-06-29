let load_options;

function deleteExists(){
    let $icon = $("#extension-logo");
    let $tab = $("#-wrapper-2jk");
    if($icon[0] != null){
        $icon.remove();
        $tab.remove();
    }
}

//получение настроек
async function getOptions(){
    const response = await sendMessage("get-options", null);
    return response;
}

//обновление данных
function sendMessage(type, body){
    return browser.runtime.sendMessage("Asonic.Wildcat2k21@gmail.com", {
      type, body
    });
}

// получение главной формы
async function parseMainForm(form_url){
    let response = await fetch(form_url);
    let formHtml = await response.text();
    let body = Tags.getFromTag("body", formHtml);
    return body;
}

// подгрузка формы и ее инъекции на страницу
let optPreload = new Promise(function(resolve){
    getOptions().then(function(opt){
        load_options = opt;
        return parseMainForm(opt.formUrl);

    }).then(function(form_html){
        let fontSize = load_options["font-size"];
        let $formElems = $(Tags.getFromTag("body", form_html));
        let fontEl = $formElems.find("#-words-2jk");
        fontEl.css("font-size", fontSize + "pt");
        [...$formElems].forEach(el => $('body')[0].append(el));

        resolve();
    });
});

deleteExists();