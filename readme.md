ReadMe.txt
==========

Author: Richard Maher 
        maherrj@gmail.com

Release: 20-Jul-2017 - Initial POC release.
         12-Sep-2017 - Most important design/proposed-specification change is that TravelManager subscription should now be Client specific. The TravelEvent must contain the intended Client.id (TravelEvent.source.id). This means that the UA must monitor and filter GeoLocation updates per client. I have also added new demo functionality such as a Trip Summary that is displayed when you press the "Arrive" button. The trip can also be replayed onto Google Maps by pressing "Map Trip" or "Replay". If the last and next geolocation updates for the trip are both visible in the Map window then smooth Marker movement is achieved via CSS transitions.

Brotkrumen Ultimate Web App
---------------------------

Raison D'etre: - To prove unequivocally once and for all that the ServiceWorker paradigm supports Background Geolocation perfectly as the functionality delivery mechanism for Web Apps. 

An unacceptable level of ignorance pervades the W3C/IETF ServiceWorker corridors leading to false assumptions that ServiceWorker instance lifespans are so fleeting as to be incapable of serving more than a single geolocation update. This Web App proves otherwise. The flag's dropped so the FUD must stop! ServiceWorkers are being held back and hamstrung by the Offline-First fanatics and zealots.

Run-time test considerations
----------------------------

Obviously, the TravelManagerRegistration in the example is currently only a pollyfill. Therefore, to be able to properly test geolocation change output, your phone needs to be on/not-asleep and Brotkrumen in the foreground. On my Samsung Galaxy S7, the longest the screen can be active constantly is 10mins but if you enable Developer Tools and plug it into your charger it can stay active forever.

NB: I prefer to use Firefox as due to an existing bug ( https://bugzilla.mozilla.org/show_bug.cgi?id=1254911 among others) Firefox continues to deliver GPS updates in the background. Put your phone in your pocket and off you go; just like it should be!

Files in this directory: -
--------------------------

Just copy all of these files to your Web Server and navigate to /TravelManager.html and then save the Ultimate Web App to your homescreen. Once the Web App is active, go for a walk, ride, or drive and watch the Service-Worker-Instance to Position-Update ratio scream at you that "This *is* the solution!" to the background geolocation conundrum.

brotkrumen.css              Style Sheet
webapp.json                 Manifest
echo.js                     ServiceWorker using Message Events to simulate the TravelEvents that need to come from UA.
gingerbreadhouse.png        Shortcut/Homescreen icon
handlemap.js                The code needed to plot and replay the trip onto Google Maps. (Uses CSS Transitions for a 'smooth' trip)
hg.png                      Our protagonists
registerserviceworker.js    ServiceWorker Registration and TravelManager subscription
striped-witch-hat.png       Destination marker icon.
sw745.html                  Uncensored copy of Issue 745 from https://github.com/w3c/ServiceWorker/issues Look from June 7 to see what the feline fetish mafia tried to hide.
travelmanager.html          Demo Web App that interacts with TravelManager.
travelmanagerpolyfill.js    All the UA developers have to do to support background geolocation. How hard can it be?


All feedback welcomed! 
