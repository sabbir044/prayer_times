# prayer_times
# package in a linux machine to deb format
npm run make

# install
copy the out/make/deb/armv7l/prayer-time_0.0.0_armhf.deb file to the raspberry pi. 
Run: dpkg -i prayer-time_0.0.0_armhf.deb
It should install the application in the pi

# update the file

todo

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
