"use strict";
electron.onOpenMidi((path) => {
    openMidi(path[0]);
});
const openMidi = async (filePath) => {
    try {
        const midi = new JZZ.MIDI.SMF(await electron.loadFile(filePath));
        UI.setPlayer(new MidiPlayer(midi));
        const music = new Music(midi);
        await music.isReady;
        UI.resetPianoRoll();
        music.displayTo(UI.pianoRoll);
    }
    catch (error) {
        alert(error);
    }
};
document.addEventListener("DOMContentLoaded", async () => {
    try {
        MidiOutputManager.init();
    }
    catch (e) {
        alert(e);
    }
    UI.init();
    openMidi("test-midi/l1.mid");
});
//# sourceMappingURL=run.js.map