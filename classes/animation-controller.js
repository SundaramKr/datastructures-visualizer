class AnimationController {
  constructor() {
    this.speeds = { slow: 900, normal: 450, fast: 180 };
    this.speed = 'normal';
    this._abort = false;
  }

  get delay() {
    return this.speeds[this.speed] ?? this.speeds.normal;
  }

  setSpeed(speed) {
    this.speed = speed;
  }

  abort() {
    this._abort = true;
  }

  resetAbort() {
    this._abort = false;
  }

  async wait(ms) {
    if (this._abort) return;
    await new Promise((resolve) => setTimeout(resolve, ms ?? this.delay));
  }
}
