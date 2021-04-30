const express = require("express");
const app = express();
const path = require("path");
const router = express.Router();
const bodyParser = require("body-parser");
var JSSoup = require("jssoup").default;
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));

router.get("/", (req, res) => {
  res.render('index', {
    distancerun
  });
  console.log("pinged the front page");
});

app.use("/", router);

app.listen(process.env.port || 3000);

console.log("Alive and kicking at Port 3000");

//-------------------------------------------------------

var distancerun = 0;


makeRequest();
setInterval(makeRequest,1000*60*15);

function makeRequest(){
const Http = new XMLHttpRequest();
const Url =
  "https://www.strava.com/clubs/867484/latest-rides/0e46dfddebd0b5c1664abd42e124531173b64534?show_rides=false";
Http.open("GET", Url);
Http.send();
Http.onreadystatechange = (e) => {
  getSoupy(Http.responseText);
};
}

function getSoupy(response) {
  var soup = new JSSoup(response);
  var soupa = soup.findAll("b", "stat-text");
  try {
    soupb = soupa[1].descendants;
    soupc = soupb[0]._text;
    soupd = soupc.replace(/\D/g,'');
    soupe = soupd.slice(0, -1); 
    //here comes last weeks adjuster!
    distancerun = soupe - 1031;
    console.log(soupe);
  } catch (error) {
    console.error(error);
  }
}
