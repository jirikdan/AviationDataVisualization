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
        // Flag to track programmatic brush moves
        this.isProgrammaticBrushMove = false;
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
        // Update the x domain with dateSpan for consistency
        this.x.domain(dateSpan);
    
        // Update the gradient
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
    }
    

    renderChart(data) {
        console.log("rendering main linechart");
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
            .attr("fill", "url(#gradient)")
            .attr("fill-opacity", .7)
            .attr("stroke", "black")
            .attr("d", this.areaGenerator);
    
        // Attach the brush with updated selection
        this.area.selectAll(".brush").remove();
        this.area
            .append("g")
            .attr("class", "brush")
            .call(this.brush);
    
        // Update gridlines based on the new x domain
        this.updateGridlines();
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

        // Define bin size, e.g., one day
        const binSize = 24 * 60 * 60 * 1000; // One day in milliseconds

        // Convert brush pixel positions to date values
        let [start, end] = [this.x.invert(extent[0]), this.x.invert(extent[1])];

        // Snap `start` to the beginning of the bin and `end` to the end of the bin
        const snappedStart = new Date(Math.floor(start.getTime() / binSize) * binSize);
        const snappedEnd = new Date(Math.ceil(end.getTime() / binSize) * binSize - 1);

        // Calculate the snapped pixel positions on the x scale
        const snappedExtent = [this.x(snappedStart), this.x(snappedEnd)];

        // Programmatically move the brush to snap to bins
        this.isProgrammaticBrushMove = true;  // Set flag to true
        d3.select(this.selector).select(".brush").call(this.brush.move, snappedExtent);
        this.isProgrammaticBrushMove = false;  // Reset flag to false

        // Update the brush selection rectangle style
        this.area.selectAll(".selection-rectangle").remove();
        this.area.append("rect")
            .attr("class", "selection-rectangle")
            .attr("x", snappedExtent[0])
            .attr("y", 0)
            .attr("width", snappedExtent[1] - snappedExtent[0])
            .attr("height", this.height)
            .attr("fill", "rgba(0, 0, 255, 0.2)")
            .attr("stroke", "blue")
            .attr("stroke-width", 1)
            .on("mouseover", function() {
                tooltip.style("display", "block");
            })
            .on("mousemove", (event) => {
                // Get bounding box of the SVG container to determine proper coordinates for tooltip positioning
                const containerElement = d3.select(this.selector).node();
                const containerBox = containerElement.getBoundingClientRect();

                // Calculate the midpoint of the brush selection and tooltip position
                const midPoint = (snappedExtent[0] + snappedExtent[1]) / 2;
                const tooltipX = midPoint + containerBox.left + this.margin.left;
                const tooltipY = containerBox.top + this.margin.top;

                // Update tooltip content and position it according to mouse position
                tooltip.html(`From: ${d3.timeFormat("%B %d, %Y %H:%M")(snappedStart)}<br>To: ${d3.timeFormat("%B %d, %Y %H:%M")(snappedEnd)}`)
                    .style("left", `${tooltipX}px`)
                    .style("top", `${tooltipY - 80}px`)
                    .style("transform", "translateX(-50%)");
            })
            .on("mouseout", function() {
                tooltip.style("display", "none");
            });

        // Highlight data inside the snapped brush selection
        this.highlightDataInsideBrush(snappedStart, snappedEnd);
    }
    
    
    
    
    
    

    updateChartData(newData) {
        console.log("updating main linechart data");
        console.log(newData);
        this.data = newData;
    
        // Set x domain to dateSpan instead of recalculating from data
        this.x.domain(dateSpan);
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
    
        // Transition the X-axis with dateSpan domain
        this.xAxis.transition().duration(1000).call(d3.axisBottom(this.x).ticks(3));
    
        // Transition the Y-axis
        this.yAxis.transition().duration(1000).call(d3.axisLeft(this.y).ticks(3));
    }
    

    highlightDataInsideBrush(start, end) {
        // Adjust the start and end to the nearest bin boundaries
        const binSize = 24 * 60 * 60 * 1000; // One day in milliseconds
    
        // Round start to the beginning of the day (bin start)
        const adjustedStart = new Date(Math.floor(start.getTime() / binSize) * binSize);
        
        // Round end to the end of the day (bin end)
        const adjustedEnd = new Date(Math.ceil(end.getTime() / binSize) * binSize - 1); 
    
        // Debug: Log the adjusted start and end
        console.log("Adjusted Start:", adjustedStart);
        console.log("Adjusted End:", adjustedEnd);
    
        // Iterate through the data and highlight points within the adjusted range
        data.forEach(point => {
            const dateMatches = point.properties.date >= adjustedStart && point.properties.date <= adjustedEnd;
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
                console.warn(`Element with id ${point.properties.id} not found.`);
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