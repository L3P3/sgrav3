const $ = document.querySelector.bind(document);

const element_screen = $('#screen');
const element_tools = $('#tools');

let tool_active = null;

let setting_size = 15;

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

		element.style.transform = `translate(${this.position_x-this.radius}px, ${this.position_y-this.radius}px)`;

		element_screen.appendChild(element);
	}
}

class tool {
	element = null;

	constructor (label) {
		const element =
		this.element =
			document.createElement('button');

		element.innerText = label;

		element.addEventListener(
			'click',
			() => {
				this.button_action();
			}
		);

		element_tools.appendChild(element);
	}

	unselect () {
		this.element.className = '';
	}

	button_action () {
		tool_active?.unselect();
		this.element.className = 'active';
		tool_active = this;
	}

	screen_down () {}
	screen_up () {}
	screen_move () {}
}

const tool_create = new (
	class extends tool {
		constructor () {
			super('Erstellen');
		}

		screen_down () {
			return () => {
				new particle;
			}
		}
	}
);

const tool_delete = new (
	class extends tool {
		constructor () {
			super('Löschen');
		}

		screen_down () {
			alert('GELÖSCHT');
		}
	}
);

new (
	class extends tool {
		constructor () {
			super('Info');
		}

		button_action () {
			alert('Noch unfertig!');
		}
	}
);

element_screen.addEventListener(
	'mousedown',
	event => {
		cursor_x = event.clientX;
		cursor_y = event.clientY;

		const handler_up = tool_active?.screen_down();
		if (handler_up) {
			window.onmouseup = event => {
				cursor_x = event.clientX;
				cursor_y = event.clientY;
				window.onmouseup = null;

				handler_up();
			}
		}
	}
);

element_screen.addEventListener(
	'mousemove',
	event => {
		cursor_x = event.clientX;
		cursor_y = event.clientY;
		tool_active?.screen_move();
	}
);
