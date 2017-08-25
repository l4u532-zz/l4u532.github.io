//heatmap.js config
var cfg = {
    // radius should be small ONLY if scaleRadius is true (or small radius is intended)
    // if scaleRadius is false it will be the constant radius used in pixels
    "radius": .00075,
    "maxOpacity": 0.8,
    // scales the radius based on map zoom
    "scaleRadius": true,
    // if set to false the heatmap uses the global maximum for colorization
    // if activated: uses the data maximum within the current map boundaries
    //   (there will always be a red spot with useLocalExtremas true)
    "useLocalExtrema": false,
    // which field name in your data represents the latitude - default "lat"
    //latField: 'latitude',
    // which field name in your data represents the longitude - default "lng"
    //lngField: 'longitude',
    // which field name in your data represents the data value - default "value"
    valueField: 'value'
};

// setup leaflet map and add layers
var heatmapLayer = new HeatmapOverlay(cfg);

var baseLayer = L.tileLayer(
    'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: "<a href='https://www.mapbox.com/about/maps/' target='_blank'>&copy; Mapbox &copy; OpenStreetMap</a> <a class='mapbox-improve-map' href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a>",
        maxZoom: 18,
        accessToken: 'pk.eyJ1Ijoia2xsYTE1YWMiLCJhIjoiY2o1czlxbjI2MTJ5ZzJxbjI2dWVvNnozYSJ9.yd5KecfkZAyEZu7SBbPGgw',
        id: 'mapbox.streets'
    }
);


var map = new L.Map('map', {
    zoomControl: false,
    center: new L.LatLng(55.617146876, 12.089504778),
    zoom: 14,
    layers: [baseLayer, heatmapLayer]
});

map.touchZoom.disable();
map.doubleClickZoom.disable();
map.scrollWheelZoom.disable();
map.boxZoom.disable();
map.keyboard.disable();

// get and work JSON
var sodaUrl = 'data/data.json';
$.getJSON(sodaUrl, function (rawData) {

    // clean up data
    var goodData = [];
    for (var i = 0; i < rawData.length; i++) {
        rawData[i].value = 0;         // set value to 0, to add level of "freshness" dynamically later on
        rawData[i].fresh = true;      // append "fresh" to indicate a new point

        if (rawData[i].latitude && rawData[i].longitude) {
            rawData[i].lat = parseFloat(rawData[i].latitude);
            rawData[i].lng = parseFloat(rawData[i].longitude);
        }

        rawData[i].date = new Date(rawData[i].date);  // create date obj from date string

        if (rawData[i].latitude && rawData[i].longitude) {
            goodData.push(rawData[i])
        }
        ;
    }
    ;

    //console.log(goodData);
    var nextDate = new Date(goodData[0].date);

    console.log("first nextDate: " + nextDate);

    // initialize variables for the D3 chart
    var countArray = [],
        svg,
        day,
        x,
        y,
        margin,
        height,
        width,
        intervalCounter = 10,
        index = 0,
        lastDate,
        data = {
            max: 15,
            min: 0,
            data: []
        };

    initializeChart();
    //initTitleBox();


    // iterate
    var updatespeed = 50;    // how often to update the canvas in ms
    var itercount = 10;     // how often to iterate per day
    setInterval(function () {

        // iterates 10 times for each day
        if (intervalCounter == itercount) {
            intervalCounter = 0;
            getAnotherDataBatch(2);     // argument = how many hours to accumulate
        } else {
            intervalCounter++;
        }


        // create new array for live points, push it to the map
        var newData = [];
        for (var j = 0; j < data.data.length; j++) {
            var point = data.data[j];

            if (point.value >= itercount) {
                point.fresh = false;
            }

            // fade in fresh points, fade out unfresh points
            if (point.fresh) {
                point.value = point.value + .2;
            } else {
                point.value = point.value - .1;
            }

            if (point.value > 0) {
                newData.push(data.data[j]);
            }
        }

        data.data = newData;

        heatmapLayer.setData(data);


        // update the chart
        day = svg.selectAll(".day")
            .data(countArray)
            .enter()
            .append("g")
            .attr("class", "day")
            .attr("transform", function (d) {
                //var yesterday = new Date(d.date);
                //yesterday = yesterday.setDate(yesterday.getDate() - 1)
                return "translate(" + x(d.date) + ",0)";
            })
            .append("rect")
            .attr("width", 28)
            .attr("y", function (d) {

                return height - y(d.count);
            })
            .attr("height", function (d) {
                return y(d.count);
            })
            .attr("class", function (d) {
                return (d.date);
            })

    }, updatespeed);


    // helper function to add X hours to the current date
    Date.prototype.addHours = function (h) {
        this.setTime(this.getTime() + (h * 60 * 60 * 1000));
        return this;
    }

    function getAnotherDataBatch(hours) {

        console.log("nextDate old:" + nextDate);
        nextDate = new Date(nextDate).addHours(hours);      // how many hours to accumulate
        console.log("nextDate new:" + nextDate);

        var todayCounter = 0;

        // iterate over goodData, push today's events to data.data
        for (; ; index++) {

            var thisDate = goodData[index].date;                // take current date
            console.log(thisDate + nextDate);
            if (thisDate < nextDate) {       // if the curr date < next date, push it
                data.data.push(goodData[index]);
                todayCounter++;
                lastDate = thisDate;
            } else {

                // Still need to increment lastDate if there is no data
                if (todayCounter == 0) {
                    console.log(lastDate);
                    lastDate = lastDate.getTime() - 1;
                }

                var todayCount = {
                    date: lastDate,
                    count: todayCounter
                };

                countArray.push(todayCount);
                console.log(todayCount.count);
                break;

            }
        }
    }

    // Todo: implement
    function initTitleBox() {
        var virtualSelection = d3.select("#titleBox").selectAll("p").data(countArray);
        // make DOM elements existent with enter()
        var myText = virtualSelection.enter().append("p");
        // change text of DOM element
        myText.text(function (d) { return (d.date) });
    }

    //sets margins and axes for the D3 chart.  Borrowed from Chris Metcalf's example on dev.socrata.com
    function initializeChart() {

        // Set our margins
        margin = {
            top: 20,
            right: 20,
            bottom: 30,
            left: 60
        },
            width = 800 - margin.left - margin.right,
            height = 100 - margin.top - margin.bottom;

        // Our X scale
        x = d3.time.scale()
            .domain([new Date(goodData.date), d3.time.hour.offset(new Date(goodData[goodData.length - 1].date), 1)])
            .rangeRound([0, width - margin.left - margin.right])
        //.ticks(d3.time.day, 1);

        // Our Y scale
        y = d3.scale.linear()
            .domain([0, 10000])
            .rangeRound([height, 0]);

        // Our color bands
        var color = d3.scale.ordinal()
            .range(["#308fef", "#5fa9f3", "#1176db"]);

        // Use our X scale to set a bottom axis
        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");

        // Same for our left axis
        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .tickValues([0, 5000, 10000]);

        // Add our chart to the #chart div
        svg = d3.select("#chartBox").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis);
    };
});