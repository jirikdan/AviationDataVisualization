class SubLineChart {
    constructor(selector, eventType, mainChart, isLastChart) {
        this.selector = selector;
        this.margin = { top: 20, right: 20, bottom: 0, left: 20 };

        this.width = 1240 - this.margin.left - this.margin.right;
        this.height = 60 - this.margin.top - this.margin.bottom;
        this.eventType = eventType;
        this.mainChart = mainChart;
        this.isLastChart = isLastChart;
        if (isLastChart) {
            this.margin.bottom = 20;
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
            .attr("class", this.isLastChart ? "x-axis" : "x-axis hidden-ticks");

        this.y = d3.scaleLinear()
            .range([this.height, 0]);

        this.yAxis = this.linechartSvg.append("g")
            .attr("class", "y-axis");

        this.clip = this.linechartSvg.append("defs").append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", this.width)
            .attr("height", this.height + 20) // Extend the height by 20 pixels
            .attr("x", 0)
            .attr("y", -20); // Shift the rectangle up by 20 pixels

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

        this.initGridlines();

        // Initialize tooltip
        this.tooltip = d3.select(this.selector)
            .append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("opacity", 0)
            .style("background-color", "white")
            .style("border", "solid 1px #d3d3d3")
            .style("padding", "5px")
            .style("pointer-events", "none")
            .style("font-size", "12px"); // Optional: adjust font size

        // Add event listeners for tooltip
        this.linechartSvg.append("rect")
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("fill", "none")
            .attr("pointer-events", "all")
            .on("mouseover", () => this.tooltip.style("opacity", 1))
            .on("mousemove", this.mousemove.bind(this))
            .on("mouseout", () => this.tooltip.style("opacity", 0));
    }

    initGridlines() {
        this.xGrid.call(d3.axisBottom(this.x).ticks(3).tickSize(-this.height - 23).tickFormat(""));
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

        // Update gridlines
        this.updateGridlines();
    }

    mousemove(event) {
        const [xPos, yPos] = d3.pointer(event, this.linechartSvg.node());
        const xDate = this.x.invert(xPos);
        const closestData = this.data.reduce((prev, curr) =>
            Math.abs(curr.date - xDate) < Math.abs(prev.date - xDate) ? curr : prev
        );
        this.tooltip
            .html(`Value: ${closestData.value}`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 20) + "px");
    }

    updateGridlines() {
        this.xGrid.call(d3.axisBottom(this.x).ticks(3).tickSize(-this.height - 36).tickFormat(""));
        this.xGrid.selectAll("line").attr("stroke-width", 3);
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
        this.area
            .select('.myArea')
            .transition()
            .duration(1000)
            .attr("d", this.areaGenerator);

        // Update gridlines
        this.updateGridlines();
    }

    updateChartFromOutside(newXDomain) {
        if (newXDomain) {
            this.x.domain(newXDomain);
        }
        this.xAxis.transition().duration(1000).call(d3.axisBottom(this.x).ticks(3));
        this.area
            .select('.myArea')
            .transition()
            .duration(1000)
            .attr("d", this.areaGenerator);
        this.updateGridlines();
    }

    resetZoomFromOutside() {
        this.x.domain(d3.extent(this.data, d => d.date));
        this.xAxis.transition().call(d3.axisBottom(this.x).ticks(3));
        this.area
            .select('.myArea')
            .transition()
            .attr("d", this.areaGenerator);

        // Update gridlines
        this.updateGridlines();
    }

    resetZoom() {
        this.x.domain(d3.extent(this.data, d => d.date));
        this.xAxis.transition().call(d3.axisBottom(this.x).ticks(3));
        this.area
            .select('.myArea')
            .transition()
            .attr("d", this.areaGenerator);

        // Update gridlines
        this.updateGridlines();

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

        // Update gridlines
        this.updateGridlines();
    }
}
