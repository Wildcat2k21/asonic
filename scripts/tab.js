//класс формы
class Tab{
    static defWidth = 450
    static defHeight = 280

    constructor(){
        this._element = $("#-wrapper-2jk");
        this._text = $('#-words-2jk');
        this._audioContent = $('.-bottom-toolbar-2jk');
        this._progress = $("#audio-btn-2jk");
        this._audioRange = $('#audio-control-2jk');
        this._remoteAudioText = $('#audio-time-2jk');
        this._textCopyMsg = $('#text-copy-info-2jk');
        this.min_width = 350;
        this.min_height = 280;
        this._lastClick;
        this.icon = $('#extension-logo');
        this._pressed = false;
        this.$unvaibleMess = $('#error-2jk');
        this.writed = "";
        this.lastWrited = "";
        this.translationProcessing = false;
        this.selection = {
            text: "",
            remove: function(){
                document.getSelection().removeAllRanges();
            }
        }

        this.trSelection = {
            el: $('#select-lan-2jk'),
            menuEl: $(".language-tab-2jk"),
            language: '',
            show: function(){
                this.ctxTrMenuShowed = true;
                if(this.lanMenuAnimEnd != false)
                clearTimeout(this.lanMenuAnimEnd);
                this.menuEl.css("display", "block");
                setTimeout(()=>this.menuEl.css("opacity", 1), 0); 
            },
    
            hide: function(){
                this.ctxTrMenuShowed = false;
                this.menuEl.css("opacity", 0);
                this.lanMenuAnimEnd = setTimeout(function(){
                    this.menuEl.css("display", "none");
                    delete this.lanMenuAnimEnd;
                }.bind(this), 500)
            }
        }

        this._resize = {
            pressed: false
        }

        this.showUnvaibleMessage = function(icon_name, msg){
            if(this.uMessAnim != false)
            return

            let _icon = new IconSvg();
            let $xml_svg = $(_icon.newSvg(icon_name, "wjk-" + icon_name));
            let $message = $("#message-info-2jk");
            let $icon = $("#mess-icon-2jk");

            if($icon[0].firstChild != null)
            $icon[0].firstChild.remove();

            $message.text(msg);
            $icon.append($($xml_svg[0]));

            this.$unvaibleMess.css({
                "display" : "block",
                "animation" : "showUnMess 5s"
            });

            clearTimeout(this.uMessAnim);
            this.uMessAnim = setTimeout(function(){
                this.$unvaibleMess.css({
                    "display" : "none",
                    "animation" : ""
                });
                
                delete this.uMessAnim;
            }.bind(this), 5000)
        }

        this._minTab = {
            hide: function(){
                this.icon.css({
                    "animation": "",
                    "display": "none"
                });
            
            }.bind(this),
            show: function(){
                this.icon.css({
                    "display": "block",
                    "animation": "showicon 0.5s"
                });
                
            }.bind(this)
        };
    }

    //ручной выбор языка (не реализовано)
    manualVoiceSelect = {
        $backg: $("#backg-man-ch-2jk"),
        $tab: $("#manual-choice-2jk"),
        $button: $("#man-v-detect-canc-2jk"),
        isShowed: false,
        show: function(){
            this.$backg.add(this.$tab).css("display", "block");
            this.isShowed = true;
        },

        hide: function(){
            this.$backg.add(this.$tab).css("display", "none");
            this.isShowed = false;
        }
    }

    audioShow(){
        clearTimeout(tab.hideRule);
        let $el = $('#audio-pleyer-2jk');
        this._audioContent.css("background", "#eee");
        $el.css({
            "opacity" : 1,
            "z-index" : 1,
            "margin-top" : "0"
        })
    }

    audioHide(){
        let $el = $('#audio-pleyer-2jk');
        if(this.hideRule != undefined)
        clearTimeout(this.hideRule);
        this.hideRule = setTimeout(function(){
            $el.css("z-index", -1)
            delete this.hideRule;
        }.bind(this), 500);
        $el.css({
            "opacity" : 0,
            "margin-top": "10px",
            "z-index" : -1
        });

        this._audioContent.css("background", "#DCDBDB")
    }
}

//Модифицированный класс tab
const TabModify = new Proxy(Tab, {
    construct(tabConstruct, ...args){
        return new Proxy(new tabConstruct(...args), {
            set(target, prop, value, reciver){
                let caseProp, val;
                switch(prop){
                    case prop.equal("posX", "posY"): //совмещение похожих методов
                        caseProp = (prop == "posX") ? "left" : "top"
                        target[prop] = value
                        target["_element"].css(caseProp, `${value}px`)
                        break
                    
                    case prop.equal("width", "height"):
                        val = value < caseProp ? caseProp : value
                        caseProp = reciver[`min_${prop}`]

                        if(prop == "height") target._text.css(prop, val - 130);
                        else target._text.css(prop, val - 70)
                        target["_element"].css(prop, val)
                        
                        target[prop] = val
                        break
                    
                    case "hideRule":
                        target[prop] = value
                        return value

                    default:
                        target[prop] = value
                        return value

                }
            },

            get(target, prop, reciver){
                switch(prop){
                    case "position":
                        return function({x, y}){
                            reciver["posX"] = x
                            reciver["posY"] = y
                        }

                    case "resize":
                        return function(w = Tab.defWidth, h = Tab.defHeight){
                            w = w < target["min_width"] ? target["min_width"] : w;
                            h = h < target["min_height"] ? target["min_height"] : h;
                            reciver["width"] = w
                            reciver["height"] = h
                        }

                    case "writeInTextArea":
                        return function(){
                            let textContent = reciver.truncateTextArea().join(" ");
                            tab.$textEd = $(`<div id="-text-2jk" contentEditable>${textContent}</div>`);
                            target._text[0].append(tab.$textEd[0]);
                            tab.$textEd.on("keyup", textSelectUpdateText);
                        }

                    case "truncateTextArea":
                        return function(){
                            let textContent = [], $span = target._text.children();
                            $span.each(i => {
                                textContent.push($span[i].textContent);
                                $span[i].remove();
                            });
                        
                            return textContent;
                        }
                    
                    case "setDefSize":
                        return function(){
                            let defH = Tab.defHeight;
                            let defW =  Tab.defWidth;
                            reciver.resize(defW, defH);
                        }

                    case "fillSpanText":
                        return function(text){
                            let spanArr = new Array();
                            let _text = text.split(/\s/);
                            _text.forEach(word => {
                                tab._text.append(`<span class="text-words-2jk" >${word}</span>\n\t\t\t\t`);
                            });

                            return spanArr;
                        }
                    
                    case "show":
                        return function(){
                        target['_element'].css("display", "block");
                        target['tabIsShowed'] = true
                    }

                    case "hide":
                        return function(){
                        target['_element'].css("display", "none");
                        target['tabIsShowed'] = false
                    }

                    case prop.equal("width", "height"):
                        return (prop in reciver) ? target[prop] : reciver[prop] = target[`min_${prop}`]

                    case prop.equal("posX", "posY"):
                        return (prop in reciver) ? target[prop] : reciver[prop] = 0

                    default:
                        return prop in target ? target[prop] : target[prop] = false;
                }
            }
        })
    }
});