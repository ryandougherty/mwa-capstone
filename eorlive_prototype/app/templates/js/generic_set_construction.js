{% include "js/histogram_utils.js" %} // Because there are functions that depend on Python variables
var _chart;
var inConstructionMode = false;
var flaggedRanges = [], lowEOR0FlaggedRanges = [], highEOR0FlaggedRanges = [];
var lowEOR1FlaggedRanges = [], highEOR1FlaggedRanges = [];
var currentData = ['high', '0'];
var clickDragMode = 'zoom';
var dataSourceObj = {};

$('#construction_controls_{{data_source_str_nospace}}').hide();

var saveSet = function() {
    var setSaveButton = function(text, disabled) {
        $('#save_set_button_{{data_source_str_nospace}}').html(text);
        $('#save_set_button_{{data_source_str_nospace}}').prop('disabled', disabled);
    };

    var currentObsIdSet = getCurrentObsIdSet();

    if (currentObsIdSet.length === 0) {
        alert("There aren't any obs ids in this set!");
        return;
    } else if ($('#set_name_textbox_{{data_source_str_nospace}}').val().length === 0) {
        alert("The set must have a name!");
        return;
    }

    setSaveButton("Working...", true);

    var startUtcMillis = Date.parse($("#start_time_label_{{data_source_str_nospace}}").text());
    var endUtcMillis = Date.parse($("#end_time_label_{{data_source_str_nospace}}").text());

    var getFlaggedObsIds = function(start, end) {
        var utc_obsid_map = getCurrentObsIdSet();

        var startObsIdIndex = -1;
        var endObsIdIndex = utc_obsid_map.length - 1;

        for (var i = 0; i < utc_obsid_map.length; ++i) {
            if (utc_obsid_map[i][0] >= start) {
                startObsIdIndex = i;
                break;
            }
        }

        if (startObsIdIndex > -1) {
            for (var i = startObsIdIndex; i < utc_obsid_map.length; ++i) {
                if (utc_obsid_map[i][0] >= end) {
                    endObsIdIndex = i - 1;
                    break;
                }
            }
        } else {
            return {
                startObsId: -1,
                endObsId: -1
            };
        }

        return {
            startObsId: utc_obsid_map[startObsIdIndex][1],
            endObsId: utc_obsid_map[endObsIdIndex][1],
            startObsIdIndex: startObsIdIndex,
            endObsIdIndex: endObsIdIndex
        };
    };

    var fullRange = getFlaggedObsIds(startUtcMillis, endUtcMillis);
    var rangesOfObsIds = [];

    for (var i = 0; i < flaggedRanges.length; ++i) {
        if (flaggedRanges[i].obs_count > 0) { // There are observations in this range!
            var range = getFlaggedObsIds(flaggedRanges[i].from, flaggedRanges[i].to);
            rangesOfObsIds.push(currentObsIdSet.slice(range.startObsIdIndex, range.endObsIdIndex + 1));
        }
    }

    $.ajax({
        type: "POST",
        url: "/save_new_set",
        data: JSON.stringify({
            name: $('#set_name_textbox_{{data_source_str_nospace}}').val(),
            startObsId: fullRange.startObsId,
            endObsId: fullRange.endObsId,
            flaggedRanges: rangesOfObsIds,
            lowOrHigh: currentData[0],
            eor: currentData[1]
        }),
        success: function(data) {
            if (data.error) {
                alert(data.message);
            } else {
                alert("Set saved successfully!");
                //refresh the set view
                applyFiltersAndSort();
            }

            setSaveButton("Save set", false);
        },
        error: function(xhr, status, error) {
            alert("An error occured: " + status);
            setSaveButton("Save set", false);
        },
        contentType: 'application/json',
        dataType: 'json'
    });
};
dataSourceObj.saveSet = saveSet;

var getCurrentDataSeries = function() {
    if (currentData[0] === 'low' && currentData[1] === '0')
        return low_eor0_counts;
    else if (currentData[0] === 'low')
        return low_eor1_counts;
    else if (currentData[0] === 'high' && currentData[1] === '0')
        return high_eor0_counts;
    else
        return high_eor1_counts;
};

var getCurrentFlaggedSet = function() {
    if (currentData[0] === 'low' && currentData[1] === '0')
        return lowEOR0FlaggedRanges;
    else if (currentData[0] === 'low')
        return lowEOR1FlaggedRanges;
    else if (currentData[0] === 'high' && currentData[1] === '0')
        return highEOR0FlaggedRanges;
    else
        return highEOR1FlaggedRanges;
};

var getCurrentObsIdSet = function() {
    if (currentData[0] === 'low' && currentData[1] === '0')
        return utc_obsid_map_l0;
    else if (currentData[0] === 'low')
        return utc_obsid_map_l1;
    else if (currentData[0] === 'high' && currentData[1] === '0')
        return utc_obsid_map_h0;
    else
        return utc_obsid_map_h1;
};

var dataSetChanged = function() {
    _chart.series[0].setData(getCurrentDataSeries());

    if (inConstructionMode) {
        removeAllPlotBands();

        // Set the correct flagged ranges.
        flaggedRanges = getCurrentFlaggedSet();

        addAllPlotBands();

        // Update the information in the panel.
        updateRangeForConstruction();
        updateSetConstructionTable();
    } else {
        // Set the correct flagged ranges.
        flaggedRanges = getCurrentFlaggedSet();
    }
};

var setEorData = function(select) {
    currentData[1] = select.value;

    dataSetChanged();
};
dataSourceObj.setEorData = setEorData;

var setLowOrHighData = function(select) {
    currentData[0] = select.value;

    dataSetChanged();
};
dataSourceObj.setLowOrHighData = setLowOrHighData;

var setClickDragMode = function(select) {
    clickDragMode = select.value;
};
dataSourceObj.setClickDragMode = setClickDragMode;

var clearSetConstructionData = function() {
    flaggedRanges = [];
    lowEOR0FlaggedRanges = [];
    highEOR0FlaggedRanges = [];
    lowEOR1FlaggedRanges = [];
    highEOR1FlaggedRanges = [];
};

var updateRangeForConstruction = function() {
    var obsAxisExtremes = _chart.xAxis[0].getExtremes(), errAxisExtremes = _chart.xAxis[1].getExtremes();
    var obsMin = obsAxisExtremes.dataMin, obsMax = obsAxisExtremes.dataMax, errMin = errAxisExtremes.dataMin,
        errMax = errAxisExtremes.dataMax;
    var minimum, maximum;

    if (obsMin > 0 && errMin > 0) {
        minimum = Math.min(obsMin, errMin);
    } else if (obsMin > 0) {
        minimum = obsMin;
    } else if (errMin > 0) {
        minimum = errMin;
    } else {
        minimum = Date.parse("{{ range_start }}");
    }

    if (obsMax > 0 && errMax > 0) {
        maximum = Math.max(obsMax, errMax);
    } else if (obsMax > 0) {
        maximum = obsMax;
    } else if (errMax > 0) {
        maximum = errMax;
    } else {
        maximum = Date.parse("{{ range_end }}");
    }

    var startDate = new Date(minimum), endDate = new Date(maximum);
    $('#start_time_label_{{data_source_str_nospace}}').html(startDate.toISOString());
    $('#end_time_label_{{data_source_str_nospace}}').html(endDate.toISOString());
    };

    var getDataIndices = function(startTime, endTime, obsSeries, errSeries) {
    var obsStartIndex = 0, obsEndIndex = -1;
    var errStartIndex = 0, errEndIndex = -1;

    for (var i = 0; i < obsSeries.xData.length; ++i) {
        if (obsSeries.xData[i] >= startTime) {
            obsStartIndex = i;
            obsEndIndex = obsSeries.xData.length - 1;
            break;
        }
    }

    for (var i = obsStartIndex; i < obsSeries.xData.length; ++i) {
        if (obsSeries.xData[i] >= endTime) {
            obsEndIndex = i - 1;
            break;
        }
    }

    for (var i = 0; i < errSeries.xData.length; ++i) {
        if (errSeries.xData[i] >= startTime) {
            errStartIndex = i;
            errEndIndex = errSeries.xData.length - 1;
            break;
        }
    }

    for (var i = errStartIndex; i < errSeries.xData.length; ++i) {
        if (errSeries.xData[i] >= endTime) {
            errEndIndex = i - 1;
            break;
        }
    }

    return {
        obsStartIndex: obsStartIndex,
        obsEndIndex: obsEndIndex,
        errStartIndex: errStartIndex,
        errEndIndex: errEndIndex
    };
};

var mergeOverlappingRanges = function() {
    if (flaggedRanges.length === 0)
        return;

    var comparator = function(a, b) {
        if (a.from < b.from)
            return -1;
        else if (a.from > b.from)
            return 1;
        return 0;
    };

    // Need to copy by slicing because sort() returns the reference
    // to the array tracking flagged ranges, and we need to empty
    // that array.
    var sortedFlaggedRanges = flaggedRanges.sort(comparator).slice();

    flaggedRanges.length = 0; // Maintain reference to flaggedRanges,
                              // which points to the correct underlying
                              // subset.

    flaggedRanges.push(sortedFlaggedRanges[0]);

    for (var i = 1; i < sortedFlaggedRanges.length; ++i) {
        var lowerRange = flaggedRanges[flaggedRanges.length - 1]; // Get top element in stack.
        var higherRange = sortedFlaggedRanges[i];

        if (higherRange.from <= lowerRange.to) { // Current interval overlaps with previous interval.
            lowerRange.to = Math.max(lowerRange.to, higherRange.to);

            // Since we merged two intervals, we have to update the observation & error counts.
            var counts = getObsAndErrorCountInRange(lowerRange.from, lowerRange.to);
            lowerRange.obs_count = counts.obsCount;
            lowerRange.err_count = counts.errCount;
        } else { // No overlap.
            flaggedRanges.push(higherRange);
        }
    }
};

var flagClickAndDraggedRange = function(event) {
    flagRangeInSet(event.xAxis[0].min, event.xAxis[0].max);
};

var flagClickedRange = function(event, series) {
    var columnRange = getColumnRangeLimits(event, series);
    flagRangeInSet(columnRange.startTime, columnRange.endTime);
};

var getObsAndErrorCountInRange = function(startTime, endTime) {
    var obsSeries = _chart.series[0], errSeries = _chart.series[1];

    var dataIndices = getDataIndices(startTime, endTime, obsSeries, errSeries);

    var flaggedObs = getCurrentDataSeries().slice(dataIndices.obsStartIndex, dataIndices.obsEndIndex + 1);

    var flaggedErr = error_counts.slice(dataIndices.errStartIndex, dataIndices.errEndIndex + 1);

    var obsCount = 0, errCount = 0;

    for (var i = 0; i < flaggedObs.length; ++i) {
        obsCount += flaggedObs[i][1];
    }

    for (var i = 0; i < flaggedErr.length; ++i) {
        errCount += flaggedErr[i][1];
    }

    return {
        obsCount: obsCount,
        errCount: errCount
    };
};

var updateFlaggedRangeIdsAndLabels = function() {
    for (var i = 0; i < flaggedRanges.length; ++i) {
        flaggedRanges[i].id = (currentData[0] + currentData[1] + i).toString();
        flaggedRanges[i].label = { text: (i + 1).toString() };
    }
};

var addAllPlotBands = function() {
    for (var i = 0; i < flaggedRanges.length; ++i) {
        _chart.xAxis[0].addPlotBand(flaggedRanges[i]);
    }
};

var removeAllPlotBands = function() {
    for (var i = 0; i < flaggedRanges.length; ++i) {
        _chart.xAxis[0].removePlotBand(flaggedRanges[i].id);
    }
};

var addedNewFlaggedRange = function(plotBand) {
    removeAllPlotBands();

    // Add new plot band.
    flaggedRanges.push(plotBand);

    mergeOverlappingRanges();
    updateFlaggedRangeIdsAndLabels();

    addAllPlotBands();
};

var flagRangeInSet = function(startTime, endTime) {
    var counts = getObsAndErrorCountInRange(startTime, endTime);

    var plotBand = {
        id: "",         // The id will be determined later.
        color: 'yellow',
        from: startTime,
        to: endTime,
        obs_count: counts.obsCount,
        err_count: counts.errCount
    };

    addedNewFlaggedRange(plotBand);

    updateRangeForConstruction();
    updateSetConstructionTable();
};

var updateSetConstructionTable = function() {
    var tableHtml = "";

    for (var i = 0; i < flaggedRanges.length; ++i) {
        var flaggedRange = flaggedRanges[i];
        tableHtml += '<tr><td>' + flaggedRange.label.text + '</td>' +
        '<td>' + new Date(flaggedRange.from).toISOString() + '</td>' +
        '<td>' + new Date(flaggedRange.to).toISOString() + '</td>' +
        '<td>' + flaggedRange.obs_count + '</td>' +
        '<td>' + flaggedRange.err_count + '</td>' +
        '<td><button onclick=\'{{data_source_str_nospace}}.unflagRange("' + flaggedRange.id +
        '")\'>Unflag range</button></td></tr>';
    }

    $('#set_construction_table_{{data_source_str_nospace}} > tbody').html(tableHtml);
};

var removedFlaggedRange = function(index) {
    removeAllPlotBands();
    flaggedRanges.splice(index, 1);
    updateFlaggedRangeIdsAndLabels();
    addAllPlotBands();
};

var unflagRange = function(flaggedRangeId) {
    for (var i = 0; i < flaggedRanges.length; ++i) {
        if (flaggedRanges[i].id === flaggedRangeId) {
            removedFlaggedRange(i);
            break;
        }
    }

    updateRangeForConstruction();
    updateSetConstructionTable();
};
dataSourceObj.unflagRange = unflagRange;

var clickConstructionModeCheckbox = function(checkbox) {
    inConstructionMode = checkbox.checked;
    if (inConstructionMode) { // Entering construction mode.
        $('#construction_controls_{{data_source_str_nospace}}').show(); // Show set construction controls.

        addAllPlotBands();

        // Update the information in the panel.
        updateRangeForConstruction();
        updateSetConstructionTable();
    } else { // Exiting construction mode.
        $('#construction_controls_{{data_source_str_nospace}}').hide(); // Hide set construction controls.

        removeAllPlotBands();
    }
};
dataSourceObj.clickConstructionModeCheckbox = clickConstructionModeCheckbox;
