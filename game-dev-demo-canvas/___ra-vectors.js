
import {
	Vector2,
	Grid,
	Point,
	LineSegment
} from './common.js'

window.customElements.define('ra-vectors', class extends HTMLElement {

    constructor() {
        super()
        this.root = this.attachShadow({ mode: 'open' })

        this.canvas = document.createElement('canvas')
		this.defaultSize = new Vector2(340, 340)
		this.scale = new Vector2(1, 1)
		this.canvas.width = this.defaultSize.x
		this.canvas.height = this.defaultSize.y
		this.center = this.defaultSize.divide(2)
		this.style.overflow = 'hidden'

        this.root.appendChild(this.canvas)
        this.context = this.canvas.getContext('2d')

		// todo: specify colors... ex:
		//this.controlPointColor = this.controlPointColor || 'rgb(34, 34, 136)'
		this.gridColor = this.gridColor || 'rgba(0, 0, 0, 0.3)'

		this.vectorColors = [
			'red', 'green', 'blue', 'purple', 'orange', 'yellow',
			'pink', 'cyan', 'magenta', 'brown', 'gray', 'black'
		]

		this.vectors = []

		this.currentVector = null

		this.draw = this.draw.bind(this)
        this.animationLoop = this.animationLoop.bind(this)
    }

    connectedCallback() {
		const { canvas, scale } = this

		const boundingRectangle = this.getBoundingClientRect()
		canvas.width = boundingRectangle.width
		canvas.height = boundingRectangle.height

		scale.x = canvas.width / this.defaultSize.x
		scale.y = canvas.height / this.defaultSize.y
		
		this.createCanvasElements()
		this.addEventListeners()

        requestAnimationFrame(this.animationLoop)
    }

    animationLoop() {
        const { context, canvas, scale } = this
        context.clearRect(0, 0, canvas.width, canvas.height)
		context.save()
        context.scale(scale.x, scale.y)
		this.draw()
		context.restore()
        requestAnimationFrame(this.animationLoop)
    }

	createCanvasElements() {
		this.grid = new Grid(34, -17, -17)
	}

	getMousePosition({ clientX, clientY }) {
		const { x, y } = this.getBoundingClientRect()
		const mousePosition = new Vector2(clientX - x, clientY - y)
		return mousePosition.divideByVector(this.scale)
	}

	getMousePostitionSnapped({ clientX, clientY }, snap = 17) {
		const mousePosition = this.getMousePosition({ clientX, clientY })
		const x = Math.round(mousePosition.x / snap) * snap
		const y = Math.round(mousePosition.y / snap) * snap
		return new Vector2(x, y)
	}

	addEventListeners() {
		const { canvas } = this

		canvas.addEventListener('mousemove', event => {
			if (!this.selectedVector) return
			const mousePosition = this.getMousePostitionSnapped(event)
			const { start, color } = this.selectedVector
			const vector = mousePosition.subtract(start)
			this.selectedVector = { vector, start, color }
		})

		canvas.addEventListener('mousedown', event => {
			const mousePosition = this.getMousePostitionSnapped(event)
			const vector = new Vector2(0, 0)
			const start = mousePosition
			const color = this.vectorColors[this.vectors.length % this.vectorColors.length]
			this.selectedVector = { vector, start, color }
		})
		canvas.addEventListener('mouseup', event => {
			if (!this.selectedVector) return
			this.vectors.push(this.selectedVector)
			this.selectedVector = null
		})
        canvas.addEventListener('mouseleave', () => this.selectedVector = null)

		// clear canvas when escape key is pressed
		document.addEventListener('keydown', event => {
			if (event.key !== 'Escape') return
			this.vectors = []
			this.selectedVector = null
		})
	}

	getMouseOverPoint(mousePosition) {
		for (const point of this.draggablePoints) {
			if (point.isMouseOver(mousePosition)) return point
		}
		return null
	}

	draw() {
		const {
			context, grid, gridColor
		} = this

		grid.draw(context, gridColor, 0.5)

		// draw axes
		const { width, height } = context.canvas
		const x = height - 17
		const y = 17
		const xLine = new LineSegment(new Vector2(0, x), new Vector2(width, x))
		const yLine = new LineSegment(new Vector2(y, 0), new Vector2(y, height))
		xLine.draw(context, 'black')
		yLine.draw(context, 'black')

		this.vectors.forEach(({ vector, start, color }) => {
			vector.draw(context, start, color, 2)
		})

		if (!this.selectedVector) return
		const { vector, start, color } = this.selectedVector
		vector.draw(context, start, color, 2)
	}
})
