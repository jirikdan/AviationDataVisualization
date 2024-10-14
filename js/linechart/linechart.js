class LineChart {
    constructor(selector) {
        this.selector = selector;
        this.margin = { top: 20, right: 20, bottom: 20, left: 20 };
        this.width = lineChartWidth - this.margin.left - this.margin.right;
        this.height = 100 - this.margin.top - this.margin.bottom;
        this.currentXDomain = null;
        this.initChart();
        this.subLineCharts = [];
        this.tickValues = this.x.ticks(3);
        console.log(this.tickValues);

    }

    initChart() {
        this.linechartSvg = d3.select(this.selector)
            .append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
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
            .attr("class", "x-axis");

        this.y = d3.scaleLinear()
            .range([this.height, 0]);
        this.yAxis = this.linechartSvg.append("g")
            .attr("class", "y-axis");

        this.clip = this.linechartSvg.append("defs").append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", this.width)
            .attr("height", this.height + 20)
            .attr("x", 0)
            .attr("y", -20);

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
            .attr("class", "grid hidden-ticks")
            .attr("transform", `translate(0,${this.height})`);
    }

    updateColorScale(scale) {
        this.colorScale = d3.scaleSequential(scale);  // Update color scale
        this.colorScale.domain(d3.extent(this.data, d => d.date));  // Recalculate domain based on data
        this.updateGradientAndRedraw();  // Redraw the chart with the new color scale
    }

    updateGradientAndRedraw() {
        // Update the gradient
        //console.log("Setting gradient and redrawing");
        this.gradient.selectAll("stop").remove();
        this.data.forEach((d, i) => {
            const color = d3.color(this.colorScale(d.date));
            this.gradient.append("stop")
                .attr("offset", `${(i / (this.data.length - 1)) * 100}%`)
                .attr("stop-color", color);
        });

        // Redraw the area chart with the updated gradient
        this.area.select('.myArea')
            .datum(this.data)
            .transition()
            .duration(1000)
            .attr("d", this.areaGenerator);

        // Redraw axes
        this.xAxis.transition().duration(1000).call(d3.axisBottom(this.x).ticks(3));
        this.yAxis.transition().duration(1000).call(d3.axisLeft(this.y).ticks(3));

        // Update gridlines
        //this.updateGridlines();
    }

    renderChart(data) {
        this.data = data;

        this.x.domain(d3.extent(this.data, d => d.date));
        //this.x.domain(dateSpan);
        this.xAxis.call(d3.axisBottom(this.x).ticks(3));
        this.y.domain([0, d3.max(this.data, d => +d.value)]);

        this.yAxis.call(d3.axisLeft(this.y).ticks(3));  // Fewer ticks on Y axis

        this.colorScale.domain(d3.extent(this.data, d => d.date));

        this.gradient.selectAll("stop").remove();
        this.data.forEach((d, i) => {
            let color = d3.color(this.colorScale(d.date));
            color = d3.rgb(color.r * 0.1, color.g * 0.1, color.b * 0.1); // Darken the color by reducing the RGB values
            this.gradient.append("stop")
                .attr("offset", `${(i / (this.data.length - 1)) * 100}%`)
                .attr("stop-color", color);
        });

        this.area.selectAll(".myArea").remove();
        this.area.append("path")
            .datum(this.data)
            .attr("class", "myArea")
            .attr("fill", "url(#gradient)")
            .attr("fill-opacity", .7)
            .attr("stroke", "black")
            .attr("d", this.areaGenerator);

        this.area.selectAll(".brush").remove();
        this.area
            .append("g")
            .attr("class", "brush")
            .call(this.brush);

        // Update gridlines
        this.updateGridlines();

        // Add X-axis labels
        //this.addXAxisLabels();
    }

    addXAxisLabels() {
        // Remove any existing labels
        d3.select(`${this.selector} .x-axis-labels`).remove();

        // Create a container for the labels
        const labelsContainer = d3.select(this.selector)
            .append('div')
            .attr('class', 'x-axis-labels')
            .style('position', 'relative')
            .style('width', `${this.width}px`)
            .style('margin', '0 auto')
            .style('display', 'flex')
            .style('justify-content', 'space-between')
            .style('top', '20px'); // Adjust this value to position the labels correctly

        // Get the tick values from the X axis
        const tickValues = this.x.ticks(3);

        // Generate labels
        tickValues.forEach((d, i) => {
            labelsContainer.append('div')
                .attr('class', 'x-axis-label')
                .style('flex', '1')
                .style('text-align', 'center')
                .text(d3.timeFormat('%b %d %H:%m')(d)); // Format the date as needed
        });
    }

    updateGridlines() {
        this.xGrid.call(d3.axisBottom(this.x).ticks(lineChartNumberOfDashedLines).tickSize(-this.height).tickFormat(""));
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
            this.currentXDomain = this.x.domain();
            // Update subLineCharts
            this.subLineCharts.forEach(subLineChart => {
                subLineChart.updateChartFromOutside(this.currentXDomain);
            });
        }

        this.xAxis.transition().duration(1000).call(d3.axisBottom(this.x).ticks(3));
        this.yAxis.transition().duration(1000).call(d3.axisLeft(this.y).ticks(3));

        this.area
            .select('.myArea')
            .transition()
            .duration(1000)
            .attr("d", this.areaGenerator);

        // Update gridlines
        //this.updateGridlines();

        // Update X-axis labels
        //this.addXAxisLabels();

        this.highlightDataInsideBrush();
    }

    resetZoom() {
        this.x.domain(d3.extent(this.data, d => d.date));
        this.xAxis.transition().call(d3.axisBottom(this.x).ticks(3));
        this.yAxis.transition().duration(1000).call(d3.axisLeft(this.y).ticks(3));
        this.area
            .select('.myArea')
            .transition()
            .attr("d", this.areaGenerator);

        // Update gridlines
        //this.updateGridlines();

        this.currentXDomain = this.x.domain(d3.extent(this.data, d => d.date));

        this.subLineCharts.forEach(subLineChart => {
            subLineChart.resetZoom();
        });

        // Update X-axis labels
        //this.addXAxisLabels();
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

        // Transition the X-axis
        this.xAxis.transition().duration(1000).call(d3.axisBottom(this.x).ticks(3));

        // Transition the Y-axis
        this.yAxis.transition().duration(1000).call(d3.axisLeft(this.y).ticks(3));

        // Update gridlines
        //this.updateGridlines();

        // Update X-axis labels
        //this.addXAxisLabels();
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
        //this.updateGridlines();

        // Update X-axis labels
        //this.addXAxisLabels();
    }

    resetZoomFromOutside() {
        this.x.domain(d3.extent(this.data, d => d.date));
        this.xAxis.transition().call(d3.axisBottom(this.x).ticks(3));
        this.area
            .select('.myArea')
            .transition()
            .attr("d", this.areaGenerator);

        // Update gridlines
        //this.updateGridlines();

        // Update X-axis labels
        //this.addXAxisLabels();
    }

    highlightDataInsideBrush() {
        data.forEach(point => {
            const dateMatches = point.properties.date >= this.x.domain()[0] && point.properties.date <= this.x.domain()[1];
            var element = document.getElementById(point.properties.id);

            if (dateMatches && point.properties.selected) {
                point.properties.highlighted = true;
                updateGlyphs();
                element.classList.add("highlighted");
            } else {
                point.properties.highlighted = false;
                updateGlyphs();
                element.classList.remove("highlighted");
            }
        });
    }
}

// Add the event listener and call the functions
document.addEventListener('DOMContentLoaded', (event) => {
    // Initial data load
    chartData = dataHandler.getSelectedEventCounts().eventCounts;
    lineChart = new LineChart("#my_dataviz");
    lineChart.renderChart(chartData);
    //console.log(zoomableMap);
    zoomableMap.setLinechart(lineChart);


    const scrollContainer = document.getElementById('hiddenCharts');
    const scrollAmount = 45; // Set this to the amount you want to scroll by each time
    
    scrollContainer.addEventListener('wheel', function (event) {
        // Prevent the default scroll behavior
        event.preventDefault();
    
        // Determine the scroll direction and set the new scroll position
        if (event.deltaY > 0) {
            // Scrolling down
            scrollContainer.scrollTop += scrollAmount;
        } else {
            // Scrolling up
            scrollContainer.scrollTop -= scrollAmount;
        }
    });
});

