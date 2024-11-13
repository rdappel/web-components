

class Vector2 {
	constructor(x, y) { this.x = x; this.y = y }
	add(vector) { return new Vector2(this.x + vector.x, this.y + vector.y) }
	subtract(vector) { return new Vector2(this.x - vector.x, this.y - vector.y) }
	multiply(scalar) { return new Vector2(this.x * scalar, this.y * scalar) }
	divide(scalar) { return new Vector2(this.x / scalar, this.y / scalar) }
	divideByVector(vector) { return new Vector2(this.x / vector.x, this.y / vector.y) }
	dot(vector) { return this.x * vector.x + this.y * vector.y }
	lengthSquared() { return this.x * this.x + this.y * this.y }
	length() { return Math.sqrt(this.lengthSquared()) }
	normalize() { return this.divide(this.length()) }
	left() { return new Vector2(-this.y, this.x) }
	right() { return new Vector2(this.y, -this.x) }
	draw(context, startPosition, color, lineWidth = 1) {
		const { x, y } = this
		context.strokeStyle = color
		context.lineWidth = lineWidth
		context.beginPath()
		context.moveTo(startPosition.x, startPosition.y)
		context.lineTo(startPosition.x + x, startPosition.y + y) 
		const headLength = 10
		const angle = Math.atan2(y, x)
		const piOver6 = Math.PI / 6
		context.lineTo(
			startPosition.x + x - headLength * Math.cos(angle - piOver6),
			startPosition.y + y - headLength * Math.sin(angle - piOver6)
		)
		context.moveTo(startPosition.x + x, startPosition.y + y)
		context.lineTo(
			startPosition.x + x - headLength * Math.cos(angle + piOver6),
			startPosition.y + y - headLength * Math.sin(angle + piOver6)
		)
		context.stroke()
	}
	equals(vector) {
		if (!vector) return false
		return this.x === vector.x && this.y === vector.y
	}
	projectOnto(vector) {
		const scalar = this.dot(vector) / vector.lengthSquared()
		return vector.multiply(scalar)
	}
}

class Point {
	constructor(position, draggableSize = 0) { this.position = position; this.draggableSize = draggableSize }
	draw(context, color, shape = 'square', size = 5) {
		context.fillStyle = color
		if (shape === 'circle') {
			context.beginPath()
			context.arc(this.position.x, this.position.y, size, 0, 2 * Math.PI)
			context.fill()
		} else {
			const halfSize = size / 2
			context.fillRect(this.position.x - halfSize, this.position.y - halfSize, size, size)
		}
	}

	isMouseOver(mousePosition) {
		if (!this.draggableSize || !mousePosition) return false
		const { x, y } = this.position
		const padding = this.draggableSize
		return mousePosition.x > x - padding && mousePosition.x < x + padding &&
			mousePosition.y > y - padding && mousePosition.y < y + padding
	}
}

class LineSegment {
	constructor(start, end) { this.start = start; this.end = end }
	getPointClosestTo(point) {
		const startToPoint = point.subtract(this.start)
		const startToEnd = this.end.subtract(this.start)
		const t = startToPoint.dot(startToEnd) / startToEnd.lengthSquared()
		if (t < 0) return this.start
		if (t > 1) return this.end
		return this.start.add(startToEnd.multiply(t))
	}
	extend(startDistance, endDistance = startDistance) {
		const startToEnd = this.end.subtract(this.start)
		const start = this.start.subtract(startToEnd.normalize().multiply(startDistance))
		const end = this.end.add(startToEnd.normalize().multiply(endDistance))
		return new LineSegment(start, end)
	}
	draw(context, color, lineWidth = 1, offset = null) {
		context.beginPath()
		context.strokeStyle = color
		context.lineWidth = lineWidth
		const { x, y } = offset || new Vector2(0, 0)
		context.moveTo(this.start.x + x, this.start.y + y)
		context.lineTo(this.end.x + x, this.end.y + y)
		context.stroke()
	}
	toVector() { return this.end.subtract(this.start) }
}

class Rectangle {
	constructor(position, size) { this.position = position; this.size = size }
	get halfWidth() { return this.size.x / 2 }
	get halfHeight() { return this.size.y / 2 }
	get left() { return this.position.x - this.halfWidth }
	get right() { return this.position.x + this.halfWidth }
	get top() { return this.position.y - this.halfHeight }
	get bottom() { return this.position.y + this.halfHeight }
	get topLeft() { return new Vector2(this.left, this.top) }
	get topRight() { return new Vector2(this.right, this.top) }
	get bottomLeft() { return new Vector2(this.left, this.bottom) }
	get bottomRight() { return new Vector2(this.right, this.bottom) }
	get center() { return this.position }
	get leftEdge() { return new LineSegment(this.topLeft, this.bottomLeft) }
	get rightEdge() { return new LineSegment(this.topRight, this.bottomRight) }
	get topEdge() { return new LineSegment(this.topLeft, this.topRight) }
	get bottomEdge() { return new LineSegment(this.bottomLeft, this.bottomRight) }
	draw(context, fillStyle, strokeStyle, lineWidth = 1) { 
		context.fillStyle = fillStyle
		context.strokeStyle = strokeStyle
		context.lineWidth = lineWidth
		const { left, top, size: { x, y } } = this
		context.fillRect(left, top, x, y)
		context.strokeRect(left, top, x, y)
	}
	isPointInside({ x, y }) {
		const { left, right, top, bottom } = this
		return x > left() && x < right() && y > top() && y < bottom()
	}
}

class Circle {
	constructor(center, radius) { this.center = center; this.radius = radius }
	draw(context, fillStyle, strokeStyle, lineWidth = 1) {
		context.fillStyle = fillStyle
		context.strokeStyle = strokeStyle
		context.lineWidth = lineWidth
		context.beginPath()
		context.arc(this.center.x, this.center.y, this.radius, 0, 2 * Math.PI)
		context.fill()
		context.stroke()
	}
	isPointInside({ x, y }) {
		const { center, radius } = this
		const dx = x - center.x
		const dy = y - center.y
		return dx ** 2 + dy ** 2 < radius * radius
	}
}


class Triangle {
	constructor(a, b, c) { this.a = a; this.b = b; this.c = c }
	draw(context, fillStyle, strokeStyle, lineWidth = 1) {
		context.fillStyle = fillStyle
		context.strokeStyle = strokeStyle
		context.lineWidth = lineWidth
		context.beginPath()
		context.moveTo(this.a.x, this.a.y)
		context.lineTo(this.b.x, this.b.y)
		context.lineTo(this.c.x, this.c.y)
		context.closePath()
		context.fill()
		context.stroke()
	}
	getCentroid() {
		return new Vector2(
			(this.a.x + this.b.x + this.c.x) / 3,
			(this.a.y + this.b.y + this.c.y) / 3
		)
	}
	getEdges() {
		return [
			new LineSegment(this.a, this.b),
			new LineSegment(this.b, this.c),
			new LineSegment(this.c, this.a)
		]
	}
	getArea() {
		const ab = this.b.subtract(this.a)
		const ac = this.c.subtract(this.a)
		return Math.abs(ab.x * ac.y - ab.y * ac.x) / 2
	}
	getSubTriangles(point) {
		const p = point || this.getCentroid()
		const ab = new Triangle(this.a, this.b, p)
		const bc = new Triangle(this.b, this.c, p)
		const ca = new Triangle(this.c, this.a, p)
		return [ab, bc, ca]
	}
	isPointInside({ x, y }) {
		const areas = this.getSubTriangles(new Vector2(x, y))
			.reduce((acc, triangle) => triangle.getArea() + acc, 0)		
		const area = this.getArea()
		const delta = 0.001
		return Math.abs(areas - area) < delta
	}
	getClosestPoint(point) {
		const edges = this.getEdges()
		const closestPoints = edges.map(edge => edge.getPointClosestTo(point))
		const distances = closestPoints.map(closestPoint => closestPoint.subtract(point).length())
		const minDistance = Math.min(...distances)
		return closestPoints[distances.indexOf(minDistance)]
	}
	getClosestSide(point) {
		const edges = this.getEdges()
		const closestPoints = edges.map(edge => edge.getPointClosestTo(point))
		const distances = closestPoints.map(closestPoint => closestPoint.subtract(point).length())
		const minDistance = Math.min(...distances)
		return edges[distances.indexOf(minDistance)]
	}
}

class Polygon {
	constructor(points) { this.points = points }
	draw(context, fillStyle, strokeStyle, lineWidth = 1) {
		context.fillStyle = fillStyle
		context.strokeStyle = strokeStyle
		context.lineWidth = lineWidth
		context.beginPath()
		const [first, ...rest] = this.points
		context.moveTo(first.x, first.y)
		rest.forEach(point => context.lineTo(point.x, point.y))
		context.closePath()
		context.fill()
		context.stroke()
	}
	isPointInside(point) {
		const { x, y } = point
		const { points } = this
		const n = points.length
		let isInside = false
		for (let i = 0, j = n - 1; i < n; j = i++) {
			const xi = points[i].x
			const yi = points[i].y
			const xj = points[j].x
			const yj = points[j].y
			const intersect = ((yi > y) !== (yj > y)) &&
				(x < (xj - xi) * (y - yi) / (yj - yi) + xi)
			if (intersect) isInside = !isInside
		}
		return isInside
	}
	getPoints() { return this.points }
}

function setColorAlpha(color, alpha) {
	const [r, g, b] = color.match(/\d+/g)
	return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export { Vector2, Point, LineSegment, Rectangle, Circle, Triangle, Polygon, setColorAlpha }