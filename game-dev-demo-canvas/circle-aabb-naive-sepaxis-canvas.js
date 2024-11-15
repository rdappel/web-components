// done!

import {
	Vector2,
	Point,
	LineSegment,
	setColorAlpha,
	Rectangle,
	Circle
} from './common.js'

window.customElements.define('circle-aabb-naive-sepaxis-canvas', class extends HTMLElement {

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
		this.axisLineColor = this.axisLineColor || 'rgb(34, 136, 34)'
		this.rectangleColor = this.rectangleColor || 'rgb(136, 34, 34)'
		this.circleColor = this.circleColor || 'rgb(34, 34, 136)'

		this.axisDistanceFromEdge = 24

		this.rectangle = new Rectangle(this.center, new Vector2(50, 90))
		this.circle = new Circle(new Vector2(240, 75), 50)

		this.mouseOverObject = null
		this.selectedObject = null
		this.selectedOffset = null

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

	isMouseOverCircle(mousePosition) {
		return this.circle.containsPoint(mousePosition)
	}

	addEventListeners() {
		const { canvas } = this

		canvas.addEventListener('mousemove', event => {
			const mousePosition = this.getMousePosition(event)

			if (this.selectedObject) {
				this.selectedObject.position = mousePosition.add(this.selectedOffset)
				return
			}

			this.mouseOverObject = this.circle.isPointInside(mousePosition) ? this.circle : null
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
			rectangle, rectangleColor,
			circle, circleColor
		} = this

		const axisLineColor50 = setColorAlpha(axisLineColor, 0.5)
		const circleColor50 = setColorAlpha(circleColor, 0.5)
		const rectangleColor50 = setColorAlpha(rectangleColor, 0.5)


		xAxisLine.draw(context, axisLineColor50, 0.5)
		yAxisLine.draw(context, axisLineColor50, 0.5)

		context.lineCap = 'round'

		const axes = rectangle.corners.map(corner => {
			return (new LineSegment(corner, circle.position)).extend(340)
		})

		axes.forEach(axis => axis.draw(context, axisLineColor50, 0.5))

		{ // rectangle
			rectangle.draw(context, rectangleColor50, rectangleColor)
			const rectangleCenterPoint = new Point(rectangle.position)
			rectangleCenterPoint.draw(context, rectangleColor, 'square', 1)
			const rectangleXPointLeft = xAxisLine.getPointClosestTo(rectangle.bottomLeft)
			const rectangleXPointRight = xAxisLine.getPointClosestTo(rectangle.bottomRight)
			const rectangleXLine = new LineSegment(rectangleXPointLeft, rectangleXPointRight)
			const rectangleYPointLeft = yAxisLine.getPointClosestTo(rectangle.topLeft)
			const rectangleYPointRight = yAxisLine.getPointClosestTo(rectangle.bottomRight)
			const rectangleYLine = new LineSegment(rectangleYPointLeft, rectangleYPointRight)
			rectangleXLine.draw(context, rectangleColor, 3)
			rectangleYLine.draw(context, rectangleColor, 3)
		}

		{ // circle
			const { radius, position } = circle
			const { x, y } = position
			circle.draw(context, circleColor50, circleColor)
			const circleCenterPoint = new Point(position)
			circleCenterPoint.draw(context, circleColor, 'square', 1)
			const circleXPointLeft = xAxisLine.getPointClosestTo(new Vector2(x - radius, y))
			const circleXPointRight = xAxisLine.getPointClosestTo(new Vector2(x + radius, y))
			const circleXLine = new LineSegment(circleXPointLeft, circleXPointRight)
			const circleYPointTop = yAxisLine.getPointClosestTo(new Vector2(x, y - radius))
			const circleYPointBottom = yAxisLine.getPointClosestTo(new Vector2(x, y + radius))
			const circleYLine = new LineSegment(circleYPointTop, circleYPointBottom)
			circleXLine.draw(context, circleColor50, 5)
			circleYLine.draw(context, circleColor50, 5)
		}

		// project on to the addition axes
		axes.forEach(axis => {
			const closestPoints = rectangle.corners.map(c => axis.getPointClosestTo(c))
			const [ min, max ] = closestPoints.reduce((acc, point) => {
				if (point.x < acc[0].x) acc[0] = point
				if (point.x > acc[1].x) acc[1] = point
				return acc
			}, [ closestPoints[0], closestPoints[0] ])
			const projectedLine = new LineSegment(min, max)
			projectedLine.draw(context, rectangleColor, 3)

			const axisNormal = axis.toVector().normalize()
			const p0 = circle.position.add(axisNormal.multiply(-circle.radius))
			const p1 = circle.position.add(axisNormal.multiply(circle.radius))
			const circleProjectedLine = new LineSegment(p0, p1)
			circleProjectedLine.draw(context, circleColor50, 5)
		})

	}
})
