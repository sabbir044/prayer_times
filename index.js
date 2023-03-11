const { ipcRenderer } = require('electron')


ipcRenderer.on('prayer-times', (event, arg) => {
    console.log(arg);
    jsonObj = arg;
    startTime();
});

/*************************************/
//cec initialization
var CecController = require('cec-controller');
var cecCtl = new CecController();
var cecController = null

cecCtl.on('ready', (controller) => {
    console.log(controller);
    cecController = controller
});
cecCtl.on('error', console.error);
/***************************************/




const { spawnSync } = require('child_process');

var weekDaysNL = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];
var monthsNL = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
const decoder = new TextDecoder("utf-8");

var WAITING_TIME = 10;

//constants
const AFTER_PRAYER_DISPLAY_ON_TIME = 20; //make it 20 minutes
const BEFORE_PRAYER_DISPLAY_ON_TIME = 30;
const JUMA_PRAYER_DISPLAY_ON_TIME = -1;
const PRAYER_TIME = 15;

var testDate = new Date("2023-03-11T20:19:50");
var baseDate = new Date()


var jsonObj = null;
var lastMonitorOffTime = new Date();
lastMonitorOffTime.setDate(lastMonitorOffTime.getDate() - 1);
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
    var diffMins = diffMS / 60000;

    if (diffMins < 0.1) {
        return;
    }
    //xset dpms force on
    setTimeout(function() {
        console.log("switching diplay on: " + currentTime);
        if (cecController != null) {
            cecController.dev0.turnOn()
        }
        $("#black_cover").css("display", "none");
        /*
        const child = spawnSync('xset', ['dpms', 'force', 'on']);
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
        */
    }, 0);

    lastMonitorOnTime = new Date();
}

function switchDisplayOff() {
    var currentTime = new Date();
    var diffMS = currentTime - lastMonitorOffTime;
    var diffMins = diffMS / 60000;

    if (diffMins < 1) {
        return;
    }
    //xset dpms force off
    setTimeout(function() {
        console.log("switching diplay off: " + currentTime);
        if (cecController != null) {
            cecController.dev0.turnOff()
        }
        $("#black_cover").css("display", "block");
        /*
        const child = spawnSync('xset', ['dpms', 'force', 'off']);
        console.log('error', decoder.decode(child.error));
        console.log('stdout ', decoder.decode(child.stdout));
        console.log('stderr ', decoder.decode(child.stderr));*/
    }, 1000);

    lastMonitorOffTime = new Date();
}

function startTime() {
    var now = new Date();
    /**** test code  ***/
    // sinceBase  = now.valueOf() - baseDate.valueOf()
    // testWithSince  = testDate.valueOf() + sinceBase
    // now = new Date(testWithSince);
    /*** test code finish ***/

    renderPrayerTimes(now);
    renderCurrentTime(now);
    var t = setTimeout(startTime, 500);
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
    var prayerNames = ["Fadjr", "", "Dohr", "Asr", "Maghreb", "Isha", "Jumu'ah"];
    var prayerNamesAr = ["الفجر", "", "الظُهر", "العصر", "المغرب", "العِشاء", "الجمع"];
    var prayerTimes = jsonObj.times[t.mm][t.dd];
    var tx = {}
    var times = [];
    var names = [];
    var namesAr = [];
    var weekDayOfToday = weekDaysNL[t.date.getDay()]
    for (var i = 1; i < 7; i++) {
        if (i == 2) continue;
        times.push(prayerTimes["p" + i].t);
        if (i == 3 && weekDayOfToday == "Vrijdag") {
            names.push(prayerNames[6]);
            namesAr.push(prayerNamesAr[6]);
        } else {
            names.push(prayerNames[i - 1]);
            namesAr.push(prayerNamesAr[i - 1]);
        }
    }
    tx.times = times
    tx.names = names
    tx.namesAr = namesAr
    return tx
}

function renderTimeAndDate(t) {
    $("#time").html(t.h + ":" + t.m)
    $("#date_nl_box").html(weekDaysNL[t.date.getDay()] + " " + t.dd + " " + monthsNL[t.date.getMonth()] + " " + t.YY)
}

function renderSlalatTimeDisplay(timeFromPrev, namePrev, timeToIqamaPercent, timeToIqamaWithSec, isPrevJuma) {
    var timeSinceAzaan = Math.abs(timeFromPrev);
    //$("#time_rem").html(namePrev + "<br/>-00:00");
    if (timeSinceAzaan < WAITING_TIME && !isPrevJuma) {
        $("#time_rem").css("display", "none");
        $("#before_iqama").css("display","flex");
        $("#time_rem_iqama").html("-"+timeToIqamaWithSec);
        updateProgressBar(timeToIqamaPercent, timeToIqamaWithSec);
        /*
        $("#time_rem_prayer_name").html("Iqama")
        $("#time_rem_time").html("-" + timeFromPrevWithSec)
        $("#time_rem_prayer_name_ar").html("إقامة")*/
    } else {
        $("#cover").css("display", "block");
    }
    //set 100 to make sure display off works in juma time
    saveEnergy(timeFromPrev, 100, isPrevJuma);
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
    var nameNextAr = prayerTimes.namesAr[0];
    $("#time_rem").css("background-color", "#f2e8e2");
    $("#time_rem_prayer_name").html(nameNext)
    $("#time_rem_time").html("-" + checkTime(hourToNext) + ":" + checkTime(minuteToNext))
    $("#time_rem_prayer_name_ar").html(nameNextAr)
    saveEnergy(timeFromPrev, timeToNext, 0);
}

function renderCurrentTime(date) {
    var t = getFormattedTimes(date);
    renderTimeAndDate(t);

    //countdown
    var prayerTimes = getPrayerNamesAndTime(jsonObj, t);
    var idx = -1;
    var current = t.h + ":" + t.m;
    const currentTime = t;
    for (var i = 0; i < 5; i++) {
        if (current < prayerTimes.times[i]) {
            break;
        }
        idx = i;
    }
    var prevIdx = (idx + 5) % 5;
    var nextIdx = idx + 1;
    var timePrev = prayerTimes.times[prevIdx];
    var namePrev = prayerTimes.names[prevIdx];
    //$("#cover").css("display", "none");
    var timeFromPrev = timeDiffInMinute(timePrev, current);
    if (prevIdx == 3) {
        WAITING_TIME = 7;
    } else {
        WAITING_TIME = 10;
    }
    if (Math.abs(timeFromPrev) < (PRAYER_TIME + WAITING_TIME)) {
        var timeToIqamaWithSec = getTimeToIqamaWithSec(timePrev, date)
        var timeToIqamaPercent = getTimeToIqamaPercent(timePrev, date)
        renderSlalatTimeDisplay(timeFromPrev, namePrev, timeToIqamaPercent, timeToIqamaWithSec, namePrev === "Jumu'ah");
    } else if (nextIdx == 5) {
        $("#time_rem").css("display", "flex");
        renderTomorrowFadjrTime(jsonObj, t, current, prayerTimes, timeFromPrev);
    } else {
        $("#time_rem").css("display", "flex");
        $("#time_rem").css("background-color", "#f2e8e2");
        var timeNext = prayerTimes.times[nextIdx];
        var nameNext = prayerTimes.names[nextIdx];
        var nameNextAr = prayerTimes.namesAr[nextIdx];
        var timeToNext = timeDiffInMinute(current, timeNext)
        var hourToNext = Math.floor(timeToNext / 60);
        var minuteToNext = timeToNext % 60;
        $("#time_rem_prayer_name").html(nameNext)
        $("#time_rem_time").html("-" + checkTime(hourToNext) + ":" + checkTime(minuteToNext))
        $("#time_rem_prayer_name_ar").html(nameNextAr)
        saveEnergy(timeFromPrev, timeToNext, namePrev === "Jumu'ah");
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

function getTimeToIqamaWithSec(prayerTime, t1) {
    hhmm = prayerTime.split(":")

    var t2 = new Date();
    t2.setMonth(t1.getMonth());
    t2.setDate(t1.getDate());
    t2.setHours(parseInt(hhmm[0]), parseInt(hhmm[1]) + WAITING_TIME, 0);

    delta = Math.floor(Math.abs(t2 - t1) / 1000);
    // calculate (and subtract) whole days
    var days = Math.floor(delta / 86400);
    delta -= days * 86400;

    // calculate (and subtract) whole hours
    var hours = Math.floor(delta / 3600) % 24;
    delta -= hours * 3600;

    // calculate (and subtract) whole minutes
    var minutes = Math.floor(delta / 60) % 60;
    delta -= minutes * 60;

    // what's left is seconds
    var seconds = delta % 60;

    minutes = checkTime(minutes)
    seconds = checkTime(seconds)
    return `${minutes}:${seconds}`
}

function getTimeToIqamaPercent(prayerTime, t1) {
    hhmm = prayerTime.split(":")

    var t2 = new Date();
    t2.setMonth(t1.getMonth());
    t2.setDate(t1.getDate());
    t2.setHours(parseInt(hhmm[0]), parseInt(hhmm[1]) + WAITING_TIME, 0);

    delta = Math.abs(t2 - t1) ;
    waitingTimeMs = WAITING_TIME * 60 * 1000 ;
    if (delta > waitingTimeMs) {
        return 100
    } 
    return delta * 100 / waitingTimeMs;
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

function updateProgressBar(progress, timeToIqamaWithSec) {
    $("#progress").css("width",progress+"%");
    mmss = timeToIqamaWithSec.split(":")
    if (mmss[0] == "00") {
        $("#progress").css("background-color","orange")
    } else {
        $("#progress").css("background-color","#4CAF50")
    }
  }

//switch display on key press
window.addEventListener("keydown", function (event) {
    switchDisplayOn();
}, true);