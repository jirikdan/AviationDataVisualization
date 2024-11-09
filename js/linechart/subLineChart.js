class SubLineChart {
    constructor(selector, eventType, mainChart, isLastChart) {
        this.selector = selector;
        this.margin = { top: 20, right: 20, bottom: 0, left: 20 };
        this.width = lineChartWidth - this.margin.left - this.margin.right;
        //console.log("Width of " + eventType + " is " + this.width);
        this.height = 40 - this.margin.top - this.margin.bottom;
        this.eventType = eventType;
        this.mainChart = mainChart;
        this.isLastChart = isLastChart;
        if (isLastChart) {
            this.margin.bottom = 20;
            //console.log("Last chart");
            this.height = this.height + 0;
        }
        this.initChart();
        this.yTicks = 2;
        //this.updateGridlines();
        this.isProgrammaticBrushMove = false;
    }

    initChart() {
        this.linechartSvg = d3.select(this.selector)
            .append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .style("overflow", "visible") // Ensure overflow is visible
            .append("g")
            .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

        this.colorScale = d3.scaleSequential(d3.interpolateViridis);

        this.gradient = this.linechartSvg.append("defs")
            .append("linearGradient")
            .attr("id", "gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%");

        this.x = d3.scaleTime()
            .range([0, this.width]);



        this.xAxis = this.linechartSvg.append("g")
            .attr("transform", `translate(0,${this.height})`)
            .attr("class", this.isLastChart ? "x-axis hidden-ticks" : "x-axis hidden-ticks"); //remove hidden-ticks to show x-axis

        this.y = d3.scaleLinear()
            .range([this.height, 0]);

        this.yAxis = this.linechartSvg.append("g")
            .attr("class", "y-axis");

        this.clip = this.linechartSvg.append("defs").append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", this.width)
            .attr("height", this.height + 20) // Extend the height by 2 pixels
            .attr("x", 0)
            .attr("y", -20); // Shift the rectangle up by 2 pixels

        this.brush = d3.brushX()
            .extent([[0, 0], [this.width, this.height]])
            .on("end", this.updateChart.bind(this));

        this.area = this.linechartSvg.append('g')
            .attr("clip-path", "url(#clip)");

        this.areaGenerator = d3.area()
            .x(d => this.x(d.date))
            .y0(this.y(0))
            .y1(d => this.y(d.value))
            .defined(d => d.value !== 0) // Only include non-zero points for the area fill
            .curve(d3.curveBasis);
        this.zeroLineGenerator = d3.line()
            .x(d => this.x(d.date))
            .y(() => this.y(0)) // Fixed y-coordinate at y = 0
            .curve(d3.curveBasis);

        // Add gridlines
        this.xGrid = this.linechartSvg.append("g")
            .attr("class", "grid")
            .attr("transform", `translate(0,${this.height})`);

        // Add gridline labels
        this.labels = this.linechartSvg.append("g")
            .attr("class", "grid-labels");

    }

    renderChart(data) {
        this.data = data;

        // Set x domain to dateSpan rather than the data extent
        this.x.domain(dateSpan);
        this.xAxis.call(d3.axisBottom(this.x).ticks(3));  // Adjust the number of ticks as needed
        this.y.domain([0, d3.max(this.data, d => +d.value)]);  // Set y domain based on data values

        this.yAxis.call(d3.axisLeft(this.y).ticks(3));  // Fewer ticks on Y axis

        this.colorScale.domain(d3.extent(this.data, d => d.date));  // Adjust color scale domain if needed

        // Remove old gradient stops and recreate with updated color
        this.gradient.selectAll("stop").remove();
        this.data.forEach((d, i) => {
            let color = d3.color(this.colorScale(d.date));
            color = d3.rgb(color.r * 0.1, color.g * 0.1, color.b * 0.1); // Darken the color
            this.gradient.append("stop")
                .attr("offset", `${(i / (this.data.length - 1)) * 100}%`)
                .attr("stop-color", color);
        });

        // Update the area path
        this.area.selectAll(".myArea").remove();
        this.area.append("path")
            .datum(this.data)
            .attr("class", "myArea")
            .attr("fill", colorMapping[this.eventType]) // Use the color from colorMapping
            .attr("fill-opacity", 1)
            .attr("stroke", d3.color(colorMapping[this.eventType]).darker(1)) // Use the color from colorMapping
            .attr("stroke-width", 1)
            .attr("d", this.areaGenerator);
        this.area.append("line")
            .attr("class", "zero-line")
            .attr("x1", this.x(new Date(dateSpan[0]))) // Start of dateSpan
            .attr("y1", this.y(0)+1) // y = 0
            .attr("x2", this.x(new Date(dateSpan[1]))) // End of dateSpan
            .attr("y2", this.y(0)+1) // y = 0
            .attr("stroke", "black")
            .attr("stroke-width", 2);

        // Attach the brush with updated selection
        this.area.selectAll(".brush").remove();
        this.area
            .append("g")
            .attr("class", "brush")
            .call(this.brush);

        // Update gridlines based on the new x domain
        this.updateGridlines();
    }

    updateGridlines() {
        this.isLastChart = false;
        // Clear any existing lines and labels to prevent overlap
        this.xGrid.selectAll("line").remove();
        this.labels.selectAll("text").remove();

        const tickValues = this.x.ticks(lineChartNumberOfDashedLines);
        //console.log("Sublinechart tickValues: " + tickValues);
        const start = this.x.domain()[0];
        const end = this.x.domain()[1];

        // Calculate distance between grid lines
        const tickPositions = tickValues.map(tick => this.x(tick)); // Convert tick values to pixel positions
        let gridLineDistance = 0;
        if (tickPositions.length > 1) {
            gridLineDistance = Math.abs(tickPositions[1] - tickPositions[0]); // Calculate the distance between the first two ticks
        }

        // Set global grid line distance
        gridLineDistanceGlobal = gridLineDistance;

        // Append vertical grid lines for each tick and create labels
        var fixedLabelsContainer = d3.select('#fixed-labels-container');
        fixedLabelsContainer.selectAll("div").remove(); // Remove previous divs to avoid overlaps


        tickValues.concat(start, end).forEach((tickValue, i) => {
            const isStartOrEnd = (tickValue === start || tickValue === end);
            const xPosition = this.x(tickValue);

            // Create the line and apply common attributes
            const line = this.xGrid.append("line")
                .attr("x1", xPosition)
                .attr("x2", xPosition)
                .attr("y1", 0)
                .attr("y2", -this.height - 42)
                .attr("stroke", "currentColor")
                .attr("stroke-width", 3); // Adjust stroke width as needed

            // If the tick value is not the start or end, apply dashed stroke
            if (!isStartOrEnd) {
                line.attr("stroke-dasharray", "2.5");

                if (this.isLastChart) {
                    const labelClass = i === 0 ? "grid-label bottom-labels first-bottom-label" : "grid-label bottom-labels";
                    const labelDivClass = i === 0 ? "label-div first-bottom-label" : "label-div";

                    // Insert dummy div if it's the first label
                    if (i == 0) {
                        const dummyDiv = fixedLabelsContainer.append("div")
                            .attr("class", "dummy-div")
                            .style("width", gridLineDistance + computeFirstOffset() - 10 + "px")
                            .style("display", "inline-block");

                        console.log(`Dummy div inserted with width: ${gridLineDistance + computeFirstOffset() - 10}px for chart: ${this.eventType}`);
                    }

                    var width = gridLineDistance;
                    if (i === tickValues.length - 1) {
                        width = 0;
                    }
                    console.log("width: " + width);
                    // Create a new div for each label with fixed width of gridLineDistance
                    const labelDiv = fixedLabelsContainer.append("div")
                        .attr("class", labelDivClass)
                        .style("width", width + "px") // Set width to gridLineDistance
                        .style("display", "inline-block");

                    // Append the text labels inside the created div
                    labelDiv.append("text")
                        .attr("dy", "2em")
                        .attr("class", labelClass) // Add the dynamic class
                        .style("font-size", "10px") // Adjust font size as needed
                        .style("fill", "black") // Change color
                        .style("font-weight", "bold") // Bold text
                        .style("opacity", 0.8) // Adjust opacity if needed
                        .text(this.formatDate(tickValue))
                        .style("overflow", "visible"); // Ensure overflow is visible

                    //console.log(`Label created for tick value: ${tickValue}, text: ${this.formatDate(tickValue)}, chart: ${this.eventType}`);
                }
            }
        });
    }


    updateBrushFromMainChart(snappedExtent) {
        // Clear existing brush selection
        d3.select(this.selector).select(".brush").call(this.brush.move, null);

        // Programmatically move the brush
        this.isProgrammaticBrushMove = true;
        d3.select(this.selector).select(".brush").call(this.brush.move, snappedExtent);
        this.isProgrammaticBrushMove = false;

    }



    updateChart(event, calledFromMainChart = false) {

        const extent = event.selection;

        // If programmatically moving the brush, skip the rest of the update logic
        if (this.isProgrammaticBrushMove) {
            return;
        }

        // Select the tooltip element
        const tooltip = d3.select("#brush-tooltip");

        if (!extent) {
            // Hide tooltip if no selection
            tooltip.style("display", "none");
            return;
        }

        // Convert brush pixel positions to date values
        let [start, end] = [this.x.invert(extent[0]), this.x.invert(extent[1])];
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        // add one day to end date to include the last day
        end.setDate(end.getDate() + 1);
        //console.log("Brush selection range:", start, end);
        // Calculate the snapped pixel positions on the x scale using UTC dates
        const snappedExtent = [this.x(start), this.x(end)];

        d3.select(this.selector).select(".brush").call(this.brush.move, null);

        // Programmatically move the brush to snap to bins
        this.isProgrammaticBrushMove = true;
        d3.select(this.selector).select(".brush").call(this.brush.move, snappedExtent);
        this.isProgrammaticBrushMove = false;

        //this.mainChart.updateBrushFromSubChart(snappedExtent);

        // Update the brush selection rectangle style
        this.area.selectAll(".selection-rectangle").remove();
        this.area.append("rect")
            .attr("class", "selection-rectangle")
            .attr("x", snappedExtent[0])
            .attr("y", 0)
            .attr("width", snappedExtent[1] - snappedExtent[0])
            .attr("height", this.height)
            .attr("fill", dataHighlightBrushBackground)
            .attr("stroke", dataBrushEdges)
            .attr("stroke-width", 1)
            .on("mouseover", () => {
                tooltip.style("display", "block");
            })
            .on("mousemove", (event) => {
                const containerElement = d3.select(this.selector).node();
                const containerBox = containerElement.getBoundingClientRect();

                const midPoint = (snappedExtent[0] + snappedExtent[1]) / 2;
                const tooltipX = midPoint + containerBox.left + this.margin.left;
                const tooltipY = containerBox.top + this.margin.top;

                // Use UTC date formatting
                tooltip.html(`From: ${d3.timeFormat("%B %d, %Y %H:%M GMT")(start)}<br>To: ${d3.timeFormat("%B %d, %Y %H:%M GMT")(end)}`)
                    .style("left", `${tooltipX - 60}px`)
                    .style("top", `${tooltipY - 40}px`)
                    .style("transform", "translateX(-50%)");
            })
            .on("mouseout", () => {
                tooltip.style("display", "none");
            });

        // Highlight data inside the snapped brush selection using UTC dates
        if (!calledFromMainChart) {
            this.highlightDataInsideBrush(start, end);
            //updateHighlightedSubcharts();
        }


        //const adjustedEndUTC = new Date(end.getTime() + bufferDuration);
        // Filter the data with the adjusted range in UTC
        const selectedData = this.data.filter(d => d.date >= start && d.date <= end);
        //console.log("Selected data (UTC range):", selectedData);

        // Call `highlightNewDataPoints` with the selected data
        this.highlightNewDataPoints(selectedData);
    }

    updateChartDataHighlight(newData) {
        // Keep track of previous data for comparison
        const previousData = this.data || [];

        // Identify new data points by checking if the new data contains points not in the previous data
        const newDataPoints = newData.filter(newPoint => {
            return !previousData.some(prevPoint =>
                prevPoint.date.getTime() === newPoint.date.getTime() &&
                prevPoint.value === newPoint.value
            );
        });

        // Highlight the new data points in the chart
        this.highlightNewDataPoints(newDataPoints);
    }

    highlightNewDataPoints(newDataPoints) {
        // Remove any previous highlights
        this.area.selectAll(".new-data-highlight").remove();

        // Remove any previous brush selection rectangle
        this.area.selectAll(".selection-rectangle").remove();

        // If there are new data points, create a programmatic brush selection
        if (newDataPoints.length > 0) {
            const minDate = d3.min(newDataPoints, d => d.date);
            const maxDate = d3.max(newDataPoints, d => d.date);

            // Set the brush extent based on the date range of newDataPoints
            const snappedExtent = [this.x(minDate), this.x(maxDate)];

            // Programmatically move the brush to cover the range of newDataPoints
            this.isProgrammaticBrushMove = true;
            d3.select(this.selector).select(".brush").call(this.brush.move, snappedExtent);
            this.isProgrammaticBrushMove = false;

            // Update the brush selection rectangle to match the manual selection style
            this.area.append("rect")
                .attr("class", "selection-rectangle")
                .attr("x", snappedExtent[0])
                .attr("y", 0)
                .attr("width", snappedExtent[1] - snappedExtent[0])
                .attr("height", this.height)
                .attr("fill", dataHighlightBrushBackground)  // Use the same background color as the manual selection
                .attr("fill-opacity", 0.3)
                .attr("stroke", dataBrushEdges)  // Use the same stroke color
                .attr("stroke-width", 1.5);
        }

        // Group newDataPoints by day
        const dailyData = d3.group(newDataPoints, d => d3.timeDay(d.date));

        // Loop through each day's data to create individual areas
        dailyData.forEach((points) => {
            const sortedPoints = points.sort((a, b) => a.date - b.date);

            // Define an area generator for each day's points
            const dayAreaGenerator = d3.area()
                .x(d => this.x(d.date))
                .y0(this.y(0))
                .y1(d => this.y(d.value))
                .curve(d3.curveBasis);

            // Append a new area path for the current day's data points
            this.area.append("path")
                .datum(sortedPoints)
                .attr("class", "new-data-highlight")
                .attr("clip-path", "url(#clip)")
                .attr("d", dayAreaGenerator)
                .attr("fill", dataHighlightBackground)  // Use the same color as the brush background
                .attr("fill-opacity", 0.3)
                .attr("stroke", "red")  // Use the same stroke color as the brush
                .attr("stroke-width", 1.5);
        });
    }



    clearBrush() {
        console.log("Clearing brush selection from the LineChart.");
        // Clear the brush selection by setting the extent to null
        this.isProgrammaticBrushMove = true;
        d3.select(this.selector).select(".brush").call(this.brush.move, null);
        this.isProgrammaticBrushMove = false;

        // Remove the selection rectangle and any highlights
        this.area.selectAll(".selection-rectangle").remove();
        this.area.selectAll(".new-data-highlight").remove();

        // Reset highlighted property for all data points
        this.data.forEach(point => {
            point.highlighted = false;
        });
        updateGlyphs();
    }


    highlightDataInsideBrush(start, end) {
        // Iterate through the data and highlight points within the adjusted range
        //console.log("Highlighting data inside brush range:", start, end);
        data.forEach(point => {
            const dateMatches = point.properties.date >= start && point.properties.date <= end;
            const element = document.getElementById(point.properties.id);

            if (element) {  // Check if element is not null
                if (dateMatches && point.properties.selected) {
                    point.properties.highlighted = true;
                    updateGlyphs();
                    element.classList.add("highlighted");
                } else {
                    point.properties.highlighted = false;
                    updateGlyphs();
                    element.classList.remove("highlighted");
                }
            } else {
                //console.warn(`Element with id ${point.properties.id} not found.`);
            }
        });
    }

    updateChartDataHighlight(newData) {
        //console.log("updating main linechart");
        // Keep track of previous data for comparison
        const previousData = this.data || [];

        // Identify new data points by checking if the new data contains points not in the previous data
        const newDataPoints = newData.filter(newPoint => {
            return !previousData.some(prevPoint =>
                prevPoint.date.getTime() === newPoint.date.getTime() &&
                prevPoint.value === newPoint.value
            );
        });

        // Highlight the new data points in the chart
        this.highlightNewDataPoints(newDataPoints);
    }


    updateChartFromOutside(newXDomain) {
        console.log("updating from outside");
        if (newXDomain) {
            this.x.domain(newXDomain);
        }
        this.xAxis.transition().duration(1000).call(d3.axisBottom(this.x).ticks(3));
        this.yAxis.transition().duration(1000).call(d3.axisLeft(this.y).ticks(2));
        this.area
            .select('.myArea')
            .transition()
            .duration(1000)
            .attr("d", this.areaGenerator);

        // Update gridlines and labels
        //this.updateGridlineLabels();
    }


    interpolateDates(start, end, numberOfPoints) {
        const startTime = new Date(start).getTime(); // Convert start date to milliseconds
        const endTime = new Date(end).getTime(); // Convert end date to milliseconds
        const interval = (endTime - startTime) / (numberOfPoints - 1); // Calculate the time interval

        const interpolatedDates = []; // Array to store interpolated dates
        for (let i = 0; i < numberOfPoints; i++) {
            const currentTime = startTime + i * interval; // Calculate current time
            interpolatedDates.push(new Date(currentTime)); // Convert back to Date object and add to array
        }

        return interpolatedDates;
    }

    updateGridlineLabels() {
        const tickValues = this.x.ticks(lineChartNumberOfDashedLines);
        const start = this.x.domain()[0];
        const end = this.x.domain()[1];

        const interpolatedDates = this.interpolateDates(start, end, lineChartNumberOfDashedLines + 1);

        // Reference the dummy div and its original width
        const dummyDiv = d3.select('.dummy-div');
        const originalWidth = parseFloat(dummyDiv.style('width'));

        // Measure initial label width
        const beforeTextWidth = d3.select('.grid-label').node()?.getBoundingClientRect().width || 0;

        // Update the text labels based on interpolated dates
        tickValues.concat(start, end).forEach((tickValue, i) => {
            const xPosition = this.x(tickValue);
            const label = d3.selectAll(".grid-label").nodes();

            if (label[i]) {
                label[i].innerHTML = this.formatDate(interpolatedDates[i + 1]);
                d3.select(label[i]).text(this.formatDate(interpolatedDates[i + 1]));
            }
        });

        // Measure updated label width
        const afterTextWidth = d3.select('.grid-label').node()?.getBoundingClientRect().width || 0;
        const widthDifference = beforeTextWidth - afterTextWidth;

        // Apply width adjustment only if the difference exceeds a threshold (e.g., 1px)
        const minAdjustmentThreshold = 1;
        if (Math.abs(widthDifference) > minAdjustmentThreshold) {
            const newWidth = Math.max(originalWidth + widthDifference / 2, originalWidth);
            dummyDiv.style('width', newWidth + 'px');
        }
    }




    formatDate(date) {
        const diff = this.x.domain()[1] - this.x.domain()[0];
        if (diff < 7 * 24 * 60 * 60 * 1000) { // If the range is less than a week
            return d3.timeFormat("%d/%m %H:%M")(date); // Show day, month, hour, and minute
        } else if (diff < 30 * 24 * 60 * 60 * 1000) { // If less than a month
            return d3.timeFormat("%d/%m")(date); // Show day and month
        } else {
            return d3.timeFormat("%m/%Y")(date); // Show month and year
        }
    }

    changeYAxisRange(maxYValue) {
        //console.log("redrawing y with - " + maxYValue);
        // Update the y scale with new min and max values
        this.y.domain([0, maxYValue]);

        // Update the y-axis with new domain
        this.yAxis.transition()  // Add a transition for smoother updates, optional
            .duration(0)       // Adjust duration as needed
            .call(d3.axisLeft(this.y).ticks(this.yTicks));  // Ensure ticks are based on updated domain

        // Redraw the chart area with the updated y scale
        this.area.select('.myArea')
            .transition()
            .duration(0)  // Optional, you can control the transition duration
            .attr("d", this.areaGenerator);  // Update the path with the new Y-domain

    }

    //return max value of y axis
    getMaxYValue() {
        return d3.max(this.data, d => +d.value);
    }


}
