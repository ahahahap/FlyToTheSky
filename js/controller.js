var app = angular.module('myApp', ['chart.js']);

app.controller('myCtrl', function($scope, $http, $q) {

	$scope.output_airline = output_airline;
	$scope.output_month = output_month;
	$scope.output_day = output_day;
	$scope.output_dep_airport = output_dep_airport;
	$scope.output_arr_airport = output_arr_airport;

	$scope.output_airline_labels = []; 
	$scope.output_airline_data = [[]];
	for (x in $scope.output_airline) {
		var airline = $scope.output_airline[x];
		$scope.output_airline_labels.push(airline.name);
		$scope.output_airline_data[0].push(airline.mean);
	}

	$scope.output_month_labels = []; 
	$scope.output_month_data = [[]];
	for (x in $scope.output_month) {
		var month = $scope.output_month[x];
		$scope.output_month_labels.push(month.name);
		$scope.output_month_data[0].push(month.mean);
	}

	$scope.output_day_labels = []; 
	$scope.output_day_data = [[]];
	for (x in $scope.output_day) {
		var day = $scope.output_month[x];
		$scope.output_day_labels.push(day.name);
		$scope.output_day_data[0].push(day.mean);
	}

	$scope.output_dep_airport_labels = []; 
	$scope.output_dep_airport_data = [[]];
	for (x in $scope.output_dep_airport) {
		var airport = $scope.output_dep_airport[x];
		$scope.output_dep_airport_labels.push(airport.name);
		$scope.output_dep_airport_data[0].push(airport.mean);
	}

	$scope.output_arr_airport_labels = []; 
	$scope.output_arr_airport_data = [[]];
	for (x in $scope.output_arr_airport) {
		var airport = $scope.output_arr_airport[x];
		$scope.output_arr_airport_labels.push(airport.name);
		$scope.output_arr_airport_data[0].push(airport.mean);
	}



	var today = new Date();
	var tomorrow = new Date(today);
	tomorrow.setDate(today.getDate()+13);
	$scope.min_date = today;
	$scope.max_date = tomorrow;

	var section = 1;
	$scope.section = function(id) { section = id; }
	$scope.is = function(id) { return section == id; }



	/* Lookup airport details */
	$scope.lookupAirport = function(airport) {
		for (a in airports) {
			if (airports[a].fs.toUpperCase() == airport.toUpperCase()) {
				return airports[a];
			}
		}
	};

	$scope.getDistance = function(lat1, lon1, lat2, lon2, unit) {
	    var radlat1 = Math.PI * lat1/180;
	    var radlat2 = Math.PI * lat2/180;
	    var radlon1 = Math.PI * lon1/180;
	    var radlon2 = Math.PI * lon2/180;
	    var theta = lon1-lon2;
	    var radtheta = Math.PI * theta/180;
	    var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
	    dist = Math.acos(dist);
	    dist = dist * 180/Math.PI;
	    dist = dist * 60 * 1.1515;
	    if (unit=="K") { dist = dist * 1.609344 }
	    if (unit=="N") { dist = dist * 0.8684 }
	    return dist
	};

	$scope.truncateDecimals = function(number, digits) {
	    var multiplier = Math.pow(10, digits);
	    var adjustedNum = number * multiplier;
		var truncatedNum = Math[adjustedNum < 0 ? 'ceil' : 'floor'](adjustedNum);
	    return truncatedNum / multiplier;
	};

	/* Perform prediction */
	$scope.doSearch = function() {

		if ($scope.departure_date != null && $scope.departure_airport != null && $scope.arrival_airport != null && $scope.airline != null) {
			// Substring airport/airline code name only
			$scope.departure_airport = $('#departure_airport').val().split(' - ')[0].toUpperCase();
			$scope.arrival_airport = $('#arrival_airport').val().split(' - ')[0].toUpperCase();
			$scope.airline = $('#airline').val().split(' - ')[0].toUpperCase();

			// Lookup airport details; need details of the airport to forecast weather by the city and state name
			var departure_airport_info = $scope.lookupAirport($scope.departure_airport);
			var arrival_airport_info = $scope.lookupAirport($scope.arrival_airport);

			/* Weather Forecast: 	http://openweathermap.org/forecast */
			var departure_date = new Date($scope.departure_date);
			var weatherDepartureCity = departure_airport_info.city.replace(' ','+') + ',' +departure_airport_info.stateCode;
			var weatherArrivalCity = arrival_airport_info.city.replace(' ','+') + ',' + arrival_airport_info.stateCode;
			var weatherDepartureUrl = "http://api.openweathermap.org/data/2.5/forecast/daily?mode=json&cnt=15&units=metric&q=" + weatherDepartureCity;
			var weatherArrivalUrl = "http://api.openweathermap.org/data/2.5/forecast/daily?mode=json&cnt=15&units=metric&q=" + weatherArrivalCity;
			$scope.dep_city = weatherDepartureCity;
			$scope.arr_city = weatherArrivalCity;
			$scope.dep_forecast, $scope.dep_forecast_temp, $scope.dep_forecast_clouds, $scope.dep_forecast_rain, $scope.dep_forecast_condition; 
			$scope.arr_forecast, $scope.arr_forecast_temp, $scope.arr_forecast_clouds, $scope.arr_forecast_rain, $scope.arr_forecast_condition; 

			/* FlightStats: 	https://developer.flightstats.com/ */
			var appKey = '?appId=8e5aec87&appKey=ed34be983e971cafe903e442f4bf630e&callback=JSON_CALLBACK';
			var routeRatingUrl = 'https://api.flightstats.com/flex/ratings/rest/v1/jsonp/route/' + $scope.departure_airport + '/' + $scope.arrival_airport + appKey;
			var airportRatingUrl = 'https://api.flightstats.com/flex/delayindex/rest/v1/jsonp/airports/' + $scope.departure_airport + appKey;
			$scope.route_rating = 0;
			$scope.airport_rating = 0;

			/* Prepare HTTP calls */
			$scope.http_dep_forecast = $http.get(weatherDepartureUrl);
			$scope.http_arr_forecast = $http.get(weatherArrivalUrl);
			$scope.http_route_rating = $http.jsonp(routeRatingUrl);
			$scope.http_airport_rating = $http.jsonp(airportRatingUrl);

			console.log(routeRatingUrl);
			console.log(airportRatingUrl);

			/* Execute all the HTTP calls */
			$q.all([$scope.http_dep_forecast, $scope.http_arr_forecast, $scope.http_route_rating, $scope.http_airport_rating]).then(function(values) {
				// Get departure airport weather on departure date
				var dep_forecast = values[0].data;
				for (f in dep_forecast.list) {
					var date = new Date(dep_forecast.list[f].dt * 1000);
					if (date.getFullYear() == departure_date.getFullYear() && date.getMonth() == departure_date.getMonth() && date.getDate() == departure_date.getDate()) {
						$scope.dep_forecast = dep_forecast.list[f];
						$scope.dep_forecast_temp = $scope.dep_forecast.temp.day || 0;
						$scope.dep_forecast_clouds = $scope.dep_forecast.clouds || 0;
						$scope.dep_forecast_rain = $scope.dep_forecast.rain || 0;
						$scope.dep_forecast_condition = $scope.dep_forecast.weather[0].main;
					}
				}

				// Get arrival airport weather on departure date
				var arr_forecast = values[1].data;
				for (f in arr_forecast.list) {
					var date = new Date(arr_forecast.list[f].dt * 1000);
					if (date.getFullYear() == departure_date.getFullYear() && date.getMonth() == departure_date.getMonth() && date.getDate() == departure_date.getDate()) {
						$scope.arr_forecast = arr_forecast.list[f];
						$scope.arr_forecast_temp = $scope.arr_forecast.temp.day || 0;
						$scope.arr_forecast_clouds = $scope.arr_forecast.clouds || 0;
						$scope.arr_forecast_rain = $scope.arr_forecast.rain || 0;
						$scope.arr_forecast_condition = $scope.arr_forecast.weather[0].main;
					}
				}

				// Get average route rating between departure and arrival airports
				var route_rating = values[2].data;
				route_rating = route_rating.ratings;
				for (var i = 0; i < route_rating.length; i++) {
					var route = route_rating[i];
					if (route.airlineFsCode == $scope.airline) {
						$scope.route_rating += route_rating[i].ontimePercent * 100;
						$scope.route_rating /= 2;
					}
				}

				// Get departure airport's delay index
				var airport_rating = values[3].data;
				$scope.airport_rating = airport_rating.delayIndexes[0].normalizedScore;
				$scope.airport_rating = 100 - ($scope.airport_rating / 5 * 100);

				// To check numbers ...
				console.log('dep_forecast_rain: ' + $scope.dep_forecast_rain);
				console.log('arr_forecast_rain: ' + $scope.arr_forecast_rain);
				console.log('route_rating: ' + $scope.route_rating);
				console.log('airport_rating: ' + $scope.airport_rating);


				var monthname = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
				var dayname = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
				var day = dayname[departure_date.getDay()];
				var month = monthname[departure_date.getMonth()];

				var dep_lat = departure_airport_info.latitude;
				var dep_long = departure_airport_info.longitude;

				var arr_lat = arrival_airport_info.latitude;
				var arr_long = arrival_airport_info.longitude;
				var distance = $scope.getDistance(dep_lat, dep_long, arr_lat, arr_long, 'N');
				
				console.log(month, day, distance, $scope.dep_forecast_temp, $scope.dep_forecast_rain,
					$scope.arr_forecast_temp, $scope.arr_forecast_rain);

				$scope.ols = ols.constant + 
					ols.weather.dep_temp_precep * ($scope.dep_forecast_temp * $scope.dep_forecast_rain) + 
					ols.weather.arr_temp_precep * ($scope.arr_forecast_temp * $scope.arr_forecast_rain) + 
					ols.distance * distance + 
					ols.population.dep_population * ols.census_pop[$scope.departure_airport.toUpperCase()] + 
					ols.population.arr_population * ols.census_pop[$scope.arrival_airport.toUpperCase()] +
					ols.month[month.toLowerCase()] + 
					ols.day[day.toLowerCase()] + 
					ols.dep_airport[$scope.departure_airport.toUpperCase()] + 
					ols.arr_airport[$scope.arrival_airport.toUpperCase()] + 
					ols.airline[$scope.airline.toUpperCase()];

				var xb = logit.constant + 
					logit.weather.dep_temp_precep * ($scope.dep_forecast_temp * $scope.dep_forecast_rain) + 
					logit.weather.arr_temp_precep * ($scope.arr_forecast_temp * $scope.arr_forecast_rain) + 
					logit.distance * distance + 
					logit.population.dep_population * logit.census_pop[$scope.departure_airport.toUpperCase()] + 
					logit.population.arr_population * logit.census_pop[$scope.arrival_airport.toUpperCase()] +
					logit.month[month.toLowerCase()] + 
					logit.day[day.toLowerCase()] + 
					logit.dep_airport[$scope.departure_airport.toUpperCase()] + 
					logit.arr_airport[$scope.arrival_airport.toUpperCase()] + 
					logit.airline[$scope.airline.toUpperCase()];
				$scope.logit = Math.pow(Math.E, xb) / (1 + Math.pow(Math.E, xb)) * 100; //.234539283 when 5-21-20
				$scope.ols = $scope.truncateDecimals($scope.ols, 4);
				$scope.logit = $scope.truncateDecimals($scope.logit, 4);

				// Change color of the circle from green to red depending on logit probability
				/*var r = (255 * $scope.logit) / 100;
				var g = (255 * (100 - $scope.logit)) / 100;
				var b = 0;
				$scope.circle_color = r | (g << 8) | (r << 16);
				$scope.circle_color = '#' + $scope.circle_color.toString(16);*/
				if ($scope.logit < 20) {
					$scope.circle_color = 'green';
				} else if ($scope.logit < 60) {
					$scope.circle_color = 'orange';
				} else {
					$scope.circle_color = 'red';
				}
				
				// Display output view and hide input view
				$scope.display = true;
			});

			
		}
	}

});