//我的窗口UI设计

function updateImageUrl(image_id, new_image_url) {
  var image = document.getElementById(image_id);
  if (image)
    image.src = new_image_url;
}

function createImage(image_id, image_url) {
  var image = document.createElement("img");
  image.setAttribute("id", image_id);
  image.src = image_url;
  return image;
}

function createButton(button_id, button_name, normal_image_url,
                       hover_image_url, click_func) {
  var button = document.createElement("div");
  button.setAttribute("class", button_name);
  var button_img = createImage(button_id, normal_image_url);
  button.appendChild(button_img);
  button.onmouseover = function() {
    updateImageUrl(button_id, hover_image_url);
  }
  button.onmouseout = function() {
    updateImageUrl(button_id, normal_image_url);
  }
  button.onclick = click_func;
  return button;
}


function focusTitlebars(focus) {
  var bg_color = focus ? "#3a3d3d" : "#7a7c7c";
    
  var titlebar = document.getElementById("top-titlebar");
  if (titlebar)
    titlebar.style.backgroundColor = bg_color;
}

function updateContentStyle() {
  var content = document.getElementById("content");
  if (!content)
    return;

  var left = 0;
  var top = 0;
  var width = window.outerWidth;
  var height = window.outerHeight;

  var titlebar = document.getElementById("top-titlebar");
  if (titlebar) {
    height -= titlebar.offsetHeight;
    top += titlebar.offsetHeight;
  }

  var contentStyle = "position: absolute; ";
  contentStyle += "left: " + left + "px; ";
  contentStyle += "top: " + top + "px; ";
  contentStyle += "width: " + width + "px; ";
  contentStyle += "height: " + height + "px; ";
  content.setAttribute("style", contentStyle);
}

function addTitlebar(titlebar_name, titlebar_icon_url, titlebar_text) {
  var titlebar = document.createElement("div");
  titlebar.setAttribute("id", titlebar_name);
  titlebar.setAttribute("class", titlebar_name);

  var icon = document.createElement("div");
  icon.setAttribute("class", titlebar_name + "-icon");
  icon.appendChild(createImage(titlebar_name + "icon", titlebar_icon_url));
  titlebar.appendChild(icon);

  var title = document.createElement("div");
  title.setAttribute("class", titlebar_name + "-text");
  title.innerText = titlebar_text;
  titlebar.appendChild(title);

  var closeButton = createButton(titlebar_name + "-close-button",
                                 titlebar_name + "-close-button",
                                 "imgs/button_close.png",
                                 "imgs/button_close_hover.png",
                                 closeWindow);
  titlebar.appendChild(closeButton);

  var divider = document.createElement("div");
  divider.setAttribute("class", titlebar_name + "-divider");
  titlebar.appendChild(divider);
  
  document.body.appendChild(titlebar);
}

function addMenu(gui) {
  console.log("addMenu");
    var newMenu = new gui.Menu()
      , cut = new gui.MenuItem({
        label: "Cut"
        , click: function() {
          document.execCommand("cut");
          console.log('Menu:', 'cutted to clipboard');
        }
      })
 
      , copy = new gui.MenuItem({
        label: "Copy"
        , click: function() {
          document.execCommand("copy");
          console.log('Menu:', 'copied to clipboard');
        }
      })
 
      , paste = new gui.MenuItem({
        label: "Paste"
        , click: function() {
          document.execCommand("paste");
          console.log('Menu:', 'pasted to textarea');
        }
      })
    ;
  newMenu.append(cut);
  newMenu.append(copy);
  newMenu.append(paste);
  document.getElementById('content').addEventListener('contextmenu', function(ev) { 
  ev.preventDefault();
  newMenu.popup(ev.x, ev.y);
  return false;
  });
}

function loginpage() {
  console.log("render to login page!");
  $('#maincontent').load('views/login.html#login');
}

//Native UI control

function closeWindow() {
  window.close();
}

window.onfocus = function() { 
  // console.log("focus");
  focusTitlebars(true);
}

window.onblur = function() { 
  // console.log("blur");
  focusTitlebars(false);
}

window.onresize = function() {
  updateContentStyle();
}

window.onload = function() {
  //console.log("onload");
  addTitlebar("top-titlebar", "imgs/top-titlebar.png", "记单词");
  
  focusTitlebars(true);
  updateContentStyle();
  var gui = require('nw.gui');
  gui.Window.get().show();
  addMenu(gui);

  loginpage();
}
