RepeatWords
------------
 --- 
####Origin

Last year I wanted to pass the CET-6 but I cannot stop programming, so I decided to make a app for improving my poor vocabulary. I used Ubuntu as my daily OS, and I wanted to make desktop application since I had two web applications programming. Then I found [node-webkit](https://github.com/rogerwang/node-webkit), it can available on Linux, Mac OSX and Windows! Afterwards, I read the node-webkit APIs and [translate](http://itzzq.tumblr.com/search/node-webkit) some of them into Chinese for deeper understanding. With two months working, I finally temporarily finish it.

![screenshot](https://github.com/itzzq/RepeatWords/blob/master/screenshot/screenshot70.png?raw=true)

![screenshot2](https://github.com/itzzq/RepeatWords/blob/master/screenshot/screenshot71.png?raw=true)
 --- 
###Requirements

+  node-webkit v0.8.0


------------------------
###Install

Get [here](https://github.com/rogerwang/node-webkit) to download node-webkit.

After downloaded node-webkit, in it's directory:

    git clone git://github.com/itzzq/RepeatWords.git
    nw RepeatWords/


 --- 
###Bugs
+ If user has no plan, there is also no prompt.
+ Cannot add plans by user his own.
+ Different users share the same table plan and table wordcard. Fail database design.
+ Table wordcard saves Imformation of words, how to deal with repeated words in the database?


 --- 
I love to accept new technologies and I believe technology can make the world greater.


