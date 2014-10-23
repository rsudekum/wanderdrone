function wanderdrone_init(debug){

	var subdomains = [ 'a.', 'b.', 'c.', 'd.' ];
	var base_template = 'https://b.tiles.mapbox.com/v4/mapbox.k19p8bdp/{Z}/{X}/{Y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImdQMzI4WjgifQ.d-Uyr7NBjrJVz9z82uk5Xg';
	var base_layer = new MM.TemplatedLayer(base_template, subdomains);

	var map = new MM.Map('map', base_layer);

	map.setZoomRange(13,17);

	var lat = random_latitude();
	var lon = random_longitude();
	var zoom = random_int(13,17);

	if (debug){
		lat = 37.75;
		lon = -122.45;
		zoom = 12;
	}

	var center = new MM.Location(lat, lon);
	map.setCenterZoom(center, zoom);

	var max_lat;
	var min_lat;

	var t = null;

	var timeout_set_direction = null;
	var timeout_move = null;

	var move = function(x, y){

		if (timeout_move){
			clearTimeout(timeout_move);
		}

		timeout_move = setTimeout(function(){

			map.panBy(x, y);

			var center = map.getCenter();
			var zoom = map.getZoom();

			if (center.lon > 180){
				center.lon = -180;
				map.setCenter(center);
			}

			if (center.lon < -180){
				center.lon = 180;
				map.setCenter(center);
			}

			if ((center.lat >= max_lat) || (center.lat <= min_lat)){
				set_direction();
				return;
			}

			var coords = document.getElementById("coords");

			var html = center.lat + "<br />" + center.lon;
			//html += "<br />@ zoom " + zoom;

			coords.innerHTML = html;

			move(x, y);
		}, 10);
	};

	var set_direction = function(){

		if (timeout_set_direction){
			clearTimeout(timeout_set_direction);
		}

		var x = Math.random(0, 1);
		var y = Math.random(0, 1);

		x = (x < .5) ? 0 : 1;
		y = (y < .5) ? 0 : 1;

		if (x == 0 && y == 0){
			/* this is evil syntax... */
			(random_boolean()) ? x = 1 : y = 1;
		}

		x = (random_boolean()) ? x : -x;
		y = (random_boolean()) ? -y : y;

		var center = map.getCenter();

		max_lat = random_int(75, 82);
		min_lat = random_int(-75, -82);

		if (center.lat >= (max_lat - 15)){
			y = -1;
		}

		else if (center.lat <= (min_lat + 15)){
			y = 1;
		}

		var deg = wanderdrone_get_degrees(x, y);
		wanderdrone_rotate_drone(deg);

		var delay = parseInt(Math.random() * 1000);
		delay = Math.max(10000, delay);

		var zoom_by = Math.random();
		zoom_by = parseInt(zoom_by);

		zoom_by = (random_boolean()) ? zoom_by : - zoom_by;
		map.zoomBy(zoom_by);

		timeout_set_direction = setTimeout(set_direction, delay);

		move(x, y);
	};

	set_direction();
}

function wanderdrone_get_degrees(x, y){

	var deg = 0;

	if ((x == 0) && (y == 1)){
		deg = 0;
	}

	else if ((x == -1) && (y == 1)){
		deg = 45;
	}

	else if ((x == -1) && (y == 0)){
		deg = 90;
	}

	else if ((x == -1) && (y == -1)){
		deg = 135;
	}

	else if ((x == 0) && (y == -1)){
		deg = 180;
	}

	else if ((x == 1) && (y == -1)){
		deg = 225;
	}

	else if ((x == 1) && (y == 0)){
		deg = 270;
	}

	else if ((x == 1) && (y == 1)){
		deg = 325;
	}

	else {}

	var dt = new Date();
	var ts = dt.getTime();

	var offset = parseInt(Math.random() * 10);
	offset = (ts % 2) ? offset : - offset;

	return deg + offset;
};

function wanderdrone_rotate_drone(deg){

	var rotate = "rotate(" + (deg) + "deg);";

	var tr = new Array(
		"transform:" + rotate,
		"-moz-transform:" + rotate,
		"-webkit-transform:" + rotate,
		"-ms-transform:" + rotate,
		"-o-transform:" + rotate
	);

	var drone = document.getElementById("drone");
	drone.setAttribute("style", tr.join(";"));
}

function wanderdrone_about(show){

	var about = document.getElementById("about");
	about.style.display = (show) ? "block" : "none";

	return false;
}

/* random */

function random_int(min, max){

	var r = parseInt(Math.random() * max);
	return Math.max(min, r);
}


function random_latitude(){
	return Math.floor(Math.random() * (50 - 26 + 1)) + 26;
}

function random_longitude(){
	return Math.floor(Math.random() * (-64.424 + 116.851 + 1)) - 116.851;
}

// function random_coordinate(max){
// 	return (Math.random() - 0.5) * max;
// }

function random_boolean(){
	var dt = new Date();
	return (dt.getTime() % 2) ? 1 : 0;
}

/* tilestache */

function tilestache_static_provider(template){

	var provider = new MM.MapProvider(function(c){

		function pad(s, n, c){
			var m = n - s.length;
			return (m < 1) ? s : new Array(m + 1).join(c) + s;
		}

		function format(i){
			var s = pad(String(i), 6, "0");
			return s.substr(0, 3) + "/" + s.substr(3);
		}

		var max = 1 << c.zoom, column = c.column % max;

		if (column < 0){
			column += max;
		}

		var z = c.zoom;
		var x = format(column);
		var y = format(c.row);

		var path = [ z, x, y ].join('/') + '.png';

		return template.replace(/{(.)}/g, function(s, v) {
                	switch (v) {
				case "Z": return c.zoom;
				case "X": return format(column);
				case "Y": return format(c.row);
			}

			return v;
		});

	});

	return new MM.Layer(provider);
}
