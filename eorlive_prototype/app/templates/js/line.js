{
    title: {
        text: "{{data_source_str}}"
    },
    chart: {
        zoomType: "x",
        events: {
            selection: function(event) {
                if (clickDragMode === 'flag') {
                    event.preventDefault();
                    flagClickAndDraggedRange(event);
                }
            }
        }
    },
    credits: {
        enabled: false
    },
    xAxis: {
        type: 'datetime'
    },
    legend: {
        enabled: true
    },
    series: [
        {% for series in graph_data %}
        {
            name: "{{series}}",
            data: {{series}}
        },
        {% endfor %}
    ]
}
