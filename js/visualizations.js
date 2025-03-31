// Modal Management
const ModalManager = {
    modals: {
        feedback: 'feedback-modal',
        completion: 'completion-modal',
        cheatSheet: 'cheat-sheet-modal'
    },

    show(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            setTimeout(() => modal.classList.add('fade-in'), 10);
        }
    },

    hide(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('fade-out');
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.classList.remove('fade-out');
            }, 500);
        }
    },

    showFeedback(correct, message) {
        const modal = document.getElementById(this.modals.feedback);
        if (!modal) return;

        const icon = document.getElementById('feedback-icon');
        const title = document.getElementById('feedback-title');

        if (correct) {
            icon.className = 'mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100';
            icon.innerHTML = '<svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
            title.textContent = 'Correct!';
            title.className = 'text-lg leading-6 font-medium text-green-900 mt-4';
        } else {
            icon.className = 'mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100';
            icon.innerHTML = '<svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';
            title.textContent = 'Incorrect';
            title.className = 'text-lg leading-6 font-medium text-red-900 mt-4';
        }

        document.getElementById('feedback-message').innerHTML = message;
        this.show(this.modals.feedback);
    },

    showCompletion(score, accuracy) {
        document.getElementById('final-score').textContent = score;
        document.getElementById('final-accuracy').textContent = `${accuracy}%`;
        this.show(this.modals.completion);
    }
};


// Define the renderChart function before it's used
function renderChart(challenge) {
    try {
        const timelineData = challenge.simulation.timeline;
        const timePoints = timelineData.timePoints;
        const totalDays = challenge.experiment.requiredRuntimeDays;
        const currentDays = challenge.simulation.timeline.currentRuntimeDays;

        // Generate complete timeline including future empty periods
        window.completeTimeline = [...timePoints];
        if (currentDays < totalDays) {
            const lastPoint = timePoints[timePoints.length - 1];
            const { type } = lastPoint.period;
            const periodLength = type === 'day' ? 1 : type === 'week' ? 7 : 28;
            let nextDay = lastPoint.period.startDay + periodLength;

            while (nextDay <= totalDays) {
                completeTimeline.push({
                    period: { type, startDay: nextDay },
                    base: {
                        rate: null,
                        rateCI: [null, null],
                        visitors: null,
                        conversions: null,
                        cumulativeRate: null,
                        cumulativeRateCI: [null, null]
                    },
                    variant: {
                        rate: null,
                        rateCI: [null, null],
                        visitors: null,
                        conversions: null,
                        cumulativeRate: null,
                        cumulativeRateCI: [null, null]
                    }
                });
                nextDay += periodLength;
            }
        }

        // Create labels based on time period
        const labels = completeTimeline.map((point, index) => {
            const { type, startDay } = point.period;
            let label;
            if (type === 'day') {
                label = `Day ${startDay}`;
            } else if (type === 'week') {
                label = `Week ${Math.ceil(startDay / 7)}`;
            } else {
                label = `Month ${Math.ceil(startDay / 28)}`;
            }
            // Add brackets around the label if it's the last full business cycle
            if (index === timelineData.lastFullBusinessCycleIndex) {
                label = `[${label}]`;
            }
            return label;
        });

        // Configure x-axis
        const xAxis = {
            type: 'category',
            data: labels,
            axisLabel: {
                formatter: (value) => value
            }
        };

        // Create datasets based on the view type
        function createDatasets(viewType) {
            const datasets = viewType === 'daily' ? [
                {
                    label: `Base ${timelineData.timePeriod}ly Rate`,
                    data: completeTimeline.map(d => {
                        if (!d || !d.base || d.base.rate === null) return null;
                        return Number(d.base.rate.toFixed(4));
                    }),
                    borderColor: 'rgb(147, 51, 234)',
                    backgroundColor: 'rgb(147, 51, 234)',
                    pointBackgroundColor: completeTimeline.map((_, i) =>
                        i > timelineData.lastFullBusinessCycleIndex ? 'rgb(128, 128, 128)' : 'rgb(147, 51, 234)'
                    ),
                    pointBorderColor: completeTimeline.map((_, i) =>
                        i > timelineData.lastFullBusinessCycleIndex ? 'rgb(128, 128, 128)' : 'rgb(147, 51, 234)'
                    ),
                    segment: {
                        borderColor: (ctx) => ctx.p0DataIndex >= timelineData.lastFullBusinessCycleIndex ? 'rgb(128, 128, 128)' : 'rgb(147, 51, 234)',
                        backgroundColor: (ctx) => ctx.p0DataIndex >= timelineData.lastFullBusinessCycleIndex ? 'rgb(128, 128, 128)' : 'rgb(147, 51, 234)',
                    },
                    fill: false,
                    tension: 0.4,
                    spanGaps: true,
                    isCI: false
                },
                {
                    label: 'Base CI Upper',
                    data: completeTimeline.map(d => {
                        if (!d || !d.base || d.base.rateCI === null || d.base.rate === null) return null;
                        return d.base.rateCI[1];
                    }),
                    borderColor: 'transparent',
                    backgroundColor: 'rgba(147, 51, 234, 0.1)',
                    segment: {
                        backgroundColor: (ctx) => ctx.p0DataIndex >= timelineData.lastFullBusinessCycleIndex ? 'rgba(128, 128, 128, 0.1)' : 'rgba(147, 51, 234, 0.1)',
                    },
                    fill: '+1',
                    tension: 0.4,
                    spanGaps: true,
                    isCI: true
                },
                {
                    label: 'Base CI Lower',
                    data: completeTimeline.map(d => {
                        if (!d || !d.base || d.base.rateCI === null || d.base.rate === null) return null;
                        return d.base.rateCI[0];
                    }),
                    borderColor: 'transparent',
                    backgroundColor: 'rgba(147, 51, 234, 0.1)',
                    segment: {
                        backgroundColor: (ctx) => ctx.p0DataIndex >= timelineData.lastFullBusinessCycleIndex ? 'rgba(128, 128, 128, 0.1)' : 'rgba(147, 51, 234, 0.1)',
                    },
                    fill: false,
                    tension: 0.4,
                    spanGaps: true,
                    isCI: true
                },
                {
                    label: `Test ${timelineData.timePeriod}ly Rate`,
                    data: completeTimeline.map(d => {
                        if (!d || !d.variant || d.variant.rate === null) return null;
                        return Number(d.variant.rate.toFixed(4));
                    }),
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgb(59, 130, 246)',
                    pointBackgroundColor: completeTimeline.map((_, i) =>
                        i > timelineData.lastFullBusinessCycleIndex ? 'rgb(192, 192, 192)' : 'rgb(59, 130, 246)'
                    ),
                    pointBorderColor: completeTimeline.map((_, i) =>
                        i > timelineData.lastFullBusinessCycleIndex ? 'rgb(192, 192, 192)' : 'rgb(59, 130, 246)'
                    ),
                    segment: {
                        borderColor: (ctx) => ctx.p0DataIndex >= timelineData.lastFullBusinessCycleIndex ? 'rgb(192, 192, 192)' : 'rgb(59, 130, 246)',
                        backgroundColor: (ctx) => ctx.p0DataIndex >= timelineData.lastFullBusinessCycleIndex ? 'rgb(192, 192, 192)' : 'rgb(59, 130, 246)',
                    },
                    fill: false,
                    tension: 0.4,
                    spanGaps: true,
                    isCI: false
                },
                {
                    label: 'Test CI Upper',
                    data: completeTimeline.map(d => {
                        if (!d || !d.variant || d.variant.rateCI === null || d.variant.rate === null) return null;
                        return d.variant.rateCI[1];
                    }),
                    borderColor: 'transparent',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    segment: {
                        backgroundColor: (ctx) => ctx.p0DataIndex >= timelineData.lastFullBusinessCycleIndex ? 'rgba(192, 192, 192, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                    },
                    fill: '+1',
                    tension: 0.4,
                    spanGaps: true,
                    isCI: true
                },
                {
                    label: 'Test CI Lower',
                    data: completeTimeline.map(d => {
                        if (!d || !d.variant || d.variant.rateCI === null || d.variant.rate === null) return null;
                        return d.variant.rateCI[0];
                    }),
                    borderColor: 'transparent',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    segment: {
                        backgroundColor: (ctx) => ctx.p0DataIndex >= timelineData.lastFullBusinessCycleIndex ? 'rgba(192, 192, 192, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                    },
                    fill: false,
                    tension: 0.4,
                    spanGaps: true,
                    isCI: true
                }
            ] : [
                {
                    label: 'Base Cumulative Rate',
                    data: completeTimeline.map(d => {
                        if (!d || !d.base || d.base.cumulativeRate === null) return null;
                        return Number(d.base.cumulativeRate.toFixed(4));
                    }),
                    borderColor: 'rgb(107, 11, 194)',
                    backgroundColor: 'rgb(107, 11, 194)',
                    pointBackgroundColor: completeTimeline.map((_, i) =>
                        i > timelineData.lastFullBusinessCycleIndex ? 'rgb(128, 128, 128)' : 'rgb(107, 11, 194)'
                    ),
                    pointBorderColor: completeTimeline.map((_, i) =>
                        i > timelineData.lastFullBusinessCycleIndex ? 'rgb(128, 128, 128)' : 'rgb(107, 11, 194)'
                    ),
                    segment: {
                        borderColor: (ctx) => ctx.p0DataIndex >= timelineData.lastFullBusinessCycleIndex ? 'rgb(128, 128, 128)' : 'rgb(107, 11, 194)',
                        backgroundColor: (ctx) => ctx.p0DataIndex >= timelineData.lastFullBusinessCycleIndex ? 'rgb(128, 128, 128)' : 'rgb(107, 11, 194)',
                    },
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.4,
                    spanGaps: true,
                    isCI: false
                },
                {
                    label: 'Base CI Upper',
                    data: completeTimeline.map(d => {
                        if (!d || !d.base || d.base.cumulativeRateCI === null || d.base.cumulativeRate === null) return null;
                        return d.base.cumulativeRateCI[1];
                    }),
                    borderColor: 'transparent',
                    backgroundColor: 'rgba(107, 11, 194, 0.1)',
                    segment: {
                        backgroundColor: (ctx) => ctx.p0DataIndex >= timelineData.lastFullBusinessCycleIndex ? 'rgba(128, 128, 128, 0.1)' : 'rgba(107, 11, 194, 0.1)',
                    },
                    fill: '+1',
                    tension: 0.4,
                    spanGaps: true,
                    isCI: true
                },
                {
                    label: 'Base CI Lower',
                    data: completeTimeline.map(d => {
                        if (!d || !d.base || d.base.cumulativeRateCI === null || d.base.cumulativeRate === null) return null;
                        return d.base.cumulativeRateCI[0];
                    }),
                    borderColor: 'transparent',
                    backgroundColor: 'rgba(107, 11, 194, 0.1)',
                    segment: {
                        backgroundColor: (ctx) => ctx.p0DataIndex >= timelineData.lastFullBusinessCycleIndex ? 'rgba(128, 128, 128, 0.1)' : 'rgba(107, 11, 194, 0.1)',
                    },
                    fill: false,
                    tension: 0.4,
                    spanGaps: true,
                    isCI: true
                },
                {
                    label: 'Test Cumulative Rate',
                    data: completeTimeline.map(d => {
                        if (!d || !d.variant || d.variant.cumulativeRate === null) return null;
                        return Number(d.variant.cumulativeRate.toFixed(4));
                    }),
                    borderColor: 'rgb(19, 90, 206)',
                    backgroundColor: 'rgb(19, 90, 206)',
                    pointBackgroundColor: completeTimeline.map((_, i) =>
                        i > timelineData.lastFullBusinessCycleIndex ? 'rgb(192, 192, 192)' : 'rgb(19, 90, 206)'
                    ),
                    pointBorderColor: completeTimeline.map((_, i) =>
                        i > timelineData.lastFullBusinessCycleIndex ? 'rgb(192, 192, 192)' : 'rgb(19, 90, 206)'
                    ),
                    segment: {
                        borderColor: (ctx) => ctx.p0DataIndex >= timelineData.lastFullBusinessCycleIndex ? 'rgb(192, 192, 192)' : 'rgb(19, 90, 206)',
                        backgroundColor: (ctx) => ctx.p0DataIndex >= timelineData.lastFullBusinessCycleIndex ? 'rgb(192, 192, 192)' : 'rgb(19, 90, 206)',
                    },
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.4,
                    spanGaps: true,
                    isCI: false
                },
                {
                    label: 'Test CI Upper',
                    data: completeTimeline.map(d => {
                        if (!d || !d.variant || d.variant.cumulativeRateCI === null || d.variant.cumulativeRate === null) return null;
                        return d.variant.cumulativeRateCI[1];
                    }),
                    borderColor: 'transparent',
                    backgroundColor: 'rgba(19, 90, 206, 0.1)',
                    segment: {
                        backgroundColor: (ctx) => ctx.p0DataIndex >= timelineData.lastFullBusinessCycleIndex ? 'rgba(192, 192, 192, 0.1)' : 'rgba(19, 90, 206, 0.1)',
                    },
                    fill: '+1',
                    tension: 0.4,
                    spanGaps: true,
                    isCI: true
                },
                {
                    label: 'Test CI Lower',
                    data: completeTimeline.map(d => {
                        if (!d || !d.variant || d.variant.cumulativeRateCI === null || d.variant.cumulativeRate === null) return null;
                        return d.variant.cumulativeRateCI[0];
                    }),
                    borderColor: 'transparent',
                    backgroundColor: 'rgba(19, 90, 206, 0.1)',
                    segment: {
                        backgroundColor: (ctx) => ctx.p0DataIndex >= timelineData.lastFullBusinessCycleIndex ? 'rgba(192, 192, 192, 0.1)' : 'rgba(19, 90, 206, 0.1)',
                    },
                    fill: false,
                    tension: 0.4,
                    spanGaps: true,
                    isCI: true
                }
            ];

            // Calculate y-axis range based on the datasets
            const yAxisRange = calculateYAxisRange(datasets);
            datasets.yAxisRange = yAxisRange;

            return datasets;
        }

        // Initialize chart with daily view
        const chart = ChartManager.createChart('conversion-chart', 'line', {
            labels,
            datasets: createDatasets('daily'),
            confidenceLevel: calculateConfidenceLevel(challenge.experiment.alpha)
        }, {
            ...conversionChartOptions,
            plugins: {
                ...conversionChartOptions.plugins,
                title: {
                    display: true,
                    text: `${timelineData.timePeriod.charAt(0).toUpperCase() + timelineData.timePeriod.slice(1)}ly Conversion Rates`
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return formatPercent(value);
                        }
                    }
                }
            }
        });

        // Add view toggle functionality
        const viewToggle = document.getElementById('chart-view-toggle');
        if (viewToggle) {
            viewToggle.options[0].text = `${timelineData.timePeriod.charAt(0).toUpperCase() + timelineData.timePeriod.slice(1)}ly View`;

            viewToggle.addEventListener('change', function (e) {
                const viewType = e.target.value;
                const datasets = createDatasets(viewType);

                ChartManager.updateChart('conversion-chart', {
                    labels,
                    datasets
                }, {
                    plugins: {
                        ...conversionChartOptions.plugins,
                        title: {
                            display: true,
                            text: viewType === 'daily' ?
                                `${timelineData.timePeriod.charAt(0).toUpperCase() + timelineData.timePeriod.slice(1)}ly Conversion Rates` :
                                'Cumulative Conversion Rates'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            min: datasets.yAxisRange ? datasets.yAxisRange.min : undefined,
                            max: datasets.yAxisRange ? datasets.yAxisRange.max : undefined,
                            ticks: {
                                callback: function (value) {
                                    return formatPercent(value);
                                }
                            }
                        }
                    }
                });
            });
        }

        return chart;

    } catch (error) {
        console.error('Error rendering chart:', error);
        showChartError(error);
        return null;
    }
}

function calculateConfidenceLevel(alpha) {
    return ((1 - alpha) * 100).toFixed(0);
}

function updateConfidenceIntervals(challenge) {
    // Update CI column header
    const ciHeader = document.getElementById('ci-header');
    if (ciHeader) {
        const confidenceLevel = calculateConfidenceLevel(challenge.experiment.alpha);
        ciHeader.textContent = `${confidenceLevel}% Confidence Intervals`;
    }

    // Display p-value
    const pValueElement = document.getElementById('p-value-display');
    if (pValueElement) {
        const pValue = challenge.simulation.pValue;
        const alpha = challenge.experiment.alpha;  // Get the experiment's alpha value
        pValueElement.textContent = pValue.toFixed(4);
        if (pValue < alpha) {  // Compare against the experiment's alpha
            pValueElement.classList.add('text-green-600');
            pValueElement.classList.remove('text-blue-600');
        } else {
            pValueElement.classList.add('text-blue-600');
            pValueElement.classList.remove('text-green-600');
        }
    }

    // Calculate the difference in conversion rate
    const diffValue = challenge.simulation.variantConversionRate - challenge.simulation.actualBaseConversionRate;

    // Display difference in conversion rate
    const differenceDisplay = document.getElementById('difference-display');
    if (differenceDisplay) {
        differenceDisplay.textContent = formatPercent(diffValue);
    }

    // Find the range for conversion rate intervals
    const conversionValues = [
        ...challenge.simulation.confidenceIntervalBase,
        ...challenge.simulation.confidenceIntervalVariant,
        challenge.simulation.actualBaseConversionRate,
        challenge.simulation.variantConversionRate
    ];

    const minConversionValue = Math.min(...conversionValues);
    const maxConversionValue = Math.max(...conversionValues);
    const conversionViewRange = maxConversionValue - minConversionValue;
    const viewPadding = conversionViewRange * 0.2;

    // Round to nice intervals
    const conversionViewMin = Math.floor((minConversionValue - viewPadding) * 100) / 100;
    const conversionViewMax = Math.ceil((maxConversionValue + viewPadding) * 100) / 100;

    // Helper function to convert actual values to view percentages
    const toViewPercent = (value) => ((value - conversionViewMin) / (conversionViewMax - conversionViewMin)) * 100;

    // Determine result type based on CI difference
    const lowDiff = challenge.simulation.confidenceIntervalDifference[0];
    const highDiff = challenge.simulation.confidenceIntervalDifference[1];
    let resultType;
    if (lowDiff > 0) {
        resultType = 'positive';
    } else if (highDiff < 0) {
        resultType = 'negative';
    } else {
        resultType = 'inconclusive';
    }

    // Color mappings based on result type
    const variantColors = {
        positive: {
            bar: 'bg-green-200',
            marker: 'bg-green-600',
            text: 'text-green-900'
        },
        negative: {
            bar: 'bg-red-200',
            marker: 'bg-red-600',
            text: 'text-red-900'
        },
        inconclusive: {
            bar: 'bg-blue-200',
            marker: 'bg-blue-600',
            text: 'text-blue-900'
        }
    };

    // Helper function to set CI visualization
    function updateCIVisualization(containerId, low, high, mean, colorSet, showBounds = true) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Get elements
        const rangeBar = container.querySelector('div:nth-child(1)');
        const marker = container.querySelector('div:nth-child(2)');
        const lowLabel = document.getElementById(`${containerId}-low`);
        const highLabel = document.getElementById(`${containerId}-high`);

        // Calculate positions
        const lowPercent = toViewPercent(low);
        const highPercent = toViewPercent(high);
        const meanPercent = toViewPercent(mean);

        // Update visual elements
        if (rangeBar) {
            rangeBar.className = `absolute h-full ${colorSet.bar} rounded-md`;
            rangeBar.style.left = `${lowPercent}%`;
            rangeBar.style.width = `${highPercent - lowPercent}%`;
        }

        if (marker) {
            marker.className = `absolute w-0.5 h-full ${colorSet.marker} rounded-sm`;
            marker.style.left = `${meanPercent}%`;
        }

        // Update labels
        if (lowLabel) {
            lowLabel.className = `absolute text-xs font-medium transform -translate-x-1/2 ${colorSet.text} top-1/2 -translate-y-1/2 drop-shadow-sm`;
            lowLabel.textContent = formatPercent(low);
            lowLabel.style.left = `${lowPercent}%`;
        }

        if (highLabel) {
            highLabel.className = `absolute text-xs font-medium transform -translate-x-1/2 ${colorSet.text} top-1/2 -translate-y-1/2 drop-shadow-sm`;
            highLabel.textContent = formatPercent(high);
            highLabel.style.left = `${highPercent}%`;
        }

        // Add view range bounds if needed
        if (showBounds) {
            const viewBounds = {
                min: container.querySelector('.view-min') || document.createElement('span'),
                max: container.querySelector('.view-max') || document.createElement('span')
            };

            for (const [key, element] of Object.entries(viewBounds)) {
                const position = key === 'min' ? '2%' : '98%';
                const value = key === 'min' ? conversionViewMin : conversionViewMax;

                element.className = 'absolute text-xs font-medium transform -translate-x-1/2 -translate-y-1/2 text-gray-400 top-1/2';
                element.style.left = position;
                element.textContent = formatPercent(value);

                if (!container.querySelector(`.view-${key}`)) {
                    element.classList.add(`view-${key}`);
                    container.appendChild(element);
                }
            }
        }
    }

    // Update base CI (always purple)
    updateCIVisualization(
        'base-ci',
        challenge.simulation.confidenceIntervalBase[0],
        challenge.simulation.confidenceIntervalBase[1],
        challenge.simulation.actualBaseConversionRate,
        {
            bar: 'bg-purple-200',
            marker: 'bg-purple-600',
            text: 'text-purple-900'
        },
        true
    );

    // Update variant CI with result-based colors
    updateCIVisualization(
        'variant-ci',
        challenge.simulation.confidenceIntervalVariant[0],
        challenge.simulation.confidenceIntervalVariant[1],
        challenge.simulation.variantConversionRate,
        variantColors[resultType],
        true
    );

    // For difference CI, calculate a view range centered around zero
    const diffValues = [
        ...challenge.simulation.confidenceIntervalDifference,
        diffValue
    ];
    const maxAbsDiff = Math.max(Math.abs(Math.min(...diffValues)), Math.abs(Math.max(...diffValues)));
    const diffViewMin = -maxAbsDiff * 1.2;  // Add 20% padding
    const diffViewMax = maxAbsDiff * 1.2;   // Add 20% padding
    const toDiffViewPercent = (value) => ((value - diffViewMin) / (diffViewMax - diffViewMin)) * 100;

    // Update difference CI
    const diffContainer = document.getElementById('diff-ci');
    if (diffContainer) {
        const diffCIBar = document.getElementById('diff-ci-bar');
        const diffCIMarker = document.getElementById('diff-ci-marker');
        const lowLabel = document.getElementById('diff-ci-low');
        const highLabel = document.getElementById('diff-ci-high');

        // Calculate positions
        const lowPercent = toDiffViewPercent(lowDiff);
        const highPercent = toDiffViewPercent(highDiff);
        const meanPercent = toDiffViewPercent(diffValue);
        const zeroPercent = toDiffViewPercent(0);

        // Apply the same color scheme as variant
        const colors = variantColors[resultType];

        // Update elements
        if (diffCIBar) {
            diffCIBar.className = `absolute h-full ${colors.bar} rounded-md`;
            diffCIBar.style.left = `${lowPercent}%`;
            diffCIBar.style.width = `${highPercent - lowPercent}%`;
        }

        if (diffCIMarker) {
            diffCIMarker.className = `absolute w-0.5 h-full ${colors.marker} rounded-sm`;
            diffCIMarker.style.left = `${meanPercent}%`;
        }

        if (lowLabel) {
            lowLabel.className = `absolute text-xs font-medium transform -translate-x-1/2 ${colors.text} top-1/2 -translate-y-1/2 drop-shadow-sm`;
            lowLabel.textContent = formatPercent(lowDiff);
            lowLabel.style.left = `${lowPercent}%`;
        }

        if (highLabel) {
            highLabel.className = `absolute text-xs font-medium transform -translate-x-1/2 ${colors.text} top-1/2 -translate-y-1/2 drop-shadow-sm`;
            highLabel.textContent = formatPercent(highDiff);
            highLabel.style.left = `${highPercent}%`;
        }

        // Update zero line
        const zeroLine = diffContainer.querySelector('.zero-line') || document.createElement('div');
        zeroLine.className = 'zero-line absolute h-full w-px bg-gray-400';
        zeroLine.style.left = `${zeroPercent}%`;
        if (!diffContainer.querySelector('.zero-line')) {
            diffContainer.appendChild(zeroLine);
        }

        // Update zero label
        const zeroLabel = diffContainer.querySelector('.zero-label') || document.createElement('span');
        zeroLabel.className = 'zero-label absolute text-xs font-medium transform -translate-x-1/2 text-gray-400 top-1/2 -translate-y-1/2';
        zeroLabel.style.left = `${zeroPercent}%`;
        zeroLabel.textContent = '0%';
        if (!diffContainer.querySelector('.zero-label')) {
            diffContainer.appendChild(zeroLabel);
        }
    }
    // Update uplift CI
    const container = document.getElementById('uplift-ci');
    if (container) {
        const upliftValue = challenge.simulation.uplift;
        const [lowUplift, highUplift] = challenge.simulation.upliftConfidenceInterval;

        // Determine color based on significance
        const colors = resultType === 'positive' ? {
            bar: 'bg-green-200',
            marker: 'bg-green-600',
            text: 'text-green-900'
        } : resultType === 'negative' ? {
            bar: 'bg-red-200',
            marker: 'bg-red-600',
            text: 'text-red-900'
        } : {
            bar: 'bg-blue-200',
            marker: 'bg-blue-600',
            text: 'text-blue-900'
        };

        const upliftBar = document.getElementById('uplift-ci-bar');
        const upliftMarker = document.getElementById('uplift-ci-marker');
        const lowLabel = document.getElementById('uplift-ci-low');
        const highLabel = document.getElementById('uplift-ci-high');

        // Calculate relative positions
        const maxAbsUplift = Math.max(Math.abs(lowUplift), Math.abs(highUplift), Math.abs(upliftValue)) * 1.2;
        const viewMin = -maxAbsUplift;
        const viewMax = maxAbsUplift;
        const toViewPercent = (value) => ((value - viewMin) / (viewMax - viewMin)) * 100;

        // Update visual elements
        if (upliftBar) {
            upliftBar.className = `absolute h-full ${colors.bar} rounded-md`;
            upliftBar.style.left = `${toViewPercent(lowUplift)}%`;
            upliftBar.style.width = `${toViewPercent(highUplift) - toViewPercent(lowUplift)}%`;
        }

        if (upliftMarker) {
            upliftMarker.className = `absolute w-0.5 h-full ${colors.marker} rounded-sm`;
            upliftMarker.style.left = `${toViewPercent(upliftValue)}%`;
        }

        if (lowLabel) {
            lowLabel.className = `absolute text-xs font-medium transform -translate-x-1/2 ${colors.text} top-1/2 -translate-y-1/2 drop-shadow-sm`;
            lowLabel.textContent = formatPercent(lowUplift);
            lowLabel.style.left = `${toViewPercent(lowUplift)}%`;
        }

        if (highLabel) {
            highLabel.className = `absolute text-xs font-medium transform -translate-x-1/2 ${colors.text} top-1/2 -translate-y-1/2 drop-shadow-sm`;
            highLabel.textContent = formatPercent(highUplift);
            highLabel.style.left = `${toViewPercent(highUplift)}%`;
        }

        // Add zero line
        const zeroLine = container.querySelector('.zero-line') || document.createElement('div');
        zeroLine.className = 'absolute h-full w-px bg-gray-400';
        zeroLine.style.left = `${toViewPercent(0)}%`;
        if (!container.querySelector('.zero-line')) {
            container.appendChild(zeroLine);
        }

        // Add zero label
        const zeroLabel = container.querySelector('.zero-label') || document.createElement('span');
        zeroLabel.className = 'zero-label absolute text-xs font-medium transform -translate-x-1/2 text-gray-400 top-1/2 -translate-y-1/2';
        zeroLabel.style.left = `${toViewPercent(0)}%`;
        zeroLabel.textContent = '0%';
        if (!container.querySelector('.zero-label')) {
            container.appendChild(zeroLabel);
        }
    }
}

function calculateYAxisRange(datasets) {
    try {
        let allValues = [];
        datasets.forEach(dataset => {
            if (!dataset.label.includes('CI')) {
                allValues = allValues.concat(dataset.data.filter(v => v !== null));
            }
        });

        if (allValues.length === 0) return { min: 0, max: 1 };

        const maxValue = Math.max(...allValues);
        const nonZeroValues = allValues.filter(v => v > 0);
        const minValue = nonZeroValues.length > 0 ? Math.min(...nonZeroValues) : 0;

        return {
            min: Math.max(0, minValue - (minValue * 0.2)),
            max: maxValue + (maxValue * 0.1)
        };
    } catch (error) {
        console.error('Error calculating Y axis range:', error);
        return { min: 0, max: 1 };
    }
}

function renderVisitorsChart(challenge) {
    const canvas = document.getElementById('visitors-chart');
    if (!canvas) {
        console.error('Visitors chart canvas not found');
        return;
    }

    try {
        // Get timeline data and setup datasets
        const timelineData = challenge.simulation.timeline;
        const timePoints = timelineData.timePoints;
        const totalDays = challenge.experiment.requiredRuntimeDays;
        const currentDays = challenge.simulation.timeline.currentRuntimeDays;

        // Generate complete timeline including future empty periods
        const completeTimeline = [...timePoints];
        if (currentDays < totalDays) {
            const lastPoint = timePoints[timePoints.length - 1];
            const { type } = lastPoint.period;
            const periodLength = type === 'day' ? 1 : type === 'week' ? 7 : 28;
            let nextDay = lastPoint.period.startDay + periodLength;

            while (nextDay <= totalDays) {
                completeTimeline.push({
                    period: { type, startDay: nextDay },
                    base: {
                        visitors: null,
                        cumulativeVisitors: null
                    },
                    variant: {
                        visitors: null,
                        cumulativeVisitors: null
                    }
                });
                nextDay += periodLength;
            }
        }

        // Create labels
        const labels = completeTimeline.map((point, index) => {
            const { type, startDay } = point.period;
            let label;
            if (type === 'day') {
                label = `Day ${startDay}`;
            } else if (type === 'week') {
                label = `Week ${Math.ceil(startDay / 7)}`;
            } else {
                label = `Month ${Math.ceil(startDay / 28)}`;
            }
            // Add brackets around the label if it's the last full business cycle
            if (index === timelineData.lastFullBusinessCycleIndex) {
                label = `[${label}]`;
            }
            return label;
        });

        // Create datasets based on view type
        function createDatasets(viewType) {
            return viewType === 'daily' ? [
                {
                    label: `Base ${timelineData.timePeriod}ly Visitors`,
                    data: completeTimeline.map(d => d?.base?.visitors ?? null),
                    borderColor: 'rgb(147, 51, 234)',
                    backgroundColor: 'rgb(147, 51, 234)',
                    pointBackgroundColor: completeTimeline.map((_, i) =>
                        i > timelineData.lastFullBusinessCycleIndex ? 'rgb(128, 128, 128)' : 'rgb(147, 51, 234)'
                    ),
                    pointBorderColor: completeTimeline.map((_, i) =>
                        i > timelineData.lastFullBusinessCycleIndex ? 'rgb(128, 128, 128)' : 'rgb(147, 51, 234)'
                    ),
                    segment: {
                        borderColor: (ctx) => ctx.p0DataIndex >= timelineData.lastFullBusinessCycleIndex ? 'rgb(128, 128, 128)' : 'rgb(147, 51, 234)',
                        backgroundColor: (ctx) => ctx.p0DataIndex >= timelineData.lastFullBusinessCycleIndex ? 'rgb(128, 128, 128)' : 'rgb(147, 51, 234)',
                    },
                    fill: false,
                    tension: 0.4,
                    spanGaps: true
                },
                {
                    label: `Test ${timelineData.timePeriod}ly Visitors`,
                    data: completeTimeline.map(d => d?.variant?.visitors ?? null),
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgb(59, 130, 246)',
                    pointBackgroundColor: completeTimeline.map((_, i) =>
                        i > timelineData.lastFullBusinessCycleIndex ? 'rgb(192, 192, 192)' : 'rgb(59, 130, 246)'
                    ),
                    pointBorderColor: completeTimeline.map((_, i) =>
                        i > timelineData.lastFullBusinessCycleIndex ? 'rgb(192, 192, 192)' : 'rgb(59, 130, 246)'
                    ),
                    segment: {
                        borderColor: (ctx) => ctx.p0DataIndex >= timelineData.lastFullBusinessCycleIndex ? 'rgb(192, 192, 192)' : 'rgb(59, 130, 246)',
                        backgroundColor: (ctx) => ctx.p0DataIndex >= timelineData.lastFullBusinessCycleIndex ? 'rgb(192, 192, 192)' : 'rgb(59, 130, 246)',
                    },
                    fill: false,
                    tension: 0.4,
                    spanGaps: true
                }
            ] : [
                {
                    label: 'Base Cumulative Visitors',
                    data: completeTimeline.map(d => d?.base?.cumulativeVisitors ?? null),
                    borderColor: 'rgb(107, 11, 194)',
                    backgroundColor: 'rgb(107, 11, 194)',
                    pointBackgroundColor: completeTimeline.map((_, i) =>
                        i > timelineData.lastFullBusinessCycleIndex ? 'rgb(128, 128, 128)' : 'rgb(107, 11, 194)'
                    ),
                    pointBorderColor: completeTimeline.map((_, i) =>
                        i > timelineData.lastFullBusinessCycleIndex ? 'rgb(128, 128, 128)' : 'rgb(107, 11, 194)'
                    ),
                    segment: {
                        borderColor: (ctx) => ctx.p0DataIndex >= timelineData.lastFullBusinessCycleIndex ? 'rgb(128, 128, 128)' : 'rgb(107, 11, 194)',
                        backgroundColor: (ctx) => ctx.p0DataIndex >= timelineData.lastFullBusinessCycleIndex ? 'rgb(128, 128, 128)' : 'rgb(107, 11, 194)',
                    },
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.4,
                    spanGaps: true
                },
                {
                    label: 'Test Cumulative Visitors',
                    data: completeTimeline.map(d => d?.variant?.cumulativeVisitors ?? null),
                    borderColor: 'rgb(19, 90, 206)',
                    backgroundColor: 'rgb(19, 90, 206)',
                    pointBackgroundColor: completeTimeline.map((_, i) =>
                        i > timelineData.lastFullBusinessCycleIndex ? 'rgb(192, 192, 192)' : 'rgb(19, 90, 206)'
                    ),
                    pointBorderColor: completeTimeline.map((_, i) =>
                        i > timelineData.lastFullBusinessCycleIndex ? 'rgb(192, 192, 192)' : 'rgb(19, 90, 206)'
                    ),
                    segment: {
                        borderColor: (ctx) => ctx.p0DataIndex >= timelineData.lastFullBusinessCycleIndex ? 'rgb(192, 192, 192)' : 'rgb(19, 90, 206)',
                        backgroundColor: (ctx) => ctx.p0DataIndex >= timelineData.lastFullBusinessCycleIndex ? 'rgb(192, 192, 192)' : 'rgb(19, 90, 206)',
                    },
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.4,
                    spanGaps: true
                }
            ];
        }

        // Initialize chart with daily view
        const chart = ChartManager.createChart('visitors-chart', 'line', {
            labels: labels,
            datasets: createDatasets('daily')
        }, {
            ...visitorsChartOptions,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return value.toLocaleString();
                        }
                    }
                }
            }
        });

        // Add view toggle functionality
        const viewToggle = document.getElementById('visitors-view-toggle');
        if (viewToggle) {
            viewToggle.addEventListener('change', function (e) {
                const viewType = e.target.value;
                const datasets = createDatasets(viewType);

                ChartManager.updateChart('visitors-chart', {
                    labels,
                    datasets
                }, {
                    ...visitorsChartOptions,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function (value) {
                                    return value.toLocaleString();
                                }
                            }
                        }
                    }
                });
            });
        }

        return chart;
    } catch (error) {
        console.error('Error rendering visitors chart:', error);
        return null;
    }
}

function renderDifferenceChart(challenge) {
    const canvas = document.getElementById('difference-chart');
    if (!canvas) return;

    try {
        const timelineData = challenge.simulation.timeline;
        const timePoints = timelineData.timePoints;
        const totalDays = challenge.experiment.requiredRuntimeDays;
        const currentDays = challenge.simulation.timeline.currentRuntimeDays;
        const confidenceLevel = calculateConfidenceLevel(challenge.experiment.alpha);

        // Generate complete timeline including future empty periods
        const completeTimeline = [...timePoints];
        if (currentDays < totalDays) {
            const lastPoint = timePoints[timePoints.length - 1];
            const { type } = lastPoint.period;
            const periodLength = type === 'day' ? 1 : type === 'week' ? 7 : 28;
            let nextDay = lastPoint.period.startDay + periodLength;

            while (nextDay <= totalDays) {
                completeTimeline.push({
                    period: { type, startDay: nextDay },
                    base: {
                        rate: null,
                        rateCI: [null, null],
                        visitors: null,
                        conversions: null,
                        cumulativeRate: null,
                        cumulativeRateCI: [null, null]
                    },
                    variant: {
                        rate: null,
                        rateCI: [null, null],
                        visitors: null,
                        conversions: null,
                        cumulativeRate: null,
                        cumulativeRateCI: [null, null]
                    },
                    difference: {
                        rate: null,
                        rateCI: [null, null],
                        cumulativeRate: null,
                        cumulativeRateCI: [null, null]
                    },
                    uplift: {
                        rate: null,
                        rateCI: [null, null],
                        cumulativeRate: null,
                        cumulativeRateCI: [null, null]
                    }
                });
                nextDay += periodLength;
            }
        }

        // Create labels
        const labels = completeTimeline.map((point, index) => {
            const { type, startDay } = point.period;
            let label;
            if (type === 'day') {
                label = `Day ${startDay}`;
            } else if (type === 'week') {
                label = `Week ${Math.ceil(startDay / 7)}`;
            } else {
                label = `Month ${Math.ceil(startDay / 28)}`;
            }
            // Add brackets around the label if it's the last full business cycle
            if (index === timelineData.lastFullBusinessCycleIndex) {
                label = `[${label}]`;
            }
            return label;
        });

        // Create datasets based on view type and difference type
        function createDatasets(viewType, diffType) {
            const isUplift = diffType === 'uplift';
            const datasets = viewType === 'daily' ? [
                {
                    label: isUplift ? 'Uplift' : 'Rate Difference',
                    data: completeTimeline.map(d => {
                        if (!d[diffType] || d[diffType].rate === null) return null;
                        return isUplift ? d[diffType].rate * 100 : d[diffType].rate * 100;
                    }),
                    borderColor: isUplift ? 'rgb(16, 185, 129)' : 'rgb(59, 130, 246)',
                    backgroundColor: isUplift ? 'rgb(16, 185, 129)' : 'rgb(59, 130, 246)',
                    pointBackgroundColor: completeTimeline.map((_, i) =>
                        i > timelineData.lastFullBusinessCycleIndex ? 'rgb(128, 128, 128)' : (isUplift ? 'rgb(16, 185, 129)' : 'rgb(59, 130, 246)')
                    ),
                    pointBorderColor: completeTimeline.map((_, i) =>
                        i > timelineData.lastFullBusinessCycleIndex ? 'rgb(128, 128, 128)' : (isUplift ? 'rgb(16, 185, 129)' : 'rgb(59, 130, 246)')
                    ),
                    segment: {
                        borderColor: (ctx) => ctx.p0DataIndex >= timelineData.lastFullBusinessCycleIndex ? 'rgb(128, 128, 128)' : (isUplift ? 'rgb(16, 185, 129)' : 'rgb(59, 130, 246)'),
                        backgroundColor: (ctx) => ctx.p0DataIndex >= timelineData.lastFullBusinessCycleIndex ? 'rgb(128, 128, 128)' : (isUplift ? 'rgb(16, 185, 129)' : 'rgb(59, 130, 246)'),
                    },
                    fill: false,
                    tension: 0.4,
                    spanGaps: true
                },
                {
                    label: 'CI Upper',
                    data: completeTimeline.map(d => {
                        if (!d[diffType] || d[diffType].rateCI === null || d[diffType].rate === null) return null;
                        return d[diffType].rateCI[1] * 100;
                    }),
                    borderColor: 'transparent',
                    backgroundColor: isUplift ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                    segment: {
                        backgroundColor: (ctx) => ctx.p0DataIndex >= timelineData.lastFullBusinessCycleIndex ? 'rgba(128, 128, 128, 0.1)' : (isUplift ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)'),
                    },
                    fill: '+1',
                    tension: 0.4,
                    spanGaps: true,
                    isCI: true
                },
                {
                    label: 'CI Lower',
                    data: completeTimeline.map(d => {
                        if (!d[diffType] || d[diffType].rateCI === null || d[diffType].rate === null) return null;
                        return d[diffType].rateCI[0] * 100;
                    }),
                    borderColor: 'transparent',
                    backgroundColor: isUplift ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                    segment: {
                        backgroundColor: (ctx) => ctx.p0DataIndex >= timelineData.lastFullBusinessCycleIndex ? 'rgba(128, 128, 128, 0.1)' : (isUplift ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)'),
                    },
                    fill: false,
                    tension: 0.4,
                    spanGaps: true,
                    isCI: true
                }
            ] : [
                {
                    label: isUplift ? 'Cumulative Uplift' : 'Cumulative Rate Difference',
                    data: completeTimeline.map(d => {
                        if (!d[diffType] || d[diffType].cumulativeRate === null) return null;
                        return isUplift ? d[diffType].cumulativeRate * 100 : d[diffType].cumulativeRate * 100;
                    }),
                    borderColor: isUplift ? 'rgb(5, 150, 105)' : 'rgb(19, 90, 206)',
                    backgroundColor: isUplift ? 'rgb(5, 150, 105)' : 'rgb(19, 90, 206)',
                    pointBackgroundColor: completeTimeline.map((_, i) =>
                        i > timelineData.lastFullBusinessCycleIndex ? 'rgb(128, 128, 128)' : (isUplift ? 'rgb(5, 150, 105)' : 'rgb(19, 90, 206)')
                    ),
                    pointBorderColor: completeTimeline.map((_, i) =>
                        i > timelineData.lastFullBusinessCycleIndex ? 'rgb(128, 128, 128)' : (isUplift ? 'rgb(5, 150, 105)' : 'rgb(19, 90, 206)')
                    ),
                    segment: {
                        borderColor: (ctx) => ctx.p0DataIndex >= timelineData.lastFullBusinessCycleIndex ? 'rgb(128, 128, 128)' : (isUplift ? 'rgb(5, 150, 105)' : 'rgb(19, 90, 206)'),
                        backgroundColor: (ctx) => ctx.p0DataIndex >= timelineData.lastFullBusinessCycleIndex ? 'rgb(128, 128, 128)' : (isUplift ? 'rgb(5, 150, 105)' : 'rgb(19, 90, 206)'),
                    },
                    fill: false,
                    tension: 0.4,
                    borderDash: [5, 5],
                    spanGaps: true
                },
                {
                    label: 'CI Upper',
                    data: completeTimeline.map(d => {
                        if (!d[diffType] || d[diffType].cumulativeRateCI === null || d[diffType].cumulativeRate === null) return null;
                        return d[diffType].cumulativeRateCI[1] * 100;
                    }),
                    borderColor: 'transparent',
                    backgroundColor: isUplift ? 'rgba(5, 150, 105, 0.1)' : 'rgba(19, 90, 206, 0.1)',
                    segment: {
                        backgroundColor: (ctx) => ctx.p0DataIndex >= timelineData.lastFullBusinessCycleIndex ? 'rgba(128, 128, 128, 0.1)' : (isUplift ? 'rgba(5, 150, 105, 0.1)' : 'rgba(19, 90, 206, 0.1)'),
                    },
                    fill: '+1',
                    tension: 0.4,
                    spanGaps: true,
                    isCI: true
                },
                {
                    label: 'CI Lower',
                    data: completeTimeline.map(d => {
                        if (!d[diffType] || d[diffType].cumulativeRateCI === null || d[diffType].cumulativeRate === null) return null;
                        return d[diffType].cumulativeRateCI[0] * 100;
                    }),
                    borderColor: 'transparent',
                    backgroundColor: isUplift ? 'rgba(5, 150, 105, 0.1)' : 'rgba(19, 90, 206, 0.1)',
                    segment: {
                        backgroundColor: (ctx) => ctx.p0DataIndex >= timelineData.lastFullBusinessCycleIndex ? 'rgba(128, 128, 128, 0.1)' : (isUplift ? 'rgba(5, 150, 105, 0.1)' : 'rgba(19, 90, 206, 0.1)'),
                    },
                    fill: false,
                    tension: 0.4,
                    spanGaps: true,
                    isCI: true
                }
            ];

            return datasets;
        }

        // Initialize chart with daily view and absolute difference
        const chart = ChartManager.createChart('difference-chart', 'line', {
            labels,
            datasets: createDatasets('daily', 'difference'),
            confidenceLevel: calculateConfidenceLevel(challenge.experiment.alpha)
        }, {
            ...differenceChartOptions,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Rate Difference (%)'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        });

        // Add view toggle functionality
        const viewToggle = document.getElementById('difference-view-toggle');
        const diffTypeToggle = document.getElementById('difference-type-toggle');

        function updateChart(viewType, diffType) {
            const datasets = createDatasets(viewType, diffType);
            const yAxisTitle = diffType === 'uplift' ? 'Uplift (%)' : 'Rate Difference (%)';

            ChartManager.updateChart('difference-chart', {
                labels,
                datasets
            }, {
                ...differenceChartOptions,
                scales: {
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: yAxisTitle
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            });
        }

        if (viewToggle) {
            viewToggle.addEventListener('change', function (e) {
                const viewType = e.target.value;
                const diffType = diffTypeToggle ? diffTypeToggle.value : 'difference';
                updateChart(viewType, diffType);
            });
        }

        if (diffTypeToggle) {
            diffTypeToggle.addEventListener('change', function (e) {
                const diffType = e.target.value;
                const viewType = viewToggle ? viewToggle.value : 'daily';
                updateChart(viewType, diffType);
            });
        }

        return chart;
    } catch (error) {
        console.error('Error rendering difference chart:', error);
        return null;
    }
}

function initializeCharts(challenge) {
    try {
        // Reset all view toggles to 'daily' first
        const toggles = ['chart-view-toggle', 'visitors-view-toggle', 'difference-view-toggle'];
        toggles.forEach(toggleId => {
            const toggle = document.getElementById(toggleId);
            if (toggle) {
                toggle.value = 'daily';
            }
        });

        // Clean up all existing charts
        const chartIds = ['conversion-chart', 'visitors-chart', 'difference-chart'];
        chartIds.forEach(chartId => {
            const canvas = document.getElementById(chartId);
            if (canvas) {
                const existingChart = Chart.getChart(canvas);
                if (existingChart) {
                    existingChart.destroy();
                }
            }
        });

        // Destroy all charts in ChartManager
        ChartManager.destroyAllCharts();

        // Clear the completeTimeline global variable
        window.completeTimeline = null;

        // Initialize all charts in the correct order
        updateConfidenceIntervals(challenge);
        renderChart(challenge);
        renderVisitorsChart(challenge);
        renderDifferenceChart(challenge);
    } catch (error) {
        console.error('Error initializing visualizations:', error);
    }
}

// Chart Management
const ChartManager = {
    charts: {},

    createChart(canvasId, type, data, options) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas ${canvasId} not found`);
            return null;
        }

        // Destroy existing chart if it exists
        this.destroyChart(canvasId);

        // Create new chart
        this.charts[canvasId] = new Chart(canvas, {
            type,
            data,
            options: {
                ...chartOptions,
                ...options
            }
        });

        return this.charts[canvasId];
    },

    updateChart(canvasId, newData, newOptions = {}) {
        const chart = this.charts[canvasId];
        if (!chart) {
            console.warn(`Chart ${canvasId} not found`);
            return;
        }

        // Preserve animations
        const animation = chart.options.animation;
        chart.options = {
            ...chart.options,
            ...newOptions,
            animation
        };

        // Update datasets while preserving references
        chart.data.datasets.forEach((dataset, i) => {
            Object.assign(dataset, newData.datasets[i]);
        });

        chart.update('none'); // Update without animation for betternce
    },

    destroyChart(canvasId) {
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
            delete this.charts[canvasId];
        }
        // Also destroy any Chart.js instance on the canvas
        const canvas = document.getElementById(canvasId);
        if (canvas) {
            const existingChart = Chart.getChart(canvas);
            if (existingChart) {
                existingChart.destroy();
            }
        }
    },

    destroyAllCharts() {
        Object.keys(this.charts).forEach(canvasId => {
            this.destroyChart(canvasId);
        });
    },

    resizeCharts() {
        Object.values(this.charts).forEach(chart => {
            chart.resize();
        });
    },

    cleanup() {
        Object.entries(this.charts).forEach(([id, chart]) => {
            // Remove event listeners
            chart.options.plugins.tooltip.callbacks = {};
            chart.options.onClick = null;

            // Destroy chart
            chart.destroy();
            delete this.charts[id];
        });
    }
};

// Add resize handler
window.addEventListener('resize', () => ChartManager.resizeCharts());