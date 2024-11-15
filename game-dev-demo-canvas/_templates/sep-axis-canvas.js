
import {
	Vector2,
	Point,
	LineSegment,
	setColorAlpha,
	Rectangle,
	Triangle,
	Polygon
} from '../common.js'

window.customElements.define('sepaxis-canvas', class extends HTMLElement {

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
		this.axisLineColor = this.axisLineColor || 'rgb(34, 136, 34)'

		this.axisDistanceFromEdge = 24

		this.selectedObject = null

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
		const { defaultSize, axisDistanceFromEdge } = this

		this.xAxisLine = new LineSegment(
			new Vector2(0, defaultSize.y - axisDistanceFromEdge),
			new Vector2(defaultSize.x, defaultSize.y - axisDistanceFromEdge)
		)
		this.yAxisLine = new LineSegment(
			new Vector2(axisDistanceFromEdge, 0),
			new Vector2(axisDistanceFromEdge, defaultSize.y)
		)
	}

	getMousePosition({ clientX, clientY }) {
		const { x, y } = this.getBoundingClientRect()
		const mousePosition = new Vector2(clientX - x, clientY - y)
		return mousePosition.divideByVector(this.scale)
	}

	addEventListeners() {
		const { canvas } = this

		canvas.addEventListener('mousemove', event => {
			const mousePosition = this.getMousePosition(event)

			if (this.selectedPoint) {
				this.selectedPoint.position = mousePosition
				return
			}

			canvas.style.cursor = this.mouseOverPoint ? 'pointer' : 'default'
		})

		canvas.addEventListener('mousedown', () => this.selectedPoint = this.mouseOverPoint)
		canvas.addEventListener('mouseup', () => this.selectedPoint = null)
        canvas.addEventListener('mouseleave', () => this.selectedPoint = null)
	}


	draw() {
		const {
			context,
			axisLineColor, xAxisLine, yAxisLine
		} = this

		const axisLineColor50 = setColorAlpha(axisLineColor, 0.5)
		xAxisLine.draw(context, axisLineColor50)
		yAxisLine.draw(context, axisLineColor50)
	}
})
