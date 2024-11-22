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
            let somethingSelected = true;
            lineChart.clearBrush();
            for (var i = 0; i < lineChart.subLineCharts.length; i++) {
                lineChart.subLineCharts[i].clearBrush();
            }
            // Check if it was a single right-click (no drag)
            const isSingleClick = (x0 === x1 && y0 === y1);
    
            if (isSingleClick) {
                // Unhighlight only the points that pass the filter (i.e., points that are selected)
                glyphs.selectAll("path").each(function (d) {
                    const element = document.getElementById(d.properties.id);
                    if (element && d.properties.highlighted && d.properties.selected) {
                        d.properties.highlighted = false;
                        element.classList.remove("highlighted");
                    }
                });
                console.log("linechart", lineChart);
                
                console.log("Unhighlighted filtered points due to single right-click.");
            } else {
                // Iterate over all glyphs for rectangle selection
                glyphs.selectAll("path").each(function (d) {
                    const [gx, gy] = projection([d.geometry.coordinates[0], d.geometry.coordinates[1]]);
                    const element = document.getElementById(d.properties.id);
    
                    if (element) {
                        // Check if the glyph is within the selection rectangle
                        if (gx >= x0 && gx <= x1 && gy >= y0 && gy <= y1) {
                            if (checkIfPointPassesFilter(d)) {
                                d.properties.selected = true;
                                // Add to highlights without overriding existing ones
                                if (!d.properties.highlighted) {
                                    d.properties.highlighted = true;
                                    element.classList.add("highlighted");
                                }
                            }
                        } else {
                            // Unhighlight only if the point passes the filter (is selected)
                            if (checkIfPointPassesFilter(d) && d.properties.highlighted && d.properties.selected) {
                                //d.properties.highlighted = false;
                                element.classList.remove("highlighted");
                            }
                        }
                    }
                });
                console.log("Updated highlights based on rectangle selection.");
            }
    
            // Update glyphs and subcharts
            updateGlyphs();
            updateHighlightedSubcharts();
    
            // Reset the selection rectangle and event handlers
            startPoint = null;
            if (selectionRect) {
                selectionRect.remove();
                selectionRect = null;
            }
            svg.on("mousemove", null);
        }
        highlightTableRows();
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
    // console.log("Updating highlighted subcharts");
    // console.log("available subcharts: ", lineChart.subLineCharts);
    populateEventSelection();
    //updateOrderOfLineCharts(); // Update the line charts based on the selected checkboxes
    //go through data and see if any of them is selected and highlited at the same time if yes somethingSelected is true
    var somethingIsHighlighted = dataHandler.isAnythingHighlighted();


    if (somethingIsHighlighted) {
        lineChart.clearBrush();
        lineChart.updateChartDataHighlight(dataHandler.getHighlightedEventCounts().eventCounts);
        //updateOrderOfLineCharts();
        // Update subLineCharts
        for (var i = 0; i < lineChart.subLineCharts.length; i++) {
            
            //console.log("Updating Max Y value: ", maxYValue);
            lineChart.subLineCharts[i].clearBrush();
            lineChart.subLineCharts[i].updateChartDataHighlight(dataHandler.getHighlightedEventCountsByType(lineChart.subLineCharts[i].eventType).eventCounts);
            
        }
    } else {
        lineChart.clearBrush();
        lineChart.updateChartDataHighlight(dataHandler.getHighlightedEventCounts().eventCounts);
        for (var i = 0; i < lineChart.subLineCharts.length; i++) {
            //console.log("Updating Max Y value: ", maxYValue);
            lineChart.subLineCharts[i].clearBrush();
            lineChart.subLineCharts[i].updateChartDataHighlight(dataHandler.getHighlightedEventCountsByType(lineChart.subLineCharts[i].eventType).eventCounts);
            
        }
    }
    updateMaxYValue();
}

function updateHighlightedSubchartsAfterSort()
{
    var somethingIsHighlighted = dataHandler.isAnythingHighlighted();

    if (somethingIsHighlighted) {
        lineChart.clearBrush();
        lineChart.updateChartDataHighlight(dataHandler.getHighlightedEventCounts().eventCounts);
        //updateOrderOfLineCharts();
        // Update subLineCharts
        for (var i = 0; i < lineChart.subLineCharts.length; i++) {
            
            lineChart.subLineCharts[i].clearBrush();
            lineChart.subLineCharts[i].updateChartDataHighlight(dataHandler.getHighlightedEventCountsByType(lineChart.subLineCharts[i].eventType).eventCounts);
            //console.log("Max Y value: ", maxYValue);
            
        }
    } else {
        lineChart.clearBrush();
        lineChart.updateChartDataHighlight(dataHandler.getHighlightedEventCounts().eventCounts);
        for (var i = 0; i < lineChart.subLineCharts.length; i++) {
            lineChart.subLineCharts[i].clearBrush();
            lineChart.subLineCharts[i].updateChartDataHighlight(dataHandler.getHighlightedEventCountsByType(lineChart.subLineCharts[i].eventType).eventCounts);
            
        }
    }
    updateMaxYValue();
}

//recalculate and change max y value for all subcharts
function updateMaxYValue()
{
    //console.log("Updating max y value");

    maxYValue = 0;
    for (var i = 0; i < lineChart.subLineCharts.length; i++) {
        //console.log("Tadzy");
        //console.log(lineChart.subLineCharts[i].getMaxYValue());
        if (lineChart.subLineCharts[i].getMaxYValue() > maxYValue) {
            //console.log("Actually updating max y value");
            maxYValue = lineChart.subLineCharts[i].getMaxYValue();
        }
    }
    //console.log("Max Y value: ", maxYValue);
    //change max y value for all subcharts
    changeMaxYBasedOnCurrentDatespan()
    /*for (var i = 0; i < lineChart.subLineCharts.length; i++) {
        lineChart.subLineCharts[i].changeYAxisRange(maxYValue);
    }*/
}

