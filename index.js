var { Dobot } = require('./com/dobot');
var robot = new Dobot('192.168.3.245', 8899);
var { queue } = require('./com/queue');
var irwstich = 0;

function initRobot() {
    robot.SetIRSwitch(1, 2, 1);
    //robot.SetColorSensor(1, 1, 1);
}
initRobot();
var Off_OK = new queue(true, (exe) => {
    //console.log(exe);
    eval(exe);
});

Off_OK.insert({ fun: `robot.SetPTPCmd(0, 106.27, 210.2,35.9,117,1)`, delay: 5000 });
Off_OK.insert({ fun: `robot.SetEndEffectorSuctionCup(1,1,1)`, delay: 5000 });
Off_OK.insert({ fun: `robot.SetPTPCmd(0, -109.3, 212.9,37,117,1)`, delay: 2000 });
Off_OK.insert({ fun: `robot.SetPTPCmd(0, 27, 235,85,83,1)`, delay: 5000 });
Off_OK.insert({ fun: `robot.SetEndEffectorSuctionCup(1,0,1)`, delay: 5000 });
Off_OK.start();


var Off_NOK = new queue(false, (exe) => {
    //console.log(exe);
    eval(exe);
});

Off_NOK.insert({ fun: `robot.SetPTPCmd(0, 106.27, 210.2,35.9,117,1)`, delay: 5000 });
Off_NOK.insert({ fun: `robot.SetEndEffectorSuctionCup(1,1,1)`, delay: 5000 });
Off_NOK.insert({ fun: `robot.SetPTPCmd(0, -109.3, 212.9,37,117,1)`, delay: 2000 });
Off_NOK.insert({ fun: `robot.SetPTPCmd(0, 27, 235,85,83,1)`, delay: 5000 });
Off_NOK.insert({ fun: `robot.SetEndEffectorSuctionCup(1,0,1)`, delay: 5000 });
//Off_NOK.start();





function ioscan() {
    robot.GetIRSwitch(2);
}

setInterval(() => {
    ioscan();
    logic();
}, 100);

function logic() {
    if (robot.IRSwitch != irwstich) {
        if (robot.IRSwitch == 1) {
            robot.SetEMotor(0, 1, 0, 1);
        }
        else if (robot.IRSwitch == 0) {
            setTimeout(() => {
                robot.SetEMotor(0, 1, 12000, 1);
            }, 3000);

        }
        irwstich = robot.IRSwitch;
    }
}


return;









