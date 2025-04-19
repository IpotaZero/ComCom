"use strict";
class Awaits {
    static sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
    static audio(ms, context) {
        return new Promise((resolve) => {
            const now = context.currentTime;
            const check = () => {
                if ((context.currentTime - now) * 1000 >= ms) {
                    resolve();
                    return;
                }
                requestAnimationFrame(check);
            };
            requestAnimationFrame(check);
        });
    }
}
//# sourceMappingURL=Awaits.js.map