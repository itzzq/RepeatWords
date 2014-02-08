var registersbtn = $('#register_submit'),
returnbackbtn = $('#returnback');

registersbtn.click(function(){
	var name = $("input[name='name']").val();
	var password1 = $("input[name='password1']").val();
	var password2 = $("input[name='password2']").val();
	var email = $("input[name='email']").val();

	if (name == "") {
		setTimeout(function(){
			$.Notify({
				content: "用户名不能为空！",
				position: "top-right",
				shadow: true,
				style:{background:'#2e92cf'}
			});
		}, 1000);
		return;
	}
	if (password1 == "" || password2 == "") {
		setTimeout(function(){
			$.Notify({
				content: "密码不能为空！",
				position: "top-right",
				shadow: true,
				style:{background:'#2e92cf'}
			});
		}, 1000);
		return;
	}
	if (email == "") {
		setTimeout(function(){
			$.Notify({
				content: "email不能为空！",
				position: "top-right",
				shadow: true,
				style:{background:'#2e92cf'}
			});
		}, 1000);
		return;
	}
	if(password1 != password2){
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
		// Create table and insert one line
  		db.transaction(function (tx) {
  			tx.executeSql('CREATE TABLE IF NOT EXISTS user (uid Integer Primary Key, name Text, password Text, email Text, checkin BOOLEAN)');
 	 		tx.executeSql('INSERT INTO user (uid, name, password, email, checkin) VALUES (?, ?, ?, ?, ?)', [null, name, password1, email, true]);
		});
		setTimeout(function(){
			$.Notify({
				content: "注册成功！",
				position: "top-right",
				shadow: true,
				style:{background:'#2e92cf'}
			});
		}, 1000);

		loginpage();
	}
});

returnbackbtn.click(loginpage);