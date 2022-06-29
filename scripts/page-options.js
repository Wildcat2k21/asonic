// function pageOptions(){
let tab, voices = [];
//преобразование текста в читаемый вид
String.prototype.normalize = function(){
    return this.replace(/\n/g, ' ').replace(/\s\s+/g, ' ');
}

//посик совпадений в ключах
String.prototype.equal = function(...arr){
    return arr.find(str => str == this);
}

// В FF нет contains, нужно сделать
if (window.Node && Node.prototype && !Node.prototype.contains)
    {
        Node.prototype.contains = function (arg) {
        return !!(this.compareDocumentPosition(arg) & 16)
    }
}

//загрузка страницы
let pageIsLoaded = new Promise(function(resolve){
    $(document).ready(function(){
        resolve();
    });
});

function preload(){
    Promise.all([pageIsLoaded, optPreload]).then(()=>{
        $("#remcheck-lan-2jk")[0].checked = load_options.translate;
        main();
    });

} preload();

//прослушивание готовности страницы
function main(){
    let $iconContentEl = [...$('.-button-2jk')];
    let iconsXml = new IconSvg();
    let icon = {};

    //интерактивные иконки
    $iconContentEl.forEach(function($el){
        let attrname = $el.getAttribute("name");
	    let xml = $(iconsXml.newSvg(attrname, `twjk-${attrname}`))[0];
	    $el.append(xml);
        let $fill = [...$(`.twjk-${attrname}-fillme`)];
        if($fill.length != 0)
        icon[attrname] = {
            fills: $fill,
            pressed: false,
            el: $($el),
            ccolor : xml.getAttribute('specialcolor'),
            active : function(){
                this.pressed = true;
                this.fills.forEach(function($f){
                    if(this.ccolor == undefined)
                    $f.style.fill = '#b1b9fa';
                    else
                    $f.style.fill = this.ccolor;
                }.bind(this));
            },

            disable : function(){
                this.pressed = false;
                this.fills.forEach(function($f){
                    $f.removeAttribute('style');
                }.bind(this))
            }
        }
    });

    ["play", "pause"].forEach((_icon, indx) => {
        let $audioContent = $('.audio-controls-2jk')[indx];
        let $el = $(iconsXml.newSvg(_icon))[0];
        $audioContent.append($el);
    });

    //иконка отдельно для проигрыавния и поставки на паузу
    let audioIconsWrapper= $('.audio-controls-2jk');
    let audioIcons = {
        pressed: false,
        reolOnPlayIcon : function(){
            audioIconsWrapper[1].style.display = "none";
            audioIconsWrapper[0].style.display = "block";
            this.pressed = true;
        },

        replOnPauseIcon: function(){
            audioIconsWrapper[0].style.display = "none";
            audioIconsWrapper[1].style.display = "block";
            this.pressed = false;
        }
    }

    //смена иконки на проигрывание
    audioIcons.reolOnPlayIcon();


    //создание объекта расширения
    tab = NewTab(100, 100, 450, 280);
    preloadOptions();

    //аудио объект
    tab.$audio = {
        volume: 1,
        selectedVoice: "rurussianfemale",
        play : function(){
            if(tab.loadingMetaData){
                tab.showUnvaibleMessage("unvaible", "Идет загрузка данных, осталось немного.");
                return;
            }
            
            audioIcons.replOnPauseIcon();
            icon['voice'].active();
            getOptions().then(function(options){
                return new Promise(function(resolve){
                    let words = {};
                    tab.$audio.volume = options.volume;
                    ["writed", "lastWrited"].forEach(inf=>{
                        words[inf] = tab[inf].split(" ")[0];
                    })


                    if(options["auto-text-detect"]){
                        if(tab.textConvertUseTranslation){
                            // console.log("exist case 2");
                            let voice = options["text-to-voice"].index;
                            let voice_value = voice[tab.translatedToLan].voices[0].val;
                            resolve(voice_value);

                        } else if (words.writed == words.lastWrited && !tab.lastManualUse){
                            // console.log("exist case");
                            resolve(tab.lastVoice);

                        } else {
                            // console.log("define case");
                            detectLanguage().then(code => {
                                tab.detectedLanguage = code;
                                tab.lastManualUse = false;
                                if(code == "zh-Hans") code = "zh";
   
                                if(!Object.keys(options["text-to-voice"].index).includes(code)){
                                    const error = new Error("Функция не поддерживает воспроизведение данного языка");
                                    error.name = "Голос не найден";
                                    error.code = 404;
                                    throw error;
                                }

                                let voice = options["text-to-voice"].index;
                                let voice_value = voice[code].voices[0].val;
                                resolve(voice_value);

                            }).catch(err => handleError(err));
                        }

                    } else {
                        // console.log("manual case");
                        tab.lastManualUse = true;
                        resolve(options.voice);
                    }
                });
            }).then(sel_voice => createAudioElement(sel_voice)).then(audioObj => {
                tab.$audioEl.volume = tab.$audio.volume;
                audioObj.play();
            })
            .catch(e => {
                tab.showUnvaibleMessage("no-internet", "Ошибка подключения. Проверьте соединение с интернетом");
                console.error("Не удалось получить аудио-файл, текст ошибки: " + e);
                disablePlayButtons();
            });
        },

        remoteTo: function(t){
            if(tab.loadingMetaData || !tab.$audioEl){
                return;
            }

            tab.$audioEl.currentTime = t;
            updateProgressLine.call(tab.$audioEl);
        },

        cancel: function(){
            if(tab.loadingMetaData || !tab.$audioEl)
            return;

            icon['voice'].disable();
            audioIcons.reolOnPlayIcon();
            tab.$audioEl.pause();
            tab.$audioEl.currentTime = 0;
            tab._progress.css("margin-left", "100%")
            clearInterval(tab._audio_play);
        },

        pause: function(){
            if(tab.loadingMetaData || !tab.$audioEl)
            return;

            disablePlayButtons();
            tab.$audioEl.pause();
            clearInterval(tab._audio_play);
        }
    }

    tab.Navigator = {
        active: false,
        back: function(){
            tab.tempText = tab.writed;
            tab.writed = tab.textBeforeTranslation;

            if(tab.textConvertUseTranslation)
            tab.textConvertUseTranslation = false;

            if(tab.textSelectMode)
                tab.$textEd[0].textContent = tab.writed;
            else {
                tab.truncateTextArea();
                tab.fillSpanText(tab.writed);
            }

            this.active = true;
        },

        foward: function(){
            tab.textBeforeTranslation = tab.writed
            tab.writed = tab.tempText

            if(tab.textConvertUseTranslation)
            tab.textConvertUseTranslation = true

            if(tab.textSelectMode)
            tab.$textEd[0].textContent = tab.writed
            else {
                tab.truncateTextArea()
                tab.fillSpanText(tab.writed)
            }

            this.active = false;
        }
    }

    //иконка расширения
    tab.minTab = new Proxy(tab._minTab, {
        get(target, prop, reciver){
            switch(prop){
                case "position":
                    return function({x, y}){
                        reciver["posX"] = x;
                        reciver["posY"] = y;
                    }

                case "hide":
                    return function(){
                        target["isShowed"] = false
                        tab._minTab.hide()
                    }

                case "show":
                    return function(){
                        target["isShowed"] = true
                        tab._minTab.show()
                    }

                default:
                    return prop in target? target[prop] : reciver[prop] = false
            }
        },
    
        set(target, prop, val){
            switch(prop){
                case "posX":
                    tab.icon[0].style.left = val + "px"
                    target[prop] = val
                    return val

                case "posY":
                    tab.icon[0].style.top = val + "px"
                    target[prop] = val
                    return val

                default:
                    return target[prop] = val
            }
        }
    });

    //прослушивание кликов по иконкам
    $('svg').on('click', function(event){
        let bname = event.currentTarget.getAttribute("name");
        if(icon[bname]!=undefined){

            if(bname == "fandb" && !tab.textBeforeTranslation){
                return;
            }

            if(!icon[bname].pressed){
            icon[bname].active(); //активировать иконку

            switch(bname){
                case 'text-select':
                    tab.textSelectMode = true
                    selText = tab.selection.text
                    tab.writeInTextArea(selText)
                    break

                case 'voice':
                    tab.$audio.play()
                    break
                
                case 'fandb':
                    tab.Navigator.back();
                    break

                case 'translate-word':
                    tab.trSelection.show();
                    break

                case 'record':
                    tab.audioShow();
                    break

                default:
                    break

            }} else {
            
            //выключение иконки
            icon[bname].disable();

            switch(bname){
                case 'text-select':
                    tab.textSelectMode = false
                    removeTextContent()
                    tab.$textEd.off("keyup")
                    break

                case 'translate-word':
                    tab.trSelection.hide()
                    break

                case 'voice':
                    tab.$audio.cancel()
                    break

                case 'text-copy':
                    selectElementContents(tab._text[0])
                    break

                case 'fandb':
                    tab.Navigator.foward();
                    break

                    
                case 'extension-logo':
                    tab.hide()

                    if(tab.selection.text.length != 0){
                        tab.writed = tab.selection.text.normalize()
                        resetOptions();

                        tab.setDefSize()
                        tab.selection.remove()
                        updateTextStatus();
    
                        if(load_options.translate){
                            translateTextTab(load_options.language).finally(function(){
                                tab.posX = tab.minTab.posX
                                tab.posY = tab.minTab.posY
                                tab.minTab.hide()
                                tab.show()
                            });
    
                        } else {
                            tab.truncateTextArea()
                            tab.fillSpanText(tab.writed)
    
                            tab.posX = tab.minTab.posX
                            tab.posY = tab.minTab.posY
                            tab.minTab.hide()
                            tab.show()
                        }
                    } else {
                        tab.posX = tab.minTab.posX
                        tab.posY = tab.minTab.posY
                        tab.minTab.hide()
                        tab.show()
                    }

                    break

                case 'record':
                    tab.audioHide()
                    break

                default:
                     break
            }}
        }

        if(bname == 'play') {
            tab.$audio.play()
        }

        if(bname == 'pause') {
            tab.$audio.pause()
        }
    })

    //перевод страницы целиком
    function createTranslatePageLink(code){
        const pageUrl = encodeURIComponent(location.href);
        tab.translatedPageUrl = `https://translate.google.com/translate?hl=${code}&tl=${code}&sl=auto&u=${pageUrl}`;
        $("#translate-all-2jk").attr("href", tab.translatedPageUrl);
        $("#translate-all-2jk").css("cursor", "pointer");
    }

    $("#translate-all-2jk").on("click", function(event){
        if(tab.textConvertUseTranslation) window.open(tab.translatedPageUrl);
        event.originalEvent.preventDefault();
    });

    $(document).on("mousedown", function(event){
        if(!tab.icon[0].contains(event.target) && !tab._element[0].contains(event.target)){
            tab.minTab.hide();
            if(!tab.tabIsShowed) tab.hide();
            if(tab.trSelection.ctxTrMenuShowed){
                tab.trSelection.ctxTrMenuShowed = false;
                icon["translate-word"].disable();
                tab.trSelection.hide();
            }
        }
    });
    
    //иконки типа mousedown + создание векторов для перемещения и маштабирования
    $(".mdown-2jk").on("mousedown", function(event){
        if(event.originalEvent.buttons != 1){
            return void 0;
        }
        
        let attrname;
        attrname = event.currentTarget.getAttribute("name");
        
        switch(attrname){
            case "text-copy":
                icon[attrname].active()
                if(tab.textCopyMsgAnim!=undefined) clearTimeout(tab.textCopyMsgAnim)
                tab.textCopyMsgAnim = setTimeout(function(){
                    tab._textCopyMsg.css({
                        "z-index" : 1,
                        "opacity" : 0,
                        "transform" : "translate(-25%, -20px)"
                    })

                    tab.textCopyMsgAnim = setTimeout(function(){
                        tab._textCopyMsg.css("z-index", -1)
                        delete tab.textCopyMsgAnim
                    }, 1000)
                },2000)


                tab._textCopyMsg.css({
                    "z-index" : 1,
                    "opacity" : 1,
                    "transform" : "translate(-25%, -30px)"
                })

                break

            case 'down':
                if(tab.selection.text.lenth == 0){
                    tab.minTab.posX = tab.posX
                    tab.minTab.posY = tab.posY
                }

                tab.minTab.show()
                tab.hide()
                break

            case 'close':
                tab.hide()
                resetOptions();
                break

            case "download":
                icon[attrname].active()
                getOptions().then(function(options){
                    if(options["auto-text-detect"]){
                        return detectLanguage().then(function(code){
                            let voice = options["text-to-voice"].index;
                            if(code == "zh-Hans") code = "zh";
                            let voice_value = voice[code].voices[0].val;
                            return createAudioElement(voice_value);
                        }).catch(err => handleError(err))
                    } else {
                        return createAudioElement(options.voice);
                    }

                }).then(audioObj => audioObj.download())
                break

            case "extension-logo":
                icon[attrname].active()
                break

            default:
                break
        }
 
        if(event.target.id == "-topbar-2jk"){
            tab._defOrigin = point(tab.posX, tab.posY);
            tab._lastClick = point(event.clientX, event.clientY);
            $("body").css("user-select", "none");
            tab._pressed = true;
        }

        if(event.target.id == "twjk-resize-res"){
            tab._resize.defOrigin = point(tab.width, tab.height);
            tab._resize.lastClick = point(event.clientX, event.clientY);
            tab._resize.pressed = true;
        }
    })
    

    //обновление отпускния мыши на странице
    $(document).on("mouseup", function(event){
        let selText = document.getSelection().toString();
        tab.selection.text = selText

        if(!tab._element[0].contains(event.target) && tab.selection.text.length != 0 && !tab.minTab.isShowed){
            let pos = point(event.pageX, event.pageY);
            tab.minTab.position(pos);
            tab.minTab.show();
        }
        
        if(tab._pressed){
            tab._pressed = false;
            $("body").css("user-select", "auto");
        }

        if(tab._resize.pressed){
        tab._resize.pressed = tab.x_resize = tab.y_resize = false;
        tab._element.prop('style').removeProperty('cursor');
        }

        if(tab._remoteHold){
            tab._remoteHold = false;
            if(tab.$audio.isPlayBeforeRemote) tab.$audio.play();
        }
    });

    //перемотка по клику на аудио
    tab._audioRange.on("mousedown", function(event){
        if(event.originalEvent.buttons == 1){
            tab.$audio.isPlayBeforeRemote = !tab.$audioEl.paused;
            remoteAudioEvent(event.originalEvent.pageX);
        }
    });

    //логика с перемещением и маштабированием
    $(document).on("mousemove", function(event){
        if(event.originalEvent.buttons == 1 && tab._pressed){
            tab.posX = tab._defOrigin.x + (event.clientX - tab._lastClick.x);
            tab.posY = tab._defOrigin.y + (event.clientY - tab._lastClick.y);
        }

        //перемотка по зажатой кнопкой мыши
        if(event.originalEvent.buttons == 1 && tab._remoteHold){
            remoteAudioEvent(event.originalEvent.pageX);
        }

        if(tab._resize.pressed && event.originalEvent.buttons == 1){
            tab.x_resize = Boolean(event.pageX > tab.posX + tab.min_width);
            tab.y_resize = Boolean(event.pageY > tab.posY + tab.min_height);
            tab._defpos = point(tab._resize.lastClick.x - event.clientX, tab._resize.lastClick.y - event.clientY)
            tab._resize.posX = tab._resize.defOrigin.x - tab._defpos.x;
            tab._resize.posY = tab._resize.defOrigin.y - tab._defpos.y;
            if(tab.x_resize || tab.y_resize){
                if(tab.x_resize && !tab.y_resize) tab._element.css("cursor", "w-resize");
                if(tab.y_resize && !tab.x_resize) tab._element.css("cursor", "n-resize");
            } else {
                tab._element.prop('style').removeProperty('cursor');
            }

            tab.resize(tab._resize.posX + 1, tab._resize.posY + 1);
        }
    });

    //применение перевода при выборе языка в списке
    tab.trSelection.el.on("change", function(event){
        tab.trSelection.language = event.target.value;
        if(tab.trSelection.ctxTrMenuShowed)
        translateTextTab().then(()=>$("#select-lan-2jk")[0].value = "");
    })

    //обновление ползунков на аудио
    function updateProgressLine(){
        let time = Number(this.currentTime.toFixed(1));
        let duration = Number(this.duration.toFixed(1));
        tab._remoteAudioText[0].textContent = toTimeFormat(time) + ' / ' + toTimeFormat(duration);
        tab._progress.css("margin-left", 100 * (time/duration) + "%");
    }
    
    function playLoadedAudio(){
    if(!tab.$audioEl || tab.error){
        tab.showUnvaibleMessage("unvaible", "Функция временно недоступна. Попробуйте позже.");
        console.error("Не удалось воспроизвести элемент, ошибки при получении аудио файла.");
        disablePlayButtons();
        return;
    }

    // восстановленеи иконок по окончанию проигрования
    tab.$audioEl.onended = function(){
        tab.$audio.cancel();
    };

    //обновление линии прогресса воспроизведения аудио
    updateProgressLine.call(tab.$audioEl);
    tab._audio_play = setInterval(function(){
    tab.$audioEl.play();
        updateProgressLine.call(tab.$audioEl);
    }, 500);
    
    audioIcons.replOnPauseIcon();
        icon['voice'].active();
    }

    function createAudioElement(voice){
        return new Promise(function(res, rej){
            if(tab.writed.length == 0){
                rej("Попытка воспроизведения пустой строки была отменена");
                return
            }

            if(tab.lastWrited != tab.writed || tab.lastVoice != voice){
                tab.lastVoice = voice;
                tab.loadingMetaData = true;
                return convertTextToAudio(tab.writed, voice).then(function(audioURL){
                    tab.lastWrited = tab.writed;
                    tab.$audioEl = $(`<audio src="${audioURL}" type="audio/mp3"></audio>`)[0];
                    tab.audioURL = audioURL;
                    let fname = `${document.title.length == 0 ? 'unnamed_page' : document.title}_fragment`;
                    tab.downloadAudio = HTMLElement.prototype.click.bind($(`<a href="${tab.audioURL}" type="audio/mp3" download="${fname}"></a>`)[0]);

                    tab.$audioEl.onloadedmetadata = function(){
                        tab.loadingMetaData = tab.error = false;
                        res({play: playLoadedAudio, download: tab.downloadAudio})
                    }

                }).catch(function(err){
                    handleError(err);
                    disablePlayButtons();
                    tab.error = true;

                }).finally(() => tab.loadingMetaData = false)

                } else {
                    res({play: playLoadedAudio, download: tab.downloadAudio});
                }
        });
    }

    //выключение иконок аудио
    function disablePlayButtons(){
        icon['voice'].disable();
        audioIcons.reolOnPlayIcon();
    }

    //откат параметров выделения
    function resetOptions(){
        tab.textBeforeTranslation = false;
        tab.translatedPageUrl = "";
        $('#tr-info-2jk')[0].textContent = "не выбрано";
        $("#translate-all-2jk")[0].removeAttribute("href");
        $("#translate-all-2jk").css("cursor", "not-allowed");
        tab.textConvertUseTranslation = false;

        if(tab.textSelectMode){
            icon["text-select"].disable()
            tab.textSelectMode = false
            removeTextContent()
        }

        if(tab.Navigator.active){
            tab.Navigator.foward()
            icon["fandb"].disable()
        }
    }

    //hide manual selection
    tab.manualVoiceSelect.$button.add(tab.manualVoiceSelect.$backg).on("click", function(e){
        if(e.target.id == "backg-man-ch-2jk" || e.target.id == "man-v-detect-canc-2jk"){
            tab.manualVoiceSelect.hide();
        }
    });

    //send new options
    $("#remcheck-lan-2jk").on("change", function(e){
        sendMessage("options-update", {auto_translate: e.target.checked});
        load_options.translate = e.target.checked;
    });

    async function translate(_text, _lan){
        try{
            const options = {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'X-RapidAPI-Key': '69dd12d74fmsh12e8f10629bf56cp107d43jsn4c52b954a1fd'
                },
                body: JSON.stringify([{Text: _text}])
            };
    
            const response = await fetch(`https://microsoft-translator-text.p.rapidapi.com/translate?api-version=3.0&to%5B0%5D=${_lan}&textType=plain&profanityAction=NoAction`, options)
            const json = await response.json();
    
            if(json.error != undefined){
                const error = new Error(json.error.message);
                error.name = "Не удалось перевести текст";
                error.code = json.error.code;
                throw error;
            }
    
            const translated = json[0].translations[0];
            return translated;
    
        } catch (err){
            throw err;
        }
    }
    
    //перевод текста
    function translateTextTab(lan){
    
        if(tab.translationProcessing)
        return
    
        tab.translationProcessing = true;
        const text = tab.writed;
    
        if(lan == undefined)
        lan = tab.trSelection.language;
    
        if(lan == '') return;
    
        return translate(text, lan).then(function(result){
            const selText = result.text;

            if(tab.Navigator.active){
                icon["fandb"].disable();
                tab.Navigator.foward();
            }
    
            if(!tab.textConvertUseTranslation)
            tab.textBeforeTranslation = tab.writed;
            
            if(result.to == "zh-Hans") result.to = "zh";

            tab.translatedToLan = result.to;
            tab.textConvertUseTranslation = true;
            createTranslatePageLink(result.to);
    
            tab.writed = selText;

            if(tab.textSelectMode) tab.$textEd[0].textContent = selText;
            else {
                tab.truncateTextArea();
                tab.fillSpanText(selText);
            }

            $('#tr-info-2jk')[0].textContent = load_options["text-to-voice"].index[result.to].language;

        }).catch(err => handleError(err))
        .finally(() => tab.translationProcessing = false);
    }

    function detectLanguage(){
        return new Promise(function(resolve, reject){
            const url = 'https://microsoft-translator-text.p.rapidapi.com/Detect?api-version=3.0';
            const _body = [{text: tab.writed}], options = {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'X-RapidAPI-Key': '69dd12d74fmsh12e8f10629bf56cp107d43jsn4c52b954a1fd'
                },
                body: JSON.stringify(_body)
            };
            
            let resLimit = setTimeout(function(){
                const error = new Error("Время ожидания ответа превышено. Запрос остановлен.");
                error.code = 408;
                error.name = "Response time out";
                reject(error);
            }, 5000);
            
            fetch(url, options).then(function(response){
                clearInterval(resLimit);
                return response.json();

            }).then(function(json){
                if(json.error != undefined){
                    const error = new Error(json.error.message);
                    error.name = "Не удалось перевести текст";
                    error.code = json.error.code;
                    reject(error);
                }

                resolve(json[0].language);
            }).catch(err => {throw err});
        });
    }
    
    // async function detectLanguage(){
    //     try{
    //         const _body = [{text: tab.writed}];
    //         const options = {
    //             method: 'POST',
    //             headers: {
    //                 'content-type': 'application/json',
    //                 'X-RapidAPI-Key': '69dd12d74fmsh12e8f10629bf56cp107d43jsn4c52b954a1fd'
    //             },
    //             body: JSON.stringify(_body)
    //         };
            
    //         const response = await fetch('https://microsoft-translator-text.p.rapidapi.com/Detect?api-version=3.0', options)
    //         const json = await response.json();
    
    //         if(json.error != undefined){
    //             const error = new Error(json.error.message);
    //             error.name = "Не удалось перевести текст";
    //             error.code = json.error.code;
    //             throw error;
    //         }
    
    //         return json[0].language;
    
    //     }catch(err){
    //         throw err;
    //     }
    // }

    // async function convertTextToAudio(text, voice){
    //     try{
    //         let audio, blob, url = "http://api.ispeech.org/api/rest?apikey=ispeech-listenbutton-betauserkey&action=convert&text="+encodeURIComponent(text)+"&voice="+voice+"&format=mp3&filename=audiofile";
    //         audio = await fetch(url);
    //         if(!audio.ok){
    //             const error = new Error("Преобразование текста в аудио-формат не удалось, сервер вернул некорректный статус");
    //             error.name = "Не удалось выполнить запрос";
    //             error.code = audio.status;
    //             throw error;
    //         }

    //         blob = await audio.blob();
    //         clearTimeout(resLimit);
    //         const urlBlob = URL.createObjectURL(blob);
    //         return urlBlob;
    
    //     }catch(err){
    //         throw err;
    //     }
    // }


    function convertTextToAudio(text, voice){
        return new Promise(function(resolve, reject){
            let url = "http://api.ispeech.org/api/rest?apikey=ispeech-listenbutton-betauserkey&action=convert&text="+encodeURIComponent(text)+"&voice="+voice+"&format=mp3&filename=audiofile";
            let resLimit = setTimeout(function(){
                const error = new Error("Время ожидания ответа превышено. Запрос остановлен.");
                error.code = 408;
                error.name = "Response time out";
                reject(error);
            }, 5000);
            
            fetch(url).then(function(response){
                if(!response.ok){
                    const error = new Error("Преобразование текста в аудио-формат не удалось, сервер вернул некорректный статус");
                    error.name = "Не удалось выполнить запрос";
                    error.code = audio.status;
                    throw error;
                }

                clearInterval(resLimit);
                return response.blob();

            }).then(function(blob){
                const urlBlob = URL.createObjectURL(blob);
                resolve(urlBlob);
            }).catch(err => {throw err});
        });
    }

    //обработка ошибок
    function handleError(err){
        if(err.code != undefined){
            if(err.code == 403000){
                tab.showUnvaibleMessage("unvaible", "Тариф Microsoft Translate Api израсходован. Дождитесь следующего месяца.");
                console.error("Количество запросов для тарифа Microsoft Translate Api исрасходовано. Перевод недоступен. " + err.message);  
            }
            else if(err.code == 408){
                tab.showUnvaibleMessage("unvaible", err.message); 
                console.error(err.message);
            }
            else if(err.code == 404){
                tab.showUnvaibleMessage("no-voice", err.message);
                console.error(err.message);
            }
            else {
                tab.showUnvaibleMessage("unvaible", "Функция временно недоступна. Попробуйте позже.");
                console.error("Asonic. текст ошибки: " + err.message);
            }

        }
        else if (err.message == "Decoding failed.") {
            tab.showUnvaibleMessage("error", "Не удалось распознать текст. Попробуйте выделить небольшую часть.");
            console.error("Asonic. текст ошибки: " + err.message);
        }
        else {
            tab.showUnvaibleMessage("no-internet", "Ошибка подключения. Проверьте соединение с интернетом");
            console.error("Asonic. текст ошибки: " + err.message);
        }

        disablePlayButtons();
    }
};

function point(x = 0, y = 0){
    return {x, y}
}

//установка по умочанию "Не выбрано" для перевода
function preloadOptions(){
    tab.trSelection.el[0].selectedIndex = 0;
}

//получение настроек
async function getOptions(){
    const response = await sendMessage("get-options", null);
    return response;
}

//перемотка
function remoteAudioEvent(pageX){
    tab._remoteHold = true;
    let rangleWidth = tab._audioRange.width();
    let remoteX = pageX - tab._audioRange.offset().left;
    let pToDur = remoteX/rangleWidth;
    tab.$audio.remoteTo(pToDur * tab.$audioEl.duration);
    tab.$audio.pause();
}

function updateTextStatus(){
    let words = {};
    ["writed", "lastWrited"].forEach(inf=>{
        words[inf] = tab[inf].split(" ")[0];
    });

    if(words.writed != words.lastWrited)
    tab.textConvertUseTranslation = false;
}

function removeTextContent(){
    textContent = tab.$textEd[0].textContent;
    tab.fillSpanText(textContent);
    tab.$textEd.remove();
}

function textSelectUpdateText(){
    tab.writed = tab.$textEd[0].textContent;
    updateTextStatus();
}

function toTimeFormat(sec = 0){
    let csec = Math.floor(sec);
    let mins = Math.floor(csec/60);
    return `${mins}:${csec%60}`
}

//обновление данных
function sendMessage(type, body){
    return browser.runtime.sendMessage("Asonic.Wildcat2k21@gmail.com", {
      type, body
    });
}

//громкость из popup
browser.runtime.onMessage.addListener(request => {
    if(request.type == "2jk-preload" && tab.$audioEl != false)
    tab.$audioEl.volume = request.volume;
});

//инициализация параметров
function NewTab(x = 0, y = 0, w = Tab.defWidth, h = Tab.defHeight){
    const _tab = new TabModify();
    _tab.position(point(x, y));
    _tab.resize(w, h);
    return _tab;
}

//выделение текста на элементе
function selectElementContents(el) {
    var range = document.createRange();
    range.selectNodeContents(el);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
	document.execCommand('copy');
}