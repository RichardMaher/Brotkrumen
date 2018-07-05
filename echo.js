'use strict';
/* identification division.
 * program-id.    echo.
 * author.        Richard Maher.
 */
 
	var   doryRegister  = [];            // Meet someone new every day.
	const INTRO         = "GrussGott";   // Tell clients we're new.
	const FLEET_MANAGER = "/Fleet/Move"; // Starship control.
	
	self.addEventListener('install', function(e) 
	{
		e.waitUntil(self.skipWaiting());
	});
	
	self.addEventListener('activate', function(e) 
	{
		e.waitUntil(self.clients.claim());
	});	
/*
 * The following MessageEvent handler is simulating the proposed TravelEvent
 * that will be sourced from the UA, or other daemon, that is monitoring 
 * geolocation. This monitoring should continue even while Client is  
 * backgrounded, closed, or when the device is asleep.
 *
 * Inputs via TravelEvent object: 
 *   Client   : Window subscribed to TravelManager
 *   Type     : enum (start, travel, loiter, end, error)
 *   Position : https://dev.w3.org/geo/api/spec-source.html#position_interface
 *   V2.0     : lastPosition, distance, other goodies?
 *
 * Note: For the sake of speedy, Version 1 implementations, we may assert that 
 * the client tab or web-app cannot be closed/unloaded. Once closed, tracking 
 * stops. (I'd personally prefer client.postMessage throw "InvalidStateError"
 * if the Client.id is no longer a member of Clients but OTY.) 
 * NB: Clients.openWindow("Lazarus") sounds good to me! But how to reclaim ID?
 * Nah, scrub that. If the server decides that a GeoFence has been traversed
 * then it can push a message to us. We'll tell fleet-manager how many active
 * clients each time we send an update to help in decision making.
 * 
 * 23/07 I've changed my mind. TravelManager subscription should now be Client
 * specific. The TravelEvent must contain the intended Client.id 
 */
	self.addEventListener('message', function(e) 
	{
		e.waitUntil(new Promise((resolve) =>
			{
				var windowCount;
				
				var client = e.source;  // Must also be true for real TravelEvent
				console.log("TravelEvent " + client.id) // UA filters per client
				
				switch (e.data.cmd) {
					case 'start':
					case 'travel':					
					case 'error':
					case 'loiter':
					case 'end':
/*
 * I don't know what will happen if client has not registered a message event 
 * handler. Hopefully an "InvalidStateError" is thrown. 
 */ 
						var msg = e.data.position||e.data.error;
						windowCount = clients.length || 0;							
						sendClient(client, e.data.cmd, msg);
						tellFleetManager({
							"cmd" : e.data.cmd,
							"activeClients" : windowCount,
							"data" : msg
							}).then(resolve,resolve).catch(error => {resolve()});	
							
					  break;
					default:
					  console.log("In default cmd : "+e.data.cmd);
					  resolve();
				};
			})
		)			  
	})	
	
/*
 * Even if there are no active client window we still let Starship
 * Control know where we are so thay can let us know (notify us) of a
 * GeoFence we've just traversed or a bargain to be had at that pub over
 * there.
 */
	function tellFleetManager(payLoad)
	{
		return new Promise((resolve, reject) =>
		{
			fetch(FLEET_MANAGER, {
				method: "POST",
				credentials: 'same-origin',
				headers: {
					'Content-Type': 'application/json'
				},
				body: payLoad
			}).then(response =>
					{
						if (response.ok) {
							resolve(response.json())
						} else {
							var error = new Error(response.statusText)
							error.response = response
							throw error;
						}
					}).catch(function(error) {
						console.log('Fleet request failed', error)
						reject(error);
					});
		})
	}	
	
	function sendClient(client, cmd, msg)
	{				  
		if (!doryRegister[client.id]) {
			doryRegister[client.id] = 0;
			if (!postIt(client,{'cmd':INTRO})) return false;
		}

		return postIt(client,	
						{
						"cmd" : cmd,
						"serialNum" : ++doryRegister[client.id],
						"data" : msg
						});
	}
	
	function postIt(client,msg)
	{
		try {
			client.postMessage(msg)
		} catch (e) {
			console.log("Could not respond to client: "+e.message)
			return false;
		}
		return true;
	}
	
// eof