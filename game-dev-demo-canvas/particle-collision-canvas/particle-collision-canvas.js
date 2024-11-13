
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

window.customElements.define('particle-collision-canvas', class extends HTMLElement {

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
        this.frictionSliderColor = 'rgb(136, 34, 34)'
        this.bounceSliderColor = 'rgb(34, 34, 136)'

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
        const minX = 20
        const maxX = 320

        const frictionY = 290
        const frictionStart = new Vector2(minX, frictionY)
        const frictionEnd = new Vector2(maxX, frictionY)
        this.frictionSliderLine = new LineSegment(frictionStart, frictionEnd)
        this.frictionSliderPoint = new Point(frictionStart.add(frictionEnd).divide(2), 12)

        const bounceY = 320
        const bounceStart = new Vector2(minX, bounceY)
        const bounceEnd = new Vector2(maxX, bounceY)
		this.bounceSliderLine = new LineSegment(bounceStart, bounceEnd)
        this.bounceSliderPoint = new Point(bounceStart.add(bounceEnd).divide(2), 12)

        this.draggablePoints.push(this.frictionSliderPoint, this.bounceSliderPoint)
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
            const sp = this.selectedPoint
			if (sp) {
				sp.position = mousePosition
                if (sp === this.frictionSliderPoint) {
                    sp.position = this.frictionSliderLine.getPointClosestTo(sp.position)
                }
                if (sp === this.bounceSliderPoint) {
                    sp.position = this.bounceSliderLine.getPointClosestTo(sp.position)
                }
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
			context, textColor,
            frictionSliderPoint, frictionSliderLine, frictionSliderColor,
            bounceSliderPoint, bounceSliderLine, bounceSliderColor,
		} = this

        const highlightPoint = this.selectedPoint || this.mouseOverPoint
		if (highlightPoint) {
			const size = highlightPoint.draggableSize
			highlightPoint.draw(context, 'white', 'circle', size)
		}

        bounceSliderLine.draw(context, bounceSliderColor, 2)
        bounceSliderPoint.draw(context, bounceSliderColor, 'square', 10)

        frictionSliderLine.draw(context, frictionSliderColor, 2)
        frictionSliderPoint.draw(context, frictionSliderColor, 'square', 10)

		context.font = '12px Tahoma'
		context.fillStyle = textColor
		const textOffset = new Vector2(12, -12)
		const bouncePosition = bounceSliderPoint.position.add(textOffset)
		const frictionPosition = frictionSliderPoint.position.add(textOffset)
		context.fillText('bounce', bouncePosition.x, bouncePosition.y)
		context.fillText('friction', frictionPosition.x, frictionPosition.y)

	}
})
