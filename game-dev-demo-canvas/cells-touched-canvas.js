
import {
	Vector2,
	Point,
	LineSegment,
	setColorAlpha,
	Rectangle,
} from './common.js'

window.customElements.define('cells-touched-canvas', class extends HTMLElement {

    constructor() {
        super()
    }

    connectedCallback() {
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
		this.gridLineColor = this.gridLineColor || 'rgba(0, 0, 0, 0.3)'
		this.rectangleColor = this.rectangleColor || 'rgb(34, 34, 136)'
		this.containingLineColor = this.containingLineColor || 'rgb(136, 34, 34)'

		this.axisDistanceFromEdge = 24

		this.selectedObject = null

		this.draw = this.draw.bind(this)
        this.animationLoop = this.animationLoop.bind(this)

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

		const { defaultSize } = this
		const width = defaultSize.x
		const height = defaultSize.y

		this.rectangle = new Rectangle(new Vector2(170, 170), new Vector2(70, 90))

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

			if (this.selectedObject) {
				this.selectedObject.position = mousePosition.add(this.selectedOffset)
				return
			}

			this.mouseOverObject = this.rectangle.isPointInside(mousePosition) ? this.rectangle : null
			canvas.style.cursor = this.mouseOverObject ? 'pointer' : 'default'
		})

		canvas.addEventListener('mousedown', event => {
			if (!this.mouseOverObject) return
			this.selectedObject = this.mouseOverObject
			const mousePosition = this.getMousePosition(event)
			this.selectedOffset = this.selectedObject.position.subtract(mousePosition)
		})
		canvas.addEventListener('mouseup', () => this.selectedObject = null)
        canvas.addEventListener('mouseleave', () => this.selectedObject = null)
	}


	draw() {
		const {
			context, defaultSize,
			gridLineColor, containingLineColor,
			rectangle, rectangleColor,
		} = this

		const gridOffset = new Vector2(20, 20)
		const gridSize = new Vector2(100, 100)
		const numCellsWide = Math.ceil(defaultSize.x / gridSize.x) + 1
		const numCellsHigh = Math.ceil(defaultSize.y / gridSize.y) + 1


		for (let x = -1; x < numCellsWide; x++) {
			const line = new LineSegment(
				new Vector2(x * gridSize.x + gridOffset.x, 0),
				new Vector2(x * gridSize.x + gridOffset.x, defaultSize.y)
			)
			line.draw(context, gridLineColor, 1)
		}

		for (let y = -1; y < numCellsHigh; y++) {
			const line = new LineSegment(
				new Vector2(0, y * gridSize.y + gridOffset.y),
				new Vector2(defaultSize.x, y * gridSize.y + gridOffset.y)
			)
			line.draw(context, gridLineColor, 1)
		}

		const getCellIndex = ({ x, y }) => {
			const xIndex = Math.floor((x + (gridSize.x - gridOffset.x)) / gridSize.x)
			const yIndex = Math.floor((y + (gridSize.y - gridOffset.y)) / gridSize.y)
			return yIndex * numCellsWide + xIndex
		}

		const indices = rectangle.corners.map(getCellIndex)

		const getRectangleFor = index => {
			const x = index % numCellsWide
			const y = Math.floor(index / numCellsWide)
			const position = new Vector2(x * gridSize.x, y * gridSize.y)
			const center = position.subtract(gridSize.divide(2)).add(gridOffset)
			return new Rectangle(center, gridSize)
		}

		const set = new Set(indices)

		set.forEach(index => {
			const outline = getRectangleFor(index)
			outline.draw(context, 'transparent', containingLineColor, 3)
		})


		rectangle.draw(context, setColorAlpha(rectangleColor, 0.5), rectangleColor)
		const point = new Point(rectangle.position)
		point.draw(context, rectangleColor, 'square', 1)
	}
})
