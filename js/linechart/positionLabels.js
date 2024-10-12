var offsetGlobalBottomLabels = 0; // Global variable to store the offset value for bottom labels

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