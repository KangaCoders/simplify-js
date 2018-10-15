/*
 (c) 2017, Vladimir Agafonkin
 Simplify.js, a high-performance JS polyline simplification library
 mourner.github.io/simplify-js
*/

// to suit your point format, run search/replace for '.latitude' and '.longitude';
// for 3D version, see 3d branch (configurability would draw significant performance overhead)

// square distance between 2 points
const getSqDist = (p1, p2) => {

    var dx = p1.latitude - p2.latitude,
        dy = p1.longitude - p2.longitude;

    return dx * dx + dy * dy;
}

// square distance from a point to a segment
const getSqSegDist = (p, p1, p2) => {

    var x = p1.latitude,
        y = p1.longitude,
        dx = p2.latitude - x,
        dy = p2.longitude - y;

    if (dx !== 0 || dy !== 0) {

        var t = ((p.latitude - x) * dx + (p.longitude - y) * dy) / (dx * dx + dy * dy);

        if (t > 1) {
            x = p2.latitude;
            y = p2.longitude;

        } else if (t > 0) {
            x += dx * t;
            y += dy * t;
        }
    }

    dx = p.latitude - x;
    dy = p.longitude - y;

    return dx * dx + dy * dy;
}
// rest of the code doesn't care about point format

// basic distance-based simplification
const simplifyRadialDist = (points, sqTolerance) => {

    var prevPoint = points[0],
        newPoints = [prevPoint],
        point;

    for (var i = 1, len = points.length; i < len; i++) {
        point = points[i];

        if (getSqDist(point, prevPoint) > sqTolerance) {
            newPoints.push(point);
            prevPoint = point;
        }
    }

    if (prevPoint !== point) newPoints.push(point);

    return newPoints;
}

const simplifyDPStep = (points, first, last, sqTolerance, simplified) => {
    var maxSqDist = sqTolerance,
        index;

    for (var i = first + 1; i < last; i++) {
        var sqDist = getSqSegDist(points[i], points[first], points[last]);

        if (sqDist > maxSqDist) {
            index = i;
            maxSqDist = sqDist;
        }
    }

    if (maxSqDist > sqTolerance) {
        if (index - first > 1) simplifyDPStep(points, first, index, sqTolerance, simplified);
        simplified.push(points[index]);
        if (last - index > 1) simplifyDPStep(points, index, last, sqTolerance, simplified);
    }
}

// simplification using Ramer-Douglas-Peucker algorithm
const simplifyDouglasPeucker = (points, sqTolerance) => {
    var last = points.length - 1;

    var simplified = [points[0]];
    simplifyDPStep(points, 0, last, sqTolerance, simplified);
    simplified.push(points[last]);

    return simplified;
}

// both algorithms combined for awesome performance
export default simplify = (points, tolerance, highestQuality) => {

    if (points.length <= 2) return points;

    var sqTolerance = tolerance !== undefined ? tolerance * tolerance : 1;

    points = highestQuality ? points : simplifyRadialDist(points, sqTolerance);
    points = simplifyDouglasPeucker(points, sqTolerance);

    return points;
}
