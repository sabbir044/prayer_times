/*const { ipcRenderer } = require('electron')


ipcRenderer.on('prayer-times', (event, arg) => {
  console.log(arg);
  jsonObj = arg;
});
*/
const { spawnSync} = require('child_process');

var weekDaysNL = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];
var monthsNL = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
const decoder = new TextDecoder("utf-8");

//constants
const WAITING_TIME = 7;
const AFTER_PRAYER_DISPLAY_ON_TIME = 8;
const BEFORE_PRAYER_DISPLAY_ON_TIME = 30;
const JUMA_PRAYER_DISPLAY_ON_TIME = 10;
const PRAYER_TIME = 15;


var jsonObj = null;
var lastMonitorOffTime = new Date();
var lastMonitorOnTime = new Date();

function saveEnergy(minuteFromPrev, minuteToNext, isPrevJuma) {
    minuteFromPrev = Math.abs(minuteFromPrev)
    minuteToNext = Math.abs(minuteToNext)
    prayerONTime = WAITING_TIME + PRAYER_TIME + AFTER_PRAYER_DISPLAY_ON_TIME
    if (isPrevJuma && minuteFromPrev > JUMA_PRAYER_DISPLAY_ON_TIME && minuteToNext > BEFORE_PRAYER_DISPLAY_ON_TIME) {
        switchDisplayOff();
    } else if (minuteFromPrev > prayerONTime && minuteToNext > BEFORE_PRAYER_DISPLAY_ON_TIME) {
        switchDisplayOff();
    } else {
        switchDisplayOn();
    }
}

function switchDisplayOn() {
    var currentTime = new Date();
    var diffMS = currentTime - lastMonitorOnTime;
    var diffMins = diffMS/60000;

    if (diffMins < 1) {
        return;
    }
    //xset dpms force on
    setTimeout(function() {
        console.log("switching diplay on: "+currentTime);
        const child = spawnSync('xset', ['dpms', 'force','on']);
        console.log('error', decoder.decode(child.error));
        console.log('stdout ', decoder.decode(child.stdout));
        console.log('stderr ', decoder.decode(child.stderr));

        const child2 = spawnSync('xset', ['s', 'noblank']);
        console.log('error', decoder.decode(child2.error));
        console.log('stdout ', decoder.decode(child2.stdout));
        console.log('stderr ', decoder.decode(child2.stderr));

        const child3 = spawnSync('xset', ['s', 'off']);
        console.log('error', decoder.decode(child3.error));
        console.log('stdout ', decoder.decode(child3.stdout));
        console.log('stderr ', decoder.decode(child3.stderr));

        const child4 = spawnSync('xset', ['dpms']);
        console.log('error', decoder.decode(child4.error));
        console.log('stdout ', decoder.decode(child4.stdout));
        console.log('stderr ', decoder.decode(child4.stderr));
    }, 0);

    lastMonitorOnTime = new Date();
}

function switchDisplayOff() {
    var currentTime = new Date();
    var diffMS = currentTime - lastMonitorOffTime;
    var diffMins = diffMS/60000;

    if (diffMins < 5) {
        return;
    }
    //xset dpms force off
    setTimeout(function() {
        console.log("switching diplay off: "+currentTime);
        const child = spawnSync('xset', ['dpms', 'force','off']);
        console.log('error', decoder.decode(child.error));
        console.log('stdout ', decoder.decode(child.stdout));
        console.log('stderr ', decoder.decode(child.stderr));
    }, 1000);

    lastMonitorOffTime = new Date();
}

function startTime() {
    var now = new Date();
    //now = new Date("2020-07-25T22:20:00");
    renderPrayerTimes(now);
    renderCurrentTime(now);
    var t = setTimeout(startTime, 500);
}

function startJS() {
    loadFile();
}

function loadFile() {
    var fs = require('fs');
    fs.readFile('prayer_times.json', 'utf8', function(err, data) {
        jsonObj = JSON.parse(data);
        console.log(jsonObj);
        if (jsonObj != null)
            startTime();
    });
    /*
    $.getJSON('prayer_times.json', function(data) {
        jsonObj = data;
        console.log(jsonObj);
        if (jsonObj != null)
            startTime();
    });
    */

}

function getFormattedTimes(today) {
    var t = {}
    h = today.getHours();
    m = today.getMinutes();
    s = today.getSeconds();
    t.h = checkTime(h);
    t.m = checkTime(m);
    t.s = checkTime(s);
    t.YY = today.getFullYear();
    t.mm = today.getMonth() + 1;
    t.dd = today.getDate();
    t.MM = checkTime(t.mm);
    t.DD = checkTime(t.dd);
    t.date = today
    return t;
}


function getPrayerNamesAndTime(jsonObj, t) {
    var prayerNames = ["Fadjr","","Dohr","Asr","Maghreb","Isha","Jumu'ah"];
    var prayerTimes = jsonObj.times[t.mm][t.dd];
    var tx = {}
    var times = [];
    var names = [];
    var weekDayOfToday = weekDaysNL[t.date.getDay()]
    for (var i = 1; i < 7; i++) {
        if (i == 2) continue;
        times.push(prayerTimes["p" + i].t);
        if (i==3 && weekDayOfToday == "Vrijdag") {
            names.push(prayerNames[6]);
        }
        else {
            names.push(prayerNames[i-1]);
        }
    }
    tx.times = times
    tx.names = names
    return tx
}

function renderTimeAndDate(t) {
    $("#time").html(t.h + ":" + t.m)
    $("#date_nl_box").html(weekDaysNL[t.date.getDay()] + " " + t.dd + " " + monthsNL[t.date.getMonth()] + " " + t.YY)
}

function renderSlalatTimeDisplay(timeFromPrev, namePrev, current) {
    var salatTime = Math.abs(timeFromPrev);
    $("#time_rem").html(namePrev + "<br/>-00:00");
    var timeToPray = WAITING_TIME - salatTime;
    if (salatTime < WAITING_TIME) {
        $("#time_rem").css("background-color", "#bbd8fe");
        $("#prayertime_remtime_countdown").html(timeToPray+" "+(timeToPray>1?"minuten":"minuut"))
        $("#prayertime_rem").css("visibility", "visible")
    } else {
        $("#cover").css("display", "block");
        $("#cover_time").html(current + "");
    }
    saveEnergy(timeFromPrev, 100, 0);
}

function renderTomorrowFadjrTime(jsonObj, t, current, prayerTimes, timeFromPrev) {
    //tomorrow Fadjr
    var tomorrow = addDays(t.date, 1)
    var tmm = tomorrow.getMonth() + 1;
    var tdd = tomorrow.getDate();
    var prayerTime = jsonObj.times[tmm][tdd].p1.t;
    var timeToNext = timeDiffInMinute(current, prayerTime)
    if (timeToNext < 0) {
        timeToNext = 24 * 60 + timeToNext;
    }
    var hourToNext = Math.floor(timeToNext / 60);
    var minuteToNext = timeToNext % 60;
    var nameNext = prayerTimes.names[0];
    $("#time_rem").html(nameNext + "<br/>-" + checkTime(hourToNext) + ":" + checkTime(minuteToNext));
    saveEnergy(timeFromPrev, timeToNext, 0);
}

function renderCurrentTime(date) {
    var t = getFormattedTimes(date);
    renderTimeAndDate(t);

    //countdown
    var prayerTimes = getPrayerNamesAndTime(jsonObj, t);
    var idx = -1;
    var current = t.h + ":" + t.m;
    const currentTime = t
    //current = "21:10";
    for (var i = 0; i < 5; i++) {
        if (current < prayerTimes.times[i]) {
            break;
        }
        idx = i;
    }
    var prevIdx = (idx+5)%5;
    var nextIdx = idx + 1;
    var timePrev = prayerTimes.times[prevIdx];
    var namePrev = prayerTimes.names[prevIdx];
    $("#cover").css("display", "none");
    $("#time_rem").css("background-color", "#fffec2");
    var timeFromPrev = timeDiffInMinute(timePrev, current);
    $("#prayertime_rem").css("visibility", "hidden");
    if (Math.abs(timeFromPrev) < (PRAYER_TIME + WAITING_TIME)) {
        renderSlalatTimeDisplay(timeFromPrev, namePrev, current);
    } else if (nextIdx == 5) {
        renderTomorrowFadjrTime(jsonObj, t, current, prayerTimes, timeFromPrev);
    } else {
        var timeNext = prayerTimes.times[nextIdx];
        var nameNext = prayerTimes.names[nextIdx];
        var timeToNext = timeDiffInMinute(current, timeNext)
        var hourToNext = Math.floor(timeToNext / 60);
        var minuteToNext = timeToNext % 60;
        $("#time_rem").html(nameNext + "<br/>-" + checkTime(hourToNext) + ":" + checkTime(minuteToNext));
        saveEnergy(timeFromPrev, timeToNext, namePrev == prayerTimes.names[6]);
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

function renderPrayerTimes(date) {
    if (jsonObj == null)
        return;
    var today = date;
    var mm = today.getMonth() + 1;
    var dd = today.getDate();
    prayerTimes = jsonObj.times[mm][dd];
    //Fadjr
    $("#fadjr_time").html(prayerTimes.p1.t)
    weekDayOfToday = weekDaysNL[today.getDay()]
    if (weekDayOfToday == "Vrijdag") {
        $("#dohr_en").html("Jumu'ah")
        $("#dohr_ar").html("الجمع")
    } else {
        $("#dohr_en").html("Dohr")
        $("#dohr_ar").html("الظُهر")
    }
    $("#dohr_time").html(prayerTimes.p3.t)
    $("#asr_time").html(prayerTimes.p4.t)
    $("#maghreb_time").html(prayerTimes.p5.t)
    $("#isha_time").html(prayerTimes.p6.t)
}

function checkTime(i) {
    if (i < 10) { i = "0" + i }; // add zero in front of numbers < 10
    return i;
}