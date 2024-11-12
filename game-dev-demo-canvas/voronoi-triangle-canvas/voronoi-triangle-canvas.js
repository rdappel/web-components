
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
		this.closestPoint = triangle.getClosestPoint(controlPoint.position)

		// calculate exterior voronoi regions based on corner normals
		const voronoiPoints = triangle.getEdges().reduce((acc, edge) => {
			const vector = edge.toVector()
			const normal = new Vector2(-vector.y, vector.x).multiply(3)
			const p0 = edge.start.add(normal)
			const p1 = edge.end.add(normal)
			return [ ...acc, { edge, p0, p1 } ]
		}, [ ])

		this.voronoiRegions = voronoiPoints.reduce((acc, { edge, p0, p1 }, index) => {
			const { length } = voronoiPoints
			const previousIndex = (index === 0 ? length : index) - 1
			const previous = voronoiPoints[previousIndex]
			const newTriangle = new Polygon([ edge.start, p0, previous.p1 ])
			const newRectangle = new Polygon([ edge.start, edge.end, p1, p0 ])
			return [ ...acc, newTriangle, newRectangle ]
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

		const outerLineColorNormal = setColorAlpha(this.exteriorLineColor, 0.5)
		const selectedRegion = this.voronoiRegions.reduce((acc, region) => {
			if (isPointInTriangle) {
				region.draw(context, 'transparent', outerLineColorNormal)
				return acc
			}

			const isControlPointInRegion = region.isPointInside(controlPoint.position)
			if (!isControlPointInRegion) {
				region.draw(context, 'transparent', outerLineColorNormal)
				return acc
			}

			return region
		}, null)

		const selectedColor = setColorAlpha(voronoiRegionColor, 0.5)
		if (selectedRegion) selectedRegion.draw(context, selectedColor, voronoiRegionColor)

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

	}
})
