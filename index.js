/*const { ipcRenderer } = require('electron')


ipcRenderer.on('prayer-times', (event, arg) => {
  console.log(arg);
  jsonObj = arg;
});
*/
var weekDaysNL = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];
var monthsNL = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];

var jsonObj = null;

function startTime() {
    renderPrayerTimes();
    renderCurrentTime();
    var t = setTimeout(startTime, 500);
}

function startJS() {
    loadFile();
}

function loadFile() {
    $.getJSON('prayer_times.json', function(data) {
        jsonObj = data;
        console.log(jsonObj);
        if (jsonObj != null)
            startTime();
    });


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
    $("#time").html(h + ":" + m)
    $("#date_nl_box").html(weekDaysNL[today.getDay()] + " " + dd + " " + monthsNL[today.getMonth()] + " " + YY)

    //countdown
    prayerNames = jsonObj.prayer_names;
    prayerTimes = jsonObj.times[mm][dd];
    times = [];
    names = [];
    for (var i = 1; i < 7; i++) {
        if (i == 2) continue;
        times.push(prayerTimes["p" + i].t);
        names.push(prayerNames["p" + i]);
    }
    var idx = -1;
    current = h + ":" + m;
    //current = "21:10";
    for (var i = 0; i < 5; i++) {
        if (current < times[i]) {
            break;
        }
        idx = i;
    }
    prevIdx = idx;
    nextIdx = idx + 1;
    timePrev = times[prevIdx];
    namePrev = names[prevIdx];
    $("#cover").css("display", "none");
    $("#time_rem").css("background-color", "#fffec2");
    timeFromPrev = timeDiffInMinute(timePrev, current);
    if (Math.abs(timeFromPrev) < 30) {
        salatTime = Math.abs(timeFromPrev);
        $("#time_rem").html(namePrev.EN + "<br/>-0:00");
        if (salatTime < 10) {
            $("#time_rem").css("background-color", "#bbd8fe");
        } else {
            $("#cover").css("display", "block");
            $("#cover_time").html(current + "");
        }
        timeFromPrev = Math.abs(timeFromPrev);
    } else if (nextIdx == 5) {
        //tomorrow Fadjr
        tomorrow = addDays(today, 1)
        tmm = tomorrow.getMonth() + 1;
        tdd = tomorrow.getDate();
        prayerTime = jsonObj.times[tmm][tdd].p1.t;
        timeToNext = timeDiffInMinute(current, prayerTime)
        if (timeToNext < 0) {
            timeToNext = 24 * 60 + timeToNext;
        }
        hourToNext = Math.floor(timeToNext / 60);
        minuteToNext = timeToNext % 60;
        nameNext = names[0];
        $("#time_rem").html(nameNext.EN + "<br/>-" + hourToNext + ":" + minuteToNext);
    } else {
        timeNext = times[nextIdx];
        nameNext = names[nextIdx];
        timeToNext = timeDiffInMinute(current, timeNext)
        hourToNext = Math.floor(timeToNext / 60);
        minuteToNext = timeToNext % 60;
        $("#time_rem").html(nameNext.EN + "<br/>-" + hourToNext + ":" + minuteToNext)

    }
}

function addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function timeDiffInMinute(from, to) {
    var t1 = new Date("2019-01-01T" + from + ":00");
    var t2 = new Date("2019-01-01T" + to + ":00");
    diffMs = t2 - t1;
    var diffMins = Math.round(diffMs / 60000); // minutes
    return diffMins;
}

function renderPrayerTimes() {
    if (jsonObj == null)
        return;
    var today = new Date();
    var mm = today.getMonth() + 1;
    var dd = today.getDate();
    prayerNames = jsonObj.prayer_names;
    prayerTimes = jsonObj.times[mm][dd];
    //Fadjr
    $("#fadjr").html(prayerNames.p1.AR + "<br/>" + prayerNames.p1.EN + "<br/>" + prayerTimes.p1.t)
        //Dohr
    $("#dohr").html(prayerNames.p3.AR + "<br/>" + prayerNames.p3.EN + "<br/>" + prayerTimes.p3.t)
    $("#asr").html(prayerNames.p4.AR + "<br/>" + prayerNames.p4.EN + "<br/>" + prayerTimes.p4.t)
    $("#magrib").html(prayerNames.p5.AR + "<br/>" + prayerNames.p5.EN + "<br/>" + prayerTimes.p5.t)
    $("#isha").html(prayerNames.p6.AR + "<br/>" + prayerNames.p6.EN + "<br/>" + prayerTimes.p6.t)
}

function checkTime(i) {
    if (i < 10) { i = "0" + i }; // add zero in front of numbers < 10
    return i;
}