function options(){
let options;
function main(){
    options = localStorage.getItem("options");
    options = JSON.parse(options);
    for(let key in options){
        let $el = $('#' + key);
        if(options.hasOwnProperty(key) && $el[0] != null){
            let el = $el[0];
            el.value = options[key];
            if(el.type=="checkbox")
            el.checked = options[key];
            $el.on("change", changeOptions);
        }
    }
}

function changeOptions(event){
    let el = event.target;
    if(el.id == "font-size" && isNaN(Number(el.value)))
    el.value = 13;

    if(el.type=="checkbox") options[el.id] = el.checked;
    else options[el.id] = el.value;

    localStorage.setItem("options", JSON.stringify(options));
} main() }
options();