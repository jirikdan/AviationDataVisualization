function updateGlyphs() {
    glyphs.selectAll("path")
        .attr("d", d3.geoPath().projection(projection))
        .each(function (d) {
            if (!d.properties.selected) {
                d.properties.highlighted = false;
            }
            d3.select(this)
                //.attr("fill", d => d3.select(this).attr("fill")) // Preserve original color
                .attr("stroke", d => d.properties.highlighted ? "black" : "none")
                .attr("stroke-width", d => d.properties.highlighted ? 2 : 0)
                .attr("opacity", d => d.properties.selected ? 1 : 0.2);
        });
}



class ZoomableMap {
    constructor() {
        this.initialTransform = d3.zoomIdentity.translate(initX, initY).scale(initScale);
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

    setLinechart(lineChart){
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
            .extent([[0, 0], [width, height]])
            .tileSize(512)
            .clampX(false);

        const rasterLevels = svg.append("g")
            .attr("pointer-events", "none")
            .selectAll("g")
            .data(deltas)
            .join("g")
            .style("opacity", showlayers ? 0.3 : null);

        glyphs = svg.append("g");
        regions = svg.append("g");
        rects = svg.append("g");

        const zoom = d3.zoom()
            .scaleExtent([1 << 20, 1 << 24])
            .extent([[0, 0], [width, height]])
            .on("zoom", (event) => zoomed(event.transform));

        svg
            .call(zoom)
            .call(zoom.transform, this.initialTransform);


        function zoomed(transform) {
            projection
                .scale(transform.k / tau)
                .translate([transform.x, transform.y]);

            //copy of updateGlyphs function
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
        var svgPolygons = regions.selectAll("polygon").data(regionData, d => d.properties.name);
        svgPolygons.exit().remove();
        svgPolygons.enter()
            .append("polygon")
            .attr("id", (d, i) => "region_" + i)
            .attr("display", "none")
            .attr("points", function (d) {
                var newCoords = [];
                for (var i = 0; i < d.geometry.coordinates[0].length; i++) {
                    newCoords.push(projection(d.geometry.coordinates[0][i]));
                }
                return newCoords.map(coord => coord.join(",")).join(" ");
            })
            .attr("fill", "rgba(0, 0, 255, 0.3)")
            .style("pointer-events", "none");

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
        const format = d3.timeFormat("%m/%d/%Y %H:%M");
        const tooltip = d3.select("#tooltip");
        const content = this.currentColorVisualization === "time" ? d.properties.name : format(d.properties.date);
        tooltip.style("display", "block")
            .html(content)
            .style("left", `${event.pageX + 5}px`)
            .style("top", `${event.pageY + 5}px`);
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
            .domain(d3.extent(filteredData, d => d.properties.date));

        glyphs.selectAll("path")
            .attr("fill", d => colorScale(d.properties.date));

        this.displayColorScale();
    }

    updateColorsByName(names) {
        const predefinedColors = d3.schemeCategory10;
        const colorMapping = {};

        const uniqueNames = [...new Set(data.map(d => d.properties.name))];
        uniqueNames.forEach((name, index) => {
            colorMapping[name] = predefinedColors[index % predefinedColors.length];
        });

        glyphs.selectAll("path")
            .attr("fill", d => colorMapping[d.properties.name] || "black");

        //this.displayUniqueNames(colorMapping, names);
    }

    applyUpdates(names) {
        //console.log("Applying updates");
        //console.log(this.currentColorVisualization);
        if (this.currentColorVisualization === "time") {
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

        const scaleData = d3.range(0, 1, 0.01).map(d => this.currentColorScale(d));
        const formatDate = d3.timeFormat("%m/%d/%Y");

        const [startDate, endDate] = d3.extent(data, d => d.properties.date).map(formatDate);

        const startDateDiv = document.createElement("div");
        startDateDiv.textContent = `${startDate}`;
        startDateDiv.style.marginLeft = "5px";
        startDateDiv.style.width = "auto";
        startDateDiv.style.height = "auto";

        const endDateDiv = document.createElement("div");
        endDateDiv.textContent = `${endDate}`;
        endDateDiv.style.marginLeft = "5px";
        endDateDiv.style.width = "auto";
        endDateDiv.style.height = "auto";

        colorScaleDiv.appendChild(startDateDiv);

        scaleData.forEach((color, i) => {
            const div = document.createElement("div");
            div.style.backgroundColor = color;
            //div.style.height = "10px";
            //div.style.width = "10px";
            div.addEventListener("mouseover", (event) => this.showColorScaleTooltip(event, color, i));
            div.addEventListener("mouseout", () => this.hideTooltip());
            colorScaleDiv.appendChild(div);
        });

        colorScaleDiv.appendChild(endDateDiv);

        colorScaleDiv.style.display = "flex";
    }

    

    showColorScaleTooltip(event, color, i) {
        const tooltip = d3.select("#tooltip");

        const format = d3.timeFormat("%m/%d/%Y %H:%M");


        const date = d3.scaleLinear()
            .domain([0, 1])
            .range(d3.extent(data, d => d.properties.date))(i / 100);

        const formattedDate = format(new Date(date));

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
        d.properties.selected = d.properties.highlighted;
        this.highlightTableWithId(d.properties.id);
        lineChart.updateChartData(dataHandler.getHighlightedEventCounts().eventCounts);
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
