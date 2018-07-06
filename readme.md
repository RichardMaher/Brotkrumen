ReadMe.md
=========

Author: Richard Maher 
        maherrj@gmail.com

Release: 20-Jul-2017 - Initial POC release.
         12-Sep-2017 - Most important design/proposed-specification change is that TravelManager subscription should now be Client specific. The TravelEvent must contain the intended Client.id (TravelEvent.source.id). This means that the UA must monitor and filter GeoLocation updates per client. I have also added new demo functionality such as a Trip Summary that is displayed when you press the "Arrive" button. The trip can also be replayed onto Google Maps by pressing "Map Trip" or "Replay". If the last and next geolocation updates for the trip are both visible in the Map window then smooth Marker movement is achieved via CSS transitions.
         06-Jul-2018 - Copied to GitHub

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

<table>
<tbody>
<tr>
<td>brotkrumen.css</td><td>Style Sheet</td>
</tr>
<tr>
<td>webapp.json</td><td>Manifest</td>
</tr>
<td>echo.js</td><td>ServiceWorker using Message Events to simulate the TravelEvents that need to come from UA.</td>
</tr>
<tr>
<td>gingerbreadhouse.png</td><td>Shortcut/Homescreen icon</td>
</tr>
<tr>
<td>handlemap.js</td><td>The code needed to plot and replay the trip onto Google Maps. (Uses CSS Transitions for a 'smooth' trip)</td>
</tr>
<tr>
<td>hg.png</td><td>Our protagonists</td>
</tr>
<tr>
<td>registerserviceworker.js</td><td>ServiceWorker Registration and TravelManager subscription</td>
</tr>
<tr>
<td>striped-witch-hat.png</td><td>Destination marker icon.</td>
</tr>
<tr>
<td>sw745.html</td><td>Uncensored copy of Issue 745 from https://github.com/w3c/ServiceWorker/issues Look from June 7.</td>
</tr>
<tr>
<td>travelmanager.html</td><td>Demo Web App that interacts with TravelManager.</td>
</tr>
<tr>
<td>travelmanagerpolyfill.js</td><td>All the UA developers have to do to support background geolocation. How hard can it be?</td>
</tr>
<tr>
</tbody>
</table>


All feedback welcomed! 
