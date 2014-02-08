
function updateImageUrl(image_id, new_image_url) {
  	var image = document.getElementById(image_id);
	if (image)
		image.src = new_image_url;
}

$('.top-titlebar-close-button').mouseover(function(){
	updateImageUrl("top-titlebar-close-button", "imgs/button_close_hover.png");
});
$('.top-titlebar-close-button').mouseout(function(){
	updateImageUrl("top-titlebar-close-button", "imgs/button_close.png");
});
$('.top-titlebar-close-button').click(function(){
	window.close();
});