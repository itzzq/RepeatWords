//全局使用变量
var gui = require('nw.gui');
var win = gui.Window.get();
var fs = require("fs");
var clipboard = gui.Clipboard.get();
var edit;
var fileEntry;
var hasWriteAccess;
var editSizeFix = 0;
var db = openDatabase('repeatest','1.0','used for test',5*1024*1024);
var async = require('async');

// 数据变量
var uid = 0;
var thispid = 0;
var tabledata = new Array;
var tableplans = new Array;
var tableuser = new Array;
var forgettimesdata = new Array;
var onactionplan = 0;                // 是否开始记单词（执行计划）
var onshowmyplan = 0;                // 查询计划只执行一次
var onshowmyaccount = 0;             // 查询账户只执行一次
var wordno = 0;                      // 单词序号（一次计划内）

// *****************************************************
// 显示用户的账户
// *****************************************************
// 数据库查询用户账户
function showmyaccount() {
  db.transaction(function(tx){
    tx.executeSql(
      'select name,email from user where uid = ?',
      [uid],
      function(tx, result) {
        tableuser.push(result.rows.item(0));
        showmyaccountcontent(tableuser);
      },
      function(tx, err){
        console.log('select userdata from user failed.' + err.message);
      });
  });
}

// 显示用户的账户信息
function showmyaccountcontent(tableuser) {
  $("<h3><i class='icon-user'></i>我的账户</h3>").appendTo("#accounttitle");
  $("#username").text(tableuser[0].name);
  $("#useremail").text(tableuser[0].email);
  $('#myaccount').show();
  onshowmyaccount=1;
}

// *****************************************************
// 显示用户的计划
// *****************************************************
// 数据库查询用户计划
function showmyplan() {
  db.transaction(function(tx){
    tx.executeSql(
      'select * from plan',
      [],
      function(tx, result) {
        for (var i=0;i<result.rows.length;i++){
          tableplans.push(result.rows.item(i));
        }
        showmyplancontent(tableplans);
      },
      function(tx, err){
        console.log('select user plan from plan failed.' + err.message);
      });
  });
}

// 显示该用户的计划
function showmyplancontent(tableplans){
  $("<h3><i class='icon-clipboard-2'></i>我的计划</h3>").appendTo("#myplantitle");
  $("<div id='myplancontent'></div>").appendTo("#myplan");
  $("#myplancontent").append('<table id="plantable" class="striped"></table>').tablecontrol({
    cls: 'table hovered border mytable',
    colModel: [
      {field: 'id', caption: '序号',width: '', sortable: true, cls:'text-center', hcls: ""},
      {field: 'executetime', caption: '执行时间',width: '', sortable: false, cls:'text-center', hcls: ""},
      {field: 'reviewtimes', caption: '复习次数',width: '', sortable: false, cls:'text-center', hcls: ""}
    ],

    data: tableplans
  }).tablePagination({});;
  // 绑定表格分页
  $('#myplan').show();
  onshowmyplan = 1;
}

// *****************************************************
// 计划实行
// *****************************************************
function actionplan(){
  onactionplan = 1;
  $("#aboutplan").hide();
  $("#actionplan").show();

  $("#wordtitle").text(tabledata[wordno].word);

  // 记得
  $("#remember").click(function(){
    $("#wordmeaning").text(tabledata[wordno].meaning);
    $("#rorf").hide();
    // 记对了还是错了
    $("#recon").show();
  });
  // 忘记了
  $("#forget").click(function(){
    $("#wordmeaning").text(tabledata[wordno].meaning);
    $("#rorf").hide();
    // 记住了
    $("#rem").show();
  });
  $("#rec").click(recclick);      // 记对了的操作  
  $("#inrec").click(remclick);    // 记错了的操作
  $("#rem").click(remclick);      // 记住了的操作

}

function recclick(){
  wordno++;
  updateactionplan(wordno);
}

function remclick(){
  forgetfun(wordno);
  wordno++; 
  updateactionplan(wordno);
}

// 更新每个单词片
function updateactionplan(i){
  if(i<tabledata.length){
    $("#wordmeaning").text("");
    $("#wordtitle").text(tabledata[i].word);
    $("#rorf").show();
    $("#recon").hide(); 
    $("#rem").hide(); 

  } else {
    // 推迟本次计划的复习时间
    async.series([
      function(next){
        // 初始化
        $("#wordmeaning").text("");
        $("#rorf").show();
        $("#recon").hide(); 
        $("#rem").hide();
        $("#rec").unbind("click",recclick);
        $("#inrec").unbind("click",remclick);
        $("#rem").unbind("click",remclick);
        console.log("actionplan finish.");
        onactionplan = 0;
        wordno = 0;
        tabledata = new Array;
        forgettimesdata = new Array;
        $("#actionplan").hide();
        $("#clockdrop").remove();
        $("#plancontent").remove();
        $("#tablePagination").remove();
        next();
      },function(next){
        // 设置本次计划的复习时间
        updatereview(next);
      },function(next){
        // 重新得到最近一次计划
        shownearplan();
        $("#aboutplan").show();
      }], function(err, values) {
        console.log('async end : '+ values);
    });
  }

}

// 更新复习次数
function updatereview(callback){
  var planday = new Date();
  var newplanday = new Date();
  var thisreviewtimes;
  var YMDHM;
  console.log("this time execute plan id is "+thispid);
  db.transaction(function(fx){
    fx.executeSql(
      'select reviewtimes from plan where id = ?',
      [thispid],
      function(fx, result){
        thisreviewtimes = result.rows.item(0).reviewtimes;
        // 按照记忆曲线设置复习时间
        switch(thisreviewtimes)
        {
          case 0:
            newplanday.setMinutes(planday.getMinutes()+30);
            break;
          case 1:
            newplanday.setHours(planday.getHours()+2);
            break;
          case 2:
            newplanday.setDate(planday.getDate()+1);
            break;
          case 3:
            newplanday.setDate(planday.getDate()+4);
            break;
          case 4:
            newplanday.setDate(planday.getDate()+7);
            break;
          case 5:
            newplanday.setDate(planday.getDate()+15);
            break;
          case 6:
            newplanday.setDate(planday.getDate()+30);
            break;
          case 7:
            break;
        }
        YMDHM = newplanday.getFullYear() + "-" +(newplanday.getMonth()+1) + "-" + newplanday.getDate() + " " + newplanday.getHours() + ":" + (newplanday.getMinutes());
        fx.executeSql(
          'update plan set reviewtimes = ?, executetime = ? where id = ?',
          [thisreviewtimes+1, YMDHM, thispid],
          function(fx, result){
            console.log("update plan set reviewtimes and executetime success.");
            callback();
          },
          function(fx, err){
            console.log("update plan set reviewtimes and executetime failed.");
          });
      },
      function(fx, err){
        console.log("select reviewtimes from plan failed.");
      });
  });
}

// 忘记单词的操作
function forgetfun(i){
  // 把忘记的单词放到当前计划的最后
  tabledata.push(tabledata[i]);
  forgettimesdata[i]++;
  db.transaction(function(fx){
    fx.executeSql(
      'update wordcard set forgettimes = ? where word = ?',
      [forgettimesdata[i], tabledata[i].word],
      function(fx, result){
        console.log("update wordcard set forgettimes success.");
      },
      function(fx, err){
        console.log("update wordcard set forgettimes failed.");
      });
  });
}


// *****************************************************
// 显示最近一个要执行的计划
// *****************************************************
function shownearplan(){
    console.log("shownearplan.");
    db.transaction(function(tx){
        var planday = new Date();
        var YMDHM = planday.getFullYear() + "-" +(planday.getMonth()+1) + "-" + planday.getDate() + " " + planday.getHours() + ":" + (planday.getMinutes());
        // 查找最近一个计划
        tx.executeSql(
            'select id, executetime from plan where executetime > ? and reviewtimes < 8 order by executetime limit 1',
            [YMDHM],
            function(tx, result){
                showlefttime(result.rows.item(0).executetime);
                selectwords(result.rows.item(0).id);
                
            },
            function(tx, err){console.log('select for next plan failed.' + err.message);}
            );

        // 查找该计划中的单词
        function selectwords(pid){
          thispid = pid;
          console.log("this time execute plan id is "+thispid);
          tx.executeSql(
            'select word, pronunciation, meaning, forgettimes from wordcard where planid = ?',
            [pid],
            function(tx, result){
                for (var i=0;i<result.rows.length;i++){
                    tabledata.push(result.rows.item(i));
                    forgettimesdata.push(result.rows.item(i).forgettimes);
                }
                showwords(tabledata);
            },
            function(tx, err){console.log('select for plans words failed.' + err.message);}
            );
        }
    });
}

// 显示该计划的单词内容
function showwords(tabledata){
    $("<div id='plancontent'></div>").appendTo("#aboutplan");
    $("#plancontent").append('<table id="wordtable" class="striped"></table>').tablecontrol({
        cls: 'table hovered border mytable',
        colModel: [
            {field: 'word', caption: '单词',width: '', sortable: false, cls:'text-center', hcls: ""},
            {field: 'pronunciation', caption: '音标',width: '', sortable: false, cls:'text-center', hcls: ""},
            {field: 'meaning', caption: '翻译',width: '', sortable: false, cls:'text-center', hcls: ""}
        ],

        data: tabledata
    }).tablePagination({});;
    // 绑定表格分页
}

// 显示倒计时
function showlefttime(lefttime){
    var stoptime = (new Date(lefttime)).getTime();
    $("#checkin").hide();
    $("#plantitle").show();
    $("<div id='clockdrop'></div>").appendTo("#myclock");
    $("#clockdrop").countdown({
        style:{
            background: "bg-lightBlue",
            foreground: "fg-white",
            divider: "fg-dark"
        },
        blink: true,
        days: 1,
        stoptimer: stoptime,
        onstop: function(){
            actionplan();
        }
    }).addClass("countdown");
    console.log(lefttime); 
}

// *****************************************************
// 编辑计划
// *****************************************************
function handleNewButton() {
  newFile();
  editor.setValue("");
}

function handleOpenButton() {
  $('#openFile').trigger("click");
}

function handleSaveButton() {
  if (fileEntry && hasWriteAccess) {
    writeEditorToFile(fileEntry);
  } else {
    $('#saveFile').trigger("click");
  }
}

function newFile() {
  fileEntry = null;
  hasWriteAccess = false;
}

function setFile(theFileEntry, isWritable) {
  fileEntry = theFileEntry;
  hasWriteAccess = isWritable;
}

function readFileIntoEditor(theFileEntry) {
  fs.readFile(theFileEntry, function (err, data) {
    if (err) {
      console.log("Read failed: " + err);
    }
    editor.setValue(String(data));
  });
}

function writeEditorToFile(theFileEntry) {
  fs.writeFile(theFileEntry, editor.getValue(), function (err) {
    if (err) {
      console.log("Write failed: " + err);
      return;
    }
    console.log("Write completed.");
  });
}

var onChosenFileToOpen = function(theFileEntry) {
  setFile(theFileEntry, false);
  readFileIntoEditor(theFileEntry);
};

var onChosenFileToSave = function(theFileEntry) {
  setFile(theFileEntry, true);
  writeEditorToFile(theFileEntry);
};

function editSizeFixer() {
  var container = document.getElementById('editor');
  var containerWidth = container.offsetWidth;
  var containerHeight = container.offsetHeight;

  var scrollerElement = editor.getScrollerElement();
  scrollerElement.style.width = containerWidth + 'px';
  scrollerElement.style.height = containerHeight + 'px';

  editor.refresh();
}

// *****************************************************
// 窗口菜单栏事件
// *****************************************************
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

// console.log("updateContentStyle!");
}

// *****************************************************
// 右键菜单
// *****************************************************
function initContextMenu() {
  menu = new gui.Menu();
  menu.append(new gui.MenuItem({
    label: 'Copy',
    icon: 'imgs/copy.png',
    click: function() {
      clipboard.set(editor.getSelection());
    }
  }));
  menu.append(new gui.MenuItem({
    label: 'Cut',
    icon: 'imgs/cut.png',
    click: function() {
      clipboard.set(editor.getSelection());
      editor.replaceSelection('');
    }
  }));
  menu.append(new gui.MenuItem({
    label: 'Paste',
    icon: 'imgs/paste.png',
    click: function() {
      editor.replaceSelection(clipboard.get());
    }
  }));

  document.getElementById("editor").addEventListener('contextmenu',
    function(ev) { 
      ev.preventDefault();
      menu.popup(ev.x, ev.y);
      return false;
    });
}

// *****************************************************
// 网页重定向
// *****************************************************
function loginpage() {
  console.log("render to login page!");
  $('#maincontent').load('views/login.html#login');
  $.getScript("control/logincontr.js");
}

function registerpage() {
  console.log("render to register page!");
  $('#maincontent').load('views/register.html#register');
  $.getScript("control/registercontr.js");
}

function dashboardpage() {
  console.log("render to dashboard page!");
  $('#maincontent').remove();
  $('#maincontent_2').load('views/dashboard.html#dashboard');
  $.getScript("control/dashboardcontr.js");
}

// *****************************************************
// Native UI control
// *****************************************************
onfocus = function() { 
// console.log("focus");
focusTitlebars(true);
}

onblur = function() { 
// console.log("blur");
focusTitlebars(false);
}

onload = function() {
  console.log("onload");

  focusTitlebars(true);
  updateContentStyle();
  $.getScript("control/titlebarcontr.js");

  loginpage();
// dashboardpage();

if(editSizeFix == 1){
  editSizeFixer();
}
}

onresize = function() {
  updateContentStyle();

  if(editSizeFix == 1){
    editSizeFixer();
  }
}