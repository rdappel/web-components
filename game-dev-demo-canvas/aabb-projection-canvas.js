
import {
	Vector2,
	Point,
	LineSegment,
	setColorAlpha,
	Rectangle
} from './common.js'

window.customElements.define('aabb-projection-canvas', class extends HTMLElement {

	CONTROL_DISTANCE = 150;
	LINE_DISTANCE_FROM_CONTROL = 40;
	RIGHT_ANGLE_BOX_SIZE = 10;

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

		this.controlPointColor = this.controlPointColor || 'rgb(136, 34, 34)'
		this.projectionLineColor = this.projectionLineColor || 'rgb(136, 34, 34)'
		this.rectangleColor = this.rectangleColor || 'rgb(34, 34, 136)'
		this.halfWidthColor = this.halfWidthColor || 'rgb(34, 136, 34)'
		this.defaultLineColor = this.defaultLineColor || 'rgb(0, 0, 0)'

		this.selectedPoint = null
		this.draggablePoints = []

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
		const position = new Vector2(170, 170)
		this.rectangle = new Rectangle(position, new Vector2(100, 80))

		const controlPoint = new Point(new Vector2(170, 320), 12)
		this.controlPoint = controlPoint
		this.draggablePoints.push(controlPoint)
		
		const distance = this.LINE_DISTANCE_FROM_CONTROL
		const p0 = new Vector2(170, controlPoint.position.y - distance)
		const p1 = new Vector2(170 - distance, p0.y)
		const projectionLine = (new LineSegment(p0, p1)).extend(340)
		this.projectionLine = projectionLine
	}

	getMousePosition({ clientX, clientY }) {
		const { x, y } = this.getBoundingClientRect()
		const mousePosition = new Vector2(clientX - x, clientY - y)
		return mousePosition.divideByVector(this.scale)
	}

	addEventListeners() {
		const { canvas, center } = this

		canvas.addEventListener('mousemove', event => {
			const mousePosition = this.getMousePosition(event)

			if (this.selectedPoint) {
				const controlDistance = this.CONTROL_DISTANCE
				const distance = this.LINE_DISTANCE_FROM_CONTROL

				// update control point position
				const offset = mousePosition.subtract(center)
				const angle = Math.atan2(offset.y, offset.x)
				const controlDirection = new Vector2(Math.cos(angle), Math.sin(angle))
				const controlPosition = this.center.add(controlDirection.multiply(controlDistance))
				this.selectedPoint.position = controlPosition
				canvas.style.cursor = 'pointer'

				// update projection line
				const offsetFromControl = controlDirection.multiply(-distance)
				const p0 = controlPosition.add(offsetFromControl)
				const right = controlDirection.right()
				const p1 = p0.add(right.multiply(10))
				this.projectionLine = (new LineSegment(p0, p1)).extend(340)

				return
			}

			this.mouseOverPoint = this.getMouseOverPoint(mousePosition)
			canvas.style.cursor = this.mouseOverPoint ? 'pointer' : 'default'
		})

		canvas.addEventListener('mousedown', () => this.selectedPoint = this.mouseOverPoint)
		canvas.addEventListener('mouseup', () => this.selectedPoint = null)
        canvas.addEventListener('mouseleave', () => this.selectedPoint = null)
	}

	getMouseOverPoint(mousePosition) {
		for (const point of this.draggablePoints) {
			if (point.isMouseOver(mousePosition)) return point
		}
		return null
	}

	draw() {
		const {
			context,
			rectangle, rectangleColor,
			controlPoint, controlPointColor,
			projectionLine, projectionLineColor,
			defaultLineColor, halfWidthColor
		} = this

		// draw rectangle
		const rectangleFillColor = setColorAlpha(rectangleColor, 0.2)
		rectangle.draw(context, rectangleFillColor, rectangleColor)

		// draw control point and projection line with right angle box
		const directionHalf = controlPoint.position.subtract(rectangle.position)
		const closestToCenter = projectionLine.getPointClosestTo(rectangle.position)
		const point = new Point(closestToCenter)
		const lineColor = setColorAlpha(defaultLineColor, 0.3)
		const lineToCenter = new LineSegment(rectangle.position, point.position)
		lineToCenter.draw(context, lineColor)
		const boxSize = this.RIGHT_ANGLE_BOX_SIZE
		const normal = directionHalf.normalize()
		const offsetInward = normal.multiply(-boxSize)
		const offsetLeft = normal.left().multiply(boxSize)
		const offsetCorner = offsetInward.add(offsetLeft)
		const boxPoint1 = point.position.add(offsetInward)
		const boxPoint2 = point.position.add(offsetLeft)
		const boxPoint3 = point.position.add(offsetCorner)
		const line1 = new LineSegment(boxPoint1, boxPoint3)
		const line2 = new LineSegment(boxPoint2, boxPoint3)
		line1.draw(context, lineColor)
		line2.draw(context, lineColor)

		// draw half width vectors and half width projection lines
		const horizontalEdge = directionHalf.x >= 0 ? rectangle.rightEdge : rectangle.leftEdge
		const horizontalPoint = horizontalEdge.getPointClosestTo(rectangle.position)
		const horizontalVector = horizontalPoint.subtract(rectangle.position)
		horizontalVector.draw(context, rectangle.position, rectangleColor)

		const verticalEdge = directionHalf.y >= 0 ? rectangle.bottomEdge : rectangle.topEdge
		const verticalPoint = verticalEdge.getPointClosestTo(rectangle.position)
		const verticalVector = verticalPoint.subtract(rectangle.position)
		verticalVector.draw(context, rectangle.position, rectangleColor)

		const halfWidthLineColor = setColorAlpha(halfWidthColor, 0.5)
		const closestHorizontal = projectionLine.getPointClosestTo(horizontalPoint)
		const closestVertical = projectionLine.getPointClosestTo(verticalPoint)
		const horizontalLine = new LineSegment(horizontalPoint, closestHorizontal)
		const verticalLine = new LineSegment(verticalPoint, closestVertical)
		horizontalLine.draw(context, halfWidthLineColor)
		verticalLine.draw(context, halfWidthLineColor)
		const halfWidthProjection = new LineSegment(closestHorizontal, closestVertical)
		halfWidthProjection.draw(context, halfWidthColor, 3, normal.multiply(12))

		// draw full corner projection lines
		const corner1 = rectangle.position.add(horizontalVector).add(verticalVector.multiply(-1))
		const corner1Projection = projectionLine.getPointClosestTo(corner1)
		const corner1Line = new LineSegment(corner1, corner1Projection)
		const corner2 = rectangle.position.add(horizontalVector.multiply(-1)).add(verticalVector)
		const corner2Projection = projectionLine.getPointClosestTo(corner2)
		const corner2Line = new LineSegment(corner2, corner2Projection)
		const fullWidthProjection = new LineSegment(corner1Projection, corner2Projection)
		corner1Line.draw(context, rectangleFillColor)
		corner2Line.draw(context, rectangleFillColor)
		fullWidthProjection.draw(context, rectangleColor, 3, normal.multiply(24))


		// draw control point
		if (this.mouseOverPoint === controlPoint) {
			controlPoint.draw(context, 'white', 'circle', 12)
		}
		controlPoint.draw(context, controlPointColor, 'square', 10)

		// draw projection line
		projectionLine.draw(context, projectionLineColor)

	}
})
