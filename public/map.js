var script_tag = document.getElementById('page')
var drun = script_tag.getAttribute("data-drun");
var dtot = script_tag.getAttribute("data-dtot");
distancerunperc = drun/dtot;
if(distancerunperc > 1){distancerunperc = 1}

var key = 'Get your own API key at https://www.maptiler.com/cloud/';
var attributions =
'<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> ' +
'<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>';

var source = new ol.source.TileJSON({
  url: 'https://api.maptiler.com/maps/voyager/tiles.json?key=GVCf6RELAt4XEHWQyAxE',
  tileSize: 512,
  crossOrigin: 'anonymous'
});

var center = ol.proj.fromLonLat([15.5,16.75]);
var map = new ol.Map({
target: document.getElementById('map'),
view: new ol.View({
center: center,
zoom: 2.9,
minZoom: 2,
maxZoom: 19,
}),
layers: [
new ol.layer.Tile({
    //source: new ol.source.OSM()}) ],
    source:source})],
});

// The polyline string is read from a JSON similiar to those returned
// by directions APIs such as Openrouteservice and Mapbox.
fetch('./coordinates.json').then(function (response) {
response.json().then(function (result) {
var polyline = result.features[0].geometry.coordinates;
/*
var route = new ol.format.Polyline({
factor: 1e6,
}).readGeometry(polyline, {
dataProjection: 'EPSG:4326',
featureProjection: 'EPSG:3857',
});
*/
var route = new ol.geom.LineString(polyline);
// Coordinates need to be in the view's projection, which is
// 'EPSG:3857' if nothing else is configured for your ol.View instance
route.transform('EPSG:4326', 'EPSG:3857');

var routeFeature = new ol.Feature({
type: 'route',
geometry: route,
});
var geoMarker = new ol.Feature({
type: 'geoMarker',
geometry: new ol.geom.Point(route.getCoordinateAt(0)),
});
var startMarker = new ol.Feature({
type: 'icon',
geometry: new ol.geom.Point(route.getCoordinateAt(0)),
});
var endMarker = new ol.Feature({
type: 'icon',
geometry: new ol.geom.Point(route.getCoordinateAt(1)),
});

var styles = {
'route': new ol.style.Style({
stroke: new ol.style.Stroke({
  width: 6,
  color: [237, 212, 0, 0.8],
}),
}),
'icon': new ol.style.Style({
image: new ol.style.Icon({
  anchor: [0.5, 1],
  src: 'data/icon.png',
}),
}),
'geoMarker': new ol.style.Style({
image: new ol.style.Circle({
  radius: 7,
  fill: new ol.style.Fill({color: 'black'}),
  stroke: new ol.style.Stroke({
    color: 'white',
    width: 2,
  }),
}),
}),
};

var animating = false;

var vectorLayer = new ol.layer.Vector({
source: new ol.source.Vector({
 
features: [routeFeature, geoMarker, startMarker, endMarker],
}),
style: function (feature) {
// hide geoMarker if animation is active
if (animating && feature.get('type') === 'geoMarker') {
  return null;
}
return styles[feature.get('type')];
},
});

map.addLayer(vectorLayer);

var speed, startTime;
var speedInput = document.getElementById('speed');
var startButton = document.getElementById('start-animation');

setTimeout(()=>{startAnimation();
},1000);

function moveFeature(event) {
var vectorContext = ol.render.getVectorContext(event);
var frameState = event.frameState;

if (animating) {
var elapsedTime = frameState.time - startTime;
var distance = (speed * elapsedTime) / 1e6;

if (distance >= distancerunperc) {
  stopAnimation(true);
  return;
}

var currentPoint = new ol.geom.Point(route.getCoordinateAt(distance));
var feature = new ol.Feature(currentPoint);
vectorContext.drawFeature(feature, styles.geoMarker);
}
// tell OpenLayers to continue the postrender animation
map.render();
}

function startAnimation() {
if (animating) {
stopAnimation(false);
} else {
animating = true;
startTime = new Date().getTime();
speed = 75;
startButton.textContent = 'Cancel Journey';
// hide geoMarker
geoMarker.changed();
// just in case you pan somewhere else
//map.getView().setCenter(center);
vectorLayer.on('postrender', moveFeature);
map.render();
}
}

function stopAnimation(ended) {
animating = false;
startButton.textContent = 'Restart Journey';

// if animation cancelled set the marker at the beginning
var coord = route.getCoordinateAt(ended ? distancerunperc : 0);
geoMarker.getGeometry().setCoordinates(coord);
// remove listener
vectorLayer.un('postrender', moveFeature);
}

startButton.addEventListener('click', startAnimation, false);
});
});