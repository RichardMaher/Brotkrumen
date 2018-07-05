'use strict';
/* identification division.
 * program-id.    RegisterServiceWorker.
 * author.        Richard Maher.
 * version.       1.0
 */
 
function registerServiceWorker()
{	
// Make sure SW is there
	navigator.serviceWorker.register('echo.js', {scope: './'})
		.then(reg => {
				window.addEventListener("unload",unsubscribeTravelManager);
				console.log('SW Registered');
			})
		.catch(err => {
			console.log('SW Registration failed with ' + err);
			reportError({header:"Could not register ServiceWorker",
						message:err});
			return;
		});
	  
// Register for Background Geolocation tracking. Take default for accuracy, max age.    
	navigator.serviceWorker.ready
		.then(reg => {
			reg.travelManager.subscribe({
								minSilence:     5, // Car trip value. Collapse GPS.
								maxSilence:   600, // Sanity check. Squelch off.
								minProgress:   50, // Indoor accuracy an issue.
								maxSnail:      55, // Brisk walk.
								dropDodgy:   true  // Avoid wireless Pong.
								})
				.then(subscription => {travelSubscription = subscription}, locFail)
				.catch(err => {
						console.log('Travel Manager Subscription failed with ' + err);
						reportError({header:"Could not subscribe to Travel Manager",
								message:err});
				});
		});
}

function unsubscribeTravelManager(e)
{	
// Tidy up
    const CANCEL   = true;
	var   shutdown = Promise.resolve(false);
	
	if (travelSubscription) 
		shutdown = travelSubscription.unsubscribe(CANCEL);
		
	shutdown
		.then(success => {
				console.log("Unsubscribed from TravelManager = " + success);
				navigator.serviceWorker.ready
					.then(reg => {
							reg.unregister()
							.then(success => {console.log('SW Unregistered = ' + success)})			
							})			
			})
		.catch(err => console.log("Couldn't unregister SW " + err))
}

// eof