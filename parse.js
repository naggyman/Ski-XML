/*
 * Ski Field XML Parser
 * 
 * Parses a XML File with Ski Field Data
 * Utilises the format that Metservice and snow.co.nz uses
 * Built for Tukino Mountain Clubs Association - tukino.org
 * 
 * Built By: Morgan French-Stagg <morgan@french.net.nz> 2017
 * Last Updated: Jun 2018
 * 
 * https://github.com/naggyman/Ski-XML
 */


//basic global variables
var url = "https://www.tukino.org/assets/snow.txt?_=" + (new Date).getTime();
var tick = "<img src='https://tukino.org/assets/snow-report/tick.png' height='15' width='15'></img>";
var cross = "<img src='https://tukino.org/assets/snow-report/cross.png' height='15' width='15'></img>";
var pause = "<img src='https://tukino.org/assets/snow-report/pause.png' height='15' width='15'></img>";
var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/*
 * Run on document load. Requests snow.txt and parses it to parseXML()
 */
function loadXMLDoc() {
    var e = new XMLHttpRequest;
    e.overrideMimeType("text/xml");
    e.onreadystatechange = function() {
        if(this.readyState == 4 && this.status == 200) parseXML(this);
    }; 
    e.open("GET", url, !0);
    e.send();
}

/*
 * Used to parse a SkiField XML Document, and put the appropriate things 
 * in the appropriate places on the DOM.
 * 
 * Also does some logic to add ticks and crosses in certain places.
 * 
 * Parameter - e. The HTTP response from a call to https://tukino.org/assets/snow.txt
 */
function parseXML(e) {
    var skiReport = e.responseXML.getElementsByTagName("report");
    var skiarea = skiReport[0].getElementsByTagName("skiarea");
    var status = skiarea[0].getElementsByTagName("status");
    var weather = skiarea[0].getElementsByTagName("weather");
    var snow = skiarea[0].getElementsByTagName("snow");
    var road = skiarea[0].getElementsByTagName("road");
    var facilities = skiarea[0].getElementsByTagName("facilities");
    var updateTime = getNodeValue(skiReport, "date", "time").replace(" ", "T").substring(0, 16) + ":00+12:00";
    
    document.getElementById("lastUpdated").innerHTML = getTimeStr(new Date(updateTime));

    //Ski Field Status
    var openingdate = getNodeValue(status, "openingdate");
    var openingdateStr = getDayStr(new Date(openingdate));
    console.log(openingdate);
    console.log(openingdateStr);
    var statusLabel = getNodeValue(status, "label") + ((openingdate != "")? openingdateStr : "") + " ";
    
    /*
     * Status code determines the Ski Field Status
     *  3 = Closed
     *  2 = Open
     *  1 = On-Hold
     */
    var fieldStatusCode = getNodeValue(status, "code");
    if("2 " == fieldStatusCode){statusLabel += tick;}
    else if("1 " == fieldStatusCode){statusLabel += pause;}
    else{statusLabel += cross;}
    
    //Put Status in the DOM
    document.getElementById("skiFieldStatus").innerHTML = statusLabel; 
    document.getElementById("skiFieldInformation").innerHTML = getNodeValue(skiarea, "information");
 
    /*
     * Road Status Information
     *  4WD With Chains = Pause
     *  On Hold = Pause
     *  Open (4WD) = Tick
     *  Closed or Shuttle Bus only = Cross
     */
    var roadBrief = getNodeValue(road, "brief");
    if(roadBrief == "Closed " || roadBrief == "Shuttle Bus only "){roadBrief += cross;}
    else if(roadBrief.substring(0, 4) == "Open"){roadBrief += tick;}
    else{roadBrief += pause;}

    document.getElementById("roadStatus").innerHTML = roadBrief;
    document.getElementById("roadInfo").innerHTML = getNodeValue(road, "detail");

    //Snow Status
    document.getElementById("lowerBase").innerHTML = getNodeValue(snow, "base");
    document.getElementById("upperBase").innerHTML = getNodeValue(snow, "upperbase");
    document.getElementById("snowInformation").innerHTML = getNodeValue(snow, "detail");
    document.getElementById("latestFall").innerHTML = getNodeValue(snow, "latestfall");
    document.getElementById("latestFallDate").innerHTML = getDayStr(new Date(getNodeValue(snow, "latestfalldate").substring(0, 10)));
    
    //Weather Information
    document.getElementById("weatherBrief").innerHTML = getNodeValue(weather, "brief");
    document.getElementById("weatherWind").innerHTML = getNodeValue(weather, "wind");
 
    //Temperature Information
    var weatherTemp = getNodeValue(weather, "temperature");
    document.getElementById("weatherTemp").innerHTML = weatherTemp.substring(0, weatherTemp.length - 1);
    document.getElementById("weatherVisibility").innerHTML = getNodeValue(weather, "visibility");
    document.getElementById("weatherDetail").innerHTML = getNodeValue(weather, "detail");

    //Facilities
    document.getElementById("fac").innerHTML = getFacilities(facilities);
}

/*
 * Used to get a string containing the statuses of all 'facilities' in the Ski Field.
 */
function getFacilities(e) {
    var out = ""
    for (var facilitytype = e[0].getElementsByTagName("facilitytype"), a = 0; a < facilitytype.length; a++) {
        for (var facility = facilitytype[a].getElementsByTagName("facility"), i = 0; i < facility.length; i++) {
            var facilityStatus = facility[i].getElementsByTagName("status");
            var facilityLabel = getNodeValue(facilityStatus, "label");
            var facilityCode = getNodeValue(facilityStatus, "code");
            if(facilityCode == "2 "){facilityLabel += tick;}
            else if(facilityCode == "1 "){facilityLabel += pause;}
            else {facilityLabel += cross;}
            out += "<h3>" + facility[i].getElementsByTagName("name")[0].firstChild.nodeValue + ":</h3>" + facilityLabel + "</br>";
        }
    }
    return out;
}

/*
 * Parses the whole document for the value of a tag
 * 
 * Can have multiple tags, which will be returned as one string.
 */
function getNodeValue(parent, tag){
    out = "";
    for(var i = 1; i < arguments.length; i++){
      node = parent[0].getElementsByTagName(arguments[i])[0].firstChild;
      if(node == null) break;
      value = node.nodeValue;
      if(value == null) break;
      out += value + " ";
    }
    return out;
  }

/*
 * Converts a date object into the format:
 *      hour:minute(am|pm), date
 * e.g:
 *      12:20am, Saturday 2 June 2018
 */
function getTimeStr(e) {
    var hours = e.getHours() % 12 || 12;
    var minutes = (e.getMinutes() < 10 ? "0" + e.getMinutes() : e.getMinutes());
    var timeSuffix = e.getHours() >= 12 ? "pm" : "am";
    return hours + ":" + minutes + timeSuffix + ", " + getDayStr(e);
}

/*
 * Converts a date object into the format:
 *      day num month year
 * e.g:
 *      Saturday 2 June 2018
 */
function getDayStr(e) {
    var day = days[e.getDay()];
    var dayNumber = e.getDate();
    var month = months[e.getMonth()];
    var year = e.getFullYear();
    return day + " " + dayNumber + " " + month + " " + year;
}
