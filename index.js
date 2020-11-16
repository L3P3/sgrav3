/**
 * sgrav3 -- simple physics playground
 * @author L3P3
 * @author Throneck
*/

class Application {
	static instance = null;

	static getInstance() {
		if (Application.instance === null) {
			Application.instance = new Application;
		}
		return Application.instance;
	}

	element_screen = null;
	element_tools = null;
	element_toolsettings = null;

	cursor_x = 0;
	cursor_y = 0;

	border_x1 = 0;
	border_x2 = 0;
	border_y1 = 0;
	border_y2 = 0;
	border_factor = .7;

	pause_enabled = false;
	border_enabled = false;
	gravity_enabled = false;
	charge_enabled = false;
	merge_enabled = false;

	constructor() {
		const $ = document.querySelector.bind(document);

		this.element_screen = $('#screen');
		this.element_tools = $('#tools');
		this.element_toolsettings = $('#toolsettings');

		this.border_x2 = this.element_screen.offsetWidth;
		this.border_y2 = this.element_screen.offsetHeight;

		const border_element = document.createElement('div');
		border_element.className = 'box';
		border_element.style.width = (this.border_x2 - this.border_x1) + 'px';
		border_element.style.height = (this.border_y2 - this.border_y1) + 'px';
		this.element_screen.appendChild(border_element);
	}
}

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
		const app = Application.getInstance();

		if (
			!app.pause_enabled &&
			(app.gravity_enabled || app.charge_enabled)
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
		const app = Application.getInstance();

		const matches = [];
		for (const particle of Particle.all) {
			if (
				Math.sqrt(
					Math.pow(particle.position_x - app.cursor_x, 2) +
					Math.pow(particle.position_y - app.cursor_y, 2)
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
		const app = Application.getInstance();

		this.position_x = app.cursor_x + Math.random() * .0001;
		this.position_y = app.cursor_y + Math.random() * .0001;

		const element =
		this.element =
			document.createElement('div');

		app.element_screen.appendChild(element);
		Particle.all.add(this);
	}

	destroy () {
		Application.getInstance().element_screen.removeChild(this.element);
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
		const app = Application.getInstance();

		for (const particle of Particle.all) {
			if (
				particle.phantom ||
				particle === this ||
				particle.position_x === this.position_x &&
				particle.position_y === this.position_y
			) continue;

			const impact = particle.mass / this.mass;
			const force_gravity = app.gravity_enabled ? impact : 0;
			const force_charge = app.charge_enabled ? -this.charge * particle.charge * impact : 0;

			const distance = this.distance_to(particle);
			this.speed_x += (force_gravity + force_charge) * (particle.position_x - this.position_x) / Math.pow(distance, 2) / delay;
			this.speed_y += (force_gravity + force_charge) * (particle.position_y - this.position_y) / Math.pow(distance, 2) / delay;
		}
	}

	tick (delay) {
		const app = Application.getInstance();

		if (
			!app.pause_enabled &&
			!this.phantom
		) {
			this.position_x += this.speed_x * delay;
			this.position_y += this.speed_y * delay;

			if (app.merge_enabled) {
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

			if (app.border_enabled) {
				if (this.position_x - this.radius < app.border_x1) {
					this.position_x = app.border_x1 + this.radius;
					this.speed_x *= -app.border_factor;
				}
				else if (this.position_x + this.radius > app.border_x2) {
					this.position_x = app.border_x2 - this.radius;
					this.speed_x *= -app.border_factor;
				}

				if (this.position_y - this.radius < app.border_y1) {
					this.position_y = app.border_y1 + this.radius;
					this.speed_y *= -app.border_factor;
				}
				else if (this.position_y + this.radius > app.border_y2) {
					this.position_y = app.border_y2 - this.radius;
					this.speed_y *= -app.border_factor;
				}
			}
		}

		this.element.style.transform = `translate(${this.position_x-this.radius}px, ${this.position_y-this.radius}px)`;
	}
}

class Tool {
	static active = null;

	static init() {
		const app = Application.getInstance();

		app.element_screen.addEventListener(
			'mousedown',
			event => {
				app.cursor_x = event.clientX;
				app.cursor_y = event.clientY;

				const handler_up = Tool.active?.screen_down();
				if (handler_up) {
					window.onmouseup = event => {
						app.cursor_x = event.clientX;
						app.cursor_y = event.clientY;
						window.onmouseup = null;

						handler_up();
					}
				}
			}
		);

		app.element_screen.addEventListener(
			'mousemove',
			event => {
				app.cursor_x = event.clientX;
				app.cursor_y = event.clientY;
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

		Application.getInstance().element_tools.appendChild(element);
	}

	unselect () {
		const app = Application.getInstance();
		this.element.className = '';

		for (const setting of this.settings) {
			app.element_toolsettings.removeChild(setting);
		}
	}

	button_action () {
		const app = Application.getInstance();
		Tool.active?.unselect();
		this.element.className = 'active';
		Tool.active = this;

		for (const setting of this.settings) {
			app.element_toolsettings.appendChild(setting);
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
			const app = Application.getInstance();

			const particle = new Particle;
			const down_x = app.cursor_x;
			const down_y = app.cursor_y;
			particle.phantom = true;
			particle.color = this.settings[0].value;
			particle.radius = Number(this.settings[1].value);

			return () => {
				particle.speed_x = (app.cursor_x - down_x) * 0.001;
				particle.speed_y = (app.cursor_y - down_y) * 0.001;
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
			const app = Application.getInstance();

			app.pause_enabled = !app.pause_enabled;
			this.element.className = (
				app.pause_enabled
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
			const app = Application.getInstance();

			app.border_enabled = !app.border_enabled;
			this.element.className = (
				app.border_enabled
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
			const app = Application.getInstance();

			app.gravity_enabled = !app.gravity_enabled;
			this.element.className = (
				app.gravity_enabled
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
			const app = Application.getInstance();

			app.charge_enabled = !app.charge_enabled;
			this.element.className = (
				app.charge_enabled
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
			const app = Application.getInstance();

			app.merge_enabled = !app.merge_enabled;
			this.element.className = (
				app.merge_enabled
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
