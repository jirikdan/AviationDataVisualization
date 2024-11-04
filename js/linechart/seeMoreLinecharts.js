// Object to store the state of selected checkboxes
let selectedEventTypes = {};

// Array to store the order of selected event types
let eventOrder = [];

let maxYValue = 0;

var eventSelection = document.getElementById('eventSelection');
eventSelection.classList.add('hidden');



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
        updateOrderOfLineCharts(); // Update the line charts based on the selected checkboxes
        updateHighlightedSubcharts(); // Update the line charts based on the selected points
        //sortChartsByMaxYValue(); // Sort the charts by maximum Y value

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
let isHidden = true;
function populateEventSelection() {
    // Get active event types using dataHandler.getSelectedEventCounts()
    var somethingSelected = false;
    for (var i = 0; i < dataHandler.data.length; i++) {
        if (dataHandler.data[i].properties.selected && dataHandler.data[i].properties.highlighted) {
            somethingSelected = true;
            break;
        }
    }
    var activeEventTypes;
    if (somethingSelected) {
        activeEventTypes = dataHandler.getHighlightedEventCounts().activeEventTypes;
    } else {
        activeEventTypes = dataHandler.getSelectedEventCounts().activeEventTypes;
    }
    //console.log('Active event types:', activeEventTypes);

    const eventSelection = document.getElementById('eventSelection');
    eventSelection.innerHTML = ''; // Clear previous selections

    // Create "hide/unhide all" button
    const hideAllContainer = document.createElement('div');
    hideAllContainer.classList.add('hide-all-container'); // Additional class for custom styling

    const hideAllButton = document.createElement('button');
    hideAllButton.id = 'hideAllButton';
    hideAllButton.textContent = 'Sort'; // Start with "Sort"

    hideAllButton.addEventListener('click', function () {
        isHidden = !isHidden;
        eventSelection.querySelectorAll('.checkbox-container:not(.hide-all-container)').forEach(container => {
            container.style.display = isHidden ? 'none' : 'flex';
        });
        hideAllButton.textContent = isHidden ? 'Sort' : 'Close';
        //get sortByMaxYButton and display it or hide it
        var sortByMaxYButton = document.getElementById('sortByMaxYButton');
        if (isHidden) {
            sortByMaxYButton.style.display = 'none';
        } else {
            sortByMaxYButton.style.display = 'block';
        }
    });
    hideAllContainer.appendChild(hideAllButton);
    eventSelection.appendChild(hideAllContainer);

    // Create a separate button for sorting by max Y value
    const sortButton = document.createElement('button');
    sortButton.id = 'sortByMaxYButton';
    sortButton.textContent = 'Max Y';

    // Add event listener to sort the charts by maximum Y value when clicked
    sortButton.addEventListener('click', function () {
        sortChartsByMaxYValue(); // Call the sorting function
    });

    hideAllContainer.appendChild(sortButton); // Append the sort button to the container

    // Iterate over each active event type and display checkboxes
    activeEventTypes.forEach((eventType, index) => {
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
        label.textContent = " ";//eventType; // Display only the event type (no count)

        checkboxContainer.appendChild(checkbox);
        checkboxContainer.appendChild(label);

        if (isHidden) {
            checkboxContainer.style.display = 'none'; // Initially hide all checkboxes
        } else {
            checkboxContainer.style.display = 'flex'; // Show all checkboxes
        }

        eventSelection.appendChild(checkboxContainer);
    });



    // Make the eventSelection div sortable
    new Sortable(eventSelection, {
        animation: 150,
        handle: '.checkbox-container', // Only allow dragging of elements with the class 'checkbox-container'
        filter: '.hide-all-container', // Exclude the container with the sort buttons from being dragged
        preventOnFilter: false, // Ensure that the filtered elements are not affected at all
        fallbackOnBody: true,  // Use body as a fallback for placing dragged elements
        fallbackTolerance: 10, // Tolerance before fallback kicks in to prevent dragging over non-draggable areas
        onMove: function (evt) {
            const target = evt.related;
            // Prevent dropping on the sort buttons
            if (target && target.classList.contains('hide-all-container')) {
                return false;
            }
        },
        onEnd: function (evt) {
            eventOrder = Array.from(eventSelection.children)
                .filter(container => !container.classList.contains('hide-all-container'))
                .map(container => container.dataset.eventType);
            updateOrderOfLineCharts(); // Update charts when order changes
        }
    });
    
    
}








function updateOrderOfLineCharts() {
    //console.log('Updating order of line charts');
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
        //subLineChart.updateGridlines();
        if (subLineChart.y.domain()[1] > maxYValue) {
            maxYValue = subLineChart.y.domain()[1];
        }
        //console.log('Max Y value sort:', maxYValue);
        subLineChart.changeYAxisRange(maxYValue);
    });
}


function createMoreLineCharts() {
    populateEventSelection(); // Update the event selection div with the current state
    //console.log('Creating more line charts');
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
        if (subLineChart.y.domain()[1] > maxYValue) {
            maxYValue = subLineChart.y.domain()[1];
        }
        subLineChart.changeYAxisRange(maxYValue);
    });

}


function sortChartsByMaxYValue() {
    console.log('Sorting charts and checkboxes by maximum Y value');

    const selectedCheckboxes = Array.from(document.querySelectorAll('#eventSelection input[type="checkbox"]:checked'));
    const allCheckboxes = Array.from(document.querySelectorAll('#eventSelection input[type="checkbox"]'));

    const selectedTypes = selectedCheckboxes.map(checkbox => checkbox.value);

    // Get the maximum Y values for each event type
    const maxYValues = selectedTypes.map(eventType => {
        if (dataHandler.isAnythingHighlighted()) {
            const subChartData = dataHandler.getHighlightedEventCountsByType(eventType).eventCounts;
            const maxY = d3.max(subChartData, d => d.value); // Assuming 'value' is the property for Y axis data
            return { eventType, maxY };
        } else {
            const subChartData = dataHandler.getEventTypeData(eventType);
            const maxY = d3.max(subChartData, d => d.value); // Assuming 'value' is the property for Y axis data
            return { eventType, maxY };
        }
    });

    console.log('Max Y values before filtering:', maxYValues);

    // Filter out any eventTypes where maxY is undefined
    const filteredMaxYValues = maxYValues.filter(d => d.maxY !== undefined);

    console.log('Max Y values after filtering:', filteredMaxYValues);

    // Sort the event types by their maxY value in descending order
    const sortedEventTypes = filteredMaxYValues
        .sort((a, b) => b.maxY - a.maxY)
        .map(d => d.eventType);

    console.log('Sorted event types:', sortedEventTypes);

    // Sort the checkboxes based on the sorted event types
    const eventSelection = document.getElementById('eventSelection');
    const checkboxContainers = Array.from(eventSelection.querySelectorAll('.checkbox-container:not(.hide-all-container)'));

    // Clear the existing checkboxes and re-order them
    checkboxContainers.forEach(container => eventSelection.removeChild(container));

    // Append the checkboxes in the new sorted order
    sortedEventTypes.forEach(eventType => {
        const checkboxContainer = checkboxContainers.find(container => container.dataset.eventType === eventType);
        eventSelection.appendChild(checkboxContainer);
    });

    // Clear the container before adding new sorted charts
    const container = document.getElementById('hiddenCharts');
    container.innerHTML = '';

    // Re-render the sorted charts
    sortedEventTypes.forEach((eventType, index) => {
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
        const isLastChart = index === sortedEventTypes.length - 1;
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
        //subLineChart.updateGridlines();

        // Update maxYValue for consistent Y axis scaling
        if (subLineChart.y.domain()[1] > maxYValue) {
            maxYValue = subLineChart.y.domain()[1];
        }
        subLineChart.changeYAxisRange(maxYValue);

        updateHighlightedSubchartsAfterSort(); // Update the line charts based on the selected points
    });
}

