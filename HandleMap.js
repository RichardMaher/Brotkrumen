'use strict';
/* identification division.
 * program-id.    HandleMaps.
 * author.        Richard Maher.
 * version.       1.0
 */
 
const MARKER_SELECTOR       = "img[src*='hg.png'";
const MARKER_SRC            = "hg.png"

var progressPath	= [];
var markerImgs		= [];
var touchDown		= false;

var protagonists, endMarker, mapDiv, HandG, currStep,
	canTalk, bounce, drop, dirPoly, stepPoly, mudMap,
	mapTypeArray, hat, HGDiv, HGImg, infoWindow,
	countDown, markerDiv, observer, nextFunc, foot,
	zoomIn, zoomOut, finish, ouch, transitionMS,
	travelListener
	;

function mapsLoaded(){
	bounce       = google.maps.Animation.BOUNCE;
	drop         = google.maps.Animation.DROP;
	
	protagonists = {size: new google.maps.Size(45, 40),
					scaledSize: new google.maps.Size(45, 40),
					url: MARKER_SRC};
					
	endMarker    = {anchor: new google.maps.Point(20,35),
					size: new google.maps.Size(45, 40),
					scaledSize: new google.maps.Size(45, 40),
					url: 'striped-witch-hat.png'};
									
	mapDiv       = document.getElementById("mapDiv");
	
	observer	 = new MutationObserver(waitForMarker);

	var barren = [
			{              
			featureType: 'all',
			stylers: [
				{ saturation: -100 },
				{ gamma: 0.50 },
				{ lightness: 20 }
			  ]
			},
			{
			featureType: 'water',
			stylers: [
				{ color: '#38b0de' },
				{ saturation: 50 },
				{ lightness: 70 },
			  ]
			},				
			{
			featureType: "water",
			elementType: "labels",
			stylers: [
				{ visibility: "off" }
			]
			},
			{
			featureType: 'road',
			elementType: 'geometry',
			stylers: [
				{ visibility: 'simplified' },
				{ lightness: 100 }
			  ]
			},	
			{
			featureType: 'road.highway',
			elementType: 'geometry',
			stylers: [
				{ color: '#f2a307'},
				{ lightness: 50 }
			  ]
			},				
			{
			featureType: 'road.arterial',
			elementType: 'geometry',
			stylers: [
				{ color: '#32CD32'},
				{ lightness: 50 }
			  ]
			},				
			{
			featureType: "poi",
			elementType: "labels",
			stylers: [
				{ visibility: "off" }
			]
			},
			{
			featureType: "landscape.man_made",
			elementType: "labels",
			stylers: [
				{ visibility: "off" }
			]
			},
			{
			featureType: "administrative",
			elementType: "labels",
			stylers: [
				{ visibility: "off" }
			]
			}
		]
		
	mudMap = new google.maps.StyledMapType(barren, {name: displayName});
	mapTypeArray = [google.maps.MapTypeId.ROADMAP, google.maps.MapTypeId.SATELLITE, displayName];

	foot = document.createElement("div");
	foot.className = "br";
    foot.innerHTML = "&#169;&#32;&#82;&#105;&#99;&#104;&#97;&#114;" 
				   + "&#100;&#32;&#77;&#97;&#104;&#101;&#114;&#32;";	
    document.body.appendChild(foot);

	locReady.then(makeMap);
}
function makeMap(){
	var myMapOptions = 
		{ 
		zoom: params.zoomLevel, 
		backgroundColor: '#00ccdd',
		center: new google.maps.LatLng(
						firstPos.coords.latitude, 
						firstPos.coords.longitude),					   
		mapTypeId: google.maps.MapTypeId.ROADMAP, 
		gestureHandling: "cooperative",
		tilt: 45, 
		scrollwheel: false,
		mapTypeControl: false, 
		fullscreenControl: false, 
		streetViewControl: false, 
		disableDoubleClickZoom: true,
		panControl:false, 
		zoomControl:false
		};

	map = new google.maps.Map(mapDiv, myMapOptions);
	google.maps.event.addListenerOnce(map,'tilesloaded', gotTiles);
	google.maps.event.addListener(map,'zoom_changed', function()
			{
				var currZoom = map.getZoom();
				zoomLevel.innerHTML = currZoom;
				params.zoomLevel = currZoom;
				localStorage.setItem(displayName,JSON.stringify(params));
			}
		);
	map.mapTypes.set(displayName, mudMap);
	map.setMapTypeId(mapTypeArray[params.mapType]);
			
	dirPoly = new google.maps.Polyline({editable: false, draggable: false, strokeColor: "#0000FF", 
					strokeOpacity: 0.5, strokeWeight: 10, clickable: true, zIndex: 995,
					map: map, visible: false});
			
	stepPoly = new google.maps.Polyline({editable: false, draggable: false, strokeColor: "#FFFF00", 
					strokeOpacity: 0.9, strokeWeight: 4, clickable: true, zIndex: 996,
					map: map});	
					
	hat = new google.maps.Marker(
		{
			map: map, 
			draggable: false,
			title: "Witch", 
			zIndex: 13, 
			visible: true, 
			icon: endMarker, 
			optimized: false
		});
		
	HandG = new google.maps.Marker(
		{
			map: map, 
			draggable: false,
			title: "HandG", 
			zIndex: 12, 
			visible: true, 
			icon: protagonists, 
			optimized: false
		});
		
    infoWindow = new google.maps.InfoWindow();

	zoomIn = document.getElementById("zoomIn");
	zoomIn.addEventListener('click', handleZoom);
	zoomOut = document.getElementById("zoomOut");
	zoomOut.addEventListener('click', handleZoom);
	
	document.getElementById("mapToggle").addEventListener('click', mapChanged);
					
	if ('speechSynthesis' in window) {
		canTalk = true;
		try {
			var chat = new SpeechSynthesisUtterance("hello");
			chat.addEventListener('end', function(){}, false);
		} catch (err) {
			canTalk = false;
		}
	}
	
	if (canTalk){
		finish       = new SpeechSynthesisUtterance(
								"Get in the oven, precious.");
		finish.rate  = 1.2;
		finish.pitch = 0.5;
		finish.addEventListener('error', speakError);
		ouch         = new SpeechSynthesisUtterance("Ow; that hurt!");
		ouch.rate    = 1.5;
		ouch.pitch   = 1.5;
		ouch.addEventListener('error', speakError);
		google.maps.event.addListener(HandG, 'click', 
			function(){speechSynthesis.speak(ouch)});
	}
}
function gotTiles(){
	mapDetails.style.display = "none";
	mapDetails.style.visibility = "";
	mapDetails.style.top = "";
	mapDetails.style.position = "";
	synchPoint2();
}
function showJourney(){
	map.setOptions({gestureHandling: "none"});
	zoomOut.style.display = "none";
	zoomIn.style.display  = "none";
	
	map.setCenter(path[0]); 
	hat.setPosition(path[path.length - 1]);
//	hat.setVisible(true);
	HandG.setPosition(path[0]);
//	HandG.setVisible(true);
	google.maps.event.trigger(map, 'resize');

	if (markerImgs.length == 0) {
		markerImgs = document.querySelectorAll(MARKER_SELECTOR);
		if (markerImgs.length == 0) {
			observer.observe(mapDiv, {
				childList: true,
				subtree: true,
				attributes: true,
				characterData: false
			})
		}
	}
	if (markerImgs.length != 0) {
		setTimeout(plotTrip, 0);
	}
}
function plotTrip(){
	nextFunc = makeDestCenter;
	hat.setAnimation(bounce);
	dirPoly.setVisible(true);		
	progressPath = [];
	progressPath.push(path[0]);
	dirPoly.setPath(path);
	stepPoly.setPath(progressPath);
	stepPoly.setVisible(true);
	currStep = 1;

	if (markerImgs.length != 1) {
		reportError({
			header: "Error processing Google Maps marker.",
			message: "Expecting one and only one Hansel and Gretal. Found: " + markerImgs.length
		});
		return;
	}

	markerDiv = markerImgs[0].parentNode;
	markerDiv.style.transitionTimingFunction = "linear";
	markerDiv.addEventListener('transitionstart', startLeg);
	markerDiv.style.visibility = "visible";
	
	abort = false;
	btn.value = "Cancel";
	btn.disabled = false;

	travelListener = google.maps.event.addListener(map, 'center_changed', centerChanged);

	setTimeout(makeDestCenter, 0);

}
function makeDestCenter() {
	console.log("Panning to new Center");
	map.panTo(path[currStep]);
}
function centerChanged() {
	console.log("Center changed msv = " + markerDiv.style.visibility);
	markerDiv.style.visibility = "hidden";
	markerDiv.style.transitionDuration = "1ms";
	markerDiv.style.transitionTimingFunction = "linear";
	markerDiv.style.transitionProperty = "left, top";
	markerDiv.addEventListener('transitionend', quiesced, { 'once': true });
	markerDiv.addEventListener('transitioncancel', quiesced, { 'once': true });
}
function quiesced(e) {
	markerDiv.style.visibility = "visible";
	console.log("Quiesced " + e.type);
	setTimeout(plotStep, 0);
}
function plotStep(){
	if (abort) return;

	markerDiv.style.transitionDuration = "0s";
	
	if (legs[currStep].didLoiter){
		countDown = legs[currStep].restTime;
		infoWindow.setContent(
			"<div id='waitDiv'><span>Waiting</span></div>");
		infoWindow.open(map,HandG);
		showInterval();
	} else {
		console.log("1");
		setTimeout(plotIt, 0);
	}
}
function showInterval(){
	if (abort) return;
	
	infoWindow.setContent(
		"<div id='waitDiv'><span>Waiting "+deltaDate(countDown)+"</span></div>");
	countDown -= (ONE_SEC * multiSpeed);
	if (countDown < 1){
		infoWindow.close();	
		console.log("2");
		setTimeout(plotIt,0);
	} else {
		setTimeout(showInterval, ONE_SEC);
	}
}
function plotIt() {
	if (abort) return;
	console.log(new Date().getMilliseconds() + " in plot");

	progressPath.push(path[currStep]);
	stepPoly.setPath(progressPath);

	google.maps.event.trigger(map, 'resize');
	console.log("After pan");
	setTimeout(undLauf, 0);
}
//  achtung fertig los
function undLauf() {
	console.log("In pan event");
	if (abort) return;

	var currStyle = getStyle(markerDiv);
	transitionMS = legs[currStep].duration / multiSpeed;
	markerDiv.style.transitionDuration = transitionMS + "ms";
	console.log(new Date().getMilliseconds() + " Total Duration " + transitionMS + " left " + currStyle.left + " top " + currStyle.top);
	markerDiv.style.transitionProperty = "left, top";

	markerDiv.addEventListener('transitionend', incrSteps, { 'once': true });

	HandG.setPosition(path[currStep]);	
	console.log("setPos " + markerDiv.style.left + " top " + markerDiv.style.top)
}
function startLeg(e) {
	var currStyle = getStyle(markerDiv);
	console.log(new Date().getMilliseconds() + " In start Leg " + e.propertyName + " left " + currStyle.left + " top " + currStyle.top);
}
function incrSteps(e) {
	var currStyle = getStyle(markerDiv);
	console.log(new Date().getMilliseconds() + " transition " + e.type + " prop " + e.propertyName + " left " + currStyle.left + " top " + currStyle.top);
	if (abort) return;

	console.log("End " + e.elapsedTime);

	if (++currStep >= path.length) {
		console.log("Journey's end");
		markerDiv.style.transitionDuration = "0s";
		nextFunc = cleanUp;
	}

	setTimeout(nextFunc, 0);
}
function cleanUp() {
	console.log("in cleanUp");
	markerDiv.style.visibility = "hidden";
	travelListener.remove();
	infoWindow.close();
	hat.setAnimation(null); 
	btn.value = "Replay";
	btn.disabled = false;
	markerDiv.style.transitionDuration = "0s";
	markerDiv.style.transitionProperty = "none";
//	HandG.setVisible(false);
	map.setOptions({gestureHandling: "cooperative"});
	zoomIn.style.display  = "";
	zoomOut.style.display = "";
	if (canTalk && !abort)
		speechSynthesis.speak(finish);
}
function waitForMarker(mutations, myInstance) {
	outer:
	for (var i=0; i<mutations.length; i++){
        if (mutations[i].type           == "attributes" && 
			mutations[i].target.tagName == "IMG"        &&
			mutations[i].target.src.toLowerCase().indexOf(MARKER_SRC) != -1) {
			touchDown = true;
			break outer;
		}
		if (mutations[i].type != "childList" ||
        	mutations[i].addedNodes.length   == 0) 
            continue;
		for (var j=0; j<mutations[i].addedNodes.length; j++) {
			var node = mutations[i].addedNodes[j];
			if (node.tagName == "DIV" && node.firstChild && node.firstChild.tagName == "IMG" &&
				node.firstChild.src.toLowerCase().indexOf(MARKER_SRC) != -1){
				touchDown = true;;
				break outer;
			}
		}
	}
	if (touchDown) {
		console.log("Got Marker");
		myInstance.disconnect();
		markerImgs = document.querySelectorAll(MARKER_SELECTOR);
		setTimeout(plotTrip, 0)
	}
}		
function handleZoom(e){
	var lclTarget = e.target || e.srcElement;
	lclTarget.blur();
	var zoomDir = -1; 
	if (lclTarget.id == "zoomIn") zoomDir = 1;
	map.setZoom(map.getZoom() + zoomDir);
}	
function mapChanged(e){
	var lclTarget = e.target || e.srcElement;
	lclTarget.blur();
	if (params.mapType == 2){ 
		params.mapType = 0;
	} else{
		params.mapType++;
	}
	map.setMapTypeId(mapTypeArray[params.mapType]);
	localStorage.setItem(displayName,JSON.stringify(params));
}
function speakError(error){		
	switch(error.error) {
		case "canceled":
		case "interrupted":
			break;
		case "audio-busy":
			setTimeout(function(){alert("Audio in use by other Application")},0);
			break;
		default:
			console.log('ERROR(' + error.error + ')');
			return;
	}
}