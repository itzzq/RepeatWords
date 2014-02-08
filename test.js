//全局使用变量
var gui = require('nw.gui');
var win = gui.Window.get();
var fs = require('fs');
var db = openDatabase('rwtest','1.0','used for test',2*1024*1024);
var async = require('async');


onload = function() {
	var actiondefault = $("#actiondefault"),
	loadingstatus = $('#loadingstatus');
	
	actiondefault.click(function(){
		console.log("actiondefault click!");

		async.series([
			function(next){
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
							YMDHM = planday.getFullYear() + "-" +(planday.getMonth()+1) + "-" + (planday.getDate()+i) + " " + planday.getHours() + ":" + (planday.getMinutes()+2);
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
				$(".metro .window-overlay").remove();
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
						tx.executeSql(
							'select word, pronunciation, meaning from wordcard where planid = ?',
							[pid],
							function(tx, result){
								var tabledata = new Array;
								for (var i=0;i<result.rows.length;i++){tabledata.push(result.rows.item(i));}
								showwords(tabledata);
							},
							function(tx, err){console.log('select for plans words failed.' + err.message);}
							);
					
					}

					function showwords(tabledata){
						// 显示该计划的单词内容
						$("#plancontent").append('<table id="wordtable" class="striped"></table>').tablecontrol({
							cls: 'table hovered border',
							colModel: [
								{field: 'word', caption: '单词',width: '', sortable: false, cls:'text-center', hcls: ""},
								{field: 'pronunciation', caption: '音标',width: '', sortable: false, cls:'text-center', hcls: ""},
								{field: 'meaning', caption: '翻译',width: '', sortable: false, cls:'text-center', hcls: ""}
							],

							data: tabledata
						}).tablePagination({});;
						// 绑定表格分页
					}

					function showlefttime(lefttime){
						// 显示倒计时
						var stoptime = (new Date(lefttime)).getTime();
						$("#checkin").hide();
						$("#myclock").countdown({
							style:{
								background: "bg-lightBlue",
				                foreground: "fg-white",
				                divider: "fg-dark"
							},
							blink: true,
				            days: 1,
							stoptimer: stoptime,
							onstop: function(){
								$.getScript("actionplan.js");
							}
						}).addClass("countdown");
						
						console.log(lefttime); 
					}
				});
			}], function(err, values) {
				console.log('async end : '+ values);
			});
	});
}