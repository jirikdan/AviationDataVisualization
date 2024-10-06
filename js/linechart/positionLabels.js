var offsetGlobalBottomLabels = 0; // Global variable to store the offset value for bottom labels
function offsetFixedLabelContainer() {
    // Get the width of the hiddenCharts div
    /*const hiddenCharts = document.getElementById('hiddenCharts');
    const hiddenChartsWidth = hiddenCharts.offsetWidth;
  
    // Set the width of the fixed-labels-container div to match hiddenCharts' width
    const fixedLabelsContainer = document.getElementById('fixed-labels-container');
    fixedLabelsContainer.style.width = hiddenChartsWidth + 'px';
  
    // Get the span with class chart-label inside hiddenCharts
    const chartLabelSpan = hiddenCharts.querySelector('.chart-container .chart-label');
    */
    /*if (chartLabelSpan) {
        // Get the width of the chart-label span
        const chartLabelWidth = chartLabelSpan.offsetWidth;

        // Get the computed margin-right of the chart-label span
        const chartLabelStyle = window.getComputedStyle(chartLabelSpan);
        const marginRight = parseFloat(chartLabelStyle.marginRight);

        // Calculate total width needed for the dummy div (span width + margin-right)
        const totalOffsetWidth = chartLabelWidth + marginRight;
        offsetGlobalBottomLabels = totalOffsetWidth;

        // Create a dummy div with the width of chart-label + margin-right
        const dummyDiv = document.createElement('div');
        dummyDiv.style.width = totalOffsetWidth + 395 + 'px';
        dummyDiv.style.display = 'inline-block'; // Ensure it does not collapse
        dummyDiv.style.marginRight = totalOffsetWidth + 'px'; // Reset margin-right to 0

        // Insert the dummy div at the beginning of fixed-labels-container
        fixedLabelsContainer.insertBefore(dummyDiv, fixedLabelsContainer.firstChild);
    }*/
}

/*function spaceOutLabelsByGridDistance(gridDistance) {
    console.log(gridDistance);
    const hiddenCharts = document.getElementById('hiddenCharts');
    const hiddenChartsWidth = hiddenCharts.offsetWidth;
  
    // Set the width of the fixed-labels-container div to match hiddenCharts' width
    const fixedLabelsContainer = document.getElementById('fixed-labels-container');
    fixedLabelsContainer.style.width = hiddenChartsWidth + 'px';
  
    // Get the span with class chart-label inside hiddenCharts
    const chartLabelSpan = hiddenCharts.querySelector('.chart-container .chart-label');

    const chartLabelWidth = chartLabelSpan.offsetWidth;

    // Get the computed margin-right of the chart-label span
    const chartLabelStyle = window.getComputedStyle(chartLabelSpan);
    const marginRight = parseFloat(chartLabelStyle.marginRight);

    // Calculate total width needed for the dummy div (span width + margin-right)
    const totalOffsetWidth = chartLabelWidth + marginRight;


    // Create a new CSS rule
    const styleSheet = document.styleSheets[0]; // Get the first stylesheet in the document

    // Define the new rule
    const rule = `.bottom-labels { margin-right: ${gridDistance - totalOffsetWidth}px; }`;
    const ruleLeft = `.bottom-labels { margin-left: ${totalOffsetWidth}px; }`;
    const ruleLeftFirst = `.first-bottom-label { margin-left: ${gridDistance}px; }`;
    // Add the new rule to the stylesheet
    if (styleSheet.insertRule) {
        //styleSheet.insertRule(rule, styleSheet.cssRules.length);
        //styleSheet.insertRule(ruleLeft, styleSheet.cssRules.length);
        //styleSheet.insertRule(ruleLeftFirst, styleSheet.cssRules.length);
    } else if (styleSheet.addRule) { // For IE support
        styleSheet.addRule('.bottom-labels', `margin-right: ${gridDistance}px;`);
        styleSheet.addRule('.bottom-labels', `margin-left: ${offsetGlobalBottomLabels}px;`);
    }
}*/

function computeFirstOffset()
{
    const hiddenCharts = document.getElementById('hiddenCharts');
    const hiddenChartsWidth = hiddenCharts.offsetWidth;
  
    // Set the width of the fixed-labels-container div to match hiddenCharts' width
    const fixedLabelsContainer = document.getElementById('fixed-labels-container');
    fixedLabelsContainer.style.width = hiddenChartsWidth + 'px';
  
    // Get the span with class chart-label inside hiddenCharts
    const chartLabelSpan = hiddenCharts.querySelector('.chart-container .chart-label');

    const chartLabelWidth = chartLabelSpan.offsetWidth;

    // Get the computed margin-right of the chart-label span
    const chartLabelStyle = window.getComputedStyle(chartLabelSpan);
    const marginRight = parseFloat(chartLabelStyle.marginRight);

    // Calculate total width needed for the dummy div (span width + margin-right)
    const totalOffsetWidth = chartLabelWidth + marginRight;
    return totalOffsetWidth;
}