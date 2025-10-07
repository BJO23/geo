//-----------------------------------------------------------------------
// FUNCTIONS
//-----------------------------------------------------------------------

/**
 * Handles error callbacks
 */
function error() {
	// alert("Position kunde inte bestämmas.");
}

/**
 * Retrieves the current position of the device running this application.
 */
function startGeoLocate() {
  if (navigator.geolocation) {
	navigator.geolocation.getCurrentPosition(showPositionsFst);
	
	// Update location each 5:th second.
	setInterval(function() {
		navigator.geolocation.getCurrentPosition(showPositions,
												 error,
												 { enableHighAccuracy: true,
												   maximumAge: 30000,
												   timeout: 27000 }
		);
		tick++;
	}, 5000);
  } 
}
		
 /**
 * Initially views the personal marker and the target markers.
 *
 * @param {GeolocationPosition} pos The geolocated position.
 */
function showPositionsFst(pos) {
	currPos = new L.LatLng(pos.coords.latitude, pos.coords.longitude);  
	// alert("pos0: " + currPos.lat + " " + currPos.lng);
	
	// Zoom in to current position and view a marker there.
	map.flyTo(currPos, normZoom);
	myMarker = L.marker(currPos, {icon: positionIcons[2]}).addTo(map).bindTooltip("Du!");			
	myMarkerPop = new L.popup(currPos, {content: 'Det här är du!'}).openOn(map);
}

/**
 * Updates and view the personal marker and the target markers.
 *
 * @param {GeolocationPosition} pos The geolocated position.
 */
function showPositions(pos) {
	// alert("position: {" + pos.coords.latitude + " " + pos.coords.longitude + "}, precision: " + pos.coords.accuracy);

	var oldPos = currPos;
	currPos = new L.LatLng(pos.coords.latitude, pos.coords.longitude);
	
	// Close the initial popup which just enlighted the user of representing her. 
	myMarkerPop.close();
	
	// Set a tooltip showing useful information of the user states.
	//
	// Later work!!!
	// Traveled distance will probably deviate a lot after a while. A possible approach would be
	// to measure the distance from the passed markers and sum them up. However that fails if
	// a not intended route is choosen by the user. That approach is no problem for estimating the
	// remaining distance to the end point and should therefore be implemented.	
	myMarker.setTooltipContent('<p>noggrannhet (GPS): ' + Math.floor(pos.coords.accuracy) + ' m<br>' +
							   'tillryggalagd sträcka: ' + traveledDist + ' m</p>');

	var dist = map.distance(currPos, oldPos);
	// alert("dist: " + dist);

	if (dist > 2) {
		// Update marker symbol indicating current direction.
		myMarker.setIcon(getDirectionIcon(currPos, oldPos));
		traveledDist += dist;
	}

	// Updates the position of the users marker.
	myMarker.setLatLng(currPos);
	
	showTargets(pos);
	
	// Repeatadly normalizes the zoom and focus so the user do not get lost in the map.
	if (tick % 8 == 0) {
		map.flyTo(currPos, normZoom);
	}
}

/**
 * Updates and view all target markers.
 *
 * @param {GeolocationPosition} pos The geolocated position.
 */
function showTargets(pos) {
	for (var i = 0; i < mapTargets.length; i++) {
		
		if (!mapTargets[i].marker) {
			alert("Målmärke saknas.");
			return;
		}
		
		var dist = Math.floor(map.distance(currPos, mapTargets[i].marker.getLatLng()));
		if (dist > mapTargets[i].range) {
			mapTargets[i].marker.bindPopup(chestClosedImg + '<p style="text-align:center;">' + dist + ' m' + '</p>');
		}
		else {
			for (var j = 0; j <= i; j++) {
				mapTargets[j].marker.bindPopup(chestOpenImg + queries[mapTargets[j].query]);
			}
			mapTargets[i].marker.openPopup();
		}
	}
}

/**
 * Gets an icon representing the direction of the move.
 *
 * @param {LatLng} newPos The new position.
 * @param {LatLng} oldPos The former position.
 * @return {Icon} the coosen icon. 
 */
function getDirectionIcon(newPos = null, oldPos = null) {      
	var ang = 0;
	var ind = 0;
	
	// alert("pos: " + newPos + "  " + oldPos);
   ang = angle(newPos, oldPos);
	// alert("angle: " + ang);             
	while (ang - 22 > 0) { // 22 is close of beeing half of 45
		ang -= 45; // 45 degrees is the precission of the direction here
		ind++;
	}
	// alert("icon ind: " + ind);
	if (ind >= positionIcons.length) {
		alert("Sorry, the icon seem to be wrong.");
		return positionIcons[0];
	}
	
	return positionIcons[ind];
}

/**
 * Give the angle of the moving direction counter clockwise degrees from the east.
 *
 * @param {LatLng} newPos The new position.
 * @param {LatLng} oldPos The former position.
 * @return {number} The angle of the moving direction in the range of [0..360] degrees, using west as reference. 
 */
function angle(newPos, oldPos) {
	var dy = newPos.lat - oldPos.lat;
	var dx = newPos.lng - oldPos.lng;
	var theta = Math.atan2(dy, dx); // range (-PI, PI]
	theta *= 180 / Math.PI; // rads to degs, range (-180, 180]
	if (theta < 0) theta = 360 + theta; // range [0, 360)

	// alert("riktning i grader moturs med ostlig referens: " + theta);

	return theta;
}
 
/**
 * Creates an icon from an image.
 *
 * @param {string} img The image to the icon.
 * @param {number} size The size of the icon.
 * @param {number} yOffset The offset in Y-direction from the marker position.
 * @param {number} zOffset The offset in Z-direction (depth).
 * @return {Icon} The created icon. 
 */
function createIcon(img, size, yOffset = -30, zOffset = 5) {
	return new L.icon({
		iconUrl: img,
		iconSize: [size, size],
		popupAnchor: [0, yOffset],
		zIndexOffset: zOffset
	});
}

/**
 * Shows coordinattes of the position of a click (or tap). May be used to find
 * coordinates for new markers during development.
 *
 * @param {event} e The click event.
 */
function onMapClick(e) {
	alert("Du klickade kartan på position: " + e.latlng);
}

//-----------------------------------------------------------------------
// GLOBALS
//-----------------------------------------------------------------------
		
// Images viewed in the target markers popups.
const chestClosedImg = '<img src="images/chest_closed.png" style="align:center;width:10vw">';
const chestOpenImg = '<img src="images/chest_open.png" style="align:center;width:10vw">';

// Queries (or assignments) viewed at the targets when captured.
const q1 =  '<img src="./images/quiz_falured_black.png"><p>Vilken färg på huset?<br>' +
            '1: Falu Svartfärg<br>x: Falu Blåfärg<br>2:Falu Rödfärg</p>';
const q2 =	'<p>Vem har kallats mekanikens fader?<br>' +
            '1: Wolf Christoph Polhammer<br>x: Christoffer Polhem 2: Isaac Newton</p>';
const q3 =	'<img src="./images/quiz_symbol_cu.png"><p>Vilken metall förknippas symbolen med?<br>' +
            '1: Cu<br>x: Co<br>2: Fe</p>';
const q4 =	'<p>Inom alkemin (tidig kemi, filosofi och mystik) fanns en idé om att himlakroppar ' +
		    'och metaller hörde ihop, att kosmos och jorden var sammanlänkade. Därför kopplades ' +
            'varje känd planet till en basmetall.<br><br>' +
            'Vilken himlakropp förknippades med koppar?<br>' +
			'1: Solen<br>x: Venus<br>2: Mars</p>';
const q5 =	'<p>Vilken metall har använts i nästan alla vanliga mynt i Sverige?<br>' +
            '1: Silver<br>x: Koppar<br>2: Nickel</p>';
const q6 =	'<p>Vilken var den historiskt dominerande energikällan i Falu Gruva?<br>' +
            '1: Hästkraft<br>x: Ångkraft<br>2: Vattenkraft</p>';
const q7 =	'<img src="./images/quiz_polhems_lock.png"><p>Hans uppfinningar och maskiner effektiviserade gruvdriften. ' +
            'Han kanske ändå blev mest populär för denna. Vem var han?<br> ' +
			'1: Christoffer Polhem<br>x: Gustaf Dalén<br>2: Gustaf de Laval</p>';
const q8 =	'<img src="./images/quiz_alfred_nobel.png"><p>Vad gjorde hans uppfinning för skillnad för ' +
            'Falu Gruva?<br>1: Raset 1667 som blev "Stora Stöten"<br>x: Mer sprängkraft<br>2: Säkrare malmbrytning</p>';
const q9 =	'<p>Vad är skillnaden mellan en ort och ett schakt i gruvan?' +
            '<br>1: Formen på hålet<br>x: Lutningen på hålet<br>2: Storleken på hålet</p>';
const q10 =	'<p>Hur stor del av all världens kopparproduktion stod Falu Gruva för som mest?<br>' +
            '1: 10%<br>x: 30%<br>2: 70%</p>';
const q11 = '<p>I äldre tiders kemi och gruvdrift användes benämningen ”vitriol” för flera olika ämnen ' +
            'som bildades när sulfidhaltiga mineraler oxiderade i kontakt med luft och vatten. ' +
            'I Falu Gruva bildades mycket kopparvitrol och ett annat ämne som tillsammans '+
            'konserverade kroppen efter Mats Israelsson. Han var en ung gruvarbetare som förolyckades ' +
			'i gruvan 1677 och återfanns först efter drygt 40 år.<br><br>' +
			'Vilket var det huvudsakliga ämnet utöver kopparvitriol som bevarade Mats så att en ' +
            'äldre kvinna 1719 utan vidare kände igen sin trolovade från ungdomen?<br>' +
            '1: zinkvitriol<br>x: järnvitriol<br>2: Manganvitriol<p>';
const q12 = '<p>Det röda pigmentet i Falu Rödffärg som ju kommer från gruvan är oxider av metall, vilken?<br>' +  
            '1: zink<br>x: järn<br>2: koppar<p>';

// Queries to be used
const queries = [q1, q2, q3, q4, q5, q6, q7, q8, q9, q10];

// Sets the levels of zoom for the map. A fly in start levels in to a normal state and
// from there the use may choose up to the max level.
const startZoom = 10;
const normZoom = 16;
const maxZoom = 20;

// Sets the positions of the start and the end point for the journey. 
const startPos = new L.LatLng(60.600127, 15.616266);
const EndPos = new L.LatLng(60.612373, 15.529926);

// Defines the icon images for the map marker pointing out the position and direction of the phone (user).
const arrowImgs = ['images/black_arrow_e.png', 'images/black_arrow_ne.png', 'images/black_arrow_n.png', 'images/black_arrow_nw.png',
				   'images/black_arrow_w.png', 'images/black_arrow_sw.png', 'images/black_arrow_s.png', 'images/black_arrow_se.png'];
				   
// Defines the map targets with positions, icons, activated when in range 
var mapTargets = [
	{ marker: L.marker({ lat: 60.596261, lng: 15.607463}, {icon: createIcon('images/pin1.png',  30)}), range: 50, query: 0 },
	{ marker: L.marker({ lat: 60.599042, lng: 15.598097}, {icon: createIcon('images/pin2.png',  30)}), range: 50, query: 1 },
	{ marker: L.marker({ lat: 60.598123, lng: 15.583205}, {icon: createIcon('images/pin3.png',  30)}), range: 50, query: 2 },
	{ marker: L.marker({ lat: 60.597282, lng: 15.576103}, {icon: createIcon('images/pin4.png',  30)}), range: 50, query: 3 },
	{ marker: L.marker({ lat: 60.600917, lng: 15.573828}, {icon: createIcon('images/pin5.png',  30)}), range: 50, query: 4 },
	{ marker: L.marker({ lat: 60.603991, lng: 15.561962}, {icon: createIcon('images/pin6.png',  30)}), range: 50, query: 5 },
	{ marker: L.marker({ lat: 60.607448, lng: 15.558186}, {icon: createIcon('images/pin7.png',  30)}), range: 50, query: 6 },
	{ marker: L.marker({ lat: 60.612082, lng: 15.552950}, {icon: createIcon('images/pin8.png',  30)}), range: 50, query: 7 },
	{ marker: L.marker({ lat: 60.616386, lng: 15.547113}, {icon: createIcon('images/pin9.png',  30)}), range: 50, query: 8 },
	{ marker: L.marker({ lat: 60.613908, lng: 15.535913}, {icon: createIcon('images/pin10.png', 30)}), range: 50, query: 9 },
];
							   
var currPos = new L.LatLng(0, 0);
var positionIcons = [];
var traveledDist = 0;
var tick = 0;
var myMarker;
var myMarkerPop;

// The map set with LeafLet
var map = L.map('map');

// initialize Leaflet
map.setView(startPos, startZoom);

// add the OpenStreetMap tiles
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 18,
	attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
}).addTo(map);

// Premake the icons used for the users marker.
for (var img of arrowImgs) {
	var icon = createIcon(img, size = 20, yOffset = 0, zOffset = 5);
	positionIcons.push(icon);
}
	
// Later work!!
// Replace the circles below with markers. For that a new icon image is needed.

// Puts a red thick cirkle on the map centering the start position of the journey.
L.circle(startPos, {
		color: 'red',
		weight: 4,
		fillColor: '#faa',
		fillOpacity: 0.15,
		radius: 50
}).addTo(map);

// Puts a blue wide cirkle around the red to light it up.
L.circle(startPos, {
		color: 'blue',
		weight: 2,
		// fillColor: '#faa',
		fillOpacity: 0,
		radius: 100
}).addTo(map).bindTooltip("<p>Samling vid gruvan kl 09:00, start 09:15</p>");

// Puts a red thick cirkle on the map centering the end position of the journey.
L.circle(EndPos, {
		color: 'red',
		weight: 4,
		//fillColor: '#faa',
		fillOpacity: 0.15,
		radius: 50
}).addTo(map);

// Puts a blue wide cirkle around the red to light it up.
L.circle(EndPos, {
		color: 'blue',
		weight: 2,
		fillColor: '#faa',
		fillOpacity: 0,
		radius: 100
}).addTo(map).bindTooltip("<p>Målgång i Puttbo och lunch.</p>");

// Puts all predefined target markers on the map.
for (var targ of mapTargets) {

	// Views a single marker with a popup function (adding content later).
	targ.marker.addTo(map).bindPopup();
	
	// Views a red transperent circle in wich the target is concider to be captured.
	L.circle(targ.marker.getLatLng(), {
		color: 'red',
		weight: 1,
		fillColor: '#faa',
		fillOpacity: 0.15,
		radius: targ.range
	}).addTo(map).bindTooltip('<p>Gå till märket. När du kommer innanför cirkeln öppnas en kista.<br>Om du tappar på märket så ser du avståndet (fågelvägen).</p>');
}

// show the scale bar on the lower left corner
L.control.scale({imperial: false, metric: true}).addTo(map);

// Start the process of locating the users phone in repeated intervals.
startGeoLocate();

// Use this line when you need to get coordinates from the map at a clicked point.
// map.on('click', onMapClick);
