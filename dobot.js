const dgram = require('dgram');
class Dobot {
    constructor(ip, port = 8899) {
        this.ip = ip;
        this.port = port;
        this.client = dgram.createSocket('udp4');
        this.header = Buffer.from([0xaa, 0xaa]);
        this.client.on('message', data => {

            if (this.checkchecksum(data)) {
                let id = data[3];
                let params = data.slice(5, data.length - 1);
                this.parsedata(id, params);
            }
            else {
                return;
            }
        });
        this.Pose = { X: 0, Y: 0, Z: 0, R: 0, jointAngle: [] };
        this.HomePosition = { X: 0, Y: 0, Z: 0, R: 0 };
        this.PTPJointParams = { velocity: [], acceleration: [] };
        this.ColorSensor = { r: 0, g: 0, b: 0 };
        this.alarmsState = "";
        this.tarPose = { x: 0, y: 0, z: 0, r: 0 };
        this.inpos = 0;

    }
    sendcom(id, rw, isQueued, Paramsbuf = null) {
        let idbuf = Buffer.from([id]);
        let ctrnum = rw * 16 + isQueued;
        let ctrlbuf = Buffer.from([ctrnum]);
        let payload, paramslength;
        if (Paramsbuf) {
            payload = Buffer.concat([idbuf, ctrlbuf, Paramsbuf]);
            paramslength = Paramsbuf.length;
        }
        else {
            payload = Buffer.concat([idbuf, ctrlbuf]);
            paramslength = 0;
        }
        let lengthbuf = Buffer.from([paramslength + 2]);
        let checksumbuf = this.generatechecksum(payload);
        let combuf = Buffer.concat([this.header, lengthbuf, payload, checksumbuf]);
        this.client.send(combuf, this.port, this.ip);
    }
    generatechecksum(payload) {
        let sum = 0;
        for (let i = 0; i < payload.length; i++) {
            sum += payload[i];
        }
        let lsum = 256 - sum & 0xff;
        return Buffer.from([lsum])

    }
    checkchecksum(response) {

        if (response.length < 6) return false;
        let checksum = response[response.length - 1];
        let length = response[2];

        let sum = 0;
        for (let i = 0; i < length; i++) {
            sum += response[i + 3];
        }
        let lsum = sum & 0xff;
        if ((lsum + checksum) & 0xff) return false;
        else return true;
    }
    parsedata(id, params) {
        switch (id) {
            //实时姿态
            case 10:
                this.Pose.X = params.readFloatLE();
                this.Pose.Y = params.readFloatLE(4);
                this.Pose.Z = params.readFloatLE(8);
                this.Pose.R = params.readFloatLE(12);
                this.Pose.jointAngle[0] = params.readFloatLE(16);
                this.Pose.jointAngle[1] = params.readFloatLE(20);
                this.Pose.jointAngle[2] = params.readFloatLE(24);
                this.Pose.jointAngle[3] = params.readFloatLE(28);
                break;
            //零位坐标
            case 30: this.HomePosition.X = params.readFloatLE();
                this.HomePosition.Y = params.readFloatLE(4);
                this.HomePosition.Z = params.readFloatLE(8);
                this.HomePosition.R = params.readFloatLE(12);
                break;
            //movj 运动的参数
            case 80:
                this.PTPJointParams.velocity[0] = params.readFloatLE();
                this.PTPJointParams.velocity[1] = params.readFloatLE(4);
                this.PTPJointParams.velocity[2] = params.readFloatLE(8);
                this.PTPJointParams.velocity[3] = params.readFloatLE(12);
                this.PTPJointParams.acceleration[0] = params.readFloatLE(16);
                this.PTPJointParams.acceleration[1] = params.readFloatLE(20);
                this.PTPJointParams.acceleration[2] = params.readFloatLE(24);
                this.PTPJointParams.acceleration[3] = params.readFloatLE(28);
                break;
            //报警代码
            case 20:
                this.alarmsState = params;
                break;
            //红外传感器
            case 138: //this.IRSwitch = params.readUInt8(2);
                if (params.length < 1) return;
                this.IRSwitch = params.readUInt8();
                break;
            case 137:
                //
                this.ColorSensor.r = params.readUInt8(0);
                this.ColorSensor.g = params.readUInt8(1);
                this.ColorSensor.b = params.readUInt8(2);
                break;
        }
    }
    Judge() {
        console.log(this.Pose);
        console.log(this.tarPose);
        if (this.Pose.X == this.tarPose.x && this.Pose.Y == this.tarPose.y && this.Pose.Z == this.tarPose.z && this.Pose.R == this.tarPose.r) {
            this.inpos = 1;
        }
        else {
            this.inpos = 0;
        }
    }
    GetPose() {
        this.sendcom(10, 0, 0);
    }
    SetHOMECmd(isQueued = 0) {
        this.sendcom(31, 1, isQueued);
    }
    GetHOMEParams() {
        this.sendcom(30, 1, 0);
    }
    SetEndEffectorSuctionCup(enable, suck, isQueued = 0) {
        let params = Buffer.from([enable, suck]);
        this.sendcom(62, 1, isQueued, params);
    }
    SetEMotor(index, insEnabled, speed, isQueued = 0) {
        let indexbuf = Buffer.from([index]);
        let ebuf = Buffer.from([insEnabled]);
        let spbuf = Buffer.allocUnsafe(4);
        spbuf.writeUInt32LE(speed);
        let params = Buffer.concat([indexbuf, ebuf, spbuf]);
        this.sendcom(135, 1, isQueued, params);

    }
    GetPTPJointParams(isQueued = 0) {
        this.sendcom(80, 0, isQueued)
    }


    SetPTPCmd(mode, x, y, z, r, isQueued = 0) {
        let modebuf = Buffer.allocUnsafe(1);
        modebuf.writeUInt8(mode);
        let xbuf = Buffer.allocUnsafe(4);
        xbuf.writeFloatLE(x);
        let ybuf = Buffer.allocUnsafe(4);
        ybuf.writeFloatLE(y);
        let zbuf = Buffer.allocUnsafe(4);
        zbuf.writeFloatLE(z);
        let rbuf = Buffer.allocUnsafe(4);
        rbuf.writeFloatLE(r);
        let params = Buffer.concat([modebuf, xbuf, ybuf, zbuf, rbuf]);
        this.tarPose.x = x;
        this.tarPose.y = y;
        this.tarPose.z = z;
        this.tarPose.r = r;
        this.sendcom(84, 1, isQueued, params);
    }
    GetIRSwitch(port) {
        let param = Buffer.from([port]);
        this.sendcom(138, 0, 0, param);
    }
    SetIRSwitch(isEnable, port, verison = 0) {
        let ebuf = Buffer.from([isEnable]);
        let pbuf = Buffer.from([port]);
        let vbuf = Buffer.from([verison]);
        let params = Buffer.concat([ebuf, pbuf, vbuf]);
        this.sendcom(138, 0, 1, params);
    }
    SetColorSensor(isEnable, port, verison = 0) {
        let ebuf = Buffer.from([isEnable]);
        let pbuf = Buffer.from([port]);
        let vbuf = Buffer.from([verison]);
        let params = Buffer.concat([ebuf, pbuf, vbuf]);
        this.sendcom(137, 1, 1, params);
    }
    GetIODO(add) {
        let params = Buffer.from([add]);
        this.sendcom(131, 0, 0, params);
    }
    GetIODI(add) {
        let params = Buffer.from([add]);
        this.sendcom(133, 0, 0, params);
    }
    GetColorSensor() {
        this.sendcom(137, 0, 0);
    }
    SetWAITCmd(ms = 0, isQueued = 0) {
        let params = Buffer.allocUnsafe(4);
        params.writeUInt32LE(ms);
        this.sendcom(110, 1, isQueued, params);
    }

    ClearAllAlarmsState() {
        this.sendcom(20, 1, 0);
    }
    GetAlarmsState() {
        this.sendcom(20, 0, 0);
    }
    SetQueuedCmdStartExec() {
        this.sendcom(240, 1, 0);
    }
    SetQueuedCmdStopExec() {
        this.sendcom(241, 1, 0);
    }
    SetQueuedCmdForceStopExec() {
        this.sendcom(242, 1, 0);
    }
    SetQueuedCmdClear() {
        this.sendcom(244, 1, 0);
    }

}
module.exports = { Dobot }