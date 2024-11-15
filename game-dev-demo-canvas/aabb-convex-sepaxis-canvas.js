
import {
	Vector2,
	Point,
	LineSegment,
	setColorAlpha,
	Rectangle,
	Circle
} from './common.js'

window.customElements.define('aabb-convex-sepaxis-canvas', class extends HTMLElement {

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
		this.rectangleColor = this.rectangleColor || 'rgb(34, 34, 136)'
		this.shapeColor = this.shape || 'rgb(136, 34, 34)'
		this.displaceVectorColor = this.displaceVectorColor || 'rgb(136, 34, 136)'
		this.defaultVectorColor = this.defaultVectorColor || 'rgb(0, 0, 0)'

		this.axisDistanceFromEdge = 24

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
		
		this.rectangle = new Rectangle(new Vector2(260, 140),
			new Vector2(70, 45))
		this.shape = new Rectangle(new Vector2(170, 200),
			new Vector2(60, 60)) // using this for the corner points (will not use draw method)
		this.circle = new Circle(this.shape.bottomLeft, this.shape.bottomEdge.toVector().length())
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
			rectangle, rectangleColor, shape, shapeColor
		} = this

		const axisLineColor50 = setColorAlpha(axisLineColor, 0.5)
		const rectangleColor50 = setColorAlpha(rectangleColor, 0.5)
		const shapeColor50 = setColorAlpha(shapeColor, 0.5)
		xAxisLine.draw(context, axisLineColor50)
		yAxisLine.draw(context, axisLineColor50)

		const displaceVectorOffset = 12
		const displaceVectors = []

		context.lineCap = 'round'

		this.axisLine = null
		if (this.shape.isPointInside(this.rectangle.bottomLeft)) {
			this.closestCirclePoint = this.circle.getClosestPointTo(this.rectangle.bottomLeft)
			const closestLine = new LineSegment(this.rectangle.bottomLeft, this.closestCirclePoint)
			closestLine.draw(context, axisLineColor50, 0.5)

			const axisVector = closestLine.toVector()
			const axisLineOffset = 80
			const left = axisVector.left().normalize()
			const isUp = left.y < 0
			const axisOffsetVector = left.multiply(axisLineOffset * (isUp ? 1 : -1))
			const p0 = this.closestCirclePoint.add(axisOffsetVector)
			const p1 = this.rectangle.bottomLeft.add(axisOffsetVector)
			this.axisLine = (new LineSegment(p0, p1)).extend(340)
		}

		if (this.axisLine) {
			const isVertical = this.axisLine.isVertical()
			const isHorizontal = this.axisLine.isHorizontal()
			if (isVertical || isHorizontal) this.axisLine = null
			else this.axisLine.draw(context, axisLineColor50, 0.5)
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

			if (this.axisLine) {
				const rectangleAPointLeft = this.axisLine.getPointClosestTo(rectangle.bottomLeft)
				const rectangleAPointRight = this.axisLine.getPointClosestTo(rectangle.topRight)
				const aLine0 = new LineSegment(rectangleAPointLeft, rectangle.bottomLeft)
				const aLine1 = new LineSegment(rectangleAPointRight, rectangle.topRight)
				this.rectangleALine = new LineSegment(rectangleAPointLeft, rectangleAPointRight)
				this.rectangleALine.draw(context, rectangleColor50, 5)
				aLine0.draw(context, rectangleColor50, 0.5)
				aLine1.draw(context, rectangleColor50, 0.5)
			}
		}

		{// shape
			const p0 = shape.bottomLeft
			const p1 = shape.bottomRight
			const p2 = shape.topLeft
			const p3 = shape.topRight
			const cpa = p1.add(p3).divide(2)
			const cpb = p3.add(p2).divide(2)

			context.beginPath()
			context.strokeStyle = shapeColor
			context.lineWidth = 0.5
			context.fillStyle = shapeColor50
			context.moveTo(p0.x, p0.y)
			context.lineTo(p1.x, p1.y)
			context.bezierCurveTo(cpa.x, cpa.y - 2, cpb.x + 2, cpb.y, p2.x, p2.y)
			context.closePath()
			context.stroke()
			context.fill()

			const shapeXPointLeft = xAxisLine.getPointClosestTo(shape.bottomLeft)
			const shapeXPointRight = xAxisLine.getPointClosestTo(shape.bottomRight)
			const xLine0 = new LineSegment(shapeXPointLeft, shape.bottomLeft)
			const xLine1 = new LineSegment(shapeXPointRight, shape.bottomRight)
			this.shapeXLine = new LineSegment(shapeXPointLeft, shapeXPointRight)
			this.shapeXLine.draw(context, shapeColor50, 5)
			xLine0.draw(context, shapeColor50, 0.5)
			xLine1.draw(context, shapeColor50, 0.5)

			const shapeYPointTop = yAxisLine.getPointClosestTo(shape.topLeft)
			const shapeYPointBottom = yAxisLine.getPointClosestTo(shape.bottomLeft)
			const yLine0 = new LineSegment(shapeYPointTop, shape.topLeft)
			const yLine1 = new LineSegment(shapeYPointBottom, shape.bottomRight)
			this.shapeYLine = new LineSegment(shapeYPointTop, shapeYPointBottom)
			this.shapeYLine.draw(context, shapeColor50, 5)
			yLine0.draw(context, shapeColor50, 0.5)
			yLine1.draw(context, shapeColor50, 0.5)

			if (this.axisLine) {
				const shapeAPointLeft = this.axisLine.getPointClosestTo(shape.bottomLeft)
				const shapeAPointRight = this.axisLine.getPointClosestTo(this.closestCirclePoint)
				const aLine0 = new LineSegment(shapeAPointLeft, shape.bottomLeft)
				const aLine1 = new LineSegment(shapeAPointRight, this.closestCirclePoint)
				this.shapeALine = new LineSegment(shapeAPointLeft, shapeAPointRight)
				this.shapeALine.draw(context, shapeColor50, 5)
				aLine0.draw(context, shapeColor50, 0.5)
				aLine1.draw(context, shapeColor50, 0.5)
			}
		}

		
		// start finding separating axis

		const getDisplacementVector = (rectangleLine, triangleLine, swapArrow) => {
			if (!rectangleLine || !triangleLine) return null
			const axisOverlapLine = rectangleLine.getOverlap(triangleLine)
			if (!axisOverlapLine) return null
			const tCenter = triangleLine.center()
			const rCenter = rectangleLine.center()
			const p0 = axisOverlapLine.start
			const p1 = axisOverlapLine.end
			const line = p0.x < p1.x || p0.y > p1.y
				? axisOverlapLine : new LineSegment(p1, p0)

			const triangleIsLeft = tCenter.x < rCenter.x || tCenter.y > rCenter.y

			const triangleIsSmaller = triangleLine.toVector().lengthSquared()
				< rectangleLine.toVector().lengthSquared()

			const enclosed = triangleIsSmaller
			? (triangleLine.start.x > rectangleLine.start.x && triangleLine.end.x < rectangleLine.end.x)
				|| (triangleLine.start.y > rectangleLine.start.y && triangleLine.end.y < rectangleLine.end.y)
			: triangleLine.start.x < rectangleLine.start.x && triangleLine.end.x > rectangleLine.end.x
				|| (triangleLine.start.y < rectangleLine.start.y && triangleLine.end.y > rectangleLine.end.y)

			if (enclosed) {
				if (triangleIsSmaller && triangleIsLeft) line.start = rectangleLine.start
				if (triangleIsSmaller && !triangleIsLeft) line.end = rectangleLine.end
				if (!triangleIsSmaller && triangleIsLeft) line.end = triangleLine.start
				if (!triangleIsSmaller && !triangleIsLeft) line.start = triangleLine.end
			}

			const vector = line.toVector().multiply(triangleIsLeft ? 1 : -1)
			const position = vector.x > 0 || vector.y < 0 ? line.start : line.end
			const normal = vector[triangleIsLeft ? 'left' : 'right']().normalize()
			const size = (swapArrow ? -1 : 1) * displaceVectorOffset
			const start = (normal.multiply(size)).add(position)
			const lengthSquared = vector.lengthSquared()
			return { vector, start, lengthSquared }
		}

		displaceVectors.push(getDisplacementVector(this.rectangleXLine, this.shapeXLine, false))
		displaceVectors.push(getDisplacementVector(this.rectangleYLine, this.shapeYLine, true))

		if (this.axisLine) {
			displaceVectors.push(getDisplacementVector(this.rectangleALine, this.shapeALine, true))
		}

		
		const vectors = displaceVectors.filter(Boolean)
		const hasDisplacement = (vectors.length === 3)
			|| (vectors.length === 2 && !this.axisLine)

		vectors.sort((a, b) => a.lengthSquared - b.lengthSquared)
			.forEach(({ vector, start }, index) => {
				if (!vector) return
				const color = (index === 0 && hasDisplacement) ? 'purple'
					: setColorAlpha(this.defaultVectorColor, 0.3)
				vector.draw(context, start, color, 3)
			})
	}
})
