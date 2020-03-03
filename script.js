/*** this stringify function is necessery for converting variable to text in order to save as a file ***/

function stringify(obj, replacer, spaces, cycleReplacer) {
  return JSON.stringify(obj, serializer(replacer, cycleReplacer), spaces)
}

function serializer(replacer, cycleReplacer) {
  var stack = [], keys = []

  if (cycleReplacer == null) cycleReplacer = function(key, value) {
    if (stack[0] === value) return "[Circular ~]"
    return "[Circular ~." + keys.slice(0, stack.indexOf(value)).join(".") + "]"
  }

  return function(key, value) {
    if (stack.length > 0) {
      var thisPos = stack.indexOf(this)
      ~thisPos ? stack.splice(thisPos + 1) : stack.push(this)
      ~thisPos ? keys.splice(thisPos, Infinity, key) : keys.push(key)
      if (~stack.indexOf(value)) value = cycleReplacer.call(this, key, value)
    }
    else stack.push(value)

    return replacer == null ? value : replacer.call(this, key, value)
  }
}


/*** --- ***/


/* global variables */

var counter = 0;		// after start button, it counts added data
var charts = [];		// array for charts
var channelCount = 0;	// user channel input
var interval = 0;		// user interval input
var minValue = 0;		// user min value input
var maxValue = 0;		// user max value input
var isLoaded = false;	// indicator to understand if chart data is loaded from file
var isRunning = false;	// indicator to understand if start button pressed and interval is running
var new_timer;			// global timer
/* a function to create chart options, maxv and minv values are taking from user */
function initOption(maxv, minv) {
    var option = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            yAxes: [{
                ticks: {
                    max: maxv,
                    min: minv,
                    stepSize: 1
                }
            }],

        }
    };

    return option;
}

/* a function to create chart, ctx1 is element, i is count of chart */
function initCharts(ctx1, i) {

    var option = initOption(parseInt(maxValue), parseInt(minValue));
    var chart = new Chart(ctx1, {

        type: 'bar',

        data: {
            labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
            datasets: [{
                label: 'Channel ' + i,
                backgroundColor: 'rgb(' + Math.floor(Math.random() * 256) + ', ' + Math.floor(Math.random() * 256) + ', 255)',
                borderColor: 'rgb(99, 132, 255)',
                data: []
            }]
        },


        options: option,
    });

    return chart;
}



/* a function to add data to chart. i is just using if data is loaded from file */
function addData(chart, label, data, i) {

    if (!isRunning) {	// if data is not added from interval 
	
        if (i > 10) {	// add label if count is more than 10
            chart.data.labels.push(i);
            var newwidth = $('.chartAreaWrapper2').width() + 30;
            $('.chartAreaWrapper2').width(newwidth);
        }

    } else {			// if data from interval

        if (counter > 10) {
            chart.data.labels.push(counter);
            var newwidth = $('.chartAreaWrapper2').width() + 30;
            $('.chartAreaWrapper2').width(newwidth);
        }

    }



    chart.data.datasets.forEach((dataset) => {
        dataset.data.push(data);
    });

    chart.update();
}


/* timer function for add data to charts */
function setNewTimer() {

    function run() {


        counter += 1;
        $("#count").text(counter);

		// iterator which count all charts
        for (i = 0; i < channelCount; i++) {
            var prng1 = new Math.seedrandom('rand' + i, {	//seedrandom is used to improve random
                entropy: true
            });
            var rand1 = Math.round((prng1() * (maxValue - minValue) + minValue));	//this part enables user to change min max 
            console.log(rand1);

            addData(charts[i], 'Channel ' + i, rand1);
        }

    }

    return setInterval(run, interval * 1000);
}


/* start button click event */ 
$("#start").click(function() {

    isRunning = true;	// to understand that interval is running

    if (isLoaded) {	/* if file loaded befor pressing start */

        interval = $("#interval").val();	//inverval value is taken
        minValue = $("#minValue").val();	//min value is taken
        maxValue = $("#maxValue").val();	//max value is taken


        clearInterval(new_timer);			//reset timer
        new_timer = setNewTimer();			//start
    } else {		/* pressing start button without loading file */
        counter = 0;
        charts = [];

        channelCount = $("#channelCount").val();
        interval = $("#interval").val();
        minValue = $("#minValue").val();
        maxValue = $("#maxValue").val();


        clearInterval(new_timer);
        $("#charts").empty();
        for (i = 0; i < channelCount; i++) {	/* dynamically charts are added */
            $("#charts").append(' 		<div class="columns">' +
                '	<div class="column is-8 is-offset-2">' +
                '	<h2 class="subtitle">Channel ' + (i + 1) + '</h2>' +
                '		<div class="chartWrapper">' +
                '		  <div class="chartAreaWrapper">' +
                '			<div class="chartAreaWrapper2">' +
                '				<canvas id="canvas' + i + '"></canvas>' +
                '			</div>' +
                '		  </div>' +
                '			' +
                '			<canvas id="myChartAxis" height="300" width="0"></canvas>' +
                '		</div>' +
                '	</div>' +
                '</div>');
			/* element is taken and sent to function which adds it to charts array */
            var ctx1 = document.getElementById('canvas' + i).getContext('2d');
            charts.push(initCharts(ctx1, i + 1));
        }


        new_timer = setNewTimer();
    }

});
/* stop button click event */
$("#stop").click(function() {
    isRunning = false;
    clearInterval(new_timer);
});
/* save button click event */
$("#save").click(function() {



    var array = {};	// chart data is collected here

    for (i = 0; i < channelCount; i++) {
        array['Channel ' + i] = charts[i].data.datasets[0].data;	//all chart data is collected in array variable


    }

    var a = document.body.appendChild(
        document.createElement("a")	//hidden href 
    );
    a.download = "export.txt";
    a.href = "data:text/plain;base64," + btoa(stringify(array));	//!custom stringify function is used because JSON.stringify throws an error about circular referance
    a.innerHTML = "download example text";
    a.style.display = "none";
    a.click();
});	/* here, hidden a tag is created with text array data. it is clicked hiddenly and downloaded */

/* loaded data is processed here, when user select a file this part is fired*/
function processFile(e) {
    var file = e.target.result,
        results;
    if (file && file.length) {
        results = file;
        // load data

        var obj = JSON.parse(results);	// data from loaded data is taken

        minValue = 0;	
        maxValue = 10;

        counter = 0;
        charts = [];

        channelCount = Object.keys(obj).length;


		// reset charts
        clearInterval(new_timer);
        $("#charts").empty();




        clearInterval(new_timer);

        $("#charts").empty();

		// chart name is used as key, data is used as value which includes an array
		// charts are created with data from file
        for (i = 0; i < Object.keys(obj).length; i++) {
            $("#charts").append(' 		<div class="columns">' +
                '	<div class="column is-8 is-offset-2">' +
                '	<h2 class="subtitle">' + Object.keys(obj)[i] + '</h2>' +
                '		<div class="chartWrapper">' +
                '		  <div class="chartAreaWrapper">' +
                '			<div class="chartAreaWrapper2">' +
                '				<canvas id="' + Object.keys(obj)[i] + '"></canvas>' +
                '			</div>' +
                '		  </div>' +
                '			' +
                '			<canvas id="myChartAxis" height="300" width="0"></canvas>' +
                '		</div>' +
                '	</div>' +
                '</div>');

            var ctx1 = document.getElementById(Object.keys(obj)[i]).getContext('2d');
            charts.push(initCharts(ctx1, i + 1));
			//below part adds data. upper part adds graph elements and name
            var data = obj[Object.keys(obj)[i]];
            counter = data.length;
            for (j = 0; j < data.length; j++) {
                addData(charts[i], Object.keys(obj)[i], data[j], j + 1);
            }
        }


        isLoaded = true;



    }
}

// file select change listener. when user selects a file, it automatically start processing it
$(document).ready(function() {
    $('input[type="file"]').change(function() {

        if (!window.FileReader) {
            alert('Your browser is not supported')
        }
        var fileInput = $('#files');

        var input = fileInput.get(0);

        // Create a reader object
        var reader = new FileReader();
        if (input.files.length) {
            var textFile = input.files[0];
            reader.readAsText(textFile);
            $(reader).on('load', processFile);
        } else {
            alert('Please upload a file before continuing')
        }

    });
});
/* load click event, it clicks hidden html5 file selector input-element */
$("#load").click(function() {


    $(".myfile").click();

});
/* interval input change listener. when user changes input it fires */
$("#interval").change(function() {
	// do nothing if interval doesnt work
    if (!isRunning) {	
        return
    };

    interval = $("#interval").val();

    if (interval <= 0) {
        $("#interval").val(1);
    } else {	//this part stops interval and starts again in order to activate changes
        clearInterval(new_timer);
        new_timer = setNewTimer();
    }




});
/* min value input change listener. when user changes input it fires */
$("#minValue").change(function() {
	// do nothing if interval doesnt work
    if (!isRunning) {
        return
    };

    minValue = parseInt($("#minValue").val());
    maxValue = parseInt($("#maxValue").val());
	// if min is bigger than max, prevent it
    if (minValue <= 0) {
        $("#minValue").val(0);
    } else if (minValue >= maxValue) {
        $("#minValue").val(parseInt(maxValue) - 1);
    } else {

        for (i = 0; i < channelCount; i++) {
            charts[i].options = initOption(maxValue, minValue)
            charts[i].update();
        }


		//reset timer for activate changes
        clearInterval(new_timer);
        new_timer = setNewTimer();
    }




});
/* max value input change listener. when user changes input it fires */
$("#maxValue").change(function() {
	// do nothing if interval doesnt work
    if (!isRunning) {
        return
    };
    minValue = parseInt($("#minValue").val());
    maxValue = parseInt($("#maxValue").val());
	// if max is smaller than min, prevent it
    if (maxValue >= 100) {
        $("#minValue").val(100);
    } else if (minValue >= maxValue) {
        $("#maxValue").val(minValue + 1);
    } else {

        for (i = 0; i < channelCount; i++) {
            charts[i].options = initOption(maxValue, minValue)
            charts[i].update();
        }


		//reset timer for activate changes
        clearInterval(new_timer);
        new_timer = setNewTimer();
    }

});