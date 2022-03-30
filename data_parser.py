from email import header
import os
import string
import requests
import json

headers = {
    'authority': 'koran.nl',
    'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="99", "Google Chrome";v="99"',
    'accept': '*/*',
    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'x-requested-with': 'XMLHttpRequest',
    'sec-ch-ua-mobile': '?0',
    'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.74 Safari/537.36',
    'sec-ch-ua-platform': '"Linux"',
    'origin': 'https://koran.nl',
    'sec-fetch-site': 'same-origin',
    'sec-fetch-mode': 'cors',
    'sec-fetch-dest': 'empty',
    'referer': 'https://koran.nl/gebedstijden/',
    'accept-language': 'en-US,en;q=0.9,bn;q=0.8',
    'cookie': '__asc=2e6e658217f94207e1a0e1b7d38; __auc=2e6e658217f94207e1a0e1b7d38; _ga=GA1.2.1612627456.1647457632; _gid=GA1.2.1079703292.1647457632',
}

data = {
  'latitude': '52.2737893',
  'longitude': '5.1663871',
  'country_iso': 'NL',
  'time_zone': 'Europe/Amsterdam',
  'time_format': '24h',
  'hda': '0',
  'calculation_method': 'CalNL',
  'dhuhr': '0',
  'maghrib': '0',
  'asr': 'Standard',
  'unix_timestamp': '1647457754',
  'calendar': 'gregorian',
  'year': '2022',
  'month': '3',
  'action': 'get_month',
  'locale': 'nl_NL'
}

'''
This function download prayer time from koran.nl to file in folder in (2022/1.json) format
'''
def downloadToFile(year: int):
    global data
    global headers
    for i in range(1,13):
        data['year'] = str(year)
        data['month'] = str(i)
        response = requests.post('https://koran.nl/wp-content/plugins/salat-times/ajax.php', headers=headers, data=data)
        res = response.json()
        print(response)
        filename = "{}/{}.json".format(year,i)
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        with open(filename, "w") as f:
            json.dump(res,f,indent=2)
    
    print("download completed")


def readOriginalPrayerTime() -> dict:
    originalPrayerTimeFileName = 'prayer_times_original.json'
    with open(originalPrayerTimeFileName) as f:
        ori = json.load(f)
        return ori

def readNewPrayerTime(year:int, month: int) -> dict:
    filename = "{}/{}.json".format(year,month)    
    with open(filename) as f:
        newMonth = json.load(f)
        return newMonth

def createPrayerTimeFileForNewYear(year:int):
    #this will replace existing file if exists
    appReadableMap = readOriginalPrayerTime()

    for i in range(1, 13):
        newMonthTimeMap = readNewPrayerTime(year, i)
        days = newMonthTimeMap['details']['days']
        for j in range (0, len(days)):
            day = days[j]['gregorian']['day']
            month = days[j]['gregorian']['month']
            times = days[j]['times']
            #print(day, month, times)
            dayMap = appReadableMap['times'][month][day]
            dayMap['p1']['t'] = times['fajr']
            dayMap['p2']['t'] = times['sunrise']
            dayMap['p3']['t'] = times['dhuhr']
            dayMap['p4']['t'] = times['asr']
            dayMap['p5']['t'] = times['maghrib']
            dayMap['p6']['t'] = times['isha']
            #print(dayMap)

    newFileName = "prayer_times_{}.json".format(year)
    with open(newFileName, "w", encoding='utf8') as f:
        json.dump(appReadableMap, f, indent=2, ensure_ascii=False)

    print("done with file: {}".format(newFileName))

if __name__ == "__main__":
    createPrayerTimeFileForNewYear(2023)