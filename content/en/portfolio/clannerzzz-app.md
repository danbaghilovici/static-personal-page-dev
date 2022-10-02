---
title: ClannerZZz App
slug: clannerzzz-app
description: Mobile application that holds your clannerz's most valuable moments. Made by Clannerzzz, for Clannerzzz.
media: https://media.giphy.com/media/iIGJ3idZ7ULWmQ7VgQ/giphy.gif
keywords: [ceva, 2]
tags: [Clannerzzz-App, Firebase]
projectLinks:
    projectsectionsidemenuheaderdownloadstr:
        googleplaystoredownloadlinktr: "https://example.com"
        fdroiddownloadlinktr: "https://example.com"
    projectsectionsidemenuheadersourcetr:
        githubdownloadlinktr: https://github.com/danbaghilovici/clannerzzz-app
    projectsectionsidemenuheaderlinkstr:
        projectsectionlinkmainpagelinktr: "https://www.example.com"
        projectsectionlinkdemopagelinktr: "https://www.example.com"
draft: true
---

## Description
Clannerzzz is meant to be a social application that holds your clannerzzz’s most valuable media as well as offer a set of utilities that will help you on your daily interactions with your clannerzzz.

The application it’s still in the early stages as the main objective of this project was to see it’s possible to rapidly build an MVP with the tools and services that I’m most familiar with to actually being able to test my idea and to receive constructive feedback from my clannerzzz.

## Features

The main idea of the app and its main feature was the ability to store, use and share media files that we accumulated over the years through different  external messaging apps like WhatsApp, Telegram, etc.

* &#9744; Upload audio files from the device storage to the cloud
* &#9745; Download audio files on the device storage from the cloud
* &#9745; Play audio files from the device storage
* &#9745; Share downloaded audio files from the device storage on any external app

As I managed to execute on the main feature of the app successfully , now there can the app can be extended to contain these new features that are expected from a more matura app:


* Account and group management
* Support for iOS and web


## It started with an idea

The idea of the application started as a joke between my group of friends that we used to play together. Every time we wanted to joke with each other we would send a voice message on the different platforms that we would communicate. At some point we reached a good amount of audio files sparse around the different apps that we used to communicate, we would have copies of the same audio file, shortened audios that together formed an even bigger audio file.
We also lost some funny and silly audios along the way since no backup was available. If one of use would lose,swap its phone and the others would not have the audio file, it would be forever lost.
At some point one of my friends asked me: “Wouldn’t be great to have all these audios on a single app?”.

## Stack
The technologies I decided to use are [Ionic](https://ionicframework.com/) and [Firebase](https://firebase.google.com/). I’m already familiar with both of them and I used them extensively on my previous job so I had a base idea on how things would play out regarding development, and although it did not worked so smoothly as I thought I managed to have an MVP.
Apart from the familiarity with the tech I chose:

Ionic simply for the fact that it allows me to build for both android and ios seamlessly* (not really)
Firebase services: let’s me focus on the application logic itself without worrying about the building and maintaining separate code from all the backend services. Also has some neat features for the native apps like offline usage (* in some cases)


## Challenges

The main challenge I faced with this project is simply the issues you face when using a technology like Ionic. It uses a plugin system that covers the most basic functionalities that you would like to use your device for, but for cases when a more complex feature is needed those app functionalities are unavailable thought the Ionic’s Team plugins.
So in order to fix this Ionic is flexible enough to let you add third-party plugins that may or may not work as intended, update on time for the latest underlying features or even give support for specific use cases that you may need.
