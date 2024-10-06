var regionData = [
    {
        "type": "Feature",
        "properties": {
            "name": "Region 1",
            "date": "2024-05-13" // Date information for coloring
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [14.256091062685005, 50.10798943445807],
                    [14.294739742384232, 50.10527037001419],
                    [14.278471803225118, 50.09230526611354],
                    [14.256091062685005, 50.10798943445807]
                    // Repeat the first point to close the polygon
                ]
            ]
        }
    },
    {
        "type": "Feature",
        "properties": {
            "name": "Region 2",
            "date": "2024-05-13" // Date information for coloring
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [14.239034374960603, 50.09995826392548],
                    [14.249781074162682, 50.101855512296034],
                    [14.261020741218069, 50.09293779160902],
                    [14.246231705618877, 50.08939554129554],
                    [14.232527199296957, 50.09306429570621],
                    [14.239034374960603, 50.09995826392548]
                    // Repeat the first point to close the polygon
                ]
            ]
        }
    },
    // Add more regions as needed
];

//access first coordinates
//console.log(regionData[0].geometry.coordinates[0]);


let selectionRegion = null;


function returnAllDataPointsInsideTimespan() {
    var returnData = data.filter(d => {
        const date = new Date(d.properties.date); // Assuming date is stored in properties as a string
        return (date >= new Date(globalStartDate) && date <= new Date(globalEndDate));
    });
    return returnData
}



function findComplexRegionWithinBounds(bounds, svg) {
    const dataPoints = bounds;

    // Calculate the convex hull of the points to form a polygonal region
    const hull = calculateConvexHull(bounds);

    // Define the bounding box of the convex hull
    const [swLon, swLat, neLon, neLat] = calculateBoundingBox(hull);

    // Filter data points within the geographical bounds
    var dataPointsInBounds = data.filter(d => {
        const [pointLon, pointLat] = d.geometry.coordinates;
        const date = new Date(d.properties.date); // Assuming date is stored in properties as a string
        //console.log("Global start and end date = " + new Date(globalStartDate) + " " + globalEndDate + " Date " + date);
        return (

            pointLon >= swLon && pointLon <= neLon &&
            pointLat >= swLat && pointLat <= neLat &&
            isPointInsidePolygon(hull, pointLon, pointLat) &&
            date >= new Date(globalStartDate) && date <= new Date(globalEndDate)
        );
    });

    updateChartWithNewData(dataPointsInBounds);

    // Bind filtered data to the selection
    var svgPoints = glyphs.selectAll("path")
        .data(dataPointsInBounds, d => `${d.properties.name}-${d.geometry.coordinates[0]}-${d.geometry.coordinates[1]}`);

    // Filter svgPoints if the fill is not rgba(0, 0, 0, 0)
    svgPoints = svgPoints.filter(function (d) {
        return d3.select(this).style("fill") !== "rgba(0, 0, 0, 0)";
    });

    // Make all elements default
    glyphs.selectAll("path")
        .style("stroke", "none");

    // Update existing elements
    svgPoints
        .style("stroke", "black")
        .style("stroke-width", "2px"); // Set stroke attribute for existing elements

    // Return the data points within bounds
    return dataPointsInBounds;
}


function calculateConvexHull(points) {
    // Implement convex hull algorithm to find the smallest convex polygon enclosing all points
    // You can use libraries like d3.js or implement your own algorithm
    // Here's a simplified example using d3.js
    return d3.polygonHull(points);
}

function calculateBoundingBox(points) {
    // Calculate the bounding box of a set of points
    const swLon = Math.min(...points.map(point => point[0]));
    const swLat = Math.min(...points.map(point => point[1]));
    const neLon = Math.max(...points.map(point => point[0]));
    const neLat = Math.max(...points.map(point => point[1]));
    return [swLon, swLat, neLon, neLat];
}

function isPointInsidePolygon(polygon, x, y) {
    // Implement point-in-polygon algorithm
    // You can use libraries like d3.js or implement your own algorithm
    // Here's a simplified example using d3.js
    return d3.polygonContains(polygon, [x, y]);
}
