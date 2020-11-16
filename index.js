const $ = document.querySelector.bind(document);

const element_screen = $('#screen');
const element_tools = $('#tools');
const element_toolsettings = $('#toolsettings');

let cursor_x = 0;
let cursor_y = 0;

const border_x1 = 0;
const border_x2 = element_screen.offsetWidth;
const border_y1 = 0;
const border_y2 = element_screen.offsetHeight;
const border_factor = .7;

let pause_enabled = false;
let border_enabled = false;
let gravity_enabled = false;
let charge_enabled = false;
let merge_enabled = false;


// BORDER

const border_element = document.createElement('div');
border_element.className = 'box';
border_element.style.width = (border_x2 - border_x1) + 'px';
border_element.style.height = (border_y2 - border_y1) + 'px';
element_screen.appendChild(border_element);


// PHYSICS

class Particle {
	static all = new Set;

	static init() {
		let tick_last = 0;

		function tick (now) {
			const delay = now - tick_last;
			tick_last = now;

			Particle.tick(delay);

			requestAnimationFrame(tick);
		}

		tick(0);
	}

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

	position_x = 0;
	position_y = 0;
	speed_x = 0;
	speed_y = 0;
	density = .01;
	charge = 1;
	phantom = false;
	_color = '#ff0000';
	_radius = 0;

	constructor () {
		this.position_x = cursor_x + Math.random() * .0001;
		this.position_y = cursor_y + Math.random() * .0001;

		const element =
		this.element =
			document.createElement('div');

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
	set area (value) {
		this.radius = Math.sqrt(value / Math.PI);
	}

	get mass () {
		return this.density * this.area;
	}

	set color(value) {
		this.element.style.background =
		this._color = value;
	}
	get color() {
		return this._color;
	}

	set color_numbers(value) {
		this.color = '#' + (
			value
			.map(com =>
				com
				.toString(16)
				.padStart(2, '0')
			)
			.join('')
		);
	}
	get color_numbers() {
		const number = parseInt(
			this.color.substr(1),
			16
		);
		return [
			number >> 16,
			(number >> 8) & 255,
			number & 255
		];
	}

	set radius(value) {
		this._radius = value;

		this.element.style.width =
		this.element.style.height =
			value*2 + 'px';
	}
	get radius() {
		return this._radius;
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
				particle === this ||
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

			if (merge_enabled) {
				for (const particle of Particle.all) {
					if (
						particle === this ||
						this.distance_to(particle) > this.radius + particle.radius
					) continue;

					const mass_ratio_a = this.mass / particle.mass + 1;
					const mass_ratio_b = particle.mass / this.mass + 1;

					this.speed_x = this.speed_x / mass_ratio_b + particle.speed_x / mass_ratio_a;
					this.speed_y = this.speed_y / mass_ratio_b + particle.speed_y / mass_ratio_a;

					this.position_x = this.position_x / mass_ratio_b + particle.position_x / mass_ratio_a;
					this.position_y = this.position_y / mass_ratio_b + particle.position_y / mass_ratio_a;

					this.density = (this.mass + particle.mass) / (this.area + particle.area);
					this.area = this.area + particle.area;
					this.charge = this.charge / mass_ratio_b + particle.charge / mass_ratio_a;

					this.color_numbers = (
						this.color_numbers
						.map((item, index) =>
							Math.round(
								item / mass_ratio_b + particle.color_numbers[index] / mass_ratio_a
							)
						)
					);

					particle.destroy();
				}
			}

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
	static active = null;

	static init() {
		element_screen.addEventListener(
			'mousedown',
			event => {
				cursor_x = event.clientX;
				cursor_y = event.clientY;

				const handler_up = Tool.active?.screen_down();
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
				Tool.active?.screen_move();
			}
		);

		tool_create.button_action();
	}

	element = null;
	settings = [];

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

		for (const setting of this.settings) {
			element_toolsettings.removeChild(setting);
		}
	}

	button_action () {
		Tool.active?.unselect();
		this.element.className = 'active';
		Tool.active = this;

		for (const setting of this.settings) {
			element_toolsettings.appendChild(setting);
		}
	}

	screen_down () {}
	screen_move () {}
}

const tool_create = new (
	class extends Tool {
		constructor () {
			super('Erstellen');

			const element_color = document.createElement('input');
			element_color.type = 'color';
			element_color.value = '#ff0000';
			this.settings.push(element_color);

			const element_size = document.createElement('input');
			element_size.type = 'range';
			element_size.value = '50';
			this.settings.push(element_size);
		}

		screen_down () {
			const particle = new Particle;
			const down_x = cursor_x;
			const down_y = cursor_y;
			particle.phantom = true;
			particle.color = this.settings[0].value;
			particle.radius = Number(this.settings[1].value);

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
			super('Verschmelzen');
			this.button_action();
		}

		button_action () {
			merge_enabled = !merge_enabled;
			this.element.className = (
				merge_enabled
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

Particle.init();
Tool.init();
