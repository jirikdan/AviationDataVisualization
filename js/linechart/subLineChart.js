class SubLineChart {
    constructor(selector, eventType, mainChart, isLastChart) {
        this.selector = selector;
        this.margin = { top: 20, right: 20, bottom: 0, left: 20 };

        this.width = lineChartWidth - this.margin.left - this.margin.right;
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
            .curve(d3.curveBasis);

        this.linechartSvg.on("dblclick", this.resetZoom.bind(this));

        // Add gridlines
        this.xGrid = this.linechartSvg.append("g")
            .attr("class", "grid")
            .attr("transform", `translate(0,${this.height})`);

        // Add gridline labels
        this.labels = this.linechartSvg.append("g")
            .attr("class", "grid-labels");

        this.initGridlines();
    }

    initGridlines() {
        // This method is intentionally left empty for now
    }

    renderChart(data) {
        this.data = data;

        this.x.domain(d3.extent(this.data, d => d.date));
        this.xAxis.call(d3.axisBottom(this.x).ticks(3));
        this.y.domain([0, d3.max(this.data, d => +d.value)]);
        this.yAxis.call(d3.axisLeft(this.y).ticks(this.yTicks));  // Fewer ticks on Y axis

        this.colorScale.domain(d3.extent(this.data, d => d.date));

        this.gradient.selectAll("stop").remove();
        this.data.forEach((d, i) => {
            this.gradient.append("stop")
                .attr("offset", `${(i / (this.data.length - 1)) * 100}%`)
                .attr("stop-color", this.colorScale(d.date));
        });

        this.area.selectAll(".myArea").remove();
        this.area.append("path")
            .datum(this.data)
            .attr("class", "myArea")
            .attr("fill", colorMapping[this.eventType]) // Use the color from colorMapping
            .attr("fill-opacity", 1)
            .attr("stroke", d3.color(colorMapping[this.eventType]).darker(1)) // Use the color from colorMapping
            .attr("stroke-width", 1)
            .attr("d", this.areaGenerator);

        this.area.selectAll(".brush").remove();
        this.area
            .append("g")
            .attr("class", "brush")
            .call(this.brush);

        // Update gridlines and labels
        this.updateGridlines();
    }

    updateGridlines() {
        // Clear any existing lines and labels to prevent overlap
        this.xGrid.selectAll("line").remove();
        this.labels.selectAll("text").remove();

        // Manually generate tick positions including the start and end of the x-axis
        const tickValues = this.x.ticks(lineChartNumberOfDashedLines);
        const start = this.x.domain()[0];
        const end = this.x.domain()[1];

        // Calculate distance between grid lines
        const tickPositions = tickValues.map(tick => this.x(tick)); // Convert tick values to pixel positions
        let gridLineDistance = 0;
        if (tickPositions.length > 1) {
            gridLineDistance = Math.abs(tickPositions[1] - tickPositions[0]); // Calculate the distance between the first two ticks
        }

        //spaceOutLabelsByGridDistance(gridLineDistance); // Call the function to space out labels
        gridLineDistanceGlobal = gridLineDistance;

        // Append vertical grid lines for each tick and create labels
        var fixedLabelsContainer = d3.select('#fixed-labels-container');
        fixedLabelsContainer.selectAll("div").remove(); // Remove previous divs to avoid overlaps
        //fixedLabelsContainer.style("display", "inline-block"); // Ensure the container is displayed as inline-block

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
                    // Determine if this is the first label to append the additional class
                    const labelClass = i === 0 ? "grid-label bottom-labels first-bottom-label" : "grid-label bottom-labels";
                    const labelDivClass = i === 0 ? "label-div first-bottom-label" : "label-div";

                    //if i==0 insert dummy div
                    if (i == 0) {
                        const dummyDiv = fixedLabelsContainer.append("div")
                            .attr("class", "dummy-div")
                            .style("width", gridLineDistance + computeFirstOffset() - 10 + "px")
                            .style("display", "inline-block");
                    }
                    var width = gridLineDistance;
                    if (i === tickValues.length - 1) {
                        width = 0;
                    }


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
                }
            }
        });
    }




    updateChart(event) {
        const extent = event.selection;
        if (!extent) {
            if (!this.idleTimeout) return this.idleTimeout = setTimeout(() => this.idleTimeout = null, 350);
            this.x.domain([4, 8]);
        } else {
            const [start, end] = [this.x.invert(extent[0]), this.x.invert(extent[1])];

            this.x.domain([start, end]);
            this.area.select(".brush").call(this.brush.move, null);

            this.mainChart.subLineCharts.forEach(subLineChart => {
                subLineChart.updateChartFromOutside(this.x.domain());
            });
            this.mainChart.updateChartFromOutside(this.x.domain());
        }

        this.xAxis.transition().duration(1000).call(d3.axisBottom(this.x).ticks(3));
        this.yAxis.transition().duration(1000).call(d3.axisLeft(this.y).ticks(2));
        this.area
            .select('.myArea')
            .transition()
            .duration(1000)
            .attr("d", this.areaGenerator);

        // Update gridlines and labels
        this.updateGridlineLabels();
    }

    updateChartFromOutside(newXDomain) {
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
        this.updateGridlineLabels();
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

        console.log("Interpolated times = " + this.interpolateDates(start, end, lineChartNumberOfDashedLines + 1));
        const interpolatedDates = this.interpolateDates(start, end, lineChartNumberOfDashedLines + 1);
        const xLineWidth = 1590;
        console.log("start = " + start + " end = " + end + " gridline width = " + gridLineDistanceGlobal);
        const dummyDiv = d3.select('.dummy-div');
        const currentWidth = parseFloat(dummyDiv.style('width'));
        
        const textElement = d3.select('.grid-label');

        var beforeTextWidth = 0;

        // Check if the text element exists
        if (!textElement.empty()) {
            // Get the width of the text element using getBoundingClientRect
            beforeTextWidth = textElement.node().getBoundingClientRect().width;
        }
        tickValues.concat(start, end).forEach((tickValue, i) => {
            const xPosition = this.x(tickValue);
            //const label = this.labels.selectAll(".grid-label").nodes();
            const label = d3.selectAll(".grid-label").nodes();
            if (label[i]) {


                //console.log(tickValues[i+1]);
                label[i].innerHTML = this.formatDate(interpolatedDates[i + 1]);
                d3.select(label)
                    .text(this.formatDate(interpolatedDates[i + 1]));
            }
        });
        const textElement2 = d3.select('.grid-label');
        // Check if the text element exists
        var afterTextWidth = 0;
        if (!textElement.empty()) {
            // Get the width of the text element using getBoundingClientRect
            afterTextWidth = textElement2.node().getBoundingClientRect().width;
        }

        if(afterTextWidth!=beforeTextWidth)
        {
            const moveLabelsPixels = beforeTextWidth - afterTextWidth;
            dummyDiv.style('width', currentWidth + moveLabelsPixels/2 + 'px');
        }

    }

    resetZoomFromOutside() {
        this.x.domain(d3.extent(this.data, d => d.date));
        this.xAxis.transition().call(d3.axisBottom(this.x).ticks(3));
        this.yAxis.transition().duration(1000).call(d3.axisLeft(this.y).ticks(2));
        this.area
            .select('.myArea')
            .transition()
            .attr("d", this.areaGenerator);

        // Update gridlines and labels
        this.updateGridlineLabels();
    }

    resetZoom() {
        this.x.domain(d3.extent(this.data, d => d.date));
        this.xAxis.transition().call(d3.axisBottom(this.x).ticks(3));
        this.yAxis.transition().duration(1000).call(d3.axisLeft(this.y).ticks(2));
        this.area
            .select('.myArea')
            .transition()
            .attr("d", this.areaGenerator);

        // Update gridlines and labels
        this.updateGridlineLabels();

        this.mainChart.subLineCharts.forEach(subLineChart => {
            if (subLineChart.eventType !== this.eventType) {
                subLineChart.resetZoomFromOutside();
            }
        });
        this.mainChart.resetZoomFromOutside();
    }

    updateChartData(newData) {
        this.data = newData;

        // Update scales with new data
        this.x.domain(d3.extent(this.data, d => d.date));
        this.y.domain([0, d3.max(this.data, d => +d.value)]);
        this.colorScale.domain(d3.extent(this.data, d => d.date));

        // Update gradient
        this.gradient.selectAll("stop").remove();
        this.data.forEach((d, i) => {
            this.gradient.append("stop")
                .attr("offset", `${(i / (this.data.length - 1)) * 100}%`)
                .attr("stop-color", this.colorScale(d.date));
        });

        // Transition the area path
        this.area.select('.myArea')
            .datum(this.data)
            .transition()
            .duration(1000)
            .attr("d", this.areaGenerator);

        // Transition the x-axis
        this.xAxis.transition().duration(1000).call(d3.axisBottom(this.x).ticks(3));
        this.yAxis.transition().duration(1000).call(d3.axisLeft(this.y).ticks(2));

        // Update gridlines and labels
        //this.updateGridlines(); // Commented out to prevent overlap
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
