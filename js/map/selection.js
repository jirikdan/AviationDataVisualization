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
        //unselect all points
        /*glyphs.selectAll("path").each(function (d) {
            d.properties.selected = false;
            d.properties.highlighted = d.properties.selected;
            var element = document.getElementById(d.properties.id);
            //remove class highlighted
            element.classList.remove("highlighted");
        });*/
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
                if (gx >= x0 && gx <= x1 && gy >= y0 && gy <= y1) {
                    //console.log(data);
                    //if d event type is in getFilters do this

                    console.log(filters.eventTypes);


                    console.log(d.properties.highlighted);
                    if (checkIfPointPassesFilter(d)) {
                        console.log("in");
                        d.properties.selected = true;
                        if (!d.properties.highlighted) {
                            d.properties.highlighted = true;
                            var element = document.getElementById(d.properties.id);
                            //toggle class highlighted
                            element.classList.toggle("highlighted");
                        }
                    }
                }
                else {
                    if (checkIfPointPassesFilter(d)) {
                        if (d.properties.highlighted) {
                            var element = document.getElementById(d.properties.id);
                            //toggle class highlighted
                            element.classList.toggle("highlighted");
                        }
                        d.properties.selected = true;
                        d.properties.highlighted = false;
                    }
                }

                //if none was selected select all
                if (x0 === x1 && y0 === y1) {
                    if (checkIfPointPassesFilter(d)) {
                        d.properties.selected = true;
                    }
                    somethingSelected = false;
                    

                }
            });
            updateGlyphs();
            
            if (somethingSelected) {
                lineChart.updateChartData(dataHandler.getHighlightedEventCounts().eventCounts);
                //foreach lineChart.subLineCharts
                for (var i = 0; i < lineChart.subLineCharts.length; i++) {
                    lineChart.subLineCharts[i].updateChartData(dataHandler.getHighlightedEventCountsByType(lineChart.subLineCharts[i].eventType).eventCounts);
                }
            }
            else {
                lineChart.updateChartData(dataHandler.getSelectedEventCounts().eventCounts);
                for (var i = 0; i < lineChart.subLineCharts.length; i++) {
                    lineChart.subLineCharts[i].updateChartData(dataHandler.getSelectedEventCountsByType(lineChart.subLineCharts[i].eventType).eventCounts);
                }
            }
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


function checkIfPointPassesFilter(point)
{
    const filters = getFilters();
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
