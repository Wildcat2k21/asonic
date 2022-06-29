let $svg = document.querySelector('#settings');
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
      browser.runtime.openOptionsPage();
      window.close();
      break

  }
}