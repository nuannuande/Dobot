# Dobot
越疆机器人 node js API
根据越疆机器人UDP通信接口手册封装了部分常用的功能。
#example
var { Dobot } = require('./dobot');
var robot = new Dobot('192.168.3.245', 8899);
robot.SetPTPCmd(0, 106.27, 210.2,35.9,117,1);
