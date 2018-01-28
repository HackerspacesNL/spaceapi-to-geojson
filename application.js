const rp = require('request-promise-native');
const fs = require('fs');

var directory_url = "https://spaceapi.fixme.ch/directory.json";

function spaceinfoToGeojsonItem(spaceinfo) {
	var name = "Unknown";
	if (typeof spaceinfo.space !== undefined && spaceinfo.space) {
		name = spaceinfo.space;
	}
	
	var url = "";
	if (typeof spaceinfo.url !== undefined  && spaceinfo.url) {
		url = spaceinfo.url;
	}	
	
	var email = "";
	if (typeof spaceinfo.contact !== undefined && spaceinfo.contact) {
		if (typeof spaceinfo.contact.email !== undefined && spaceinfo.contact.email) {
			email = spaceinfo.contact.email;
		}
	}
	
	var latitude = 0;
	var longitude = 0;
	var address = "";
	
	if (typeof spaceinfo.location !== undefined && spaceinfo.location) {
		if (typeof spaceinfo.location.lat !== undefined && spaceinfo.location.lat) {
			latitude = spaceinfo.location.lat;
		}
		
		if (typeof spaceinfo.location.lon !== undefined && spaceinfo.location.lon) {
			longitude = spaceinfo.location.lon;
		}
		
		if (typeof spaceinfo.location.address !== undefined && spaceinfo.location.address) {
			address = spaceinfo.location.address;
		}
	}
	
	var msg = "";
	var symbol = "hs";
	
	if (typeof spaceinfo.state !== undefined && spaceinfo.state) {
		if (typeof spaceinfo.state.message !== undefined && spaceinfo.state.message) {
			msg = spaceinfo.state.message;
		}
		
		if (typeof spaceinfo.state.open !== undefined && spaceinfo.state.open) {
			if (spaceinfo.state.open) {
				symbol = "hs-open";
			} else {
				symbol = "hs-closed";
			}
		}
	}
	
	var output = {
		"type": "Feature",
		"geometry": {
			"type": "Point",
			"coordinates": [longitude, latitude]
		},
		"properties": {
			"marker-symbol": symbol,
			"name": name.replace(/(?:\r\n|\r|\n)/g, ' '),
			"url": url.replace(/(?:\r\n|\r|\n)/g, ' '),
			"address": address.replace(/(?:\r\n|\r|\n)/g, ' '),
			"email": email.replace(/(?:\r\n|\r|\n)/g, ' '),
			"description": msg.replace(/(?:\r\n|\r|\n)/g, ' ')
		}
	};
	
	return output;
}

rp({uri: directory_url, json: true}).then((directory) => {
	var geojson_items = [];
	var promises = [];
	for(var hackerspace in directory){
		var hs_url = directory[hackerspace];
		promises.push(rp({uri: hs_url, json: true, timeout: 2000}).then((spaceinfo) => {
			geojson_items.push(spaceinfoToGeojsonItem(spaceinfo));
		}).catch((error) => {
			console.log(error);
		}));
	}
	
	Promise.all(promises).then( (values) => {
		var geojson = {
			"type": "FeatureCollection",
			"features": geojson_items
		};

		fs.writeFile('output.geojson', JSON.stringify(geojson), (err) => {
		if (err) throw err;
		console.log('The file has been saved!');
		});
	});
	
}).catch((error) => {
	console.log("Error: Could not fetch the directory!");
	console.log(error);
});
