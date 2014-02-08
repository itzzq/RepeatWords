//屏幕调整
var wx = win.x - 100;
var wy = win.y - 120;
win.resizeTo(1000, 700);
win.moveTo(wx, wy);
setTimeout(function(){
	updateContentStyle();
},200);

checkfirstin();

// navigation
var dashboardpage = $('#dashboardpage'),
accountpage = $('#accountpage'),
myplanpage = $('#myplanpage'),
addplanpage = $('#addplanpage'),
deleteplanpage = $('#deleteplanpage');

// first checkin content
var actiondefaultbtn = $('#actiondefault'),
editmyselfbtn = $('#editmyself');

// editpad
var newbtn = $('#new'),
openbtn = $('#open'),
savebtn = $('#save'),
transferbtn = $('#transfer');

// account
var updatepwdbtn = $('#updatepwd');

updatepwdbtn.click(function(e){
    console.log("updatepwd click!");
    var password0 = $("input[name='password0']").val();
    var newpassword = $("input[name='newpassword']").val();
    var cpassword = $("input[name='cpassword']").val();

    if (password0 == "" || newpassword == "" || cpassword == "") {
        setTimeout(function(){
            $.Notify({
                content: "密码不能为空！",
                position: "top-right",
                shadow: true,
                style:{background:'#2e92cf'}
            });
        }, 1000);
        return;
    } else if(newpassword != cpassword) {
        setTimeout(function(){
            $.Notify({
                content: "两次密码不一致！",
                position: "top-right",
                shadow: true,
                style:{background:'#2e92cf'}
            });
        }, 1000);
        return;
    } else {
        db.transaction(function(tx){
        tx.executeSql(
            "select name FROM user WHERE uid = ? and password=?",
            [uid, password0],
            function(tx, result){
                if(result.rows.length>0){
                    console.log("comfirm password0 success.");
                    tx.executeSql(
                        "update user set password=? where uid = ?",
                        [newpassword, uid],
                        function(tx, result){
                            console.log("update password success.");
                            setTimeout(function(){
                                $.Notify({
                                    content: "修改密码成功！",
                                    position: "top-right",
                                    shadow: true,
                                    style:{background:'#2e92cf'}
                                });
                            }, 1000);
                        },
                        function(tx, err){
                            console.log("update password failed!");
                        });
                } else {
                    setTimeout(function(){
                        $.Notify({
                            content: "原始密码错误！",
                            position: "top-right",
                            shadow: true,
                            style:{background:'#2e92cf'}
                        });
                    }, 1000);
                    return;
                }
            },
            function(tx, err){
                console.log("select password from user failed.");
            });
        });
    }   
});

editor = CodeMirror(
    document.getElementById("editor"),
    {
    mode: {name: "javascript", json: false },
    lineNumbers: true,
    theme: "solarized light",
    extraKeys: {
        "Cmd-S": function(instance) { handleSaveButton() },
        "Ctrl-S": function(instance) { handleSaveButton() },
    }
});

// navigation event
dashboardpage.click(function(e){
    e.preventDefault();
    e.stopPropagation();
    $('#editpad').hide();
    $('#myplan').hide();
    $('#myaccount').hide();
    if(onactionplan == 0){
        $('#aboutplan').show();
    }else {
        $('#actionplan').show();
    }
});

accountpage.click(function(e){
    e.preventDefault();
    e.stopPropagation();
    $('#editpad').hide();
    $('#myplan').hide();
    if(onactionplan == 0){
        $('#aboutplan').hide();
    }else {
        $('#actionplan').hide();
    }
    $('#myplan').hide();
    if(onshowmyaccount == 0){
        showmyaccount();
    } else {
        $('#myaccount').show();
    }
});

myplanpage.click(function(e){
    e.preventDefault();
    e.stopPropagation();
    $('#editpad').hide();

    if(onactionplan == 0){
        $('#aboutplan').hide();
    }else {
        $('#actionplan').hide();
    }
    $('#myaccount').hide();
    if(onshowmyplan == 0){
        showmyplan();
    } else {
        $('#myplan').show();
    }

});

addplanpage.click(function(e){
    e.preventDefault();
    e.stopPropagation();
    $('#myplan').hide();
    $('#myaccount').hide();
    if(onactionplan == 0){
        $('#aboutplan').hide();
    }else {
        $('#actionplan').hide();
    }
    $('#editpad').show();
});

// content event
actiondefaultbtn.click(function(){
    console.log("actiondefault click!");

    async.series([
    function(next){
        // 修改用户不是初次登录
        db.transaction(function(fx){
            fx.executeSql(
                'update user set checkin = "false" where uid = ?',
                [uid],
                function(fx, result){
                    console.log("update user set checkin success.");
                    next();
                },
                function(fx, err){console.log("update user set checkin failed.");} 
                );
        });
    },function(next){
        // loading提示框
        $.Dialog({
            overlay: true,
            shadow: true,
            flat: true,
            icon: '<img src="imgs/top-titlebar.png">',
            title: '记单词',
            content: '<div><img src="imgs/loading.gif" style="margin: 10px 70px;width: 60px;"></img></div>',
            onShow: function(_dialog){
                $(".window .content").append('<div id="loadstatue"><p>正在读取单词文件......</p></div>');
            }
        });

        next();
    }, function(next){
        // 创建wordcard表
        db.transaction(function(tx){
            tx.executeSql(
                'create table if not exists wordcard (id Integer Primary Key, word Text, pronunciation text, meaning text, planid Integer,forgettimes Integer)',
                [], 
                function(tx,result){ 
                    $('#loadstatue').text("正在读取词库......");
                    console.log('create table wordcard success.'); 
                    next();
                }, 
                function(tx, error){ console.log('create table wordcard failed:' + error.message);}
                );
        }); 

        
    }, function(next){
        // 复杂转换
        // 读取默认单词库
        var filedata = fs.readFileSync("control/samp.txt", "utf8");
        var pieces=filedata.split("\n");
        var planid=1;
        var j=1;

        for(var i=0;i<pieces.length;i+=4){

            //闭包解决js异步调用函数为顺序执行
            (function(i,planid){
                // 配合原始数据格式，去除前三个无用字符
                var word=pieces[i].substring(3);
                var pronunciation=pieces[i+1].substring(3);
                var meaning=pieces[i+2].substring(3);
                db.transaction(function(tx){
                    tx.executeSql(
                        'insert into wordcard(id, word, pronunciation, meaning, planid, forgettimes) values(?, ?, ?, ?, ?, ?)',
                        [null, word, pronunciation, meaning, planid, 0],
                        function(tx,result){}, 
                        function(tx, error){ console.log('insert into wordcard failed:' + error.message);}
                        );
                });
            })(i,planid);

            // 设置一组计划的单词数目
            if(j%20==0){
                planid++;
            }
            j++;
        }   
        $('#loadstatue').text("完成生成词库......");
        console.log("insert into wordcard finish!");
        next();
    }, function(next) {
        // 生成新的计划表
        db.transaction(function(tx){
            tx.executeSql(
                'create table if not exists plan(id Integer Primary Key, executetime datetime, reviewtimes Integer)',
                [],
                function(tx, result){ 
                    $('#loadstatue').text("正在新建计划......");
                    console.log('create table plan success.'); 
                    next();
                }, 
                function(tx, error){ console.log('create table plan failed:' + error.message);}
                );
        });
    }, function(next) {
        var planday = new Date();
        var YMDHM = planday.getFullYear() + "-" +(planday.getMonth()+1) + "-" + planday.getDate() + " " + planday.getHours() + ":" + (planday.getMinutes()+2);
        // 初始化计划表数据
        db.transaction(function(tx){
            tx.executeSql(
                'select distinct planid from wordcard',
                [],
                function(tx, result){
                    console.log("select planid from wordcard success.");
                    selectpid(result, function(){
                        $('#loadstatue').text("计划建立成功……");
                        setTimeout(function(){      
                            next();
                        },1000);
                        
                    });

                },
                function(tx, err){ console.log('select planid from wordcard failed:' + error.message);}
                );

            function selectpid(result, callback){
                for(var i=0;i<result.rows.length;i++){
                    YMDHM = planday.getFullYear() + "-" +(planday.getMonth()+1) + "-" + (planday.getDate()+i) + " " + planday.getHours() + ":" + (planday.getMinutes()+1);
                    createplan(result.rows.item(i).planid, YMDHM);
                }
                callback();
            }

            function createplan(pid, executetime){
                tx.executeSql(
                    'insert into plan(id, executetime, reviewtimes) values(?,?,?)',
                    [pid, executetime, 0],
                    function(tx, result){console.log('insert into table plan success.'); },
                    function(tx, err){console.log('insert into table plan failed.' + err.message);}
                    );
            }
        });
    }, function(next) {
        $(".metro.window-overlay").remove();
        shownearplan();
    }], function(err, values) {
        console.log('async end : '+ values);
    });
});

editmyselfbtn.click(function(){
	editSizeFix = 1;
	$('#checkin').hide();
	$('#editpad').show();
	initContextMenu();
	editor.refresh();
	updateContentStyle();
});


// editpad event
newbtn.click(function(){
	$.Dialog({
		overlay: true,
        shadow: true,
        flat: true,
        icon: '<img src="imgs/top-titlebar.png">',
        title: '记单词',
        content: '<div style="width:180px; height:80px; padding:5px;">是否确定要新建计划？</div>',
        onShow: function(_dialog){
            $('.window .content').append('<div class="dialogSelect" style="width:200px;"></div>');
            var dialogSelect = $('.dialogSelect');
            dialogSelect.append('<button id="selectyes" class="default" style="padding:0px 25px;margin:0px 8px 0px 10px;">确定</button>');
            dialogSelect.append('<button id="selectno" class="default" style="padding:0px 25px;margin:0px 10px 0px 8px;">取消</button>');
            var selectyes = $('#selectyes');
            var selectno = $('#selectno');
            selectyes.click(function(){
            	handleNewButton();
            	$.Dialog.close();
            });
            selectno.click($.Dialog.close);
        }
	});
});

openbtn.click(handleOpenButton);

savebtn.click(handleSaveButton);

$("#saveFile").change(function(evt) {
	onChosenFileToSave($(this).val());
});
$("#openFile").change(function(evt) {
	onChosenFileToOpen($(this).val());
});

// 查询是否首次登录
function checkfirstin(){
    db.transaction(function(tx){
        tx.executeSql(
            'select checkin from user where uid = ?',
            [uid],
            function(tx, result) {
                if(result.rows.item(0).checkin=='true'){
                    $('#checkin').show();
                } else if(result.rows.item(0).checkin=='false'){
                    shownearplan();
                } else {
                    console.log("select checkin from user data crash.");
                }
            },
            function(tx, err){
                console.log('select checkin from user failed.' + err.message);
            });
    });
}

win.show();
