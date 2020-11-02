const $ = document.querySelector.bind(document);

const element_screen = $('#screen');

let setting_size = 50;

let cursor_x = 0;
let cursor_y = 0;

class particle {
	element = null;

	radius = 0;
	position_x = 0;
	position_y = 0;
	speed_x = 0;
	speed_y = 0;

	constructor () {
		this.radius = setting_size;
		this.position_x = cursor_x;
		this.position_y = cursor_y;

		const element =
		this.element =
			document.createElement('div');

		element.style.width =
		element.style.height =
			this.radius*2 + 'px';

		element_screen.appendChild(element);
	}
}

$('#button_create').addEventListener(
	'click',
	() => {
		new particle;
	}
);
