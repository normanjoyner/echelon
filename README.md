echelon
======

##About

###Description
Echelon is a distributed work queue built on [Espial](https://github.com/normanjoyner/espial).

Echelon uses the master Espial node to distribute jobs to slave nodes. Slave nodes perform computation and return results to the master node. The registration of custom handlers allow for different types of jobs to be handled by the same cluster. More to come!

###Author
* Norman Joyner - <norman.joyner@gmail.com>

##Getting Started

###Installation
```npm install echelon```
