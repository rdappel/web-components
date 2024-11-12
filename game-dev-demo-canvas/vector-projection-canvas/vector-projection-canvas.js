
import {
	Vector2,
	Point,
	LineSegment,
	setColorAlpha,
	Size2D,
	Rectangle,
	Triangle,
	Polygon
} from '../common.js'

window.customElements.define('vector-projection-canvas', class extends HTMLElement {

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

		this.lineColor = this.lineColor || 'rgb(136, 34, 34)'
		this.pointColor = this.pointColor || 'rgb(34, 34, 136)'
		this.projectionVectorColor = this.projectionVectorColor || 'rgb(34, 136, 34)'
		this.defaultLineColor = this.defaultLineColor || 'rgb(0, 0, 0, 0.3)'
		this.textColor = this.textColor || 'rgb(0, 0, 0)'

		this.selectedPoint = null
		this.draggablePoints = []

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
		this.p0 = new Point(new Vector2(150, 90), 12)
		this.p1 = new Point(new Vector2(70, 250), 12)
		this.p2 = new Point(new Vector2(250, 145), 12)

		this.draggablePoints.push(this.p0, this.p1, this.p2)
	}

	getMousePosition({ clientX, clientY }) {
		const { x, y } = this.getBoundingClientRect()
		const mousePosition = new Vector2(clientX - x, clientY - y)
		return mousePosition.divideByVector(this.scale)
	}

	addEventListeners() {
		const { canvas, triangle } = this

		canvas.addEventListener('mousemove', event => {
			const mousePosition = this.getMousePosition(event)

			if (this.selectedPoint) {
				this.selectedPoint.position = mousePosition
				console.log(this.selectedPoint.position)
				return
			}

			this.mouseOverPoint = this.getMouseOverPoint(mousePosition)
			canvas.style.cursor = this.mouseOverPoint ? 'pointer' : 'default'
		})

		canvas.addEventListener('mousedown', () => this.selectedPoint = this.mouseOverPoint)
		canvas.addEventListener('mouseup', () => this.selectedPoint = null)
	}

	getMouseOverPoint(mousePosition) {
		for (const point of this.draggablePoints) {
			if (point.isMouseOver(mousePosition, 12)) return point
		}
		return null
	}

	draw() {
		const {
			context, p0, p1, p2,
			lineColor, pointColor,
			projectionVectorColor,
			defaultLineColor, textColor
		} = this

		const textOffset = new Vector2(12, -12)

		const lineColor50 = setColorAlpha(lineColor, 0.5)
		const line = (new LineSegment(p1.position, p2.position)).extend(340)

		const pointColor50 = setColorAlpha(pointColor, 0.5)
		const pointVector = p0.position.subtract(p1.position)

		const projectionVector = pointVector.projectOnto(line.toVector())
		const projectionPoint = p1.position.add(projectionVector)
		const orthogonalLine = new LineSegment(p0.position, projectionPoint)

		const boxSideLength = 10
		const boxSideLengthSquared = boxSideLength ** 2
		if (orthogonalLine.toVector().lengthSquared() > boxSideLengthSquared
			&& projectionVector.lengthSquared() > boxSideLengthSquared) {

			const boxVector1 = projectionVector.normalize().multiply(-boxSideLength)
			const points = [
				projectionPoint.add(boxVector1),
				projectionPoint.add(boxVector1).add(boxVector1.left()),
				projectionPoint.add(boxVector1.left())
			]
			const boxLine1 = new LineSegment(points[0], points[1])
			const boxLine2 = new LineSegment(points[1], points[2])
			boxLine1.draw(context, defaultLineColor, 1)
			boxLine2.draw(context, defaultLineColor, 1)
		}

		line.draw(context, lineColor50, 1)
		orthogonalLine.draw(context, defaultLineColor, 1)
		pointVector.draw(context, p1.position, pointColor50, 2)
		projectionVector.draw(context, p1.position, projectionVectorColor, 2)
		p1.draw(context, lineColor, 'square', 10)
		p2.draw(context, lineColor, 'square', 10)
		p0.draw(context, pointColor, 'square', 10)

		context.font = '12px sans-serif'
		context.fillStyle = textColor
		const p0textPosition = p0.position.add(textOffset)
		const p1textPosition = p1.position.add(textOffset)
		const p2textPosition = p2.position.add(textOffset)
		context.fillText('p0', p0textPosition.x, p0textPosition.y)
		context.fillText('p1', p1textPosition.x, p1textPosition.y)
		context.fillText('p2', p2textPosition.x, p2textPosition.y)

	}
})
