const $ = document.querySelector.bind(document);

const element_screen = $('#screen');
const element_tools = $('#tools');

let tool_active = null;

let setting_size = 50;

let cursor_x = 0;
let cursor_y = 0;

const border_x1 = 0;
const border_x2 = element_screen.offsetWidth;
const border_y1 = 0;
const border_y2 = element_screen.offsetHeight - 50;
const border_factor = .7;

let pause_enabled = false;
let border_enabled = false;
let gravity_enabled = false;
let charge_enabled = false;


// BORDER

const border_element = document.createElement('div');
border_element.className = 'box';
border_element.style.width = (border_x2 - border_x1) + 'px';
border_element.style.height = (border_y2 - border_y1) + 'px';
element_screen.appendChild(border_element);


// PHYSICS

class Particle {
	static all = new Set;

	static tick (delay) {
		if (
			!pause_enabled &&
			(gravity_enabled || charge_enabled)
		) {
			for (const particle of Particle.all) {
				particle.tick_speed(delay);
			}
		}

		for (const particle of Particle.all) {
			particle.tick(delay);
		}
	}

	static clear () {
		for (const particle of Particle.all) {
			particle.destroy();
		}
	}

	static hovered_get () {
		const matches = [];
		for (const particle of Particle.all) {
			if (
				Math.sqrt(
					Math.pow(particle.position_x - cursor_x, 2) +
					Math.pow(particle.position_y - cursor_y, 2)
				) <= particle.radius
			) {
				matches.push(particle);
			}
		}
		return matches;
	}

	element = null;

	radius = 0;
	position_x = 0;
	position_y = 0;
	speed_x = 0;
	speed_y = 0;
	density = .01;
	charge = 1;
	phantom = false;

	constructor () {
		this.radius = setting_size;
		this.position_x = cursor_x + Math.random() * .0001;
		this.position_y = cursor_y + Math.random() * .0001;

		const element =
		this.element =
			document.createElement('div');

		element.style.width =
		element.style.height =
			this.radius*2 + 'px';

		element_screen.appendChild(element);
		Particle.all.add(this);
	}

	destroy () {
		element_screen.removeChild(this.element);
		Particle.all.delete(this);
	}

	get area () {
		return this.radius * this.radius * Math.PI;
	}

	get mass () {
		return this.density * this.area;
	}

	distance_to (particle) {
		return Math.sqrt(
			Math.pow(particle.position_x - this.position_x, 2) +
			Math.pow(particle.position_y - this.position_y, 2)
		);
	}

	tick_speed (delay) {
		if (this.phantom) return;

		for (const particle of Particle.all) {
			if (
				particle.phantom ||
				particle.position_x === this.position_x &&
				particle.position_y === this.position_y
			) continue;

			const impact = particle.mass / this.mass;
			const force_gravity = gravity_enabled ? impact : 0;
			const force_charge = charge_enabled ? -this.charge * particle.charge * impact : 0;

			const distance = this.distance_to(particle);
			this.speed_x += (force_gravity + force_charge) * (particle.position_x - this.position_x) / Math.pow(distance, 2) / delay;
			this.speed_y += (force_gravity + force_charge) * (particle.position_y - this.position_y) / Math.pow(distance, 2) / delay;
		}
	}

	tick (delay) {
		if (
			!pause_enabled &&
			!this.phantom
		) {
			this.position_x += this.speed_x * delay;
			this.position_y += this.speed_y * delay;

			if (border_enabled) {
				if (this.position_x - this.radius < border_x1) {
					this.position_x = border_x1 + this.radius;
					this.speed_x *= -border_factor;
				}
				else if (this.position_x + this.radius > border_x2) {
					this.position_x = border_x2 - this.radius;
					this.speed_x *= -border_factor;
				}

				if (this.position_y - this.radius < border_y1) {
					this.position_y = border_y1 + this.radius;
					this.speed_y *= -border_factor;
				}
				else if (this.position_y + this.radius > border_y2) {
					this.position_y = border_y2 - this.radius;
					this.speed_y *= -border_factor;
				}
			}
		}

		this.element.style.transform = `translate(${this.position_x-this.radius}px, ${this.position_y-this.radius}px)`;
	}
}


// TOOLS

class Tool {
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
	class extends Tool {
		constructor () {
			super('Erstellen');
		}

		screen_down () {
			const particle = new Particle;
			const down_x = cursor_x;
			const down_y = cursor_y;
			particle.phantom = true;

			return () => {
				particle.speed_x = (cursor_x - down_x) * 0.001;
				particle.speed_y = (cursor_y - down_y) * 0.001;
				particle.phantom = false;
			}
		}
	}
);

const tool_delete = new (
	class extends Tool {
		constructor () {
			super('Löschen');
		}

		screen_down () {
			for (const particle of Particle.hovered_get()) {
				particle.destroy();
			}
		}
	}
);

new (
	class extends Tool {
		constructor () {
			super('Pause');
		}

		button_action () {
			pause_enabled = !pause_enabled;
			this.element.className = (
				pause_enabled
				?	'active'
				:	''
			);
		}
	}
);

new (
	class extends Tool {
		constructor () {
			super('Rahmen');
			this.button_action();
		}

		button_action () {
			border_enabled = !border_enabled;
			this.element.className = (
				border_enabled
				?	'active'
				:	''
			);
		}
	}
);

new (
	class extends Tool {
		constructor () {
			super('Gravitation');
			this.button_action();
		}

		button_action () {
			gravity_enabled = !gravity_enabled;
			this.element.className = (
				gravity_enabled
				?	'active'
				:	''
			);
		}
	}
);

new (
	class extends Tool {
		constructor () {
			super('Ladung');
		}

		button_action () {
			charge_enabled = !charge_enabled;
			this.element.className = (
				charge_enabled
				?	'active'
				:	''
			);
		}
	}
);

new (
	class extends Tool {
		constructor () {
			super('Alle löschen');
		}

		button_action () {
			Particle.clear();
		}
	}
);

new (
	class extends Tool {
		constructor () {
			super('Info');
		}

		button_action () {
			alert('Noch unfertig!');
		}
	}
);

tool_create.button_action();


// LISTENERS

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


// LOOP

let tick_last = 0;

function tick (now) {
	const delay = now - tick_last;
	tick_last = now;

	Particle.tick(delay);

	requestAnimationFrame(tick);
}

tick(0);
