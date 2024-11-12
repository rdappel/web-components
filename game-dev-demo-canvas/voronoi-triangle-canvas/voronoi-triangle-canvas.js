
import {
	Vector2,
	Point,
	LineSegment,
	setColorAlpha,
	Size2D,
	Rectangle,
	Triangle
} from '../common.js'

window.customElements.define('voronoi-triangle-canvas', class extends HTMLElement {

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

		this.controlPointColor = this.controlPointColor || 'rgb(34, 34, 136)'
		this.controlLineColor = this.controlLineColor || 'rgb(34, 136, 34)'
		this.triangleColor = this.triangleColor || 'rgb(136, 34, 34)'
		this.exteriorLineColor = this.exteriorLineColor || 'rgb(136, 34, 34)'
		this.defaultLineColor = this.defaultLineColor || 'rgb(0, 0, 0)'
		this.voronoiRegionColor = this.voronoiRegionColor || 'rgb(34, 136, 34)'

		this.selectedPoint = null
		this.draggablePoints = []
		this.closestPoint = new Vector2(129.13, 138.77)

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
		const position = new Vector2(170, 170)
		this.rectangle = new Rectangle(position, new Size2D(100, 80))

		const controlPoint = new Point(new Vector2(150, 95), true)
		this.controlPoint = controlPoint
		this.draggablePoints.push(controlPoint)
		
		const triangle = new Triangle(
			new Vector2(110, 130),
			new Vector2(90, 245),
			new Vector2(230, 185)
		)
		this.triangle = triangle

		// calculate exterior voronoi regions based on corner normals
		this.voronoiPoints = triangle.getEdges().reduce((acc, side) => {
			const vector = side.toVector()
			const normal = new Vector2(-vector.y, vector.x).multiply(3)
			const p0 = side.start.add(normal)
			const p1 = side.end.add(normal) 
			return [ ...acc, [ p0, p1 ] ]
		}, [ ])
	}

	getMousePosition({ clientX, clientY }) {
		const { x, y } = this.getBoundingClientRect()
		const mousePosition = new Vector2(clientX - x, clientY - y)
		mousePosition.x /= this.scale.x
		mousePosition.y /= this.scale.y
		return mousePosition
	}

	addEventListeners() {
		const { canvas, triangle } = this

		canvas.addEventListener('mousemove', event => {
			const mousePosition = this.getMousePosition(event)

			if (this.selectedPoint) {
				this.selectedPoint.position = mousePosition
				this.closestPoint = triangle.getClosestPoint(mousePosition)
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
			context,
			triangle, triangleColor,
			controlPoint, controlPointColor,
			controlLineColor, defaultLineColor,
			voronoiRegionColor
		} = this

		const isPointInTriangle = triangle.isPointInside(controlPoint.position)
		
		if(!isPointInTriangle) {
			const closestPoint = triangle.getClosestPoint(controlPoint.position)
			const closestSide = triangle.getClosestSide(controlPoint.position)
			if (closestPoint.equals(closestSide.start) || closestPoint.equals(closestSide.end)) {
				// closest point is a corner
				// todo: color background of voronoi region
			}
			else {
				// closest point is on side
				// todo: color background of voronoi region
			}
		}

		const outerLineColor = setColorAlpha(this.exteriorLineColor, 0.5)
		this.voronoiPoints.forEach((voronoiRegion, index) => {
			const side = triangle.getEdges()[index]
			const [ p0, p1 ] = voronoiRegion
			const line1 = new LineSegment(p0, p1)
			const line2 = new LineSegment(side.start, p0)
			const line3 = new LineSegment(side.end, p1)
			line1.draw(context, outerLineColor, 1)
			line2.draw(context, outerLineColor, 1)
			line3.draw(context, outerLineColor, 1)
		})

		const lineColor = setColorAlpha(defaultLineColor, 0.3)
		if (isPointInTriangle) {
			const triangles = triangle.getSubTriangles()
			let mouseOverSubTriangle = null
			triangles.forEach((subTriangle) => {
				if (subTriangle.isPointInside(controlPoint.position)) {
					mouseOverSubTriangle = subTriangle
					return
				}
				subTriangle.draw(context, setColorAlpha(triangleColor, 0.5), lineColor, 1)
			})

			if (mouseOverSubTriangle) {
				const fillColor = setColorAlpha(voronoiRegionColor, 0.5)
				mouseOverSubTriangle.draw(context, fillColor, voronoiRegionColor,  1)
			}
		}
		else {
			triangle.draw(context, setColorAlpha(triangleColor, 0.5), triangleColor, 1)
			const centroid = triangle.getCentroid()
			const centroidLine1 = new LineSegment(triangle.a, centroid)
			const centroidLine2 = new LineSegment(triangle.b, centroid)
			const centroidLine3 = new LineSegment(triangle.c, centroid)
			centroidLine1.draw(context, lineColor, 1)
			centroidLine2.draw(context, lineColor, 1)
			centroidLine3.draw(context, lineColor, 1)
		}

		// draw control point
		if (this.mouseOverPoint === controlPoint) {
			controlPoint.draw(context, 'rgb(255, 255, 255, 0.75)', 'circle', 12)
		}

		// draw closest point
		const lineToClosest = new LineSegment(controlPoint.position, this.closestPoint)
		lineToClosest.draw(context, controlLineColor, 2)

		controlPoint.draw(context, controlPointColor, 'square', 10)

		// if (closestSide) {
		// 	closestSide.draw(context, controlLineColor, 5)
		// }

	}
})
