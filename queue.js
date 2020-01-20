class queue {
    constructor(loop = false, cb) {

        this.queue = [];
        this.index = 0;
        this.loop = loop;
        this.cb = cb;

        this.worked = 0;
        this.del = 0;
        this.starttime = new Date().valueOf();
        this.cycledog;
        this.loopcouter = 0;
    }
    init() {
        this.index = 0;
        this.queue = [];
        clearInterval(this.cycledog);
    }
    insert(obj) {
        this.queue.push({ fun: obj.fun, delay: obj.delay });
    }
    start() {
        this.worked = 1;
        this.work();
    }
    stop() {
        this.worked = 0;
        clearInterval(this.cycledog);
    }
    work() {
        clearInterval(this.cycledog);
        this.step();
    
    }
    step() {
      
        this.cb(this.queue[this.index].fun);
        this.index += 1;
        if (this.index + 1 > this.queue.length) {
            this.loopcouter += 1;
            if (this.loop) {
                this.index = 0;
            }
            else {
                this.stop();
                return;
            }
        }
        let delay=this.queue[this.index].delay;
        clearInterval(this.cycledog);
        this.cycledog = setTimeout(() => {
            this.step()
        }, delay);
    }
}
module.exports = { queue };