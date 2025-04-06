# prayer_times

## build and run
```
npm install

npm start
```
## package in a linux machine to deb format to install in rpi
```
npm run make-arm
```

## install and update
copy the out/make/deb/armv7l/prayer-time_0.9.1_armhf.deb file to the raspberry pi. 
Run: 
```
dpkg -i prayer-time_0.9.1_armhf.deb
```
It should install the application in the pi


## how to run gui app in raspberry pi on startup

https://askubuntu.com/questions/963675/how-to-start-application-when-system-boots-using-a-desktop-file

copy the autostart file to the autostart directory. 
```
cp /usr/share/applications/prayer-time.desktop ~/.config/autostart/
chmod +x prayer-time.desktop
```
Make sure X11 is the window manager, not wayfire (wayland). Else this will not work. https://pimylifeup.com/raspberry-pi-wayland-x11/