function updateGlyphs() {
    glyphs.selectAll("path")
        .attr("d", d3.geoPath().projection(projection)) // Update the path data based on the projection
        .each(function (d) {
            if (!d.properties.selected) {
                d.properties.highlighted = false; // Ensure highlighted is false if not selected
            }

            const currentPath = d3.select(this); // Select the current path element

            // Calculate the centroid of the path for scaling
            const pathCentroid = d3.geoPath().projection(projection).centroid(d);

            currentPath
                .attr("fill", currentPath.attr("fill")) // Preserve the original fill color
                //.attr("stroke-linejoin", "round") // Smooth edges for the halo effect
                .attr("display", d => d.properties.selected ? "auto" : "none") // Control visibility based on selection
                .attr("transform", d => {
                    if (d.properties.highlighted) {
                        // Apply scaling relative to the centroid
                        return `translate(${pathCentroid[0]}, ${pathCentroid[1]}) scale(1.6) translate(${-pathCentroid[0]}, ${-pathCentroid[1]})`;
                    } else {
                        return null; // Reset transform if not highlighted
                    }
                })
                .classed("mapPoint", true) // Always add "mapPoint"
                .classed("highlighted point", d => d.properties.highlighted); // Add "highlighted" and "point" only if highlighted

            if (d.properties.highlighted) {
                currentPath.raise(); // Move the element to the end
            }
        });
}






class ZoomableMap {
    constructor() {
        this.initialTransform = d3.zoomIdentity.translate(initX, initY).scale(initScale);
        //console.log("Client width: " + document.getElementById("map").clientWidth);
        //console.log("Client height: " + document.getElementById("map").clientHeight);
        //get width and height of the svg element
        this.svgWidth = document.getElementById("map").clientWidth;

        this.width = document.getElementById("map").clientWidth;
        this.height = document.getElementById("map").clientHeight;
        this.showlayers = false;
        this.mapElement = this.createZoomableMap(this.width, this.height, this.showlayers);
        this.mapToSvg(data, glyphs);
        glyphs.selectAll("path").attr("d", d3.geoPath().projection(projection));
        this.colorVisualizations = ["time", "name"];
        this.currentColorVisualization = this.colorVisualizations[0];
        this.currentColorScale = d3.interpolateViridis; // Default color scale
        this.updateColorsByTime();
        this.updateColorsByName();
        enableRectangleSelection(this);
        this.lineChart = null;
        // Set up color scale selection listener
        this.setupColorScaleSelector();
    }

    setLinechart(lineChart) {
        this.lineChart = lineChart;
    }

    setupColorScaleSelector() {
        const colorScaleSelector = document.getElementById('colorScale');

        colorScaleSelector.addEventListener('change', (event) => {
            this.lineChart.updateGradientAndRedraw();
            const selectedScale = event.target.value;
            this.currentColorScale = d3[selectedScale]; // Dynamically assign selected color scale
            if (this.currentColorVisualization === "time") {
                this.updateColorsByTime(); // Reapply colors using the selected scale
            }
        });
    }

    createZoomableMap(width, height, showlayers) {
        const svg = d3.selectAll("svg");

        const tile = d3.tile()
            .extent([[0, 0], [width * 3, height * 3]])
            .tileSize(512)
            .clampX(false);

        const rasterLevels = svg.append("g")
            .attr("pointer-events", "none")
            .selectAll("g")
            .data(deltas)
            .join("g")
            .style("opacity", showlayers ? 0.3 : null)
            // .style("filter", "grayscale(100%)")
            .classed("raster", true);

        glyphs = svg.append("g");
        regions = svg.append("g");
        rects = svg.append("g");

        const zoom = d3.zoom()
            .scaleExtent([1 << 20.5, 1 << 28])
            .extent([[0, 0], [width, height]])
            .on("zoom", (event) => zoomed(event.transform));

        svg
            .call(zoom)
            .call(zoom.transform, this.initialTransform)
            .on("click", (event) => {
                const [x, y] = d3.pointer(event);
                const [lon, lat] = projection.invert([x, y]);
                console.log(`Latitude: ${lat}, Longitude: ${lon}`);
            });


        function zoomed(transform) {
            // Log current translation and scale values
            /*console.log("Current X Translation:", transform.x);
            console.log("Current Y Translation:", transform.y);
            console.log("Current Scale (Zoom Level):", transform.k);*/

            projection
                .scale(transform.k / tau)
                .translate([transform.x, transform.y]);

            // Copy of updateGlyphs function
            updateGlyphs();

            regions.selectAll("polygon")
                .attr("points", function (d) {
                    var newCoords = [];
                    for (var i = 0; i < d.geometry.coordinates[0].length; i++) {
                        newCoords.push(projection(d.geometry.coordinates[0][i]));
                    }
                    return newCoords.map(coord => coord.join(",")).join(" ");
                });

            rasterLevels.each(function (delta) {
                const tiles = tile.zoomDelta(delta)(transform);

                d3.select(this)
                    .selectAll("image")
                    .data(tiles, d => d)
                    .join("image")
                    .attr("xlink:href", d => url(...d3.tileWrap(d)))
                    .attr("x", ([x]) => (x + tiles.translate[0]) * tiles.scale)
                    .attr("y", ([, y]) => (y + tiles.translate[1]) * tiles.scale)
                    .attr("width", tiles.scale)
                    .attr("height", tiles.scale);
            });
        }

    }

    mapToSvg(data, glyphs) {
        var svgPoints = glyphs.selectAll("path").data(data, d => d.properties.name);
        svgPoints.exit().remove();
        svgPoints.enter()
            .append("path")
            .attr("datum", function (d) { return d; })
            .attr("d", path)
            .attr("fill", d => colorScale(d.properties.date))
            .on("mouseover", (event, d) => this.showTooltip(event, d))
            .on("mouseout", (event, d) => this.hideTooltip())
            .on("click", (event, d) => this.onGlyphClick(event, d));

        updateGlyphs();
    }

    // Tooltip methods
    showTooltip(event, d) {
        if (d.properties.selected) { // Only show tooltip if the point is selected
            const format = d3.timeFormat("%m/%d/%Y %H:%M");
            const tooltip = d3.select("#tooltip");
            const content = this.currentColorVisualization === "time" ? d.properties.name : format(d.properties.date);
            tooltip.style("display", "block")
                .html(content)
                .style("left", `${event.pageX + 5}px`)
                .style("top", `${event.pageY + 5}px`);
        }
    }


    hideTooltip() {
        d3.select("#tooltip").style("display", "none");
    }

    addItem() {
        var point = ["Feature " + featureId++, 14.24 + Math.random() * 0.04, 50.09 + Math.random() * 0.01];
        data.push(this.toGeoPoint(point));
        this.mapToSvg(data, glyphs);
        glyphs.selectAll("path").attr("d", d3.geoPath().projection(projection));
    }

    updateColorsByTime() {
        const filteredData = data.filter(d => d.properties.selected === true);

        colorScale = d3.scaleSequential(this.currentColorScale)
            .domain(dateSpan);

        glyphs.selectAll("path")
            .attr("fill", d => colorScale(d.properties.date));

        this.displayColorScale();
    }

    updateColorsByName(names) {
        //const predefinedColors = d3.schemeCategory10;
        /*const colorMapping = {};

        const uniqueNames = [...new Set(data.map(d => d.properties.name))];
        uniqueNames.forEach((name, index) => {
            colorMapping[name] = predefinedColors[index % predefinedColors.length];
        });
*/
        glyphs.selectAll("path")
            .attr("fill", d => colorMapping[d.properties.name] || "black");

        //this.displayUniqueNames(colorMapping, names);
    }

    applyUpdates(names) {
        //console.log("Applying updates");
        //console.log(this.currentColorVisualization);
        if (this.currentColorVisualization === "time") {
            //console.log("UpdatingByTime");
            this.updateColorsByTime();
        } else if (this.currentColorVisualization === "name") {
            this.updateColorsByName(names);
        }

        //selected glyphs are highlighted
        updateGlyphs();
    }

    displayColorScale() {
        const colorScaleDiv = document.getElementById("color-scale");
        colorScaleDiv.innerHTML = ""; // Clear existing content

        // Set the fixed width for the container div
        const fixedWidth = 400; // Adjust this value as needed
        colorScaleDiv.style.width = `${fixedWidth}px`;
        colorScaleDiv.style.overflow = "hidden"; // Optional: to prevent overflow
        colorScaleDiv.style.display = "flex"; // For horizontal layout

        // Filter data based on the selected property
        const selectedData = data.filter(d => d.properties.selected === true);

        // Check if there is any selected data
        if (selectedData.length === 0) {
            console.warn("No selected data found.");
            return;
        }

        // Format for displaying dates
        const formatDate = d3.timeFormat("%m/%d/%Y");

        // Get the start and end dates from the global dateSpan
        const startDate = new Date(dateSpan[0]);
        const endDate = new Date(dateSpan[1]);
        const startDateFormatted = formatDate(startDate);
        const endDateFormatted = formatDate(endDate);

        // Create and style the start and end date divs
        const startDateDiv = document.createElement("div");
        startDateDiv.textContent = startDateFormatted;
        startDateDiv.style.marginLeft = "5px";
        startDateDiv.style.width = "auto";
        startDateDiv.style.height = "auto";

        const endDateDiv = document.createElement("div");
        endDateDiv.textContent = endDateFormatted;
        endDateDiv.style.marginLeft = "5px";
        endDateDiv.style.width = "auto";
        endDateDiv.style.height = "auto";

        // Append the start date div to the color scale container
        colorScaleDiv.appendChild(startDateDiv);

        // Sort the selected data by date to ensure a continuous scale
        const sortedData = selectedData.sort((a, b) => new Date(a.properties.date) - new Date(b.properties.date));

        // Calculate dynamic width for each color segment div
        const segmentWidth = Math.floor(fixedWidth / sortedData.length);

        // Map each selected data entry to a normalized color within dateSpan
        sortedData.forEach((d, i) => {
            const date = new Date(d.properties.date);
            // Normalize the date within the dateSpan range
            const normalizedValue = (date - startDate) / (endDate - startDate);
            const color = this.currentColorScale(normalizedValue); // Apply color scale

            const div = document.createElement("div");
            div.style.backgroundColor = color;
            div.style.height = "10px"; // Adjust height as needed
            div.style.width = `${segmentWidth}px`; // Set dynamic width for each segment
            div.addEventListener("mouseover", (event) => this.showColorScaleTooltip(event, color, i));
            div.addEventListener("mouseout", () => this.hideTooltip());
            colorScaleDiv.appendChild(div);
        });

        // Append the end date div to the color scale container
        colorScaleDiv.appendChild(endDateDiv);
    }





    showColorScaleTooltip(event, color, i) {
        const tooltip = d3.select("#tooltip");

        // Retrieve the date directly from the sortedData array
        const selectedData = data.filter(d => d.properties.selected === true);
        const sortedData = selectedData.sort((a, b) => new Date(a.properties.date) - new Date(b.properties.date));
        const date = new Date(sortedData[i].properties.date); // Get the date of the current segment

        const format = d3.timeFormat("%m/%d/%Y %H:%M");
        const formattedDate = format(date);

        tooltip.style("display", "block")
            .html(`Date: ${formattedDate}`)
            .style("left", `${event.pageX + 5}px`)
            .style("top", `${event.pageY + 5}px`);
    }


    displayUniqueNames(colorMapping, uniqueNames) {
        const uniqueNamesDiv = document.getElementById("unique-names");
        uniqueNamesDiv.innerHTML = "";

        uniqueNames.forEach(name => {
            const nameDiv = document.createElement("div");
            nameDiv.style.backgroundColor = colorMapping[name];
            nameDiv.style.color = "white";
            nameDiv.style.position = "relative";
            nameDiv.style.display = "inline-block";
            nameDiv.style.padding = "5px";
            //nameDiv.style.margin = "5px";
            nameDiv.style.marginLeft = "5px";
            nameDiv.style.borderRadius = "5px";
            nameDiv.style.cursor = "pointer";

            nameDiv.textContent = name;

            const removeSpan = document.createElement("span");
            removeSpan.className = 'remove';
            removeSpan.style.position = "absolute";
            removeSpan.style.top = "0";
            removeSpan.style.right = "0";
            removeSpan.style.width = "16px";
            removeSpan.style.height = "16px";
            removeSpan.style.backgroundColor = "rgb(87, 24, 24)";
            removeSpan.style.color = "rgb(255, 255, 255)";
            removeSpan.style.textAlign = "center";
            removeSpan.style.lineHeight = "16px";
            removeSpan.style.borderRadius = "50%";
            removeSpan.style.cursor = "pointer";
            removeSpan.style.display = "none";
            removeSpan.textContent = 'X';

            removeSpan.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent triggering parent click
                const indexToRemove = uniqueNames.indexOf(name);
                uniqueNames.splice(indexToRemove, 1); // Remove name from uniqueNames array
                nameDiv.remove(); // Remove the nameDiv from the DOM

                if (uniqueNames.length === 0) {
                    const noEventsDiv = document.createElement("div");
                    noEventsDiv.textContent = "No events selected";
                    uniqueNamesDiv.appendChild(noEventsDiv);
                }

                document.querySelector(`.checkbox-group input[type="checkbox"][value="${name}"]`).checked = false;
                updateSelectAllButtonText();
                updateSelectedEvents();
                const filters = getFilters();
                applyFilters(filters);
                showActiveFilters(filters);

            });

            nameDiv.appendChild(removeSpan);

            nameDiv.addEventListener('mouseover', () => {
                removeSpan.style.display = "block";
            });

            nameDiv.addEventListener('mouseout', () => {
                removeSpan.style.display = "none";
            });

            uniqueNamesDiv.appendChild(nameDiv);
        });

        if (uniqueNames.length === 0) {
            const div = document.createElement("div");
            div.textContent = "No events selected";
            uniqueNamesDiv.appendChild(div);
        }

        //document.getElementById("color-scale").style.display = "none";
        uniqueNamesDiv.style.display = "block";
    }

    // Function to handle glyph click
    onGlyphClick(event, d) {
        if (checkIfPointPassesFilter(d)) {
            d.properties.highlighted = !d.properties.highlighted;
            //d.properties.selected = d.properties.highlighted;
            this.highlightTableWithId(d.properties.id);
            //lineChart.updateChartData(dataHandler.getHighlightedEventCounts().eventCounts);
            updateHighlightedSubcharts();
            updateGlyphs();
        }
    }

    // Placeholder function to be called with glyph id
    highlightTableWithId(id) {
        //console.log(`Function called with id: ${id}`);
        // Add your custom logic here
        //find a html element with the id
        var element = document.getElementById(id);
        //toggle class highlighted
        element.classList.toggle("highlighted");
    }


}
