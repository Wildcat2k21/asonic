class Tags {
    static getFromTag = function(tagName, html_text){
        let start = html_text.indexOf(`<${tagName}>`) + tagName.length + 2;
        let end = html_text.indexOf(`</${tagName}>`);
        let content = html_text.slice(start, end);
        return content;
    }
};