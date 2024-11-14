// todo: add purple displace vectors

import {
	Vector2,
	Point,
	LineSegment,
	setColorAlpha,
	Rectangle,
	Circle
} from '../common.js'

window.customElements.define('circle-aabb-vr-sepaxis-canvas', class extends HTMLElement {

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
		this.rectangleColor = this.rectangleColor || 'rgb(136, 34, 34)'
		this.circleColor = this.circleColor || 'rgb(34, 34, 136)'
		this.displaceVectorColor = this.displaceVectorColor || 'rgb(136, 34, 136)'
		this.defaultVectorColor = this.defaultVectorColor || 'rgb(0, 0, 0)'

		this.axisDistanceFromEdge = 24
		
		this.rectangle = new Rectangle(this.center, new Vector2(90, 90))
		this.circle = new Circle(new Vector2(240, 75), 36)

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
		const rectangleColor50 = setColorAlpha(rectangleColor, 0.5)
		const circleColor50 = setColorAlpha(circleColor, 0.5)

		xAxisLine.draw(context, axisLineColor50, 0.5)
		yAxisLine.draw(context, axisLineColor50, 0.5)

		context.lineCap = 'round'

		{ // rectangle
			rectangle.draw(context, rectangleColor50, rectangleColor)
			const rectangleCenterPoint = new Point(rectangle.position)
			rectangleCenterPoint.draw(context, rectangleColor, 'square', 1)
			const rectangleXPointLeft = xAxisLine.getPointClosestTo(rectangle.bottomLeft)
			const rectangleXPointRight = xAxisLine.getPointClosestTo(rectangle.bottomRight)
			this.rectangleXLine = new LineSegment(rectangleXPointLeft, rectangleXPointRight)
			const rectangleYPointLeft = yAxisLine.getPointClosestTo(rectangle.topLeft)
			const rectangleYPointRight = yAxisLine.getPointClosestTo(rectangle.bottomRight)
			this.rectangleYLine = new LineSegment(rectangleYPointLeft, rectangleYPointRight)
			this.rectangleXLine.draw(context, rectangleColor, 3)
			this.rectangleYLine.draw(context, rectangleColor, 3)

			// rectangle voronoi region lines
			rectangle.topEdge.extend(340).draw(context, rectangleColor50, 0.5)
			rectangle.rightEdge.extend(340).draw(context, rectangleColor50, 0.5)
			rectangle.bottomEdge.extend(340).draw(context, rectangleColor50, 0.5)
			rectangle.leftEdge.extend(340).draw(context, rectangleColor50, 0.5)
		}

		{ // circle
			const { radius, position } = circle
			const { x, y } = position
			circle.draw(context, circleColor50, circleColor)
			const circleCenterPoint = new Point(position)
			circleCenterPoint.draw(context, circleColor, 'square', 1)
			const circleXPointLeft = xAxisLine.getPointClosestTo(new Vector2(x - radius, y))
			const circleXPointRight = xAxisLine.getPointClosestTo(new Vector2(x + radius, y))
			this.circleXLine = new LineSegment(circleXPointLeft, circleXPointRight)
			const circleYPointTop = yAxisLine.getPointClosestTo(new Vector2(x, y - radius))
			const circleYPointBottom = yAxisLine.getPointClosestTo(new Vector2(x, y + radius))
			this.circleYLine = new LineSegment(circleYPointTop, circleYPointBottom)
			this.circleXLine.draw(context, circleColor50, 5)
			this.circleYLine.draw(context, circleColor50, 5)
		}


		this.inVoronoiRegion = false
		const displaceVectorOffset = 12
		const displaceVectors = []

		const isCenterInside = rectangle.isPointInside(circle.position)
		if (!isCenterInside) {

			const closestCorner = rectangle.getClosestCorner(circle.position)
			const closestPoint = rectangle.getClosestPoint(circle.position)

			if (closestPoint.equals(closestCorner)) {
				const centerToCornerLine = new LineSegment(circle.position, closestPoint)
				if (!centerToCornerLine.isVertical() && !centerToCornerLine.isHorizontal()) {
					this.inVoronoiRegion = true

					centerToCornerLine.draw(context, axisLineColor50, 0.5)
					const axisOffset = 60
					const tempAxis = centerToCornerLine.extend(340)
					const newAxisVectorNormal = tempAxis.end.subtract(tempAxis.start).normalize()
					const isLeftUp = newAxisVectorNormal.left().y < 0
					const newAxisOrthogonal = newAxisVectorNormal[isLeftUp ? 'left' : 'right']()
					const offsetVector = newAxisOrthogonal.multiply(axisOffset)
					const p0 = closestPoint.add(offsetVector)
					const p1 = circle.position.add(offsetVector)
					const newAxisLine = new LineSegment(p0, p1).extend(340)
					newAxisLine.draw(context, axisLineColor50, 0.5)

					// rectangle projection
					const farthestCorner = rectangle.getFarthestCorner(circle.position)
					const rP0 = newAxisLine.getPointClosestTo(closestCorner)
					const rP1 = newAxisLine.getPointClosestTo(farthestCorner)
					const rProjectedLine = new LineSegment(rP0, rP1)
					rProjectedLine.draw(context, rectangleColor, 3)
					this.rectangleLine1 = new LineSegment(closestCorner, rP0)
					this.rectangleLine2 = new LineSegment(farthestCorner, rP1)
					this.rectangleLine1.draw(context, rectangleColor50, 0.5)
					this.rectangleLine2.draw(context, rectangleColor50, 0.5)

					// circle projection
					const normalOffset = newAxisVectorNormal.multiply(circle.radius)
					const farthestIntersection = circle.position.subtract(normalOffset)
					const closestIntersection = circle.position.add(normalOffset)
					const cP0 = newAxisLine.getPointClosestTo(farthestIntersection)
					const cP1 = newAxisLine.getPointClosestTo(closestIntersection)
					const cProjectedLine = new LineSegment(cP0, cP1)
					cProjectedLine.draw(context, circleColor50, 5)
					this.circleLine1 = new LineSegment(farthestIntersection, cP0)
					this.circleLine2 = new LineSegment(closestIntersection, cP1)
					this.circleLine1.draw(context, circleColor50, 0.5)
					this.circleLine2.draw(context, circleColor50, 0.5)

					// overlap on axis
					const axisOverlapLine = rProjectedLine.getOverlap(cProjectedLine)
					if (axisOverlapLine) {
						const vector = axisOverlapLine.toVector().multiply(-1)
						const offset = vector.x > 0 ? vector.left() : vector.right()
						const start = offset.normalize()
							.multiply(-displaceVectorOffset).add(axisOverlapLine.end)
						//vector.draw(context, start, axisLineColor, 3)
						const lengthSquared = vector.lengthSquared()
						displaceVectors.push({ vector, start, lengthSquared })
					}
				}
			}
		}

		// overlap on x and y axis
		const xOverlapLine = this.rectangleXLine.getOverlap(this.circleXLine)
		if (xOverlapLine) {
			const { position: { x }, radius } = circle
			const p0 = xOverlapLine.start
			const p1 = xOverlapLine.end
			const line = p0.x < p1.x ? xOverlapLine : new LineSegment(p1, p0)
			const circleXisLeft = circle.position.x < rectangle.position.x
			const enclosed = x - radius >= rectangle.left && x + radius <= rectangle.right
			if (enclosed && circleXisLeft) line.start.x = rectangle.left
			if (enclosed && !circleXisLeft) line.end.x = rectangle.right
			const vector = line.toVector()
			if (circleXisLeft) vector.x *= -1
			const position = vector.x > 0 ? line.start : line.end
			const start = (new Vector2(0, displaceVectorOffset)).add(position)
			const lengthSquared = vector.lengthSquared()
			displaceVectors.push({ vector, start, lengthSquared })
		}
		const yOverlapLine = this.rectangleYLine.getOverlap(this.circleYLine)
		if (yOverlapLine) {
			const p0 = yOverlapLine.start
			const p1 = yOverlapLine.end
			const line = p0.y < p1.y ? yOverlapLine : new LineSegment(p1, p0)
			const circleYisUp = circle.position.y < rectangle.position.y
			const enclosed = circle.position.y - circle.radius >= rectangle.top
				&& circle.position.y + circle.radius <= rectangle.bottom
			if (enclosed && circleYisUp) line.start.y = rectangle.top
			if (enclosed && !circleYisUp) line.end.y = rectangle.bottom
			const vector = line.toVector()
			if (circleYisUp) vector.y *= -1
			const position = vector.y > 0 ? line.start : line.end
			const start = (new Vector2(-displaceVectorOffset, 0)).add(position)
			const lengthSquared = vector.lengthSquared()
			displaceVectors.push({ vector, start, lengthSquared })
		}

		const l = displaceVectors.length
		const hasDisplacement = ((this.inVoronoiRegion && l === 3)
			|| !this.inVoronoiRegion && l === 2)

		displaceVectors.sort((a, b) => a.lengthSquared - b.lengthSquared)
			.forEach(({ vector, start }, index) => {
				if (!vector) return
				const color = (index === 0 && hasDisplacement) ? 'purple'
					: setColorAlpha(this.defaultVectorColor, 0.3)
				vector.draw(context, start, color, 3)
			})

	}
})
