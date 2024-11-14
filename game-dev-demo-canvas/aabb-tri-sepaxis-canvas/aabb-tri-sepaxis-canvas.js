
import {
	Vector2,
	Point,
	LineSegment,
	setColorAlpha,
	Rectangle,
	Triangle,
	Polygon
} from '../common.js'

window.customElements.define('aabb-tri-sepaxis-canvas', class extends HTMLElement {

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
		this.rectangleColor = this.rectangleColor || 'rgb(34, 34, 136)'
		this.triangleColor = this.triangleColor || 'rgb(136, 34, 34)'
		this.displaceVectorColor = this.displaceVectorColor || 'rgb(136, 34, 136)'
		this.defaultVectorColor = this.defaultVectorColor || 'rgb(0, 0, 0)'

		this.axisDistanceFromEdge = 24

		this.triangle = new Triangle(new Vector2(135, 185),
			new Vector2(135, 265), new Vector2(190, 265))
		this.rectangle = new Rectangle(new Vector2(260, 140),
			new Vector2(70, 45))

		this.mouseOverObject = null
		this.selectedObject = null
		this.selectedOffset = null

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
		const { defaultSize, axisDistanceFromEdge, triangle } = this

		this.xAxisLine = new LineSegment(
			new Vector2(0, defaultSize.y - axisDistanceFromEdge),
			new Vector2(defaultSize.x, defaultSize.y - axisDistanceFromEdge)
		)
		this.yAxisLine = new LineSegment(
			new Vector2(axisDistanceFromEdge, 0),
			new Vector2(axisDistanceFromEdge, defaultSize.y)
		)

		const hypotenuseLeft = new LineSegment(triangle.a, triangle.c).toVector().left()
		const axisP0 = triangle.a.subtract(new Vector2(0, 100))
		const axisP1 = axisP0.add(hypotenuseLeft)
		this.triangleAxisLine = (new LineSegment(axisP0, axisP1)).extend(340)
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
			context,
			axisLineColor, xAxisLine, yAxisLine,
			triangleAxisLine,
			triangle, triangleColor,
			rectangle, rectangleColor
		} = this

		const axisLineColor50 = setColorAlpha(axisLineColor, 0.5)
		const rectangleColor50 = setColorAlpha(rectangleColor, 0.5)
		const triangleColor50 = setColorAlpha(triangleColor, 0.5)

		xAxisLine.draw(context, axisLineColor50)
		yAxisLine.draw(context, axisLineColor50)
		triangleAxisLine.draw(context, axisLineColor50)

		context.lineCap = 'round'

		{ // triangle
			triangle.draw(context, triangleColor50, triangleColor)

			const triangleXPointLeft = xAxisLine.getPointClosestTo(triangle.b)
			const triangleXPointRight = xAxisLine.getPointClosestTo(triangle.c)
			const xLine0 = new LineSegment(triangleXPointLeft, triangle.b)
			const xLine1 = new LineSegment(triangleXPointRight, triangle.c)
			this.triangleXLine = new LineSegment(triangleXPointLeft, triangleXPointRight)
			this.triangleXLine.draw(context, triangleColor, 3)
			xLine0.draw(context, triangleColor50, 0.5)
			xLine1.draw(context, triangleColor50, 0.5)

			const triangleYPointLeft = yAxisLine.getPointClosestTo(triangle.a)
			const triangleYPointRight = yAxisLine.getPointClosestTo(triangle.b)
			const yLine0 = new LineSegment(triangleYPointLeft, triangle.a)
			const yLine1 = new LineSegment(triangleYPointRight, triangle.b)
			this.triangleYLine = new LineSegment(triangleYPointLeft, triangleYPointRight)
			this.triangleYLine.draw(context, triangleColor, 3)
			yLine0.draw(context, triangleColor50, 0.5)
			yLine1.draw(context, triangleColor50, 0.5)

			const triangleHPointRight = triangleAxisLine.getPointClosestTo(triangle.a)
			const triangleHPointLeft = triangleAxisLine.getPointClosestTo(triangle.b)
			const hLine0 = new LineSegment(triangleHPointLeft, triangle.b)
			const hLine1 = new LineSegment(triangleHPointRight, triangle.a)
			this.triangleHLine = new LineSegment(triangleHPointLeft, triangleHPointRight)
			this.triangleHLine.draw(context, triangleColor, 3)
			hLine0.draw(context, triangleColor50, 0.5)
			hLine1.draw(context, triangleColor50, 0.5)
		}

		{ // rectangle
			rectangle.draw(context, rectangleColor50, rectangleColor)
			const rectangleCenterPoint = new Point(rectangle.position)

			rectangleCenterPoint.draw(context, rectangleColor, 'square', 1)
			const rectangleXPointLeft = xAxisLine.getPointClosestTo(rectangle.bottomLeft)
			const rectangleXPointRight = xAxisLine.getPointClosestTo(rectangle.bottomRight)
			const xLine0 = new LineSegment(rectangleXPointLeft, rectangle.bottomLeft)
			const xLine1 = new LineSegment(rectangleXPointRight, rectangle.bottomRight)
			this.rectangleXLine = new LineSegment(rectangleXPointLeft, rectangleXPointRight)
			this.rectangleXLine.draw(context, rectangleColor50, 5)
			xLine0.draw(context, rectangleColor50, 0.5)
			xLine1.draw(context, rectangleColor50, 0.5)

			const rectangleYPointLeft = yAxisLine.getPointClosestTo(rectangle.topLeft)
			const rectangleYPointRight = yAxisLine.getPointClosestTo(rectangle.bottomRight)
			const yLine0 = new LineSegment(rectangleYPointLeft, rectangle.topLeft)
			const yLine1 = new LineSegment(rectangleYPointRight, rectangle.bottomRight)
			this.rectangleYLine = new LineSegment(rectangleYPointLeft, rectangleYPointRight)
			this.rectangleYLine.draw(context, rectangleColor50, 5)
			yLine0.draw(context, rectangleColor50, 0.5)
			yLine1.draw(context, rectangleColor50, 0.5)

			const rectangleHPointRight = triangleAxisLine.getPointClosestTo(rectangle.topRight)
			const rectangleHPointLeft = triangleAxisLine.getPointClosestTo(rectangle.bottomLeft)
			const hLine0 = new LineSegment(rectangleHPointLeft, rectangle.bottomLeft)
			const hLine1 = new LineSegment(rectangleHPointRight, rectangle.topRight)
			this.rectangleHLine = new LineSegment(rectangleHPointLeft, rectangleHPointRight)
			this.rectangleHLine.draw(context, rectangleColor50, 5)
			hLine0.draw(context, rectangleColor50, 0.5)
			hLine1.draw(context, rectangleColor50, 0.5)
		}
	}
})
