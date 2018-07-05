'use strict';
/* identification division.
 * program-id.    HandleMaps.
 * author.        Richard Maher.
 * version.       1.0
 */
 
const MARKER_SELECTOR       = "img[src*='hg.png'";
const MARKER_SRC            = "hg.png"

var progressPath   			= [];

var protagonists, endMarker, mapDiv, HandG, currStep,
	canTalk, bounce, drop, dirPoly, stepPoly, mudMap,
	mapTypeArray, hat, HGDiv, HGImg, infoWindow,
	countDown, markerDivs, observer, nextFunc, foot,
	plotTimer, zoomIn, zoomOut, finish, ouch
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
	google.maps.event.addListenerOnce(map,'tilesloaded',gotTiles);
	google.maps.event.addListener(map,'zoom_changed',function()
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
		animation: bounce,
		map: map, 
		draggable: false,
		title: "Witch", 
		zIndex: 13, 
		visible: false, 
		icon: endMarker, 
		optimized: false
		});
		
	HandG = new google.maps.Marker(
		{
		position: new google.maps.LatLng(
						firstPos.coords.latitude,
						firstPos.coords.longitude), 
		animation: drop,
		map: map, 
		draggable: false,
		title: "HandG", 
		zIndex: 12, 
		visible: false, 
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
								"Get in the oven precious.");
		finish.rate  = 1.2;
		finish.pitch = 0.5;
		finish.addEventListener('error', speakError);
		ouch         = new SpeechSynthesisUtterance("Ow! That hurt.");
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
	
	hat.setPosition(
		new google.maps.LatLng(
				lastPos.coords.latitude,
				lastPos.coords.longitude)); 
	hat.setVisible(true);
	hat.setAnimation(bounce);
		
	HandG.setPosition(
		new google.maps.LatLng(
				firstPos.coords.latitude,
				firstPos.coords.longitude)); 
	HandG.setVisible(true);
	
	map.panTo(path[0]); 
	google.maps.event.trigger(map, 'resize');
	
	if (document.querySelectorAll(MARKER_SELECTOR).length == 0){
		observer.observe(mapDiv, {
						childList     : true,
					    subtree       : true ,
					    attributes    : true ,
					    characterData : false
						})
	} else {
		setTimeout(plotTrip,0);
	}
}
function plotTrip(){
	nextFunc = plotStep;
	hat.setAnimation(bounce);
	HandG.setPosition(path[0]);
	dirPoly.setVisible(true);		
	progressPath = [];
	progressPath.push(path[0]);
	dirPoly.setPath(path);
	stepPoly.setPath(progressPath);
	stepPoly.setVisible(true);
	currStep = 1;
	markerDivs = [];
	var markerImgs = document.querySelectorAll(MARKER_SELECTOR);
	for (var i=0; i<markerImgs.length; i++){
		console.log(markerImgs[i].src);
		markerDivs[i] = markerImgs[i].parentNode;
		markerDivs[i].style.transitionDuration = "0s";
		markerDivs[i].style.transitionProperty = "left, top";
		markerDivs[i].style.transitionTimingFunction = "linear";
	}
	
	setTimeout(plotStep,0);
	abort = false;
	btn.value = "Cancel";
	btn.disabled = false;
}
function plotStep(){
	if (abort) return;
	
	if (legs[currStep].didLoiter){
		countDown = legs[currStep].restTime;
		infoWindow.setContent(
			"<div id='waitDiv'><span>Waiting</span></div>");
		infoWindow.open(map,HandG);
		showInterval();
	} else {
		plotIt();
	}
}
function showInterval(){
	if (abort) return;
	
	infoWindow.setContent(
		"<div id='waitDiv'><span>Waiting "+deltaDate(countDown)+"</span></div>");
	countDown -= (ONE_SEC * multiSpeed);
	if (countDown < 1){
		infoWindow.close();	
		plotIt();
	} else {
		setTimeout(showInterval, ONE_SEC);
	}
}
function plotIt(){
	if (abort) return;

	progressPath.push(path[currStep]);
	stepPoly.setPath(progressPath);
	map.panTo(path[currStep]);
	var transitionMS = legs[currStep].duration / multiSpeed;
	for (var i=0; i<markerDivs.length; i++){
		markerDivs[i].style.transitionDuration = transitionMS + "ms";
	}
	HandG.setPosition(path[currStep])

	if (++currStep >= path.length)
		nextFunc = cleanUp;
	
	plotTimer = setTimeout(nextFunc,transitionMS);
}
function cleanUp(){
	infoWindow.close();
	hat.setAnimation();
	btn.value = "Replay";
	btn.disabled = false;
	clearTimeout(plotTimer);
	for (var i=0; i<markerDivs.length; i++){
		markerDivs[i].style.transitionDuration = "0s";
	}
	HandG.setPosition(
		new google.maps.LatLng(
				lastPos.coords.latitude,
				lastPos.coords.longitude)); 
	HandG.setVisible(false);
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
			mutations[i].target.src.toLowerCase().indexOf(MARKER_SRC) != -1){
			console.log("result")
			myInstance.disconnect();
			setTimeout(plotTrip,0)
			break outer;
		}
		if (mutations[i].type != "childList" ||
        	mutations[i].addedNodes.length   == 0) 
            continue;
		for (var j=0; j<mutations[i].addedNodes.length; j++) {
			var node = mutations[i].addedNodes[j];
			if (node.tagName == "DIV" && node.firstChild && node.firstChild.tagName == "IMG" &&
				node.firstChild.src.toLowerCase().indexOf(MARKER_SRC) != -1){
				console.log(node.firstChild.src);
				myInstance.disconnect();
				setTimeout(plotTrip,0)
				break outer;
			}
		}
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