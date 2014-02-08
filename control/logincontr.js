var loginbtn = $('#login_submit'),
registerbtn = $('#registerpage');

loginbtn.click(function(){
	var name = $("input[name='name']").val();
	var password = $("input[name='password']").val();
	
	if (name == "") {
		setTimeout(function(){
			$.Notify({
				content: "用户名不能为空！",
				position: "bottom-right",
				shadow: true,
				style:{background:'#2e92cf'}
			});
		}, 1000);
		return;
	}
	if (password == "") {
		setTimeout(function(){
			$.Notify({
				content: "密码不能为空！",
				position: "bottom-right",
				shadow: true,
				style:{background:'#2e92cf'}
			});
		}, 1000);
		return;
	}
	// Query out the data
	db.transaction(function (tx) {
		tx.executeSql('SELECT uid FROM user WHERE name=? and password=?', [name, password], function (tx, results) {
			var len = results.rows.length;

			if(len == 1){
				setTimeout(function(){
					$.Notify({
					content: "登录成功！",
					position: "top-right",
					shadow: true,
					style:{background:'#2e92cf'}
					});
				}, 1000);
				uid = results.rows.item(0).uid;
				dashboardpage();				
				
			} else {
				setTimeout(function(){
					$.Notify({
					content: "用户名或密码错误！",
					position: "bottom-right",
					shadow: true,
					style:{background:'#2e92cf'}
					});
				}, 1000);
			}
		}, function (tx, err) {
			//couldn't read database
			console.log("数据库连接错误！"+err);
		});
	});
});

registerbtn.click(registerpage);