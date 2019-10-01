const { ipcRenderer } = require('electron')

var jsonObj = null;

ipcRenderer.on('prayer-times', (event, arg) => {
  console.log(arg);
  jsonObj = arg;
})

function startTime() {
  //renderPrayerTimes();
  renderCurrentTime();
  var t = setTimeout(startTime, 500);
}

function renderCurrentTime() {
  var today = new Date();
  var h = today.getHours();
  var m = today.getMinutes();
  var s = today.getSeconds();
  h = checkTime(h);
  m = checkTime(m);
  s = checkTime(s);
  var YY = today.getFullYear();
  var mm = today.getMonth() + 1;
  var dd = today.getDate();
  var MM = checkTime(mm);
  var DD = checkTime(dd);
  //document.getElementById("right").innerHTML = "<p><h1>" + DD + "-" + MM + "-" + YY + "</h1></p>" + "<p>" + h + ":" + m + ":" + s + "</p>";
}

function renderPrayerTimes() {
  if (jsonObj == null)
    return;
  var today = new Date();
  var mm = today.getMonth() + 1;
  var dd = today.getDate();
  prayerNames = jsonObj.prayer_names;
  prayerTimes = jsonObj.times[mm][dd];
  for (var i = 1; i < 7; i++) {
    var key = "p" + i;
    document.getElementById(key).innerHTML = "<table><tr class='prayer_box'><th><table><tr><th>" + prayerNames[key].EN + "</th></tr><tr><th>" + prayerNames[key].AR + "</th></tr></table></th><th>" + prayerTimes[key].t + "</th></tr></table>";
  }
}
function checkTime(i) {
  if (i < 10) { i = "0" + i };  // add zero in front of numbers < 10
  return i;
}