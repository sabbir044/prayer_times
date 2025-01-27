const { ipcRenderer } = require('electron')


var prayerTimeData = null;

ipcRenderer.on('prayer-times', (event, arg) => {
    prayerTimeData = arg;
    playSoundFourBeep();
    playSoundNoBeep();
    playSoundTwoBeep();
    renderUI();
});
class ScreenState {
    static SCREEN_OFF_BLACK = new ScreenState("OFF_BLACK");
    static SCREEN_ON_BEFORE_AZAAN = new ScreenState("ON_BEFORE_AZAAN");
    static SCREEN_ON_BEFORE_IQAMA = new ScreenState("ON_BEFORE_IQAMA");
    static SCREEN_ON_SALAT = new ScreenState("ON_SALAT");
    static SCREEN_ON_AFTER_SALAT = new ScreenState("ON_AFTER_SALAT");
    constructor(name) {
        this.name = name;
    }
}

class TimeInformation {
    h;
    m;
    s;
    YY;
    mm;
    dd;
    MM;
    DD;
    date;
    constructor(date) {
        let h = date.getHours();
        let m = date.getMinutes();
        let s = date.getSeconds();
        this.h = checkTime(h);
        this.m = checkTime(m);
        this.s = checkTime(s);
        this.YY = date.getFullYear();
        this.mm = date.getMonth() + 1;
        this.dd = date.getDate();
        this.MM = checkTime(this.mm);
        this.DD = checkTime(this.dd);
        this.date = date;
    }
}

class PrayerInformation {
    prevIdx;
    namePrev;
    timePrev;
    minuteFromPrev;
    nextIdx;
    nameNext;
    nameNextAr;
    minuteToNext;
    secondsToNext;

    constructor(prevIdx, namePrev, timePrev, minuteFromPrev,nextIdx, nameNext, nameNextAr, minuteToNext) {
        this.prevIdx = prevIdx;
        this.namePrev = namePrev;
        this.timePrev = timePrev;
        this.minuteFromPrev = minuteFromPrev;
        this.nextIdx = nextIdx;
        this.nameNext = nameNext;
        this.nameNextAr = nameNextAr;
        this.minuteToNext = minuteToNext;
    }
}

class DisplayInformation {
    screenState; // ScreenState
    timeInformation; // TimeInformation
    prayerInformation; // PrayerInformation
    constructor(screenState, timeInformation, prayerInformation) {
        this.screenState = screenState;
        this.timeInformation = timeInformation;
        this.prayerInformation = prayerInformation;
    }
}

var weekDaysNL = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];
var monthsNL = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];

var WAITING_TIME = 10;

//constants
const AFTER_PRAYER_DISPLAY_ON_TIME = 20; //make it 20 minutes
const BEFORE_PRAYER_DISPLAY_ON_TIME = 30;
const JUMA_PRAYER_DISPLAY_ON_TIME = -1;
const PRAYER_TIME = 15;

var isDev = process.env.APP_DEV ? (process.env.APP_DEV.trim() == "true") : false
var testDate = new Date("2025-01-25T06:43:50");
var baseDate = new Date();
var currentScreenState = ScreenState.SCREEN_OFF_BLACK;

basePath = isDev ? __dirname + '/resources/audio' : process.resourcesPath + '/audio'
var soundFourBeep = new Audio(basePath + '/four_beep.mp3');
var soundTwoBeep = new Audio(basePath + '/two_beep.mp3');
var soundNoBeep = new Audio(basePath + '/no_beep.mp3');

var lastMonitorOffTime = new Date();
lastMonitorOffTime.setDate(lastMonitorOffTime.getDate() - 1);
var lastKeyPressedTime = new Date(lastMonitorOffTime.getTime())

function renderUI() {
    var beginTime = new Date()
    var now = new Date();
    /**** test code  ***/
    if (isDev) {
        sinceBase  = now.valueOf() - baseDate.valueOf()
        testWithSince  = testDate.valueOf() + sinceBase
        now = new Date(testWithSince);
    }
    /*** test code finish ***/

    //
    let timeInformation = new TimeInformation(now);
    let displayInformation = calculateWhatToShow(timeInformation);
    prevScreenState = currentScreenState
    currentScreenState = displayInformation.screenState

    
    showUIState(displayInformation, prevScreenState)

    setTimeout(renderUI, 100);
}

function showUIState(newDisplayInformation, prevScreenState) {
    var timeToIqamaWithSec;
    switch (newDisplayInformation.screenState) {
        case ScreenState.SCREEN_OFF_BLACK:
            $("#black_cover").css("display", "block");
            break;
        case ScreenState.SCREEN_ON_BEFORE_AZAAN:
            if (prevScreenState != ScreenState.SCREEN_ON_BEFORE_AZAAN) {
                renderPrayerTimes(newDisplayInformation.timeInformation);
                $("#black_cover").css("display", "none");
                $("#cover").css("display", "none");
                $("#before_iqama").css("display", "none")
                $("#time_rem").css("display", "flex");
            }
            renderTimeRemainingPrayerName(newDisplayInformation)
            break;
        case ScreenState.SCREEN_ON_BEFORE_IQAMA:
            if (prevScreenState != ScreenState.SCREEN_ON_BEFORE_IQAMA) {
                renderPrayerTimes(newDisplayInformation.timeInformation);
                playSoundTwoBeep();
                $("#black_cover").css("display", "none");
                $("#cover").css("display", "none");
                $("#time_rem").css("display", "none");
                $("#before_iqama").css("display", "flex");
            }
            timeToIqamaWithSec = getTimeToIqamaWithSec(newDisplayInformation.prayerInformation.timePrev, newDisplayInformation.timeInformation.date)
            let timeToIqamaPercent = getTimeToIqamaPercent(newDisplayInformation.prayerInformation.timePrev, newDisplayInformation.timeInformation.date)
            $("#time_rem_iqama").html("-" + timeToIqamaWithSec);
            updateProgressBar(timeToIqamaPercent, timeToIqamaWithSec);
            if (timeToIqamaWithSec === "00:05") {
                playSoundNoBeep()
            }
            break;
        case ScreenState.SCREEN_ON_SALAT:
            if (prevScreenState != ScreenState.SCREEN_ON_SALAT) {
                renderPrayerTimes(newDisplayInformation.timeInformation);
                playSoundFourBeep();
                $("#black_cover").css("display", "none");
                $("#cover").css("display", "block");
            }
            break;
        case ScreenState.SCREEN_ON_AFTER_SALAT:
            if (prevScreenState != ScreenState.SCREEN_ON_AFTER_SALAT) {
                renderPrayerTimes(newDisplayInformation.timeInformation);
                $("#black_cover").css("display", "none");
                $("#cover").css("display", "none");
                $("#before_iqama").css("display", "none")
                $("#time_rem").css("display", "flex");
            }
            renderTimeRemainingPrayerName(newDisplayInformation)
            break;
        default:
            break;
    }
    renderCurrentDateAndTime(newDisplayInformation.timeInformation);
}

function renderTimeRemainingPrayerName(newDisplayInformation) {
    hourToNext = Math.floor(newDisplayInformation.prayerInformation.minuteToNext / 60);
    minuteAfterHourToNext = newDisplayInformation.prayerInformation.minuteToNext % 60;
    $("#time_rem_prayer_name").html(newDisplayInformation.prayerInformation.nameNext)
    $("#time_rem_time").html("-" + checkTime(hourToNext) + ":" + checkTime(minuteAfterHourToNext))
    $("#time_rem_prayer_name_ar").html(newDisplayInformation.prayerInformation.nameNextAr)
     
}

function renderCurrentDateAndTime(timeInformation) {
    $("#time").html(timeInformation.h + ":" + timeInformation.m)
    $("#date_nl_box").html(weekDaysNL[timeInformation.date.getDay()] + " " + timeInformation.dd + " " + monthsNL[timeInformation.date.getMonth()] + " " + timeInformation.YY)
}

function calculateWhatToShow(timeInformation) {
    //countdown
    var prayerTimes = getPrayerNamesAndTime(prayerTimeData, timeInformation);
    var idx = -1;
    var current = timeInformation.h + ":" + timeInformation.m;
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
    var minuteFromPrev = Math.abs(timeDiffInMinute(timePrev, current));
    var minuteToNext = 0
    let nameNext, nameNextAr;

    if (nextIdx === 5) {
        // tomorrow fajr time
        let tomorrow = addDays(timeInformation.date, 1)
        let tmm = tomorrow.getMonth() + 1;
        let tdd = tomorrow.getDate();
        let prayerTime = prayerTimeData.times[tmm][tdd].p1.t;
        let timeToNext = timeDiffInMinute(current, prayerTime)
        if (timeToNext < 0) {
            timeToNext = 24 * 60 + timeToNext;
        }
        minuteToNext = timeToNext;
        nameNext = prayerTimes.names[0];
        nameNextAr = prayerTimes.namesAr[0];

    } else {
        let timeNext = prayerTimes.times[nextIdx];
        minuteToNext = Math.abs(timeDiffInMinute(current, timeNext));
        nameNext = prayerTimes.names[nextIdx];
        nameNextAr = prayerTimes.namesAr[nextIdx];
    }
    let prayerInformation = new PrayerInformation(prevIdx, namePrev, timePrev, minuteFromPrev, nextIdx, nameNext, nameNextAr, minuteToNext)
    let newScreenState = getScreenStateToShow(prayerInformation)
    return new DisplayInformation(newScreenState, timeInformation, prayerInformation)    
}

function getScreenStateToShow(prayerInformation) {
    let waitingTimeMinute = WAITING_TIME
    if (prayerInformation.prevIdx == 3) {
        waitingTimeMinute = 7;
    }
    let prayerONTime = waitingTimeMinute + PRAYER_TIME + AFTER_PRAYER_DISPLAY_ON_TIME
    let keyPressedSinceMinute = (Date.now() - lastKeyPressedTime.getTime()) / 60000;
    if (prayerInformation.namePrev === "Jumu'ah" && 
        prayerInformation.minuteFromPrev < 60 && 
        keyPressedSinceMinute >= 5) {
        return ScreenState.SCREEN_OFF_BLACK
    } else if (prayerInformation.minuteFromPrev > prayerONTime && 
        prayerInformation.minuteToNext > BEFORE_PRAYER_DISPLAY_ON_TIME && 
        keyPressedSinceMinute >= 5) {
        return ScreenState.SCREEN_OFF_BLACK
    } else if (prayerInformation.minuteToNext <= BEFORE_PRAYER_DISPLAY_ON_TIME) {
        return ScreenState.SCREEN_ON_BEFORE_AZAAN
    } else if (prayerInformation.minuteFromPrev < waitingTimeMinute) {
        return ScreenState.SCREEN_ON_BEFORE_IQAMA
    } else if (prayerInformation.minuteFromPrev < (waitingTimeMinute + PRAYER_TIME)) {
        return ScreenState.SCREEN_ON_SALAT
    } else {
        return ScreenState.SCREEN_ON_AFTER_SALAT
    }
}

function playSoundFourBeep() {
    soundFourBeep.play();
}

function playSoundTwoBeep() {
    soundTwoBeep.play();
}

function playSoundNoBeep() {
    soundNoBeep.play();
}

function getPrayerNamesAndTime(jsonObj, t) {
    var prayerNames = ["Fadjr", "", "Dohr", "Asr", "Maghreb", "Isha", "Jumu'ah"];
    var prayerNamesAr = ["الفجر", "", "الظهر", "العصر", "المغرب", "العشاء", "الجمع"];
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

    delta = Math.abs(t2 - t1);
    waitingTimeMs = WAITING_TIME * 60 * 1000;
    if (delta > waitingTimeMs) {
        return 100
    }
    return delta * 100 / waitingTimeMs;
}

function renderPrayerTimes(timeInformation) {
    if (prayerTimeData == null)
        return;
    var today = timeInformation.date;
    var mm = today.getMonth() + 1;
    var dd = today.getDate();
    prayerTimes = prayerTimeData.times[mm][dd];
    //Fadjr
    $("#fadjr_time").html(prayerTimes.p1.t)
    weekDayOfToday = weekDaysNL[today.getDay()]
    if (weekDayOfToday == "Vrijdag") {
        $("#dohr_en").html("Jumu'ah")
        $("#dohr_ar").html("الجمع")
    } else {
        $("#dohr_en").html("Dohr")
        $("#dohr_ar").html("الظهر")
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
    $("#progress").css("width", progress + "%");
    mmss = timeToIqamaWithSec.split(":")
    if (mmss[0] == "00") {
        $("#progress").css("background-color", "orange")
    } else {
        $("#progress").css("background-color", "#4CAF50")
    }
}

//switch display on key press
window.addEventListener("keydown", function (event) {
    lastKeyPressedTime = new Date()
}, true);