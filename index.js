//this section runs the server and handles routing
const express = require("express");
const app = express();
const path = require("path");
const router = express.Router();
const bodyParser = require("body-parser");
var JSSoup = require("jssoup").default;
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var geojsonLength = require('geojson-length');
const fs = require('fs');
const { time } = require("console");

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));

router.get("/", (req, res) => {
  res.render('index', {
    distancerun,
    distancetotal
  });
  console.log("pinged the front page");
});

app.use("/", router);

app.listen(process.env.port || 3000);

console.log("Alive and kicking at Port 3000");

//-------------------------------------------------------

//distancetotal is irrelevant here as it gets replaced!
var distancetotal=1;
//distancerun is the sum of the strava group and will be replaced by the actual value
var distancerun = 1;
//these two make up for the face that the strava group total resets each week.
//if the server needs to be rebooted mid way through the chllenge then these can help reset the distances
var lasttotaldistance = 1;
var laststravadist = 1000;

//initialise these at the beginning then set a timer to grab the data every 30min
readCoordinates();
getDistance();
//UNCOMMENT THE BELOW WHEN WE START  <<<<<<<<<<<<<<---------------------------------------------------------------------------
//setInterval(getDistance,1000*60*30);

//read the geojson coordinate file and load up the total distance as distancetotal
function readCoordinates(){
  var data = fs.readFileSync(path.join(__dirname, "public/coordinates.json"),'utf8')
  coordinates = JSON.parse(data);
  distancetotal = geojsonLength(coordinates.features[0].geometry)/1000;
  console.log(distancetotal + ' total route length');
}

//this returns the strava widget HTML to be parsed later
function getDistance(){
const Http = new XMLHttpRequest();
const Url =
  "https://www.strava.com/clubs/1040721/latest-rides/704c47a76ba86a03cf0c64c8f41965f3a118c31c?show_rides=false";
Http.open("GET", Url);
Http.send();
Http.onreadystatechange = (e) => {
  if(Http.readyState == 3) {getSoupy(Http.responseText);}
};
}
//this section reads the widget HTML
function getSoupy(response) {
  var soup = new JSSoup(response);
  var soupa = soup.findAll("b", "stat-text");
  try {

    soupb = soupa[1].descendants;
    soupc = soupb[0]._text;
    soupd = soupc.replace(/\D/g,'');
    soupe = soupd.slice(0, -1); 
stravadist = Number(soupe);

//check if the group has reset for the week and if it has add last weeks total as the adjuster
    if(stravadist<laststravadist){adjuster = lasttotaldistance}
    distancerun = stravadist + adjuster;

//remember these for when the week resets
    laststravadist = stravadist;
    lasttotaldistance = distancerun;

    console.log('Strava group weekly distance: ' + soupe);
    console.log('Total distance: ' + distancerun);
  } catch (error) {
    console.error(error);
    
  }
 
}
 