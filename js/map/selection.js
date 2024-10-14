function enableRectangleSelection(zoomableMap) {
    const svg = d3.select("#map");
    let startPoint, endPoint, selectionRect;

    svg.on("mousedown", (event) => {
        if (event.button === 2) { // Check if right mouse button is pressed
            event.preventDefault();
            startPoint = d3.pointer(event);
            if (selectionRect) {
                selectionRect.remove();
            }
            selectionRect = svg.append("rect")
                .attr("x", startPoint[0])
                .attr("y", startPoint[1])
                .attr("width", 0)
                .attr("height", 0)
                .attr("fill", "rgba(0, 0, 255, 0.3)")
                .attr("stroke", "blue")
                .attr("stroke-width", 1);

            svg.on("mousemove", mousemoveHandler);
        }
    });

    function mousemoveHandler(event) {
        if (startPoint) {
            endPoint = d3.pointer(event);
            const x = Math.min(startPoint[0], endPoint[0]);
            const y = Math.min(startPoint[1], endPoint[1]);
            const width = Math.abs(startPoint[0] - endPoint[0]);
            const height = Math.abs(startPoint[1] - endPoint[1]);
            selectionRect
                .attr("x", x)
                .attr("y", y)
                .attr("width", width)
                .attr("height", height);
        }
    }

    svg.on("mouseup", (event) => {
        if (event.button === 2 && startPoint) { // Check if right mouse button is released
            endPoint = d3.pointer(event);
            const x0 = Math.min(startPoint[0], endPoint[0]);
            const y0 = Math.min(startPoint[1], endPoint[1]);
            const x1 = Math.max(startPoint[0], endPoint[0]);
            const y1 = Math.max(startPoint[1], endPoint[1]);
            const filters = getFilters();
            var somethingSelected = true;

            glyphs.selectAll("path").each(function (d) {
                const [gx, gy] = projection([d.geometry.coordinates[0], d.geometry.coordinates[1]]);
                const element = document.getElementById(d.properties.id);
                console.log("Checking element for ID: ", d.properties.id);
                console.log("Element: ", element);
                // Debugging the ID
                //console.log("Checking element for ID: ", d.properties.id);

                if (element) {
                    if (gx >= x0 && gx <= x1 && gy >= y0 && gy <= y1) {
                        if (checkIfPointPassesFilter(d)) {
                            //console.log("in");
                            d.properties.selected = true;
                            if (!d.properties.highlighted) {
                                d.properties.highlighted = true;
                                // Toggle the highlighted class
                                element.classList.toggle("highlighted");
                            }
                        }
                    } else {
                        if (checkIfPointPassesFilter(d)) {
                            if (d.properties.highlighted) {
                                // Toggle the highlighted class
                                element.classList.toggle("highlighted");
                            }
                            d.properties.selected = true;
                            d.properties.highlighted = false;
                        }
                    }
                } else {
                    //console.warn(`No element found for ID: ${d.properties.id}`);
                }

                // If none was selected, select all
                if (x0 === x1 && y0 === y1) {
                    if (checkIfPointPassesFilter(d)) {
                        d.properties.selected = true;
                    }
                    somethingSelected = false;
                }
            });

            updateGlyphs();

            updateHighlightedSubcharts();

            startPoint = null;
            if (selectionRect) {
                selectionRect.remove();
                selectionRect = null;
            }
            svg.on("mousemove", null);
        }
    });

    // Prevent the default context menu from appearing
    svg.on("contextmenu", (event) => {
        event.preventDefault();
    });
}

function checkIfPointPassesFilter(point) {
    const filters = getFilters();
    let startDate, endDate;

    if (filters.timeFilter === 'past-7-days') {
        endDate = new Date();
        startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);
    } else if (filters.timeFilter === 'past-30-days') {
        endDate = new Date();
        startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);
    } else if (filters.timeFilter === 'custom') {
        startDate = filters.startDate ? new Date(filters.startDate) : null;
        endDate = filters.endDate ? new Date(filters.endDate) : null;
    }

    const eventName = point.properties.name;
    const eventDate = new Date(point.properties.date);

    const nameMatches = filters.eventTypes.includes(eventName);
    const dateMatches = (!startDate || eventDate >= startDate) && (!endDate || eventDate <= endDate);

    return nameMatches && dateMatches;
}


function updateHighlightedSubcharts() {
    console.log("Updating highlighted subcharts");
    populateEventSelection();
    updateOrderOfLineCharts(); // Update the line charts based on the selected checkboxes
    //go through data and see if any of them is selected and highlited at the same time if yes somethingSelected is true
    var somethingIsHighlighted = dataHandler.isAnythingHighlighted();

    if (somethingIsHighlighted) {
        activeEventTypes = dataHandler.getHighlightedEventCounts().activeEventTypes;
    } else {
        activeEventTypes = dataHandler.getSelectedEventCounts().activeEventTypes;
    }

    //console.log("Active event types: ", activeEventTypes);

    for (var i = 0; i < activeEventTypes.length; i++) {
        var eventType = activeEventTypes[i];

        // Check if the subLineChart for this eventType already exists
        var existingChart = lineChart.subLineCharts.find(function (chart) {
            return chart.eventType === eventType;
        });

        //console.log("Existing chart: ", existingChart);
    }

    if (somethingIsHighlighted) {
        lineChart.updateChartData(dataHandler.getHighlightedEventCounts().eventCounts);
        //updateOrderOfLineCharts();
        // Update subLineCharts
        for (var i = 0; i < lineChart.subLineCharts.length; i++) {
            
            console.log("Updating Max Y value: ", maxYValue);
            lineChart.subLineCharts[i].updateChartData(dataHandler.getHighlightedEventCountsByType(lineChart.subLineCharts[i].eventType).eventCounts);
            lineChart.subLineCharts[i].changeYAxisRange(maxYValue);
        }
    } else {
        lineChart.updateChartData(dataHandler.getSelectedEventCounts().eventCounts);
        for (var i = 0; i < lineChart.subLineCharts.length; i++) {
            console.log("Updating Max Y value: ", maxYValue);
            lineChart.subLineCharts[i].updateChartData(dataHandler.getSelectedEventCountsByType(lineChart.subLineCharts[i].eventType).eventCounts);
            lineChart.subLineCharts[i].changeYAxisRange(maxYValue);
        }
    }
}

function updateHighlightedSubchartsAfterSort()
{
    var somethingIsHighlighted = dataHandler.isAnythingHighlighted();

    if (somethingIsHighlighted) {
        activeEventTypes = dataHandler.getHighlightedEventCounts().activeEventTypes;
    } else {
        activeEventTypes = dataHandler.getSelectedEventCounts().activeEventTypes;
    }

    //console.log("Active event types: ", activeEventTypes);

    for (var i = 0; i < activeEventTypes.length; i++) {
        var eventType = activeEventTypes[i];

        // Check if the subLineChart for this eventType already exists
        var existingChart = lineChart.subLineCharts.find(function (chart) {
            return chart.eventType === eventType;
        });

        //console.log("Existing chart: ", existingChart);
    }

    if (somethingIsHighlighted) {
        lineChart.updateChartData(dataHandler.getHighlightedEventCounts().eventCounts);
        //updateOrderOfLineCharts();
        // Update subLineCharts
        for (var i = 0; i < lineChart.subLineCharts.length; i++) {
            
            lineChart.subLineCharts[i].updateChartData(dataHandler.getHighlightedEventCountsByType(lineChart.subLineCharts[i].eventType).eventCounts);
            console.log("Max Y value: ", maxYValue);
            lineChart.subLineCharts[i].changeYAxisRange(maxYValue);
        }
    } else {
        lineChart.updateChartData(dataHandler.getSelectedEventCounts().eventCounts);
        for (var i = 0; i < lineChart.subLineCharts.length; i++) {
            lineChart.subLineCharts[i].updateChartData(dataHandler.getSelectedEventCountsByType(lineChart.subLineCharts[i].eventType).eventCounts);
            lineChart.subLineCharts[i].changeYAxisRange(maxYValue);
        }
    }
}