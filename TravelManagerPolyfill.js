'use strict';
/* identification division.
 * program-id.    TravelManagerPolyfill.
 * author.        Richard Maher.
 * version.       1.0
 */

// Simple polyfill paper-tiger
ServiceWorkerRegistration.prototype.travelManager 
		= new BackgroundGeolocation();
/*
 * This module simulates the work that needs to be done by the UA or
 * SW daemon in order to facilitate background geolocation on the web.
 *
 * Each client even in the same scope will have their own TravelManager
 * object/registration. With individual "options" configuration.
 *
 * TODO: Ask someone why registrations just can't be done in Ultimate
 * Web App manifests?
 *
 * NB: Please treat this as a black-box and concentrate on what it does
 * and not how it does it. Most of the magic will be in the UA. Some of
 * the proposed throttle functionality may be duplicating existing UA 
 * functionality and therefore be redundant.
 */
function BackgroundGeolocation() 
{
	const EARTH_RADIUS     = 6371000;
	const SHUSH            =   60000;
	const NUMBER           = "number";
	const STRING           = "string";
	const BOOLEAN          = "boolean";
	const DATE             = "date";
	const MIN_DATE		   =   -864*Math.pow(10,13);
	const MAX_DATE		   =    864*Math.pow(10,13);
	const MSECS            =   1000;	
	const TIMEOUT_IS_USELESS
                           = Number.POSITIVE_INFINITY;
 	const toRad            = function(num){return num*Math.PI/180};

	const DEFAULT_OPTIONS  = 
	{
		"maxSilence" : 900000,
		"minSilence" :   4000,
		"maxSnail"   :  15000,
		"minProgress":     15,
		"maxAge"     :      0,
		"accurate"   :   true,
		"dropDodgy"  :  false
	}
	var options     = DEFAULT_OPTIONS;
	var lastOptions = options; 
	var seqNum      = 0;
	
	var lastPos, trackerId, loiterTimer, deltaMetres, lastDrop, 
		replayTimer, timeDetent, spaceDetent, loiterDetent, 
		maxLocAge, accurate, maxSilence, watchCnt, acceptCnt,
		lastUpdate, kept, broken, currActive, regId, subscription,
		dropDodgy, mostConfident, leastConfident, recalibrateTimer
		;
		
	var OptionElem = function(name,valType,minValue,maxValue,shift)
	{
		this.name = name;
		this.type = valType;
		this.minValue = minValue;
		this.maxValue = maxValue;
		this.shift = shift;
		return this;
	}

	var optionRules = 
		[
		new OptionElem("maxSilence", NUMBER, 0,Number.POSITIVE_INFINITY,MSECS),
		new OptionElem("minSilence", NUMBER, 0,SHUSH,MSECS),
		new OptionElem("maxSnail",   NUMBER, 0,Number.POSITIVE_INFINITY,MSECS),
		new OptionElem("maxAge",     NUMBER, 0,Number.POSITIVE_INFINITY,MSECS),
		new OptionElem("minProgress",NUMBER, 0,Number.POSITIVE_INFINITY,1),
		new OptionElem("accurate",   BOOLEAN,0,1,0),
		new OptionElem("dropDodgy",  BOOLEAN,0,1,0),
		];
			

	var subscribe =		
		function(userOptions) 
		{									
			if(!navigator.geolocation) 
				return Promise.reject(new Error("Unsupported browser - No Geolocation support"));

			if (regId) return Promise.resolve(subscription);
			
			if (userOptions != undefined) {
				parseOptions(userOptions);
				lastOptions = options;			
			}
			
			regId = ++seqNum;	
				
			subscription = 
				{
					getId: function(){return regId},
					setOptions: setOptions,
					unsubscribe: unsubscribe
				}
				
			return new Promise((resolve, reject) => 
						{
							kept   = resolve;
							broken = reject;
							getCurrent(startPosition, startError);
						});	
		}				
								
	var getCurrent = 
		function(currentSuccess, currentFailure) 
		{
			navigator.geolocation.getCurrentPosition(currentSuccess, currentFailure ,{
						maximumAge: Number.POSITIVE_INFINITY,
						timeout: TIMEOUT_IS_USELESS
					});								
		}
		
	var startPosition =
		function(position)
		{
			kept(subscription);
			kept   = null;
			broken = null;
			fireTravelEvent({
							"cmd":"start",
							"position": pos4Net(position)
							},function(){
									lastPos        = position;
									watchCnt       = 1;
									acceptCnt      = 0;
									mostConfident  = position.coords.accuracy.toFixed();
									leastConfident = mostConfident;
									startWatch();
									loiterTimer  = setTimeout(loiterLimit, loiterDetent);
							})
		}
		
	var startError =
		function(positionError){
			regId = null;
			broken(positionError);
			broken = null;
			kept   = null;
		}
	
	var	startWatch =
		function()
		{
			trackerId = navigator.geolocation.watchPosition(filterLocation, locError, {
						enableHighAccuracy: accurate,
						maximumAge: maxLocAge,
						timeout: TIMEOUT_IS_USELESS
					});
			
			recalibrateTimer = setTimeout(recalibrate, maxSilence);					
		}
	
	var stopWatch = 
		function()
		{								
			navigator.geolocation.clearWatch(trackerId);
			clearTimeout(recalibrateTimer);
			
			trackerId        = null;
			recalibrateTimer = null;
		}
	
	var fireTravelEvent = 
		function(msg,callback)
		{
			try {
				currActive.postMessage(msg);
				console.log("Msg Sent to SW");
				if (callback) callback();
			} catch (e) {
				if (e.name == "InvalidStateError" || e.name == "TypeError") {
					navigator.serviceWorker.ready
					.then(reg => {
							currActive = reg.active;
							fireTravelEvent(msg, callback)})
				} else {
					throw e;
				}
			}
		}	
	
	var vetOption = function(userOption,rule)
	{		
		var result;
		switch(rule.type){
			case NUMBER:
			case DATE:
				result = Number(userOption*rule.shift);
				if (Number.isNaN(result) || result < rule.minValue || result > rule.maxValue) {
					result = null;
				} 
				break;
			case STRING:
				result = String(userOption);
				if (typeof result != STRING){
					result = null;
				}
				break;
			case BOOLEAN:
				result = Boolean(userOption);
				if (typeof result != BOOLEAN){
					result = null;
				}
				break;
			default:
				console.log("Invalid data type '"+rule.type+"'")
		}
		if (result == null) {
			console.log("Invalid parameter '"+rule.name+"'")			
		}
		return result;
	}
			
	var	setOptions =
		function(userOptions)
		{
			parseOptions(userOptions);
			
			for (var x in options) {
				if (options[x] != lastOptions[x]){
					stopWatch();
					startWatch();
					break;
				}
			}
	
			lastOptions = options;			
		}
		
	var	parseOptions =
		function(userOptions)
		{			
			var rawOptions = userOptions || {};
			for (var i=0; i<optionRules.length; i++){
				var currOption = optionRules[i].name;
				if ((currOption in rawOptions)){
					var currentTarget = vetOption(rawOptions[currOption], optionRules[i]);
					if (currentTarget){
						options[currOption] = currentTarget;
					} else {
						console.log("Invalid option "+optionRules[i].name+" value = " + rawOptions[currOption])
					}
				}
			}
			
			for (var opt in rawOptions){
				if (!optionRules.some(function(rule){return rule.name==this},opt)){
					console.log("Unknown option '"+opt+"'")
				}
			}
			
			timeDetent    = options.minSilence;			
			maxSilence    = options.maxSilence;			
			spaceDetent   = options.minProgress;
			loiterDetent  = options.maxSnail;
			maxLocAge     = options.maxAge;
			accurate      = options.accurate;
			dropDodgy     = options.dropDodgy;
			
			if (timeDetent > maxSilence){
				timeDetent = maxSilence;
				console.log("Minimum Silence overridden by Maximum Silence");
			}			
			if (loiterDetent > maxSilence){
				loiterDetent = maxSilence;
				console.log("Maximum Snail overridden by Maximum Silence");
			}			
			if (loiterDetent < timeDetent) {
				loiterDetent = timeDetent;
				console.log("Maximum Snail overridden by Minimum Silence");
			}
			
			return;
		}
			
	var locError = 
		function(error) 
		{			
			fireTravelEvent({"cmd":"error","error": {
								"code": error.code,
								"message": error.message
								}});
		}
			
	var recalibrate = 
		function()
		{
			console.log("recalibrating");
			
			stopWatch();
			startWatch();
			
			mostConfident = leastConfident;
		}
					
	var filterLocation = 
		function(position) 
		{
			watchCnt++;

			if (position.timestamp <= lastPos.timestamp) return;

			var currTime = Date.now();
			var updateDelta = currTime - lastUpdate;
			var dropping = (updateDelta < timeDetent);
				
			deltaMetres = calculateDistance(
						position.coords.latitude,
						position.coords.longitude,
						lastPos.coords.latitude,
						lastPos.coords.longitude)
							
			if (deltaMetres.toFixed() < spaceDetent) return;
			
			if (dropping) {
				lastDrop = position;
				if (!replayTimer) 
					replayTimer = setTimeout(moveReplay, (timeDetent - updateDelta));
				return;
			}
			
			var giveOrTake = position.coords.accuracy.toFixed();			
			if (giveOrTake > leastConfident) leastConfident = giveOrTake;
			if (giveOrTake < mostConfident ) mostConfident  = giveOrTake;
			
			if (dropDodgy 					&&
			    giveOrTake > spaceDetent 	&&
			    giveOrTake > deltaMetres 	&&
			    giveOrTake > (2*mostConfident)) {
			    return; // Not legit. Dicky phone tower or access point?
			}			   
			
			acceptCnt++;

			clearTimeout(recalibrateTimer);
			recalibrateTimer = setTimeout(recalibrate, maxSilence);
			
			clearTimeout(loiterTimer);
			loiterTimer = setTimeout(loiterLimit, loiterDetent);
			
			fireTravelEvent({
							"cmd":"travel",
							"position":pos4Net(position)
							})
							
			lastPos = position;
			lastUpdate = currTime;
		}
				
	var loiterLimit = 
		function()
		{
			loiterTimer = null;
			fireTravelEvent({"cmd":"loiter","position":pos4Net(lastPos)})
		}
		
	var moveReplay =
		function()
		{
			replayTimer = null;
			
			if ((lastDrop.timestamp > lastPos.timestamp)) {
				filterLocation(lastDrop);
			}						
		}			
		
	var calculateDistance =
		function(lat1, lon1, lat2, lon2){
			var dLat = toRad(lat2 - lat1);
			var dLon = toRad(lon2 - lon1);
			var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * 
					Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
			var distance = EARTH_RADIUS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
			return distance;
		}
		
	var unsubscribe =		
		function(cancel) 
		{							
			if (!regId) return Promise.resolve(false);

			stopWatch();
			
			if (loiterTimer) {
				clearTimeout(loiterTimer);
				loiterTimer = null;
			}
			
			if (replayTimer) {
				clearTimeout(replayTimer);
				replayTimer = null;
			}
			
			regId = null;
			lastUpdate = 0;
			
			if (cancel) {
				return Promise.resolve(true);
			} else {
				return new Promise((resolve, reject) => 
							{
								kept   = resolve;
								broken = reject;
								getCurrent(endPosition, endError);
							});	
			}			
		}	
		
	var endPosition = 
		function(position) 
		{			
			fireTravelEvent({
							"cmd":"end",
							"position":pos4Net(position)
							})
			kept(true);
			kept   = null;
			broken = null;
		}
		
	var endError = 
		function(error) 
		{			
			fireTravelEvent({"cmd":"error","error": {
								"code": error.code,
								"message": error.message
								}});
			broken(false);
			broken = null;
			kept   = null;
		}
		
	var pos4Net = 
		function(pos)
		{
			return {
				coords: {
					latitude: pos.coords.latitude,
					longitude: pos.coords.longitude,
					accuracy: pos.coords.accuracy.toFixed()
				},
				timestamp: pos.timestamp
			}
		}
		
	return {subscribe: subscribe};
}
