
import {
	Vector2,
	LineSegment,
	setColorAlpha,
	Rectangle,
} from './common.js'

window.customElements.define('aabb-aabb-sepaxis-canvas', class extends HTMLElement {

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
		this.rectangleAColor = this.rectangleAColor || 'rgb(34, 34, 136)'
		this.rectangleBColor = this.rectangleBColor || 'rgb(136, 34, 34)'
		this.defaultLineColor = this.defaultLineColor || 'rgba(0, 0, 0, 0.3)'

		//this.axisDistanceFromEdge = 24

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
		this.redRectangle = new Rectangle(
			new Vector2(160, 120),
			new Vector2(60, 125)
		)

		this.blueRectangle = new Rectangle(
			new Vector2(95, 45),
			new Vector2(85, 45)
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

			this.mouseOverObject = this.redRectangle.isPointInside(mousePosition)
				? this.redRectangle
				: this.blueRectangle.isPointInside(mousePosition)
				? this.blueRectangle
				: null

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
			redRectangle, blueRectangle,
			rectangleAColor, rectangleBColor,
			axisLineColor,
		} = this

		const rectangleAColor50 = setColorAlpha(rectangleAColor, 0.5)
		const rectangleBColor50 = setColorAlpha(rectangleBColor, 0.5)
		const axisLineColor50 = setColorAlpha(axisLineColor, 0.5)

		const overlapLineX = new LineSegment(
			new Vector2(0, 320),
			new Vector2(340, 320)
		)
		const overlapLineY = new LineSegment(
			new Vector2(320, 0),
			new Vector2(320, 340)
		)

		const up = new Vector2(0, -10)
		const redLineX = new LineSegment(overlapLineX.start.add(up), overlapLineX.end.add(up))
		const blueLineX = new LineSegment(redLineX.start.add(up), redLineX.end.add(up))
		const displaceLineX = new LineSegment(overlapLineX.start.subtract(up), overlapLineX.end.subtract(up))

		const left = new Vector2(-10, 0)
		const redLineY = new LineSegment(overlapLineY.start.add(left), overlapLineY.end.add(left))
		const blueLineY = new LineSegment(redLineY.start.add(left), redLineY.end.add(left))
		const displaceLineY = new LineSegment(overlapLineY.start.subtract(left), overlapLineY.end.subtract(left))

		context.lineCap = 'round'

		blueRectangle.draw(context, rectangleAColor50, rectangleAColor)
		redRectangle.draw(context, rectangleBColor50, rectangleBColor)

		const centerLine = new LineSegment(blueRectangle.position, redRectangle.position)
		centerLine.draw(context, axisLineColor50, 0.5)
		const centerVector = centerLine.toVector()

		const displaceVectors = []

		{ // x axis
			const distanceP0 = overlapLineX.getPointClosestTo(blueRectangle.position)
			const distanceP1 = overlapLineX.getPointClosestTo(redRectangle.position)
			const distanceLine = new LineSegment(distanceP0, distanceP1)
			distanceLine.draw(context, axisLineColor, 3)
			const line0 = new LineSegment(blueRectangle.position, distanceP0)
			const line1 = new LineSegment(redRectangle.position, distanceP1)
			line0.draw(context, rectangleAColor50, 0.5)
			line1.draw(context, rectangleBColor50, 0.5)

			const pBlue = blueRectangle.getClosestCorner(redRectangle.position)
			const blueHalfP0 = blueLineX.getPointClosestTo(pBlue)
			const blueHalfP1 = blueLineX.getPointClosestTo(blueRectangle.position)
			const blueHalfLine = new LineSegment(blueHalfP0, blueHalfP1)
			blueHalfLine.draw(context, rectangleAColor, 3)
			const blueConnect = new LineSegment(blueHalfP0, pBlue)
			blueConnect.draw(context, rectangleAColor50, 0.5)

			const pRed = redRectangle.getClosestCorner(blueRectangle.position)
			const redHalfP0 = redLineX.getPointClosestTo(pRed)
			const redHalfP1 = redLineX.getPointClosestTo(redRectangle.position)
			const redHalfLine = new LineSegment(redHalfP0, redHalfP1)
			redHalfLine.draw(context, rectangleBColor, 3)
			const redConnect = new LineSegment(redHalfP0, pRed)
			redConnect.draw(context, rectangleBColor50, 0.5)

			// get lengths of 3 lines
			const blueLine = blueRectangle.halfWidth
			const redLine = redRectangle.halfWidth 
			const overlap = distanceLine.toVector().length()
			const sum = blueLine + redLine

			// see if there's overlap
			if (overlap < sum) {
				const displaceVector = new Vector2(-centerVector.x, 0).normalize().multiply(sum - overlap)
				const start = displaceLineX.getPointClosestTo(pBlue)
				displaceVectors.push({displaceVector, start})
			}
		}

		{ // y axis
			const distanceP0 = overlapLineY.getPointClosestTo(blueRectangle.position)
			const distanceP1 = overlapLineY.getPointClosestTo(redRectangle.position)
			const distanceLine = new LineSegment(distanceP0, distanceP1)
			distanceLine.draw(context, axisLineColor, 3)
			const line0 = new LineSegment(blueRectangle.position, distanceP0)
			const line1 = new LineSegment(redRectangle.position, distanceP1)
			line0.draw(context, rectangleAColor50, 0.5)
			line1.draw(context, rectangleBColor50, 0.5)

			const pBlue = blueRectangle.getClosestCorner(redRectangle.position)
			const blueHalfP0 = blueLineY.getPointClosestTo(pBlue)
			const blueHalfP1 = blueLineY.getPointClosestTo(blueRectangle.position)
			const blueHalfLine = new LineSegment(blueHalfP0, blueHalfP1)
			blueHalfLine.draw(context, rectangleAColor, 3)
			const blueConnect = new LineSegment(blueHalfP0, pBlue)
			blueConnect.draw(context, rectangleAColor50, 0.5)
			
			const pRed = redRectangle.getClosestCorner(blueRectangle.position)
			const redHalfP0 = redLineY.getPointClosestTo(pRed)
			const redHalfP1 = redLineY.getPointClosestTo(redRectangle.position)
			const redHalfLine = new LineSegment(redHalfP0, redHalfP1)
			redHalfLine.draw(context, rectangleBColor, 3)
			const redConnect = new LineSegment(redHalfP0, pRed)
			redConnect.draw(context, rectangleBColor50, 0.5)

			// get lengths of 3 lines
			const blueLine = blueRectangle.halfHeight
			const redLine = redRectangle.halfHeight
			const overlap = distanceLine.toVector().length()
			const sum = blueLine + redLine

			// see if there's overlap
			if (overlap < sum) {
				const displaceVector = new Vector2(0, -centerVector.y).normalize().multiply(sum - overlap)
				const start = displaceLineY.getPointClosestTo(pBlue)
				displaceVectors.push({displaceVector, start})
			}
		}

		if (displaceVectors.length === 0) return

		if (displaceVectors.length === 1) {
			const {displaceVector, start} = displaceVectors[0]
			displaceVector.draw(context, start, this.defaultLineColor, 3)
			return
		}

		displaceVectors
			.sort((a, b) => a.displaceVector.lengthSquared() - b.displaceVector.lengthSquared())
			.forEach(({displaceVector, start}, index) => {
				const color = index === 0 ? 'purple' : this.defaultLineColor
				displaceVector.draw(context, start, color, 3)
			})
	}
})
