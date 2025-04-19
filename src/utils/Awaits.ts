class Awaits {
    static sleep(ms: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(resolve, ms)
        })
    }

    static audio(ms: number, context: AudioContext) {
        return new Promise<void>((resolve) => {
            const now = context.currentTime

            const check = () => {
                if ((context.currentTime - now) * 1000 >= ms) {
                    resolve()
                    return
                }

                requestAnimationFrame(check)
            }

            requestAnimationFrame(check)
        })
    }
}
