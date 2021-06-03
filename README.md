# prayer_times
# package
electron-packager . prayer_time --platform=linux --arch=armv7l --out=out --overwrite

# install
Application binary is in
/home/pi/prayer_time/prayer_time-linux-armv7l/
This is the <application_folder>.
folder. To replace code, we can just replace the code under <application_folder>/resources/app/ folder.

# update the file
Current prayer time file is <application_folder>/resources/app/prayer_times_2021.json. Replacing this with a new file will update the times.

# how to run gui app in raspberry pi on startup
I learned it from this blog: https://jsakov.medium.com/linux-start-an-application-automatically-at-boot-2b6fb61524d7.
Basically we need to edit following file:

/etc/xdg/lxsession/LXDE-pi/autostart

with content like this:

@/path/to/myapp
@/usr/bin/python /home/pi/example.py
@/usr/local/bin/electron /home/pi/electron_example.py

Notes:
1. Don’t forget the @
2. Your commands should come before the @xscreensaver line.
