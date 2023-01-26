
window.customElements.define('glitch-text', class extends HTMLElement {
	constructor() {
		super()

		this.root = this.attachShadow({ mode: 'closed' })
		this.root.innerHTML = `<slot></slot>`
	}

	set glyphs(glyphs) { this._glyphs = glyphs; this.#initialize() }
	set ignore(ignore) { this._ignore = ignore; this.#initialize() }
	set speed(speed) { this._speed = speed; this.#initialize() }
	set duration(duration) { this._duration = duration; this.#initialize() }
	set drop(drop) { this._drop = drop; this.#initialize() }

	get glyphs() { return this._glyphs }
	get ignore() { return this._ignore }
	get speed() { return this._speed }
	get duration() { return this._duration }
	get drop() { return this._drop }

	#initialize() {
		this.text = this.node.textContent
		this.previous = ''
		this.changedIndices = []

		if (this.interval) clearInterval(this.interval)

		const speed = 1 / this.text.length * (1 / this.speed) * 1000
		this.interval = setInterval(() => this.#update(), speed)
	}

	#update() {
		this.node = this.root.querySelector('slot').assignedNodes()[0]
		if (this.node.textContent !== this.previousText || !this.text) this.#initialize()

		if (Math.random() < this.drop) return

		const randomIndex = Math.floor(Math.random() * this.text.length)
		if (this.changedIndices.includes(randomIndex)) {
			return
		}
		if (this.ignore.includes(this.text[randomIndex])) {
			return
		}


		this.changedIndices.push(randomIndex)
		const randomGlyph = this.glyphs[Math.floor(Math.random() * this.glyphs.length)]
		const originalChar = this.text[randomIndex]

		const start = this.node.textContent.substring(0, randomIndex)
		const end = this.node.textContent.substring(randomIndex + 1)
		this.node.textContent = `${start}${randomGlyph}${end}`

		this.previousText = this.node.textContent

		setTimeout(() => {
			if (!this.changedIndices.includes(randomIndex)) return
			const start = this.node.textContent.substring(0, randomIndex)
			const end = this.node.textContent.substring(randomIndex + 1)
			this.node.textContent = `${start}${originalChar}${end}`
			this.previousText = this.node.textContent
			this.changedIndices = this.changedIndices.filter(i => i !== randomIndex)
		}, this.duration)
	}

	connectedCallback() {
		
		this._glyphs = this.getAttribute('glyphs') || '<>_\\/[]+^'
		this._ignore = this.getAttribute('ignore') || ' '
		this._speed = parseFloat(this.getAttribute('speed')) || .05
		this._duration = parseInt(this.getAttribute('duration')) || 250
		this._drop = parseFloat(this.getAttribute('drop')) || 0

		setTimeout(() => { if (this.getAttribute('start') !== null) this.start() })
	}

	start() {
		if (this.interval) return
		this.node = this.root.querySelector('slot').assignedNodes()[0]
		this.#initialize()
	}

	stop() {
		clearInterval(this.interval)
		this.interval = null
	}

	isRunning() { return this.interval !== null }

	toggle() { this.interval ? this.stop() : this.start() }
})
