// Object to store the state of selected checkboxes
let selectedEventTypes = {};

// Array to store the order of selected event types
let eventOrder = [];

document.getElementById('toggleButton').addEventListener('click', function () {
    var hiddenTexts = document.getElementById('hiddenCharts');
    var eventSelection = document.getElementById('eventSelection');
    var fixedLabelContainer = document.getElementById('fixed-labels-container');

    if (hiddenTexts.classList.contains('hidden')) {
        // Show hidden charts and event selection
        hiddenTexts.classList.remove('hidden');
        eventSelection.classList.remove('hidden');
        fixedLabelContainer.classList.remove('hidden');
        this.textContent = 'Close';

        // Populate the eventSelection div with checkboxes
        populateEventSelection();

        lineChart.xAxis.attr("class", "x-axis hidden-ticks");
        lineChart.xGrid.attr("class", "grid");
        createMoreLineCharts();

    } else {
        // Hide hidden charts and event selection
        hiddenTexts.classList.add('hidden');
        eventSelection.classList.add('hidden');
        fixedLabelContainer.classList.add('hidden');
        this.textContent = 'See More';
        lineChart.subLineCharts = [];
        lineChart.xAxis.attr("class", "x-axis");
        lineChart.xGrid.attr("class", "grid hidden-ticks");
    }
});

function populateEventSelection() {
    const eventCounts = dataHandler.getSelectedEventCounts().eventCounts; // Assuming this contains event counts
    const activeEventTypes = dataHandler.getSelectedEventCounts().activeEventTypes; // Fetch active event types

    const eventSelection = document.getElementById('eventSelection');
    eventSelection.innerHTML = ''; // Clear previous selections

    // Create "hide/unhide all" button
    const hideAllContainer = document.createElement('div');
    hideAllContainer.classList.add('hide-all-container'); // Additional class for custom styling

    const hideAllButton = document.createElement('button');
    hideAllButton.id = 'hideAllButton';
    hideAllButton.textContent = 'Sort'; // Start with "Unhide All"

    let isHidden = true;

    hideAllButton.addEventListener('click', function () {
        isHidden = !isHidden;
        eventSelection.querySelectorAll('.checkbox-container:not(.hide-all-container)').forEach(container => {
            container.style.display = isHidden ? 'none' : 'flex';
        });
        hideAllButton.textContent = isHidden ? 'Sort' : 'Close';
    });

    hideAllContainer.appendChild(hideAllButton);
    eventSelection.appendChild(hideAllContainer);

    // Sort event types by their occurrence count in descending order
    const orderedEventTypes = activeEventTypes.sort((a, b) => eventCounts[b] - eventCounts[a]);

    // Use sorted event types to maintain the order
    orderedEventTypes.forEach((eventType, index) => {
        const checkboxContainer = document.createElement('div');
        checkboxContainer.classList.add('checkbox-container');
        checkboxContainer.dataset.eventType = eventType;

        // Set the background color based on the event type
        checkboxContainer.style.backgroundColor = colorMapping[eventType];

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `eventCheckbox_${index}`;
        checkbox.value = eventType;
        checkbox.checked = selectedEventTypes[eventType] !== undefined ? selectedEventTypes[eventType] : true;

        // Save the state when checkbox is clicked
        checkbox.addEventListener('change', function () {
            selectedEventTypes[eventType] = checkbox.checked;
            updateOrderOfLineCharts(); // Update charts when selection changes
        });

        const label = document.createElement('label');
        label.htmlFor = `eventCheckbox_${index}`;
        label.textContent = `${eventType} (${eventCounts[eventType]})`; // Display event type and occurrence count

        checkboxContainer.appendChild(checkbox);
        checkboxContainer.appendChild(label);

        checkboxContainer.style.display = 'none'; // Initially hide all checkboxes

        eventSelection.appendChild(checkboxContainer);
    });

    // Make the eventSelection div sortable
    new Sortable(eventSelection, {
        animation: 150,
        onEnd: function (evt) {
            eventOrder = Array.from(eventSelection.children)
                .filter(container => !container.classList.contains('hide-all-container'))
                .map(container => container.dataset.eventType);
            updateOrderOfLineCharts(); // Update charts when order changes
        }
    });
}



function updateOrderOfLineCharts() {
    console.log('Updating order of line charts');
    const selectedCheckboxes = Array.from(document.querySelectorAll('#eventSelection input[type="checkbox"]:checked'));

    const selectedTypes = selectedCheckboxes.map(checkbox => checkbox.value);

    const container = document.getElementById('hiddenCharts');
    container.innerHTML = ''; // Clear the container before adding new charts

    selectedTypes.forEach((eventType, index) => {
        const chartContainer = document.createElement('div');
        chartContainer.classList.add('chart-container');

        const label = document.createElement('span');
        label.classList.add('chart-label');
        label.textContent = eventType;

        // Set the color of the label based on the event type
        label.style.color = colorMapping[eventType];

        const newDiv = document.createElement('div');
        newDiv.id = `linechart_${index}`;
        newDiv.classList.add('linechart');

        // Set background color for the chart container if desired
        chartContainer.style.backgroundColor = colorMapping[eventType] + '15'; // Slightly transparent background

        chartContainer.appendChild(label); // Append the label next to the chart
        chartContainer.appendChild(newDiv);

        container.appendChild(chartContainer);

        const subChartData = dataHandler.getEventTypeData(eventType);
        const isLastChart = index === selectedTypes.length - 1;
        const subLineChart = new SubLineChart(`#linechart_${index}`, eventType, lineChart, isLastChart);
        subLineChart.renderChart(subChartData);
        lineChart.subLineCharts.push(subLineChart);
        subLineChart.x.domain([lineChart.x.domain()[0], lineChart.x.domain()[1]]);
        subLineChart.xAxis.call(d3.axisBottom(subLineChart.x).ticks(5));
        subLineChart.area
            .select('.myArea')
            .transition()
            .attr("d", subLineChart.areaGenerator)
            .style("fill", colorMapping[eventType]) // Apply color to the chart area
            .style("stroke", colorMapping[eventType]); // Apply color to the chart line
        subLineChart.updateGridlines();
    });
}



function createMoreLineCharts() {
    populateEventSelection(); // Update the event selection div with the current state
    console.log('Creating more line charts');
    const selectedCheckboxes = Array.from(document.querySelectorAll('#eventSelection input[type="checkbox"]:checked'));

    const selectedTypes = selectedCheckboxes.map(checkbox => checkbox.value);

    const container = document.getElementById('hiddenCharts');
    container.innerHTML = ''; // Clear the container before adding new charts

    let maxYValue = 0;

    selectedTypes.forEach((eventType, index) => {
        const chartContainer = document.createElement('div');
        chartContainer.classList.add('chart-container');

        const label = document.createElement('span');
        label.classList.add('chart-label');
        label.textContent = eventType;

        // Set the color of the label based on the event type
        label.style.color = colorMapping[eventType];

        const newDiv = document.createElement('div');
        newDiv.id = `linechart_${index}`;
        newDiv.classList.add('linechart');

        // Set background color for the chart container if desired
        chartContainer.style.backgroundColor = colorMapping[eventType] + '15'; // Slightly transparent background

        chartContainer.appendChild(label); // Append the label next to the chart
        chartContainer.appendChild(newDiv);

        container.appendChild(chartContainer);

        const subChartData = dataHandler.getEventTypeData(eventType);
        const isLastChart = index === selectedTypes.length - 1;
        const subLineChart = new SubLineChart(`#linechart_${index}`, eventType, lineChart, isLastChart);
        
        
        subLineChart.renderChart(subChartData);
        
        lineChart.subLineCharts.push(subLineChart);
        subLineChart.x.domain([lineChart.x.domain()[0], lineChart.x.domain()[1]]);
        subLineChart.xAxis.call(d3.axisBottom(subLineChart.x).ticks(5));
        subLineChart.area
            .select('.myArea')
            .transition()
            .attr("d", subLineChart.areaGenerator)
            .style("fill", colorMapping[eventType]) // Apply color to the chart area
            .style("stroke", colorMapping[eventType]); // Apply color to the chart line
        subLineChart.updateGridlines();
        if (subLineChart.y.domain()[1] > maxYValue) {
            maxYValue = subLineChart.y.domain()[1];
        }
        subLineChart.changeYAxisRange(maxYValue);
    });
}



// Initialize the selectedEventTypes and eventOrder when the page loads or the charts are first shown
(function initializeSelectedEventTypes() {
    const activeEventTypes = dataHandler.getSelectedEventCounts().activeEventTypes;
    activeEventTypes.forEach(eventType => {
        if (selectedEventTypes[eventType] === undefined) {
            selectedEventTypes[eventType] = true; // Set default to true if not already set
        }
        if (!eventOrder.includes(eventType)) {
            eventOrder.push(eventType); // Add to order array if not already present
        }
    });
})();
