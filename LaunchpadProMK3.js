//// Launchpad Pro MK3 MIDI mapping for Mixxx
//// created by Milkii B, hi Mum

/// wip

/// done
// 4*16 or 2*32 hotcue pads, matched to deck colour
// total 80 with 4 sets of intro start, end, outro start, end
// beatjump page with a range of jump lengths for all decks
// bpm scale page with visual aid to fix misanalysed tempo
// fix colour brightness scaling
// fix background for bpm scale
// make all the base functionality work
// fix undo bpm scale
// fix star up/down
// fix hotcues
// finish move to cleaner deck config object

/// todo
// sort_hotcues, sort_hotcues_remove_offsets
// reduce duplicated logic, recheck objects
// make the core logic saner
// generate gradients better
// literary programming comments
// finish one deck page with multiple controls
// make this truly 2 deck compatible
// make a two deck page
// make deck order truly free
// normalise variable names across functions
// make more robust through adding more checks
// make the bpm flash in a new place
// better deck colour display
// represent track colours
// a e s t h e t i c s and consistency
// party


//// MARK: LaunchpadProMK3
//// Main object to represent the controller
var LaunchpadProMK3 = {};


/// DEBUG stuff
LaunchpadProMK3.DEBUGstate = 1;


// Terminal colour codes for DEBUG message
const COLOURS = {
  // Standard colours
  RED: "\x1b[31m",
  GREEN: "\x1b[32m",
  YELLOW: "\x1b[33m",
  BLUE: "\x1b[34m",
  MAGENTA: "\x1b[35m",
  CYAN: "\x1b[36m",
  ORANGE: "\x1b[33m", // 208 = bright orange
  RESET: "\x1b[0m",

  // Darker (standard low-brightness)
  DARK_RED: "\x1b[38;5;88m",
  DARK_GREEN: "\x1b[38;5;22m",
  DARK_YELLOW: "\x1b[38;5;100m",
  DARK_BLUE: "\x1b[38;5;18m",
  DARK_MAGENTA: "\x1b[38;5;90m",
  DARK_CYAN: "\x1b[38;5;30m",

  // Pastels (24-bit truecolor)
  PASTEL_RED: "\x1b[38;2;255;128;128m",
  PASTEL_ORANGE: "\x1b[38;2;255;178;102m",
  PASTEL_YELLOW: "\x1b[38;2;255;255;153m",
  PASTEL_GREEN: "\x1b[38;2;153;255;153m",
  PASTEL_BLUE: "\x1b[38;2;153;204;255m",
  PASTEL_MAGENTA: "\x1b[38;2;255;153;255m",
  PASTEL_CYAN: "\x1b[38;2;153;255;255m",

  // Greys
  GREY: "\x1b[38;5;245m",       // Light-Mid Grey
  DARK_GREY: "\x1b[38;5;240m",  // Darker Grey
  LIGHT_GREY: "\x1b[38;5;250m"  // Very Light Grey
};

const C = {
  // Standard
  R: COLOURS.RED,
  O: COLOURS.ORANGE,
  Y: COLOURS.YELLOW,
  G: COLOURS.GREEN,
  B: COLOURS.BLUE,
  M: COLOURS.MAGENTA,
  C: COLOURS.CYAN,
  RE: COLOURS.RESET,

  // Dark
  DR: COLOURS.DARK_RED,
  DG: COLOURS.DARK_GREEN,
  DY: COLOURS.DARK_YELLOW,
  DB: COLOURS.DARK_BLUE,
  DM: COLOURS.DARK_MAGENTA,
  DC: COLOURS.DARK_CYAN,

  // Pastel
  PR: COLOURS.PASTEL_RED,
  PO: COLOURS.PASTEL_ORANGE,
  PY: COLOURS.PASTEL_YELLOW,
  PG: COLOURS.PASTEL_GREEN,
  PB: COLOURS.PASTEL_BLUE,
  PM: COLOURS.PASTEL_MAGENTA,
  PC: COLOURS.PASTEL_CYAN,

  // Greys
  GR: COLOURS.GREY,
  DG: COLOURS.DARK_GREY,
  LG: COLOURS.LIGHT_GREY
};


LaunchpadProMK3.appStartTimestamp = Date.now();


// Function to print debug messages
// MARK: DEBUG()
const DEBUG = function (message, colour, linesbefore, linesafter) {
  if (LaunchpadProMK3.DEBUGstate) {
    if (colour === undefined) { colour = ""; }
    if (typeof linesbefore === "number" && linesbefore > 0 && linesbefore < 50) { for (i = 0; i < linesbefore; i += 1) { console.log(" "); } }
    const onTime = (Date.now() - LaunchpadProMK3.appStartTimestamp) / 1000;
    console.log(`${C.PR}DEBUG ${C.GR}${onTime.toFixed(3)}${C.RE} ${colour}${message}${C.RE}`);
    if (typeof linesafter === "number" && linesafter > 0 && linesafter < 50) { for (i = 0; i < linesafter; i += 1) { console.log(" "); } }
    //LaunchpadProMK3.sleep(1000)
  };
};

//const D = function(var1, var2, var3, var4, var5, var6) {
//  if (LaunchpadProMK3.DEBUGstate) {
//    console.log(`${C.R}D${C.RE}  ${var1)} ${C.O}   ${eval(var1)}   ${C.RE} ${var2} ${C.O}${var2}${C.RE} ${var3} ${C.O}${var3}${C.RE} ${var4} ${C.O}${var4}${C.RE} ${var5} ${C.O}${var5}${C.RE} ${var6} ${C.O}${var6}${C.RE}`)
//    //LaunchpadProMK3.sleep(333)
//  }
//};



Object.prototype.forEach = function (callback) {
  for (let key in this) {
    if (this.hasOwnProperty(key)) {
      callback(this[key], key, this);
    }
  }
};


// Init deck conf base object
LaunchpadProMK3.deck = LaunchpadProMK3.deck || {};



//// Instantiation function; set up decks, etc
// MARK: init()
LaunchpadProMK3.init = function () {
  // Initialize animationStateInitialized as an object if it's not already
  if (typeof LaunchpadProMK3.animationStateInitialized === 'undefined') {
    LaunchpadProMK3.animationStateInitialized = {};
  }
  LaunchpadProMK3.lastQuantizedStep = {};
  LaunchpadProMK3.currentMainBeatCycle = {};
  DEBUG("ooooo                                                    oooo                                   .o8 ", C.M, 2)
  DEBUG("`888'                                                    `888                                 dc888 ", C.M)
  DEBUG(" 888          .oooo.   oooo  oooo  ooo. .oo.    .ooooo.   888 .oo.   oo.ooooo.   .oooo.    .oooo888 ", C.M)
  DEBUG(" 888         `P  )88b  `888  `888  `888P'Y88b  d88' `'Y8  888P'Y88b   888' `88b `P  )88b  d88' `888 ", C.M)
  DEBUG(" 888          .oP'888   888   888   888   888  888        888   888   888   888  .oP'888  888   888 ", C.M)
  DEBUG(" 888       o d8(  888   888   888   888   888  888   .o8  888   888   888   888 d8(  888  888   888 ", C.M)
  DEBUG("o888ooooood8 `Y888''8o  `V88V'V8P' o888o o888o `Y8bod8P' o888o o888o  888bod8P' `Y888''8o `Y8bod88P'", C.M)
  DEBUG("                                                                      888                           ", C.M)
  DEBUG("                                                                     o888o                          ", C.M)
  DEBUG("")
  DEBUG("          ooooooooo.                           ooo        ooooo oooo    oooo   .oooo.               ", C.M)
  DEBUG("          `888   `Y88.                         `88.       .888' `888   .8P'  .dPY''88b              ", C.M)
  DEBUG("           888   .d88' oooo d8b  .ooooo.        888b     d'888   888  d8'          ]8P'             ", C.M)
  DEBUG("           888ooo88P'  `888''8P d88' `88b       8 Y88. .P  888   88888[          <88b.              ", C.M)
  DEBUG("           888          888     888   888       8  `888'   888   888`88b.         `88b.             ", C.M)
  DEBUG("           888          888     888   888       8    Y     888   888  `88b.  o.   .88P              ", C.M)
  DEBUG("          o888o        d888b    `Y8bod8P'      o8o        o888o o888o  o888o `8bd88P'               ", C.M)
  DEBUG("")
  DEBUG("   created by Milkii, with thanks to various Mixxx devs on Zulip, the forum and GitHub for help!", C.C)
  DEBUG("###### init controller script n object", C.G, 2, 1);


  // switch LPP3 from DAW mode to programmer mode
  DEBUG("LaunchpadProMK3.setProgrammerMode()", C.O)
  LaunchpadProMK3.setProgrammerMode();

  // clear already lit pads
  //LaunchpadProMK3.clearAll();

  // MIDI handlers for deck selection, actions, and page selection
  DEBUG("LaunchpadProMK3.initVars()", C.O)
  LaunchpadProMK3.initVars();


  // construct Deck objects based on the Components JS Deck object system
  if (LaunchpadProMK3.totalDecks === 4) {
    DEBUG("LaunchpadProMK3.totalDecks = 4 decks, creating..", C.O, 0, 1)
    LaunchpadProMK3.decks = {
      "1": new LaunchpadProMK3.Deck(1),
      "2": new LaunchpadProMK3.Deck(2),
      "3": new LaunchpadProMK3.Deck(3),
      "4": new LaunchpadProMK3.Deck(4),
    }
  } else if (LaunchpadProMK3.totalDecks === 2) {
    DEBUG("LaunchpadProMK3.totalDecks = 2 decks, creating..", C.O, 0, 1)
    LaunchpadProMK3.decks = {
      "1": new LaunchpadProMK3.Deck(1),
      "2": new LaunchpadProMK3.Deck(2),
    }
    // Don't call bpmScaledInit here without a deck number
    // LaunchpadProMK3.bpmScaledInit()
    DEBUG("decks madeeeee", C.R, 1, 1)
  };

  // Initialize per-deck animation cycle trackers using integer keys
  for (let i = 1; i <= LaunchpadProMK3.totalDecks; i++) {
    // Ensure the deck object itself exists before trying to set properties related to it.
    // Note: LaunchpadProMK3.decks uses string keys "1", "2", etc.
    if (LaunchpadProMK3.decks[i.toString()]) { 
        LaunchpadProMK3.lastQuantizedStep[i] = -1;       // Use integer deckNum 'i' as key
        LaunchpadProMK3.currentMainBeatCycle[i] = 0;    // Use integer deckNum 'i' as key
    } else {
        DEBUG("LaunchpadProMK3.init: Deck " + i + " not found in LaunchpadProMK3.decks for animation cycle init.", C.R);
    }
  }


  // MIDI handlers for deck selection, actions, and page selection
  DEBUG("LaunchpadProMK3.initExtras()", C.G, 1)
  LaunchpadProMK3.initExtras();


  // Select the initial desk
  DEBUG("LaunchpadProMK3.selectDeck(1)", C.G, 1)
  LaunchpadProMK3.selectDeck(1);


  // Initialise zeroth page (hotcues)
  DEBUG("LaunchpadProMK3.selectPage(0)", C.G, 1)
  LaunchpadProMK3.selectPage(0);


  DEBUG("init finished", C.R, 2, 24);
};




// MARK: base functions

// set Launchpad Pro MK3 to Programmer Mode
LaunchpadProMK3.setProgrammerMode = function () {
  LaunchpadProMK3.sendSysEx([0x0E, 0x01]);
};


// helper to construct and send SysEx messageggVG
LaunchpadProMK3.sendSysEx = function (data) {
  signal = [0xF0, 0x00, 0x20, 0x29, 0x02, 0x0E].concat(data, [0xF7]);
  //DEBUG(signal)
  midi.sendSysexMsg(signal, signal.length);
};


// To add time between steps in multi hotcue function
// MARK: sleep()
LaunchpadProMK3.sleep = function (time) {
  let then = Date.now();
  while (true) {
    let now = Date.now();
    if (now - then > time) {
      break;
    };
  };
};


LaunchpadProMK3.startTime = function () {
  LaunchpadProMK3.startTime = Date.now();
};

LaunchpadProMK3.whereTime = function () {
  return C.Y + "-whereTime: " + C.RE + (Date.now() - LaunchpadProMK3.startTime);
};

let lastHotcueCreationTime = 0;







//// MARK: initVars()
LaunchpadProMK3.initVars = function () {
  //// initialise main variables

  // MIDI addresses of the main 8x8 grid
  LaunchpadProMK3.mainpadAddresses = [
    81, 82, 83, 84, 85, 86, 87, 88,
    71, 72, 73, 74, 75, 76, 77, 78,
    61, 62, 63, 64, 65, 66, 67, 68,
    51, 52, 53, 54, 55, 56, 57, 58,
    41, 42, 43, 44, 45, 46, 47, 48,
    31, 32, 33, 34, 35, 36, 37, 38,
    21, 22, 23, 24, 25, 26, 27, 28,
    11, 12, 13, 14, 15, 16, 17, 18
  ];


  // sidepad pads

  // MIDI addresses of the left/right side pads
  LaunchpadProMK3.sidepads = [
    80, 70, 89, 79,
    60, 50, 69, 59,
    40, 30, 49, 39,
    20, 10, 29, 19
  ];


  // Templates for assigning side pad controls
  LaunchpadProMK3.sidepadNames = [
    "intro_start_",
    "intro_end_",
    "outro_start_",
    "outro_end_"
  ];


  // row above main pads
  LaunchpadProMK3.row0 = [0x5B, 0x5C, 0x5D, 0x5E, 0x5F, 0x60, 0x61, 0x62];

  // rows below main pads
  LaunchpadProMK3.row1 = [0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x6B, 0x6C];
  LaunchpadProMK3.row2 = [0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08];


  // Deck physical order (pad address offsets) and deck colours
  LaunchpadProMK3.deck.config = {
    "3": { order: 1, colour: 0xfeb108 }, //yellow
    "1": { order: 2, colour: 0x378df7 }, //blue
    "2": { order: 3, colour: 0xd700d7 }, //magenta
    "4": { order: 4, colour: 0x88b31a }  //green
  };


  LaunchpadProMK3.bpmScaleColumns = [
    { index: 1, scale: 0.5, control: "beats_set_halve", indicator: "beat_active_0_5", colour: 0xFF5555 }, //2
    { index: 2, scale: 0.666, control: "beats_set_twothirds", indicator: "beat_active_0_666", colour: 0x77FF77 }, //1.5
    { index: 3, scale: 0.75, control: "beats_set_threefoutrths", indicator: "beat_active_0_75", colour: 0x7B00C2 }, //1.333
    { index: 4, scale: 1, control: "beats_undo_adjustment", indicator: "beat_active", colour: 0xff0000 }, //1
    { index: 5, scale: 1.25, control: "beats_set_fivefourths", indicator: "beat_active_1_25", colour: 0x00F }, //
    { index: 6, scale: 1.333, control: "beats_set_fourthirds", indicator: "beat_active_1_333", colour: 0x8B00C2 }, //0.75
    { index: 7, scale: 1.5, control: "beats_set_threehalves", indicator: "beat_active_1_5", colour: 0x88FF88 }, //0.666
    { index: 8, scale: 2, control: "beats_set_double", indicator: "beat_active_2", colour: 0xFF1111 } //0.5
  ];


  // provide the rgb colors for the bpm scaling columns in an array for easy use later
  scaleColumnRgb = [];

  LaunchpadProMK3.bpmScaleColumns.forEach(column => {
    scaleColumnRgb.push(LaunchpadProMK3.hexToRGB(column.colour));
  })

  LaunchpadProMK3.totalDecks = Object.keys(LaunchpadProMK3.deck.config).length;
  LaunchpadProMK3.totalDeckHotcuePads = 64 / LaunchpadProMK3.totalDecks;

  // full brightness LED colour is confusing
  // these set how bright the LEDs are for loaded and unloaded decks
  LaunchpadProMK3.deckLoadedActiveDimscale = 0.85
  LaunchpadProMK3.deckLoadedInactiveDimscale = 0.4
  LaunchpadProMK3.deckUnloadedDimscale = 0.2


  // Track which page is selected
  LaunchpadProMK3.currentPage = 0; // Page 0 for hotcues

  // Track which hotcue was last used
  LaunchpadProMK3.lastHotcue = []; // Page 0 for hotcues

  // Track what hotcue was last deleted
  LaunchpadProMK3.redoLastDeletedHotcue = [];

  // Which deck actions will be performed on
  LaunchpadProMK3.lastHotcueChannel = "undefined"

  // Track if the shift button is pressed
  LaunchpadProMK3.shift = 0;


  // initialize bpmFlashStep object for all pads (11 through 88)
  // LaunchpadProMK3.bpmFlashStepInit = function () {
  // reset the bpm pad flash step object (keyed by pad address)
  LaunchpadProMK3.bpmFlashStep = {};
  // };


  // initialize base lastFlashTime object
  LaunchpadProMK3.lastFlashTime = {};
  LaunchpadProMK3.songLengthInBeatsSamples = {};
  LaunchpadProMK3.lastTriggerOfPlayConnection = {};

  // initialize lastBeatStep object
  LaunchpadProMK3.lastBeatStep = {};

  // initialize animationSteps and lastBeatSteps objects
  LaunchpadProMK3.animationSteps = LaunchpadProMK3.animationSteps || {};
  LaunchpadProMK3.lastBeatSteps = LaunchpadProMK3.lastBeatSteps || {};
};



//// MARK: initExtras()
LaunchpadProMK3.initExtras = function () {
  // Deck selection buttons
  // TODO currently order here is hardcoded
  // select deck 3
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row1[0], (channel, control, value, status, _group) => {
    if (value !== 0) { LaunchpadProMK3.selectDeck(3); }
  });
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row1[0], 0xd7, 0x00, 0xd7); // bright

  // select deck 1
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row1[1], (channel, control, value, status, _group) => {
    if (value !== 0) { LaunchpadProMK3.selectDeck(1); }
  });
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row1[1], 0x1D, 0x46, 0x7B); // bright

  // select deck 2
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row1[2], (channel, control, value, status, _group) => {
    if (value !== 0) { LaunchpadProMK3.selectDeck(2); }
  });
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row1[2], 0x7F, 0x58, 0x04); // bright

  // select deck 4
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row1[3], (channel, control, value, status, _group) => {
    if (value !== 0) { LaunchpadProMK3.selectDeck(4); }
  });
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row1[3], 0x44, 0x60, 0x0D); // bright


  // select page 1
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row2[0], (channel, control, value, status, _group) => {
    if (value !== 0) { LaunchpadProMK3.selectPage(0); }
  });

  midi.makeInputHandler(0xB0, LaunchpadProMK3.row2[1], (channel, control, value, status, _group) => {
    if (value !== 0) { LaunchpadProMK3.selectPage(1); }
  });
  // select page 3
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row2[2], (channel, control, value, status, _group) => {
    if (value !== 0) { LaunchpadProMK3.selectPage(2); }
  });
  // select page 4
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row2[3], (channel, control, value, status, _group) => {
    if (value !== 0) { LaunchpadProMK3.selectPage(3); }
  });
  // select page 5
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row2[4], (channel, control, value, status, _group) => {
    if (value !== 0) { LaunchpadProMK3.selectPage(4); }
  });
  // select page 6
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row2[5], (channel, control, value, status, _group) => {
    if (value !== 0) { LaunchpadProMK3.selectPage(5); }
  });
  // select page 7
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row2[6], (channel, control, value, status, _group) => {
    if (value !== 0) { LaunchpadProMK3.selectPage(6); }
  });


  // shift;press and hold to access alternate functions for other pads
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row2[7], (channel, control, value, status) => {
    if (value !== 0) {
      LaunchpadProMK3.shift = 1;
      LaunchpadProMK3.sendRGB(LaunchpadProMK3.row2[7], 0x2F, 0x7F, 0x7F);
      DEBUG("# shift on", C.G);
    } else if (value === 0) {
      LaunchpadProMK3.shift = 0;
      LaunchpadProMK3.sendRGB(LaunchpadProMK3.row2[7], 0x0B, 0x0B, 0x0F);
      DEBUG("# shift off", C.G);
    }
  });
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row2[7], 0x0B, 0x0B, 0x0F);


  // pop and pull hotcue info for the ability to undo and redo
  // undo last hotcue
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row0[0], (channel, control, value, status) => {
    if (value !== 0) {
      LaunchpadProMK3.undoLastHotcue();
    }
  });
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row0[0], 0x7F, 0x30, 0x7F);

  // redo last hotcue
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row0[1], (channel, control, value, status) => {
    if (value !== 0) {
      LaunchpadProMK3.redoLastHotcue();
    }
  });
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row0[1], 0x2F, 0x20, 0x7F);


  // multi hotcue creation function
  // creates 4 leadup and then a drop hotcue, playhead to be on drop when pressed
  // TODO currently creation positions are hardcoded
  hotcueCreationButton = LaunchpadProMK3.row0[7]
  midi.makeInputHandler(0xB0, hotcueCreationButton, (channel, control, value, status, _group) => {
    if (value !== 0) { LaunchpadProMK3.create4LeadupDropHotcues(LaunchpadProMK3.selectedDeck, value); }
  });
  LaunchpadProMK3.sendRGB(hotcueCreationButton, 0x7F, 0x7F, 0x7F);


  // ability to switch color of a hotcue that has been created
  // hotcue color switch prev
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row0[4], (control, value, status, group) => {
    var channel = LaunchpadProMK3.lastHotcueChannel;
    if (typeof LaunchpadProMK3.lastHotcueChannel === "undefined") { return; }
    script.toggleControl(group, "hotcue_focus_color_prev");
  });
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row0[4], 0x20, 0x20, 0x7F);

  // hotcue color switch next
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row0[5], (control, value, status, group) => {
    var channel = LaunchpadProMK3.lastHotcueChannel;
    if (typeof LaunchpadProMK3.lastHotcueChannel === "undefined") { return; }
    script.toggleControl(group, "hotcue_focus_color_next");
  });
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row0[5], 0x7F, 0x20, 0x20);
  DEBUG("## end LaunchpadProMK3.initExtras()", C.R, 0, 20);
};




// MARK: init Deck obj
LaunchpadProMK3.Deck = function (deckNum) {
  //D(LaunchpadProMK3.DEBUGstate, C.M, this.deckColour, this.pads, test)
  DEBUG("", C.RE, 2)
  DEBUG("  o8o               o8o      .             .o8                      oooo       ", C.M);
  DEBUG("  `''               `''    .o8            '888                      `888       ", C.M);
  DEBUG(" oooo  ooo. .oo.   oooo  .o888oo      .oooo888   .ooooo.   .ooooo.   888  oooo ", C.M);
  DEBUG(" 888  `888P'Y88b  `888    888        d88' `888  d88' `88b d88' `'Y8  888 .8P'  ", C.M);
  DEBUG(" 888   888   888   888    888        888   888  888ooo888 888        888888.   ", C.M);
  DEBUG(" 888   888   888   888    888 .      888   888  888    .o 888   .o8  888 `88b. ", C.M);
  DEBUG(" o888o o888o o888o o888o   '888'     `Y8bod88P' `Y8bod8P' `Y8bod8P' o888o o888o " + deckNum, C.M, 0, 2);
  // DEBUG("### constructing " + C.M + "deck " + deckNum, C.G);
  // connect deck object to Components system
  components.Deck.call(this, deckNum);

  // give deck object the configured deck colour
  this.deckColour = LaunchpadProMK3.deck.config[deckNum].colour;
  DEBUG("Deck(" + C.O + deckNum + C.G + ") ### object instantiation    this.currentDeck " + C.O + this.currentDeck + C.RE + "   deckColour " + C.O + "#" + this.deckColour.toString(16).padStart(6, "0").toUpperCase() + C.RE + " (" + C.O + LaunchpadProMK3.hexToRGB(this.deckColour) + C.RE + ")", C.G);
  // save this.deckColour in RGB arrray format to use later
  this.deckRgb = LaunchpadProMK3.hexToRGB(this.deckColour);
  // give object its physical order
  this.deckOrderIndex = LaunchpadProMK3.deck.config[deckNum].order;
  DEBUG("Deck(" + C.O + deckNum + C.RE + ") this.deckOrderIndex " + C.O + this.deckOrderIndex + C.RE + " (via LaunchpadProMK3.deck.config[deckNum].order)")
  // what pad is the first of the set the deck will manage?
  this.deckMainSliceStartIndex = (this.deckOrderIndex - 1) * LaunchpadProMK3.totalDeckHotcuePads;
  DEBUG("Deck(" + C.O + deckNum + C.RE + ") this.deckMainSliceStartIndex " + C.O + this.deckMainSliceStartIndex)
  // what is the set of main grid pads this deck will manage?
  this.pads = LaunchpadProMK3.mainpadAddresses.slice(this.deckMainSliceStartIndex, this.deckMainSliceStartIndex + LaunchpadProMK3.totalDeckHotcuePads);
  DEBUG("Deck(" + C.O + deckNum + C.RE + ") this.pads " + C.O + this.pads + C.RE + " (" + this.deckMainSliceStartIndex + "-" + (this.deckMainSliceStartIndex + 16) + ")")
  // save just first and last pad number for quick reference later
  this.padsFirst = this.pads[0];
  this.padsLast = this.pads[this.pads.length - 1];

  // what is the first sidepad of the set for this deck?
  this.deckSideSliceStartIndex = (LaunchpadProMK3.deck.config[deckNum].order - 1) * 4;
  DEBUG("Deck(" + C.O + deckNum + C.RE + ") this.deckSideSliceStartIndex " + C.O + (this.deckSideSliceStartIndex - 1))
  // what is the full set of four sidepads for this deck?
  this.deckSidepadAddresses = LaunchpadProMK3.sidepads.slice(this.deckSideSliceStartIndex, this.deckSideSliceStartIndex + 4);
  DEBUG("Deck(" + C.O + deckNum + C.RE + ") this.deckSidepadAddresses " + C.O + LaunchpadProMK3.sidepads.slice(this.deckSideSliceStartIndex, this.deckSideSliceStartIndex + 4))

  let deckLoaded = engine.getValue(`${this.currentDeck}`, "track_loaded");
  DEBUG("Deck(" + C.O + deckNum + C.RE + ") deckLoaded " + C.O + deckLoaded)
  DEBUG("Deck(" + C.O + deckNum + C.RE + ") deckColour " + C.O + "#" + this.deckColour.toString(16).toUpperCase() + C.RE + " (" + C.O + LaunchpadProMK3.hexToRGB(this.deckColour) + C.RE + ")")
  //// Deck Main Hotcues
  // initialise an array, attached to the object, that will hold the individual hotcue objects
  this.hotcueButtons = [];
  DEBUG("Deck(" + C.O + deckNum + C.G + ") ### start hotcue pads init", C.G, 1);


  channel = "[Channel" + deckNum + "]";

  // either 16 or 32
  // for the whole number of hotcues this deck will have..
  // MARK: Deck main pad init
  for (let i = 1; i <= LaunchpadProMK3.totalDeckHotcuePads; i += 1) {
    color_obj = "";
    this.i = i;
    let padAddress = this.pads[i - 1];
    // give the hotcue a number
    let hotcueNum = i;
    this.deckRgb = LaunchpadProMK3.darkenRGBColour(LaunchpadProMK3.hexToRGB(this.deckColour), LaunchpadProMK3.deckUnloadedDimscale);
    LaunchpadProMK3.sendRGB(padAddress, this.deckRgb[0], this.deckRgb[1], this.deckRgb[2]);

    // Create hotcue button, using ComponentsJS objects
    this.hotcueButtons[i - 1] = new components.HotcueButton({
      // Not using midi: because sysex is where it's at with this controller
      //midi: [0x90, padAddress],
      number: this.i, // This is the hotcue number
      padAddress: padAddress,

      // what happens when pads get pressed
      input: midi.makeInputHandler(0x90, padAddress, (channel, control, value, status) => {
        if (value !== 0) { DEBUG("Deck(" + C.O + deckNum + C.RE + ") (input):   main pad press: " + C.O + padAddress + C.RE + "   loaded? " + C.O + engine.getValue(`${this.currentDeck}`, "track_loaded") + C.RE + "   value: " + C.O + value + C.RE + "   page: " + C.O + LaunchpadProMK3.currentPage + C.RE + ")", C.RE, 1); }
        // check the deck is loaded with a track, that the page is right, that it's a button press not release
        //if (engine.getValue(`${this.currentDeck}`,"track_loaded") !== 1 || value === 0) { return; }


        //MARK: page 0 hotcues
        // hotcues, intro/outro, multihotcue creation, deck select
        if (LaunchpadProMK3.currentPage === 0) {
          // is shift pressed?
          if (LaunchpadProMK3.shift === 0) {
            // if shift not pressed: Hotcue Activation
            DEBUG("Deck(" + C.O + deckNum + C.RE + ") (input): no shift..  value " + C.O + value);
            // is this a note down or note up event?
            if (value !== 0) {
              DEBUG("Deck(" + C.O + deckNum + C.G + ") (input): deckNum" + C.O + deckNum + C.RE + "/" + C.O + this.currentDeck + C.RE + ",  i " + C.O + i + C.RE + ",  padAddress " + C.O + padAddress + C.RE + "/" + C.O + "0x" + padAddress.toString(16).padStart(2, "0").toUpperCase() + C.RE + "   hotcueNum " + C.O + hotcueNum, C.G, 0, 1);
              // activate creation trigger
              engine.setValue(this.currentDeck, "hotcue_" + hotcueNum + "_activate", 1)
              // set new last hotcue channel
              LaunchpadProMK3.lastHotcueChannel = this.currentDeck;
              // add new entry to undo list
              DEBUG(LaunchpadProMK3.lastHotcue.slice(-1))
              // construct name of control target
              hotcueName = "hotcue_" + (hotcueNum)
              DEBUG(hotcueName)
              // will this hotcue be the same as the last hotcue?
              // color_object = "";
              if (LaunchpadProMK3.lastHotcue[0] !== this.currentDeck && LaunchpadProMK3.lastHotcue.slice(-1) !== hotcueName) {
                LaunchpadProMK3.lastHotcue.unshift([this.currentDeck, hotcueName, padAddress, deckNum, color_obj]);
              }
              // on note up, deactivate control trigger
            } else if (value === 0) {
              engine.setValue(this.currentDeck, "hotcue_" + hotcueNum + "_activate", 0)
            }
            DEBUG("Deck(" + C.O + deckNum + C.RE + ") (input): LaunchpadProMK3.lastHotcue:  " + C.O + LaunchpadProMK3.lastHotcue);

            /// if shift is pressed: Hotcue Deletion
            if (LaunchpadProMK3.shift === 1) {
              DEBUG("Deck(" + C.O + deckNum + C.RE + ") (input): shift, hotcue clear " + C.RE + hotcueNum + C.G + " on " + C.RE + this.currentDeck, C.G);
              // helper function to toggle hotcue clear control on then off
              script.triggerControl(this.currentDeck, "hotcue_" + hotcueNum + "_clear", 50);
              // has to be full page refresh because a track could be on two decks
              LaunchpadProMK3.updateHotcuePage();
              DEBUG("Deck(" + C.O + deckNum + C.RE + ") (input): leaving hotcue page btton press..", C.R, 0, 1);
            }
          }
          DEBUG("Deck(" + C.O + deckNum + C.RE + ") (input): end of page 0 input action");
        }; //end of page0, hotcue input handler




        //MARK: page 1 beatjump
        // beatjump
        if (LaunchpadProMK3.currentPage === 1) {
          if (value !== 0) {
            // what control in the array is activated with this pad?
            let beatjumpControlSel = LaunchpadProMK3.beatjumpControls[hotcueNum - 1];
            script.triggerControl(this.currentDeck, beatjumpControlSel, 50);
            DEBUG("Deck(" + C.O + deckNum + C.RE + ") (input): BEATJUMP " + C.O + beatjumpControlSel + C.RE + " on deck " + this.currentDeck, C.G, 1);
          }
        };



        //MARK: page 2 bpmscale
        // bpm scaling
        if (LaunchpadProMK3.currentPage === 2) {
          // if a pad is pressed on page 2
          if (value !== 0) {
            DEBUG("Deck(" + C.O + deckNum + C.RE + ") (input): bpm scaling..  padAddress " + C.O + padAddress + C.RE);
            // check if this deck is loaded
            let columnIndex = (padAddress % 10 - 1);
            DEBUG("PAD DEBUG: padAddress=" + padAddress + " maps to columnIndex=" + columnIndex, C.Y);

            if (engine.getValue(this.currentDeck, "track_loaded") === 1) {
              // get what control this pad should trigger
              let bpmScaleColumnsControl = LaunchpadProMK3.bpmScaleColumns[columnIndex].control;
              // if the last number is zero
              DEBUG(parseInt(padAddress / 10));
              if (parseInt(padAddress / 10) % 2 !== 0) {
                // what is the first digit of the pad
                let firstDigit = Math.floor(padAddress / 10);
                // if the first digit is even then pad is stars up, and vice versa
                firstDigit % 2 === 0 ? bpmScaleColumnsControl = "stars_up" : bpmControlSel = "stars_down";
              }
              // trigger the control (on then off)
              script.triggerControl(this.currentDeck, bpmScaleColumnsControl, 50);
              DEBUG("Deck(" + C.O + deckNum + C.G + ") (input): bpmSCALE " + C.O + bpmScaleColumnsControl, C.G, 1);
              // refresh all the pads
              LaunchpadProMK3.updateBpmScalePage();
            }
          }
        }; //end page 2, bpm scaling



        //MARK: page 3 & 4 loops
        // loops
        if (LaunchpadProMK3.currentPage === 3 || LaunchpadProMK3.currentPage === 4) {
          if (value !== 0) {
            DEBUG("Deck(" + C.O + deckNum + C.G + ") (input): it's loopin time", C.G, 1);
            reverse = "";
            if (Object.values(LaunchpadProMK3.decks[1].pads).includes(padAddress)) { deck = 1 }
            if (Object.values(LaunchpadProMK3.decks[2].pads).includes(padAddress)) { deck = 2 }
            if (Object.values(LaunchpadProMK3.decks[3].pads).includes(padAddress)) { deck = 3 }
            if (Object.values(LaunchpadProMK3.decks[4].pads).includes(padAddress)) { deck = 4 }

            const firstDigit = parseInt(padAddress / 10);
            const lastDigit = padAddress % 10;
            if (firstDigit % 2 === 0) {
              fun = "beatloop_" // even
            } else {
              fun = "beatlooproll_" // odd
            }
            if (LaunchpadProMK3.currentPage === 4) { reverse = "r" }
            control = fun + reverse + LaunchpadProMK3.loopControls[lastDigit];
            DEBUG("Deck (input): loops   channel " + C.O + channel + C.RE + "   padAddress " + C.O + padAddress + C.RE + "   control " + C.O + control);
            script.toggleControl(channel, control, 50);
          };
        };
        //MARK: page 5 loop extra
        // loop
        if (LaunchpadProMK3.currentPage === 5) {
          if (value !== 0) {
            DEBUG("Deck(" + C.O + deckNum + C.G + ") (input): it's loopin extra tools time on page 5", C.G, 1)
          }
        } // end loop pages



        //MARK: page 6 onedeck
        // one deck
        if (LaunchpadProMK3.currentPage === 6) {
          if (value !== 0) {
            DEBUG("Deck(" + C.O + deckNum + C.G + ") (input): one deck time, page 6", C.G, 1)
            if (engine.getValue(this.currentDeck, "track_loaded") === 1) {
              deck = LaunchpadProMK3.selectedDeck;
              const firstDigit = parseInt(padAddress / 10);
              const lastDigit = padAddress % 10;
              if (firstDigit % 2 === 0) { fun = "beatloop_" } else { fun = "beatlooproll_" }
              if (firstDigit === 8 || firstDigit === 7) { padPoss = 4 }
              else if (firstDigit === 6 || firstDigit === 5) { padPoss = 4 }
              else if (firstDigit === 4 || firstDigit === 3) { padPoss = 4 }
              else if (firstDigit === 2 || firstDigit === 1) { padPoss = 4 }
            }
          }
        }
      }), //end input handler

      // how the lights of pads managed this way are changed
      sendRGB: function (color_obj) {
        if (LaunchpadProMK3.currentPage === 0) {
          let deckLoaded = engine.getValue(channel, "track_loaded");
          LaunchpadProMK3.sendRGB(this.padAddress, color_obj.red >> 1, color_obj.green >> 1, color_obj.blue >> 1);
        }
      } //end sendrgb method
    }) //end hotcue component

    //shutdown: undefined

    // bind action to a change of hotcue status
    engine.makeConnection(channel, "hotcue_" + hotcueNum + "_status", (value) => {
      //if (value === 0) { return }
      if (LaunchpadProMK3.currentPage === 0 || value !== 0) {
        let deckColour = this.deckColour // Get the deck color
        let deckRgb = LaunchpadProMK3.hexToRGB(deckColour);
        let deckDimUnloaded = LaunchpadProMK3.darkenRGBColour(deckRgb, LaunchpadProMK3.deckUnloadedDimscale);

        LaunchpadProMK3.sendRGB(padAddress, deckDimUnloaded[0], deckDimUnloaded[1], deckDimUnloaded[2]);
        DEBUG(">> makeConnection " + C.C + "hotcue_X_status" + C.RE + "   deckColour hex " + C.O + "#" + deckColour.toString(16) + C.RE + "   deckRgb " + C.O + deckRgb + C.RE + "   deckDimUnloaded " + C.O + deckDimUnloaded, C.G, 1);
      }
      if (value === 0) {

      }
    }); //end of makeConnection
  };
  DEBUG("Deck(" + C.O + deckNum + C.R + ") ### ending mainpads init", C.R, 0, 1);




  ////MARK: Deck sidepads init
  DEBUG("Deck(" + C.O + deckNum + C.G + ") ### intro/outro sidepads init", C.G);
  this.sideButtons = [];
  DEBUG("Deck(" + C.O + deckNum + C.RE + ") this.deckSidepadAddresses " + C.O + this.deckSidepadAddresses)
  for (sidepad = 1; sidepad <= 4; sidepad += 1) {
    //let padAddress = this.deckSidepadAddresses[sidepad-1]
    let padAddress = this.deckSidepadAddresses[sidepad - 1];
    if (LaunchpadProMK3.selectPage === 6) { padAddress = LaunchpadProMK3.sidepads[12 + sidepad] - 20 };
    // the sidepad control this loop will setup
    let sidepadControlName = LaunchpadProMK3.sidepadNames[sidepad - 1];
    let rgb = LaunchpadProMK3.hexToRGB(0x00FFFF)

    DEBUG("Deck(" + deckNum + ")" + C.RE + " side pad " + C.O + sidepad + C.RE + "   padAddress " + C.O + padAddress + C.RE + " (" + C.O + "0x" + padAddress.toString(16).padStart(2, "0").toUpperCase() + C.RE + ")", C.O)
    if (deckLoaded !== 1) { this.deckRgb = LaunchpadProMK3.darkenRGBColour(LaunchpadProMK3.hexToRGB(this.deckColour), LaunchpadProMK3.deckUnloadedDimscale); }
    if (deckLoaded === 1) { this.deckRgb = LaunchpadProMK3.darkenRGBColour(LaunchpadProMK3.hexToRGB(this.deckColour), LaunchpadProMK3.deckLoadedActiveDimscale); }
    LaunchpadProMK3.sendRGB(padAddress, this.deckRgb[0], this.deckRgb[1], this.deckRgb[2]);

    // Create hotcue button, using ComponentsJS objects
    this.sideButtons[sidepad - 1] = new components.Button({
      midi: [0xB0, padAddress],
      padAddress: this.padAddress, // Get ready
      // sendRGB: LaunchpadProMK3.sendRGB(this.sidepadAddress, 0x00, 0x00, 0xFF),

      // what to do when a sidepad is pressed
      input: midi.makeInputHandler(0xB0, padAddress, (channel, control, value, status) => {
        if (LaunchpadProMK3.currentPage === 0) {
          if (value !== 0) {
            if (LaunchpadProMK3.shift === 0) {
              DEBUG("Deck(" + C.O + deckNum + C.G + ") (input): side press: deck " + C.O + deckNum + C.RE + "   padAddress " + C.O + padAddress + C.RE + "/" + C.O + "0x" + padAddress.toString(16).padStart(2, "0").toUpperCase() + C.RE + "   sidepadControlName: " + C.O + sidepadControlName + C.G + "activate", C.G, 1);
              script.triggerControl(channel, `${sidepadControlName}activate`, 50);
              LaunchpadProMK3.lastHotcue.unshift([deckNum, sidepadControlName, padAddress, deckNum]);
            } else {
              script.triggerControl(channel, `${sidepadControlName}clear`, 50);
            };
          }
        }; //end page 0
        if (LaunchpadProMK3.currentPage === 2) {
          //if (value !== 0) {
          //}
        }; //end page 2
      }), //end sidepad input handler
    }); //end sidepad button components

    engine.makeConnection(channel, `${sidepadControlName}enabled`, (value) => {
      DEBUG(">> makeConnection " + C.O + sidepadControlName + C.RE + "activate enabled on deck " + C.O + deckNum + C.RE + " padAddress " + C.O + padAddress, C.G);
      if (LaunchpadProMK3.currentPage === 0) {
        LaunchpadProMK3.trackWithIntroOutro(1, deckNum, padAddress);
      }
    }); //end makeConnection
  }; //end sidepad init loop
  DEBUG("Deck(" + C.O + deckNum + C.R + "): ### ending sidepads init", C.R, 0, 1);



  // on track load, calculate scaled beat positions
  // MARK: makeConn track_loaded
  engine.makeConnection(channel, "track_loaded", function () {
    let value = engine.getValue(channel, "track_loaded")
    DEBUG(">> makeConnection:" + C.O + "track loaded event on deck " + C.R + deckNum + C.RE + "   value " + C.O + value, C.G, 1)
  })


  // MARK: makeConn bpm change
  engine.makeConnection(channel, `bpm`, function () {
    let value = engine.getValue(channel, "bpm")
    DEBUG(">> makeConnection:" + C.G + " bpm change event on deck " + C.R + deckNum + C.RE + "   value " + C.O + value, C.G, 2)
  })




  // on play/stop, stop all bpm timers
  // MARK: makeConn play/stop
  engine.makeConnection(channel, "play", function (value) {
    DEBUG(">> makeConnection:" + C.O + " play/stop event on deck " + C.R + deckNum + C.RE + "   value " + C.R + value, C.G, 2)
    if (LaunchpadProMK3.decks[deckNum].firstTriggerOfPlayConnection !== 0 || LaunchpadProMK3.decks[deckNum].firstTriggerOfPlayConnection === undefined) {
      let now = Date.now()
      if (now - LaunchpadProMK3.decks[deckNum].firstTriggerOfPlayConnection < 500) {
        DEBUG(">> makeConnection: play/stop, second play connection on deck " + C.R + deckNum + C.O + " within 500ms, ignoring..", C.O, 0, 1)
        return
      }
      LaunchpadProMK3.decks[deckNum].firstTriggerOfPlayConnection = 0
    }
    LaunchpadProMK3.decks[deckNum].firstTriggerOfPlayConnection = Date.now()
    let scaleColoursRgb = []
    let pads = LaunchpadProMK3.decks[deckNum].pads;
    // is the track being stopped, only handle BPM flash timers on page 2
    if (value === 0 && LaunchpadProMK3.currentPage === 2) {
      DEBUG(">> play/stop: track is now in a stopped state on deck " + C.R + deckNum + C.RE + ", stopping all BPM timers..", C.R);
      // stop all timers before resetting lights
      // reset lights on this deck to loaded normal scale colours
      LaunchpadProMK3.bpmResetToBpm(deckNum)
      // when play stops, we need to force reset the bpm flash steps
      DEBUG(">> play/stop: track stopped on deck " + C.O + deckNum + C.RE + ", resetting BPM colors", C.R);
    }

    if (value === 1 && LaunchpadProMK3.currentPage === 2) { // track started playing
      // LaunchpadProMK3.bpmResetToDeck(deckNum);
      let now = Date.now();
      DEBUG(">> play/stop: track now playing on deck " + C.R + deckNum + C.G + ", starting flash animations   now " + C.O + now + C.RE + "   LaunchpadProMK3.lastTriggerOfPlayConnection[deckNum] " + C.O + LaunchpadProMK3.lastTriggerOfPlayConnection[deckNum], C.G, 1);
      if (LaunchpadProMK3.lastTriggerOfPlayConnection[deckNum] === undefined) {
        LaunchpadProMK3.lastTriggerOfPlayConnection[deckNum] = now
      } else if (now - LaunchpadProMK3.lastTriggerOfPlayConnection[deckNum] < 20) {
        return
      }
      // Start flash animations for the pads in this deck
      let deckRgb = LaunchpadProMK3.decks[deckNum].deckRgb;
      // LaunchpadProMK3.bpmResetToDeck(deckNum);
    }
  })



  DEBUG("Deck(" + C.O + deckNum + C.G + ") ### init reconnect Components properties to group", C.G, 1);
  // Set the group properties of the above Components and connect their output callback functions
  this.reconnectComponents(function (c) {
    if (c.group === undefined) {
      // 'this' inside a function passed to reconnectComponents refers to the ComponentContainer
      // so 'this' refers to the custom Deck object being constructed
      c.group = this.currentDeck;
    }
    DEBUG("reconnectComponents(" + C.O + deckNum + C.O + ")" + C.RE + " (current group if group undefined)   " + C.O + c.group, C.O);
  })
  DEBUG("Deck(" + C.O + deckNum + C.R + ") ### end reconnect Components properties to group", C.R, 0, 1);
};

LaunchpadProMK3.Deck.prototype = new components.Deck();

//// End of Deck object setup



LaunchpadProMK3.clearBeatConnections = function () {
  // MARK: clearBeatConnections()
  if (LaunchpadProMK3.beatConnections && LaunchpadProMK3.beatConnections.length > 0) {
    DEBUG("clearBeatConnections: ### clearing " + C.O + LaunchpadProMK3.beatConnections.length + C.RE + " beat connections");
    // Disconnect each connection
    for (let i = 0; i < LaunchpadProMK3.beatConnections.length; i++) {
      let conn = LaunchpadProMK3.beatConnections[i];
      if (conn) {
        engine.disconnectControl(conn.group, conn.control, conn.callback);
        DEBUG("clearBeatConnections: disconnected " + C.O + conn.group + C.RE + "." + C.O + conn.control);
      }
    }
    // Clear the array
    LaunchpadProMK3.beatConnections = [];
  };
};






//// Single pad light functions

// Send RGB values to a single pad
// MARK: sendRGB/HEX()
LaunchpadProMK3.sendRGB = function (pad, r, g, b) {
  if (g === undefined && r !== undefined) {
    b = r[2];
    g = r[1];
    r = r[0];
  }
  if (r === undefined) rgb = [0, 0, 0];
  r = Math.floor(r / 2)
  g = Math.floor(g / 2)
  b = Math.floor(b / 2)
  LaunchpadProMK3.sendSysEx([0x03, 0x03, pad, r, g, b]);
};

LaunchpadProMK3.sendHEX = function (pad, hex) {
  var r = (hex >> 16) & 0xFF;
  var g = (hex >> 8) & 0xFF;
  var b = hex & 0xFF;
  //divided by two becaure MIDI is 0-127
  LaunchpadProMK3.sendSysEx([0x03, 0x03, pad, Math.floor(r / 2), Math.floor(g / 2), Math.floor(b / 2)]);
};



// Helper function to convert RGB hex value to individual R, G, B values
// MARK: hexToRGB()
LaunchpadProMK3.hexToRGB = function (hex) {
  // If it's already an array, return it
  if (Array.isArray(hex)) {
    return hex;
  }
  var r = (hex >> 16) & 0xFF;
  var g = (hex >> 8) & 0xFF;
  var b = hex & 0xFF;
  return [r, g, b];
};



// Darken an RGB colour by ratio
// MARK: darkenRGBColour()
LaunchpadProMK3.darkenRGBColour = function (rgbIn, ratio) {
  // if (ratio === undefined) { DEBUG("LaunchpadProMK3.darkenRGBColour   darken ratio undefined, so ratio = 0.2", C.O); ratio = 0.2 }
  // Clamp the ratio between 0 and 1
  ratio = Math.max(0, Math.min(1, ratio));
  // Apply non-linear scaling (square the ratio for better sensitivity)
  ratioNu = +(ratio ** 2).toFixed(4);
  let rgb = [];
  let debugMiddle = "";
  rgb[0] = Math.round(rgbIn[0] * ratioNu);
  rgb[1] = Math.round(rgbIn[1] * ratioNu);
  rgb[2] = Math.round(rgbIn[2] * ratioNu);
  if (rgbIn[0] > 127 || rgbIn[1] > 127 || rgbIn[2] > 127) { debugMiddle = C.R + "   OOVVEERR 127!" + C.RE }
  return rgb;
}

// toggle sidepad colour to blue or off
// MARK: p0 trackWithIntroOutro()
LaunchpadProMK3.trackWithIntroOutro = function (value, deckNum, padAddress) {
  if (value > 0) {
    LaunchpadProMK3.sendRGB(padAddress, 0x00, 0x00, 0xFF);
  } else {
    LaunchpadProMK3.sendRGB(padAddress, 0x00, 0x00, 0x00);
  }
};



//// Multiple pad light functions

LaunchpadProMK3.sendTopAndBottom = function (padAddress, rgb, rgb2, rgb3) {
  if (!rgb[2]) {
    LaunchpadProMK3.sendRGB(padAddress, rgb, rgb2, rgb3);
    LaunchpadProMK3.sendRGB(padAddress - 10, rgb, rgb2, rgb3);
  } else if (rgb2) {
    LaunchpadProMK3.sendRGB(padAddress, rgb[0], rgb[1], rgb[2]);
    LaunchpadProMK3.sendRGB(padAddress - 10, rgb[0], rgb[1], rgb[2]);
  }
}


// MARK: sidepadDeckColour()
LaunchpadProMK3.sidepadDeckColour = function (d) {
  DEBUG("LaunchpadProMK3.sidepadDeckColour()", C.G, 2)
  DEBUG("sidepadDeckColour:   d " + C.O + d, C.RE);

  let deckPosition = LaunchpadProMK3.deck.config[d].order;
  let deckColour = LaunchpadProMK3.deck.config[d].colour;
  let deckSidepadsStart = ((deckPosition - 1) * 4);
  DEBUG("sidepadDeckColour:   deckSidepadsStart " + C.O + deckSidepadsStart);

  // get hard copy of array of sidepad addresses for deck position
  const sidepads = LaunchpadProMK3.sidepads.slice(deckSidepadsStart, deckSidepadsStart + 4);
  DEBUG("sidepadDeckColour:   sidepads " + C.O + sidepads);

  // cut next LED address from sidepad list
  let nextAddress = sidepads.shift();
  DEBUG("sidepadDeckColour:   nextAddress " + C.O + nextAddress);
  LaunchpadProMK3.sendHEX(nextAddress, deckColour);
  // Set the color for current deck LED
  let next2Address = sidepads.shift();
  DEBUG("sidepadDeckColour:   next2Address " + C.O + next2Address, C.R);
  LaunchpadProMK3.sendHEX(next2Address, deckColour);
  // Set the color for next deck LED
  let next3Address = sidepads.shift();
  DEBUG("sidepadDeckColour:   next3Address " + C.O + next3Address, C.R);
  LaunchpadProMK3.sendHEX(next3Address, deckColour);
  // Set the color for next next deck LEDs
  let next4Address = sidepads.shift();
  DEBUG("sidepadDeckColour:   next4Address " + C.O + next4Address, C.R);
  LaunchpadProMK3.sendHEX(next4Address, deckColour);
  DEBUG("sidepadDeckColour:   extras side colour deck " + C.O + d + C.RE + "   nextAddress " + C.O + nextAddress + C.RE + "   next2Address " + C.O + next2Address + C.RE + "   next3Address " + C.O + next3Address + C.RE + "   next4Address " + C.O + next4Address + C.RE, C.RE, 0, 1);
}


// LEDs for changing page
LaunchpadProMK3.lightUpRow2 = function () {
  DEBUG("LaunchpadProMK3.lightUpRow2()", C.G, 0, 1)
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row2[0], 127, 110, 127);
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row2[1], 127, 110, 127);
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row2[2], 127, 110, 127);
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row2[3], 127, 110, 127);
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row2[4], 127, 110, 127);
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row2[5], 127, 110, 127);
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row2[6], 127, 110, 127);
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row2[0] + LaunchpadProMK3.currentPage, 127, 0, 20);
};




// MARK: gradientSetup()
LaunchpadProMK3.gradientSetup = function (deck, altpos, gradStartA, gradEndA, gradStartB, gradEndB) {
  let deckColour = LaunchpadProMK3.decks[deck].deckColour;
  let deckRgb = LaunchpadProMK3.hexToRGB(deckColour);
  DEBUG("gradientSetup: deck " + C.O + deck + C.RE + "   altpos " + C.O + altpos + C.RE + "   deckColour " + C.O + "#" + deckColour + C.RE + "   deckRgb " + C.O + deckRgb, C.G, 1);
  deckLoaded = engine.getValue(channel, "track_loaded");
  let gradLength = LaunchpadProMK3.totalDeckHotcuePads / 2
  let gradA = LaunchpadProMK3.gradientCalculate(gradStartA, gradEndA, gradLength);
  let gradB = LaunchpadProMK3.gradientCalculate(gradStartB, gradEndB, gradLength);
  let gradBoth = gradA.concat(gradB);
  DEBUG("gradientSetup:  gradBoth " + C.O + gradBoth + C.RE + "   len " + C.O + gradBoth.length);
  if (altpos === undefined) { altpos = 1 }
  let pads = ""
  if (LaunchpadProMK3.currentPage !== 6) {
    pads = LaunchpadProMK3.decks[deck].pads;
  } else {
    pads = LaunchpadProMK3.decks[altpos].pads;
  }
  DEBUG("gradientSetup: pads " + C.O + pads + C.RE + "   len " + C.O + pads.length);
  for (let pad of pads) {
    let toSend = gradBoth.shift();
    DEBUG("gradientSetup: toSend " + C.O + toSend + C.RE + "   len " + C.O + gradBoth.length);
    if (deckLoaded !== 1) { toSend = LaunchpadProMK3.darkenRGBColour(toSend, LaunchpadProMK3.deckLoadedActiveDimscale); }
    DEBUG("gradientSetup: gradBoth " + C.O + gradBoth + C.RE + "   len " + C.O + gradBoth.length);
    let r = toSend[0];
    let g = toSend[1];
    let b = toSend[2];
    DEBUG("toSend " + toSend + "    pad " + pad + "   r " + r + "  g " + g + "   b " + b, C.O);
    LaunchpadProMK3.sendRGB(pad, r, g, b);
  };
}


LaunchpadProMK3.gradientCalculate = function (color1, color2, steps) {
  const gradient = [];
  for (let i = 0; i < steps; i++) {
    let scale = i / (steps - 1);
    let r = Math.round(color1[0] * (1 - scale) + color2[0] * scale);
    let g = Math.round(color1[1] * (1 - scale) + color2[1] * scale);
    let b = Math.round(color1[2] * (1 - scale) + color2[2] * scale);
    DEBUG(`${r},${g},${b}`);
    gradient.push([r, g, b]);
  }
  return gradient;
};


//// clearing an resetting main hotcues
// MARK: clearMain()
// turn off main LEDs for page change
LaunchpadProMK3.clearMain = function () {
  //// main pads
  DEBUG("clearMain: /// clearing ALL main and side pads", C.G, 1);
  // turn all pads off by compiling a multi-led affecting sysex msg to send
  const colorSpecMulti = _.flatMap(LaunchpadProMK3.mainpadAddresses, (address) => [0x03, address, 0, 0, 0]);
  LaunchpadProMK3.sendSysEx([0x03].concat(colorSpecMulti));
  //// sidepads
  const colorSpecMultiSide = _.flatMap(LaunchpadProMK3.sidepads, (address) => [0x03, address, 0, 0, 0]);
  LaunchpadProMK3.sendSysEx([0x03].concat(colorSpecMultiSide));
  DEBUG("clearMain: /// end clearing ALL main and side pads", C.R);
};


// turn off ALL LEDs for page change or shutdown
// MARK: clearAll()
LaunchpadProMK3.clearAll = function () {
  DEBUG("/// clearing all pads", C.G, 2);
  // compile and send a two part msg to turn all pads off
  ca = [0x03]; cb = [0x03];
  for (i = 0; i <= 0x3F; i += 1) { ca = ca.concat([0x03, i, 0, 0, 0]); } LaunchpadProMK3.sendSysEx(ca);
  for (i = 0x40; i <= 0x7F; i += 1) { cb = cb.concat([0x03, i, 0, 0, 0]); } LaunchpadProMK3.sendSysEx(cb);
  DEBUG("/// end clearing all pads", C.R);
};


// Shutdown function that should be triggered by Mixxx on close
// MARK: shutdown()
LaunchpadProMK3.shutdown = function () {
  DEBUG("###  SHUTTINGDOWN..  ###", C.O, 2, 3);
  LaunchpadProMK3.clearAll();
  DEBUG("LaunchpadProMK3 controller script now exiting");
}





// Select deck and change LEDs
// MARK: selectDeck()
LaunchpadProMK3.selectDeck = function (deckNum) {
  DEBUG("selectDeck: deckNum " + C.O + deckNum + C.RE, C.G, 2)
  LaunchpadProMK3.sleep(50);
  // remember selection
  LaunchpadProMK3.selectedDeck = deckNum
  Object.entries(LaunchpadProMK3.deck.config).forEach((d) => {
    let deckRgb = LaunchpadProMK3.hexToRGB(d[1].colour);
    DEBUG("selectDeck: " + C.RE + "d " + C.O + JSON.stringify(d) + C.RE + "   deckNum " + C.O + deckRgb + C.RE + "   colour " + C.O + "#" + d[1].colour.toString(16) + C.RE + "   deckRgb " + C.O + deckRgb + C.RE + "   deck order " + C.O + d[1].order + C.RE + "/" + C.O + LaunchpadProMK3.totalDecks, C.O);
    if (+d[0] !== deckNum) {
      deckRgb = LaunchpadProMK3.darkenRGBColour(deckRgb, LaunchpadProMK3.deckUnloadedDimscale);
    }
    LaunchpadProMK3.sendRGB(100 + d[1].order, deckRgb);
    if (+d[0] === deckNum) {
      LaunchpadProMK3.sendRGB(hotcueCreationButton, deckRgb);
    }
  });
  if (LaunchpadProMK3.currentPage === 6) {
    LaunchpadProMK3.updateOneDeckPage()
  }
};




//// Page functions
// handle switching pages
// MARK: selectPage()
LaunchpadProMK3.selectPage = function (page) {
  // find target page if none provided
  DEBUG("selectPage(" + C.O + page + C.G + ")", C.G, 25);
  if (page === undefined) {
    page = (+LaunchpadProMK3.currentPage + 1) % 7;
    DEBUG("selectPage: page undefined, selectPage setting page to next page    " + C.M + page, C.O);
  }
  DEBUG("selectPage: switching page from " + C.M + LaunchpadProMK3.currentPage + C.O + " to " + C.M + page, C.O);
  LaunchpadProMK3.currentPage = page;

  for (let deckNum = 1; deckNum <= LaunchpadProMK3.totalDecks; deckNum++) {
    LaunchpadProMK3.cleanupScaledBeatConnections(deckNum);
  }

  if (page === 0) {
    LaunchpadProMK3.updateHotcuePage();
  }
  else if (page === 1) {
    LaunchpadProMK3.updateBeatjumpPage();
  }
  else if (page === 2) {
    LaunchpadProMK3.updateBpmScalePage();
  }
  else if (page === 3) {
    LaunchpadProMK3.updateLoopPage();
  }
  else if (page === 4) {
    LaunchpadProMK3.updateReverseLoopPage();
  }
  else if (page === 5) {
    LaunchpadProMK3.updateLoopExtrasPage();
  }
  else if (page === 6) {
    LaunchpadProMK3.updateOneDeckPage();
  }

  DEBUG("selectPage: resetting bottom row deck selection buttons for new page..", C.O)
  LaunchpadProMK3.lightUpRow2()

  DEBUG("selectPage: leaving selectPage(" + C.O + page + C.R + ")", C.R, 0, 20)
};


// update main and side pad lights for a specific deck
// MARK: p0 updateHotcueLights()
LaunchpadProMK3.updateHotcueLights = function (deckNum) {
  DEBUG("updateHotcueLights(" + deckNum + "): deck.config[" + deckNum + "] " + JSON.stringify(LaunchpadProMK3.deck.config[deckNum]), C.G, 2)
  let channel = `[Channel${deckNum}]`
  let deckColour = LaunchpadProMK3.deck.config[deckNum].colour;
  let deckRgb = LaunchpadProMK3.hexToRGB(deckColour);
  let deckLoaded = engine.getValue(channel, "track_loaded");
  let colourSpecMulti = [];

  // go through the hotcues one by one and make a longer multi-pad midi msg
  for (let i = 1; i <= LaunchpadProMK3.totalDeckHotcuePads; i += 1) {
    padAddress = LaunchpadProMK3.decks[deckNum].pads[i - 1];
    if (LaunchpadProMK3.currentPage === 6) { padAddress = LaunchpadProMK3.decks[4].pads[i - 1]; }
    if (deckLoaded !== 1) {
      padRgb = LaunchpadProMK3.darkenRGBColour(deckRgb, LaunchpadProMK3.deckUnloadedDimscale);
    }
    if (deckLoaded === 1) {
      // is the hotcue enabled?
      hotcueEnabled = engine.getValue(channel, `hotcue_${i}_status`);
      if (hotcueEnabled === 1) {
        // if so, get it's colour
        hotcueColour = engine.getValue(channel, `hotcue_${i}_color`);
        debugHotcueEnabled = "   hotcueEnabled " + C.O + hotcueEnabled + C.RE + "   hotcueColour " + C.O + "#" + hotcueColour.toString(16).padStart(6, "0").toUpperCase();
        padRgb = LaunchpadProMK3.darkenRGBColour(LaunchpadProMK3.hexToRGB(hotcueColour), LaunchpadProMK3.deckLoadedActiveDimscale);
        DEBUG("padRgb " + C.O + padRgb + C.RE)
      } else if (hotcueEnabled !== 1) {
        // if no hotcue, set pad to deck colour
        padRgb = LaunchpadProMK3.darkenRGBColour(deckRgb, LaunchpadProMK3.deckLoadedInactiveDimscale);
        DEBUG("  padRgb " + C.O + padRgb + C.RE)
      }
    }
    colourSpecMulti = colourSpecMulti.concat([0x03, padAddress, Math.floor(padRgb[0] / 2), Math.floor(padRgb[1] / 2), Math.floor(padRgb[2] / 2)]);
    DEBUG(colourSpecMulti)
    DEBUG("updateHotcueLights(" + C.O + deckNum + C.O + "): finished creating pad address sysex msg, sending...", C.O);
    LaunchpadProMK3.sendSysEx([0x03].concat(colourSpecMulti));
    colourSpecMulti = [];
  }

  DEBUG("updateHotcueLights(" + C.O + deckNum + C.O + "): finished creating pad address sysex msg, sending...", C.O);
  DEBUG("updateHotcueLights(" + C.O + deckNum + C.R + "): end updating main pads", C.R);

  // Sidebar, to blue and off
  DEBUG("updateHotcueLights(" + C.O + deckNum + C.G + "): update sidepad lights for deck " + C.O + deckNum, C.G, 1);
  for (let i = 1; i <= 4; i += 1) {
    let sidepad = (deckNum) * 4 + i;
    let padAddress = LaunchpadProMK3.decks[deckNum].deckSidepadAddresses[i - 1];
    if (LaunchpadProMK3.currentPage === 6) { padAddress = LaunchpadProMK3.sidepads[11 + i] };
    let sidepadControlName = LaunchpadProMK3.sidepadNames[i - 1];
    let sidepadEnabled = engine.getValue(channel, `${sidepadControlName}enabled`);
    if (sidepadEnabled === 1) {
      DEBUG("updateHotcueLights(" + C.O + deckNum + C.O + "): " + C.RE + "sidepad " + C.O + i + C.RE + "   sidepad " + C.O + sidepad + C.RE + "   padAddress " + C.O + padAddress + C.RE + "/" + C.O + "0x" + padAddress.toString(16).padStart(2, "0").toUpperCase() + C.RE + "   control " + C.O + sidepadControlName + C.G + "activate", C.O);
      LaunchpadProMK3.trackWithIntroOutro(1, deckNum, padAddress);
    } else {
      LaunchpadProMK3.trackWithIntroOutro(0, deckNum, padAddress);
    }
  }
  DEBUG("updateHotcueLights(" + C.O + deckNum + C.R + "): end updating sidepads", C.R);
};




/// First page (0)

// Function to update pad lights for each hotcue
// MARK: p0 updateHotcuePage()
LaunchpadProMK3.updateHotcuePage = function (deck) {
  if (LaunchpadProMK3.currentPage === 0) {
    DEBUG("  ", C.RE, 2);
    DEBUG("                              .o8                .                                                              .oooo.   ", C.M);
    DEBUG("                             '888              .o8                                                             d8P  Y8b  ", C.M);
    DEBUG(" oooo  ooo. .oo.oooos.   .oooo888   .oooo.   .o888oo  .ooooo.     oo.ooooo.   .oooo.    .oooooooo  .ooooo.    888    888 ", C.M);
    DEBUG(" `888  `888   888' `88b d88' `888  `P  )88b    888   d88' `88b     888' `88b `P  )88b  888' `88b  d88' `88b   888    888 ", C.M);
    DEBUG("  888   888   888   888 888   888   .oP'888    888   888ooo888     888   888  .oP'888  888   888  888ooo888   888    888 ", C.M);
    DEBUG("  888   888   888   888 888   888  d8(  888    888 . 888    .o     888   888 d8(  888  `88bod8P'  888    .o    88b  d88  ", C.M);
    DEBUG("  `V88V'V8P'  888bod8P' `Y8bod88P' `Y888''8o   '88'  `Y8bod8P'     888bod8P' `Y888''8o `8oooooo.  `Y8bod8P'     Y8bd8P   ", C.M);
    DEBUG("              888                                                  888                 d'     YD                         ", C.M);
    DEBUG("             o888o                                                o888o                 'Y88888P'                        ", C.M);
    DEBUG("  ");
    DEBUG("LaunchpadProMK3.updateHotcuePage()", C.G);
    if (deck === undefined) {
      DEBUG("updateHotcuePage(" + C.O + deck + C.O + "): deck undefined so updating all decks..", C.O);
      DEBUG("updateHotcuePage(" + C.O + deck + C.RE + "): LaunchpadProMK3.deck.config " + C.O + JSON.stringify(LaunchpadProMK3.deck.config));
      DEBUG("updateHotcuePage(" + C.O + deck + C.RE + "): LaunchpadProMK3.deck.config[deck] " + C.O + JSON.stringify(LaunchpadProMK3.deck.config[deck]));
      LaunchpadProMK3.updateHotcueLights(1);
      LaunchpadProMK3.updateHotcueLights(2);
      if (LaunchpadProMK3.totalDecks === 4) {
        LaunchpadProMK3.updateHotcueLights(3);
        LaunchpadProMK3.updateHotcueLights(4);
      }
      DEBUG("updateHotcuePage: end updating decks", C.R, 0, 1);
    } else {
      DEBUG("updateHotcuePage: ## updating deck " + C.O + deck, C.G);
      DEBUG("updateHotcuePage: deck " + C.O + JSON.stringify(deck));
      LaunchpadProMK3.updateHotcueLight(deck);
      DEBUG("updateHotcuePage: ### end updating deck", C.R, 0, 1);
    }
  }
};



// MARK: p0 undoLastHotcue()
LaunchpadProMK3.undoLastHotcue = function () {
  DEBUG("undoLastHotcue: ####################### undooooo", C.G, 1);
  // Check that a hotcue has been created
  let popped = LaunchpadProMK3.lastHotcue.shift();
  if (popped === undefined) { DEBUG("no undo stack"); return }
  DEBUG("undoLastHotcue: ## popped:  " + popped, C.O, 1);
  DEBUG("undoLastHotcue: ## LaunchpadProMK3.lastHotcue:  " + LaunchpadProMK3.lastHotcue, C.G, 1);
  DEBUG("undoLastHotcue: ## LaunchpadProMK3.redoLastDeletedHotcue:  " + LaunchpadProMK3.redoLastDeletedHotcue, C.G);
  let channel = popped[0];
  // Deserealise array
  let control = popped[1];
  let padAddress = popped[2];
  let deckNum = popped[3];
  DEBUG("## undoLastHotcue:   cont  " + control + ",   channel  " + channel + ",   deck  " + deckNum + ",   pad " + padAddress, C.O);
  let colour
  // Clear hotcue
  // Common JS func to toggle a control on then off again
  script.triggerControl(channel, control + "_clear", 64);
  // Add undone hotcue to redo list, in case
  LaunchpadProMK3.redoLastDeletedHotcue.unshift(popped);
  DEBUG("undoLastHotcue: ## LaunchpadProMK3.redoLastDeletedHotcue:  " + LaunchpadProMK3.redoLastDeletedHotcue);
  // Reset pad colour to deck colour
  LaunchpadProMK3.sendHEX(padAddress, LaunchpadProMK3.decks[deckNum].colour);
  LaunchpadProMK3.updateHotcuePage();
  DEBUG("undoLastHotcue: leaving undoLastHotcue..", C.R, 1, 1)
};


// MARK: p0 redoLastHotcue()
LaunchpadProMK3.redoLastHotcue = function () {
  DEBUG("redoLastHotcue: ####################### REDOOO", C.R, 1, 1);
  // Check if a hotcue has been undone
  if (LaunchpadProMK3.redoLastDeletedHotcue[0] === undefined) { return; }
  // Get the undone hotcue to redo
  let unpopped = LaunchpadProMK3.redoLastDeletedHotcue.shift();
  DEBUG("redoLastHotcue: ## unpopped:  " + unpopped, C.O, 1);
  DEBUG("redoLastHotcue: ## LaunchpadProMK3.redoLastDeletedHotcue:  " + LaunchpadProMK3.redoLastDeletedHotcue, C.O, 1);
  // Deserialise the hotcue to redo
  let channel = unpopped[0];
  let control = unpopped[1];
  let padAddress = unpopped[2];
  let deckNum = unpopped[3];
  let colour = unpopped[4];
  DEBUG("### redoLastHotcue:   cont; " + control + ",   chan; " + channel + ",   deck; " + deckNum + ",   pad;" + padAddress + "   colour " + colour);
  // Activate the hotcue to undelete it
  script.triggerControl(channel, control + "_activate", 64);
  // Add redone hotcue back to undo stack again
  LaunchpadProMK3.lastHotcue.unshift([channel, control, padAddress, deckNum]);
  DEBUG("## LaunchpadProMK3.lastHotcue:  " + LaunchpadProMK3.lastHotcue);
  LaunchpadProMK3.updateHotcuePage();
  DEBUG("redoLastHotcue: leaving redoLastHotcue..", C.R, 1, 1)
};



// MARK: p0 create4LeadupDropHotcues()
leadupCues = {
  "1": { control: "beatjump_128_backward", colour: 0x1DBEBD }, //teal
  "2": { control: "beatjump_64_forward", colour: 0x8DC63F }, //green
  "3": { control: "beatjump_32_forward", colour: 0xf8d200 }, //yellow
  "4": { control: "beatjump_16_forward", colour: 0xff8000 }, //orange
  "5": { control: "beatjump_16_forward", colour: 0xEF1441 } //red
}


function isCloseEnough(array, num, precision = 2) {
  return array.some(n => Math.abs(n - num) < Math.pow(10, -precision));
}


LaunchpadProMK3.create4LeadupDropHotcues = function (deck, value) {
  DEBUG(`create4LeadupDropHotcues: ## create hotcues  ${C.Y} -128 -64 -32 -16 ${C.R}drop ${C.RE}on ${C.O}${deck}`, C.G, 2);
  if (value === 0 || value === undefined) return 0;
  group = `[Channel${deck}]`;

  // what time is it right now?
  let now = Date.now()
  // is now at least a second after the last time?
  if (now < (lastHotcueCreationTime + 1000)) {
    DEBUG("create4LeadupDropHotcues: DENIED   " + lastHotcueCreationTime + "   " + now, C.R);
    return
  }
  // record now as the new lastwhat is the time right now?
  lastHotcueCreationTime = now
  // how long is the track in samples?
  let samplesTotal = engine.getValue(group, "track_samples");

  let hotcuePositions = [];
  // get the first twenty hotcue positions, store in an array
  for (let h = 0; h <= 19; h++) {
    hotcuePositions[h] = engine.getValue(group, "hotcue_" + (+h + 1) + "_position")
    //if (hotcuePositions[h]) hotcueRightmost = h;
  }
  DEBUG("create4LeadupDropHotcues: hotcuePositions  creation " + C.O + hotcuePositions);
  // for each of the controls in the object;
  DEBUG("create4LeadupDropHotcues: leadupCues " + C.O + JSON.stringify(leadupCues));
  for (const number of Object.entries(leadupCues)) {
    DEBUG(JSON.stringify(number))
    DEBUG("number " + C.O + number[1].control)
    let control = number[1].control
    let colour = number[1].colour
    DEBUG(`control ${C.O}${control}${C.RE}   colour ${C.O}#${colour.toString(16)}`, C.G, 1)
    // perform it
    engine.setValue(group, control, 1)
    // pause so the jump takes effect
    // LaunchpadProMK3.sleep(100);
    // how far through the track is ther, between 0 and 1
    playPosition = engine.getValue(group, "playposition");
    // if it's before 0, aka the start of the track then..
    DEBUG("create4LeadupDropHotcues: playPosition " + C.O + playPosition)
    if (playPosition <= 0) {
      // do nothing in this loop round
      DEBUG("create4LeadupDropHotcues: do nothing in this loop round", C.O)
    } else if (0 < playPosition) {
      // find the first unused hotcue
      DEBUG("create4LeadupDropHotcues: hotcuePositions mid " + C.O + hotcuePositions)
      // how many samples into the track right now?
      samplesNow = samplesTotal * playPosition;
      DEBUG("create4LeadupDropHotcues: samplesNow " + C.O + samplesNow)
      // has this sample position got a hotcue already?
      //if (!hotcuePositions.includes(samplesNow)) {
      if (!isCloseEnough(hotcuePositions, samplesNow, 3)) {
        hotcueSpace = hotcuePositions.findIndex((hotcueSpaceFree) => hotcueSpaceFree === -1)
        DEBUG("create4LeadupDropHotcues: hotcueSpace " + C.O + hotcueSpace)
        // if there is no hotcue space then give up
        if (hotcueSpace === -1) { DEBUG("create4LeadupDropHotcues: no hotcue space", C.R); return }
        // colate control
        hotcueSpaceTitle = "hotcue_" + (hotcueSpace + 1)
        DEBUG("create4LeadupDropHotcues: hotcueSpaceTitle " + C.O + hotcueSpaceTitle)
        // create new hotcue
        engine.setValue(group, hotcueSpaceTitle + "_set", 1);
        // give that hotcue its colour
        engine.setValue(group, hotcueSpaceTitle + "_color", colour); // green
        // what is its pad?
        DEBUG("create4LeadupDropHotcues: LaunchpadProMK3.decks[deck].deckMainSliceStartIndex " + C.O + LaunchpadProMK3.decks[deck].deckMainSliceStartIndex)
        pad = LaunchpadProMK3.decks[deck].deckMainSliceStartIndex + hotcueSpace;
        DEBUG("create4LeadupDropHotcues: pad " + C.O + pad)
        // add to undo list
        LaunchpadProMK3.lastHotcue.unshift([group, hotcueSpaceTitle, pad, deck, colour]);

        // add to existing check
        hotcuePositions[hotcueSpace] = samplesNow;
        DEBUG("create4LeadupDropHotcues: hotcuePositions end " + C.O + hotcuePositions, C.R, 0, 1)
      }
    }
  };

  //for (let X = hotcueRightmost; X <= 19; X++) {
  //  LaunchpadProMK3.sleep(25);

  DEBUG("create4LeadupDropHotcues: # end multi hotcue creation", C.R, 0, 2);
};


/// Second page (1)

LaunchpadProMK3.beatjumpControls = [
  //"beatjump",
  // MARK: p1 beatjumpControls()
  // Jump forward (positive) or backward (negative) by N beats. If a loop is active, the loop is moved by X beats

  //"beatjump_size",
  // Set the number of beats to jump with beatloop_activate / beatjump_forward / beatjump_backward
  //"beatjump_size_halve",
  // Halve the value of beatjump_size
  //"beatjump_size_double",
  // Double the value of beatjump_size

  //"beatjump_backward"
  // Jump backward by beatjump_size. If a loop is active, the loop is moved backward by X beats
  //"beatjump_forward",
  // Jump forward by beatjump_size. If a loop is active, the loop is moved forward by X beats

  //"beatjump_X_backward",0
  // Jump backward by X beats. If a loop is active, the loop is moved backward by X beats
  //"beatjump_X_forward",
  // Jump forward by X beats. If a loop is active, the loop is moved forward by X beats.
  // control exists for X = 0.03125, 0.0625, 0.125, 0.25, 0.5, 1, 2, 4, 8, 16, 32, 64, 128, 256, 512.
  "beatjump_128_backward",
  "beatjump_64_backward",
  "beatjump_32_backward",
  "beatjump_16_backward",


  "beatjump_8_backward",
  "beatjump_4_backward",
  "beatjump_2_backward",
  "beatjump_1_backward",

  "beatjump_128_forward",
  "beatjump_64_forward",
  "beatjump_32_forward",
  "beatjump_16_forward",

  "beatjump_8_forward",
  "beatjump_4_forward",
  "beatjump_2_forward",
  "beatjump_1_forward",
];

// Function to update beatjump page
// MARK: p1 updateBeatjumpPage()
LaunchpadProMK3.updateBeatjumpPage = function () {
  if (LaunchpadProMK3.currentPage === 1) {
    DEBUG("  ", C.RE, 2);
    DEBUG("                              .o8                .                                                               .o  ", C.M);
    DEBUG("                             '888              .o8                                                             o888  ", C.M);
    DEBUG(" oooo  oooo  oo.ooooo.   .oooo888   .oooo.   .o888oo  .ooooo.     oo.ooooo.   .oooo.    .oooooooo  .ooooo.      888  ", C.M);
    DEBUG(" `888  `888   888' `88b d88' `888  `P  )88b    888   d88' `88b     888' `88b `P  )88b  888' `88b  d88' `88b     888  ", C.M);
    DEBUG("  888   888   888   888 888   888   .oP'888    888   888ooo888     888   888  .oP'888  888   888  888ooo888     888  ", C.M);
    DEBUG("  888   888   888   888 888   888  d8(  888    888 . 888    .o     888   888 d8(  888  `88bod8P'  888    .o     888  ", C.M);
    DEBUG("  `V88V'V8P'  888bod8P' `Y8bod88P' `Y888''8o   '88'  `Y8bod8P'     888bod8P' `Y888''8o `8oooooo.  `Y8bod8P'    o888o ", C.M);
    DEBUG("              888                                                  888                 d'     YD                     ", C.M);
    DEBUG("             o888o                                                o888o                 'Y88888P'                    ", C.M);
    DEBUG("  ");
    DEBUG("updateBeatjumpPage()", C.G, 0, 1);

    LaunchpadProMK3.clearMain();
    for (let deckNum = 1; deckNum <= LaunchpadProMK3.totalDecks; deckNum += 1) {
      let deckColour = LaunchpadProMK3.decks[deckNum].deckColour;
      let deckRgb = LaunchpadProMK3.hexToRGB(deckColour);
      gradStartA = [20, 20, 20];
      gradEndA = [112, 112, 112];
      gradStartB = deckRgb;
      gradEndB = [127, 127, 127];
      LaunchpadProMK3.gradientSetup(deckNum, undefined, gradStartA, gradEndA, gradStartB, gradEndB);
    };
    //LaunchpadProMK3.beatjumpExtrasButtons
  }
};




/// Third page (2)

// change all main pads to deck colours
// MARK: p2 bpmResetToDeck()
LaunchpadProMK3.bpmResetToDeck = function (deckNum) {
  //// main pads
  DEBUG("bpmResetToDeck(" + C.O + deckNum + C.G + "): resetting main pads to deck colour", C.G);
  let order = LaunchpadProMK3.deck.config[deckNum].order
  let pads = LaunchpadProMK3.decks[deckNum].pads
  let deckColour = LaunchpadProMK3.decks[deckNum].deckColour
  let deckRgb = LaunchpadProMK3.hexToRGB(deckColour)
  DEBUG("bpmResetToDeck(" + C.O + deckNum + C.RE + "): pads " + C.O + pads, C.O);
  DEBUG("bpmResetToDeck(" + C.O + deckNum + C.RE + "): order " + C.O + order)
  DEBUG("bpmResetToDeck(" + C.O + deckNum + C.RE + "): deckColour " + C.O + "#" + deckColour.toString(16))
  DEBUG("bpmResetToDeck(" + C.O + deckNum + C.RE + "): deckRgb " + C.O + deckRgb)

  let deckLoaded = engine.getValue(`[Channel${deckNum}]`, "track_loaded");
  if (deckLoaded === 1) { deckRgb = LaunchpadProMK3.darkenRGBColour(deckRgb, LaunchpadProMK3.deckLoadedActiveDimscale); }
  if (deckLoaded !== 1) { deckRgb = LaunchpadProMK3.darkenRGBColour(deckRgb, LaunchpadProMK3.deckUnloadedDimscale); }
  pads.forEach((pad) => {
    LaunchpadProMK3.sendRGB(pad, deckRgb[0], deckRgb[1], deckRgb[2]);
  })
  DEBUG("bpmResetToDeck(" + C.O + deckNum + C.R + "): end resetting main pads to deck colour", C.R);
}
// }

// change all main pads to bpm scale column colours
// MARK: p2 bpmResetToBpm()
// LaunchpadProMK3.bpmResetToBpm = function (deckNum) {
//   if (deckNum) {
//     DEBUG("bpmResetToBpm: resetting main pads of deck " + C.R + deckNum + C.G + " to bpm scale column colour", C.G, 1);
//     let pads = LaunchpadProMK3.decks[deckNum].pads;
//     let columnCount = 0;
//     for (let pad of pads) {
//       let scaleColour = LaunchpadProMK3.bpmScaleColumns[columnCount % LaunchpadProMK3.bpmScaleColumns.length].colour;
//       let scaleRgb = LaunchpadProMK3.hexToRGB(scaleColour);
//       DEBUG("bpmResetToBpm: columnCount " + C.O + columnCount + C.RE + "   pad " + C.O + pad + C.RE + "   scaleColour " + C.O + "#" + scaleColour.toString(16) + C.RE + "   scaleRgb " + C.O + scaleRgb);
//       LaunchpadProMK3.sendRGB(pad, scaleRgb[0], scaleRgb[1], scaleRgb[2]);
//       columnCount = columnCount + 1;
//       if (columnCount === 8) columnCount = 0;
//     }
//     DEBUG("bpmResetToBpm: end resetting loaded deck main pads to bpm colour", C.R, 0, 1);
//   };
// }

// MARK: p2 bpmResetToBpm()
LaunchpadProMK3.bpmResetToBpm = function (deckNum) {
  if (deckNum) {
    DEBUG("bpmResetToBpm: Deck " + C.R + deckNum + C.G + ": Even rows get bpmScaleColumn colors, odd rows get deck color.", C.G, 1);
    let pads = LaunchpadProMK3.decks[deckNum].pads;
    let columnCount = 0; // To determine which of the 8 bpmScaleColumns colors to use
    let deckColourHex = LaunchpadProMK3.decks[deckNum].deckColour;
    let deckRgb = LaunchpadProMK3.hexToRGB(deckColourHex);

    for (let pad of pads) {
      // Determine the color from bpmScaleColumns based on the current column of the pad
      let scaleColumnColourHex = LaunchpadProMK3.bpmScaleColumns[columnCount % LaunchpadProMK3.bpmScaleColumns.length].colour;
      let scaleColumnRgb = LaunchpadProMK3.hexToRGB(scaleColumnColourHex);

      // Determine the row index (1-indexed from bottom, e.g., bottom hardware row is 1, top is 8)
      // This assumes pads are numbered 11-18 (row 1), 21-28 (row 2), ..., 81-88 (row 8)
      let rowIndexOneBased = Math.floor(pad / 10);

      let debugMsg = "bpmResetToBpm: Pad " + C.O + pad + C.RE + 
                     " (Col " + C.O + columnCount + C.RE + ", Row_1idx " + C.O + rowIndexOneBased + C.RE + ") " +
                     "ScaleCol: #" + C.O + scaleColumnColourHex.toString(16) + C.RE +
                     ", DeckCol: #" + C.O + deckColourHex.toString(16) + C.RE;

      if (rowIndexOneBased % 2 === 0) { // If the row index (1-based from bottom) is even
        // Even row: Use the color from bpmScaleColumns corresponding to the pad's column
        LaunchpadProMK3.sendRGB(pad, scaleColumnRgb[0], scaleColumnRgb[1], scaleColumnRgb[2]);
        DEBUG(debugMsg + " -> EVEN row, using scaleColor", C.P, 2);
      } else {
        // Odd row: Use the default deck color
        LaunchpadProMK3.sendRGB(pad, deckRgb[0], deckRgb[1], deckRgb[2]);
        DEBUG(debugMsg + " -> ODD row, using deckColor", C.P, 2);
      }
      
      columnCount = columnCount + 1;
      if (columnCount === 8) { // After processing 8 columns, reset for the next conceptual row of pads
        columnCount = 0;
      }
    }
    DEBUG("bpmResetToBpm: finished processing pads for deck " + C.R + deckNum, C.R, 0, 1);
  };
}


// Function to update bpm scale page
// MARK: p2 updateBpmScalePage()
LaunchpadProMK3.updateBpmScalePage = function () {
  if (LaunchpadProMK3.currentPage === 2) {
    DEBUG("  ");
    DEBUG("                              .o8                .                                                               .oooo.    ", C.M);
    DEBUG("                             '888              .o8                                                             .dP''Y88b   ", C.M);
    DEBUG("  oooo  ooo. .oo.oooos.   .oooo888   .oooo.   .o888oo  .ooooo.     oo.ooooo.   .oooo.    .oooooooo  .ooooo.           ]8P' ", C.M);
    DEBUG(" `888  `888   888' `88b d88' `888  `P  )88b    888   d88' `88b     888' `88b `P  )88b  888' `88b  d88' `88b        .d8P'   ", C.M);
    DEBUG("  888   888   888   888 888   888   .oP'888    888   888ooo888     888   888  .oP'888  888   888  888ooo888      .dP'      ", C.M);
    DEBUG("  888   888   888   888 888   888  d8(  888    888 . 888    .o     888   888 d8(  888  `88bod8P'  888    .o    .oP         ", C.M);
    DEBUG("  `V88V'V8P'  888bod8P' `Y8bod88P' `Y888''8o   '88'  `Y8bod8P'     888bod8P' `Y888''8o `8oooooo.  `Y8bod8P'    `8bd888P'   ", C.M);
    DEBUG("              888                                                  888                 d'     YD                           ", C.M);
    DEBUG("             o888o                                                o888o                 'Y88888P'                          ", C.M);
    DEBUG("  ");
    DEBUG("updateBpmScalePage()", C.G);
    LaunchpadProMK3.clearMain();

    // initialize arrays for BPM scaling
    LaunchpadProMK3.beatConnections = [];

    // Process all decks in a single loop for better performance
    for (let deckNum = 1; deckNum <= LaunchpadProMK3.totalDecks; deckNum++) {
      DEBUG("updateBpmScalePage(" + C.O + deckNum + C.G + "): ######### deckNum " + C.R + deckNum, C.G, 2);

      // Cache channel string to avoid repeated string concatenation
      const channel = `[Channel${deckNum}]`;
      // Get all needed engine values in one batch
      const bpm = engine.getValue(channel, "bpm");
      const isPlaying = bpm > 0 ? engine.getValue(channel, "play") : 0;

      // LaunchpadProMK3.bpmResetToDeck(deckNum);
      LaunchpadProMK3.setupScaledBeatConnections(deckNum);
      
      if (bpm > 0) {
        DEBUG("updateBpmScalePage(" + C.O + deckNum + C.G + "): yep it's loaded, resetting to bpm scale colour", C.G, 1);
        // reset to BPM scale color
        LaunchpadProMK3.bpmResetToBpm(deckNum);
        // get first pad for this deck
        const firstPad = LaunchpadProMK3.decks[deckNum].padsFirst;
        DEBUG("updateBpmScalePage(" + C.O + deckNum + C.G + "): firstPad " + C.R + firstPad, C.G, 1);
      } else {
        DEBUG("updateBpmScalePage(" + C.O + deckNum + C.G + "): nope it's not loaded, resetting to deck colour", C.G, 1);
        LaunchpadProMK3.bpmResetToDeck(deckNum);
      }
    }
  }
}
DEBUG("updateBpmScalePage: ## end of bpm scaling loop", C.R);


// MARK: isScaledBeatActive()
LaunchpadProMK3.isScaledBeatActive = function (deck, speedup) {
  // Get the current beat distance
  let distance = engine.getParameter("[Channel" + deck + "]", "beat_distance");
  // Apply the speedup factor and take modulo 1 to keep it in the 0-1 range
  let scaledDistance = (distance * speedup) % 1;
  // Return true if the beat is active (using the same logic as beat_active)
  // beat_active is essentially equivalent to distance <= 0.2 || distance >= 0.8
  return scaledDistance <= 0.2 || scaledDistance >= 0.8;
}


// MARK: setupScaledBeatConnections()
LaunchpadProMK3.setupScaledBeatConnections = function (deckNum) {
  DEBUG("setupScaledBeatConnections(" + C.O + deckNum + C.G + ")", C.G, 1);
  if (!LaunchpadProMK3.decks[deckNum].scaledBeatConnection) {
    let channel = "[Channel" + deckNum + "]"; // Not strictly needed if using script.deckFromGroup

    LaunchpadProMK3.decks[deckNum].scaledBeatConnection = engine.makeConnection(
      channel,
      "beat_distance",

      function (value, group, control) {
        const deckNum = script.deckFromGroup(group); // CRITICAL: get deck for THIS event, assign to user-preferred 'deckNum'
        //DEBUG_SETUP_SCALED_BEAT("beat_distance raw: " + value.toFixed(3) + " for deck " + deckNum, C.P);

        const numMasterDivisions = 12; 
        const numAnimationSteps = 4;   
        const ANIMATION_SCALED_BEATS_PER_STEP = 0.5; // Default: 1 scaled beat per animation step.
                                                   // Set to 2 for half speed (each step lasts 2 scaled beats).
                                                   // Set to 0.5 for double speed (each step lasts 0.5 scaled beats).

        if (typeof LaunchpadProMK3.lastQuantizedStep[deckNum] === 'undefined') {
            LaunchpadProMK3.lastQuantizedStep[deckNum] = -1;
            DEBUG_SETUP_SCALED_BEAT("Late init for lastQuantizedStep deck " + deckNum, C.R);
        }
        if (typeof LaunchpadProMK3.currentMainBeatCycle[deckNum] === 'undefined') {
            LaunchpadProMK3.currentMainBeatCycle[deckNum] = 0;
            DEBUG_SETUP_SCALED_BEAT("Late init for currentMainBeatCycle deck " + deckNum, C.R);
        }

        const currentQuantizedStepValue = Math.floor((value % 1.0) * numMasterDivisions);

        if ((LaunchpadProMK3.lastQuantizedStep[deckNum] === numMasterDivisions - 1 && currentQuantizedStepValue === 0) || LaunchpadProMK3.lastQuantizedStep[deckNum] === -1) {
            LaunchpadProMK3.currentMainBeatCycle[deckNum]++;
        }
        LaunchpadProMK3.lastQuantizedStep[deckNum] = currentQuantizedStepValue;

        const quantizedMainBeatDistance = LaunchpadProMK3.currentMainBeatCycle[deckNum] + (currentQuantizedStepValue / numMasterDivisions);

        const baseDeckRgbForAnim = LaunchpadProMK3.decks[deckNum].deckRgb; 
        const backgroundPadRgb = LaunchpadProMK3.darkenRGBColour(baseDeckRgbForAnim, 0.7);

        LaunchpadProMK3.bpmScaleColumns.forEach(column => {
          const scaleRgb = LaunchpadProMK3.hexToRGB(column.colour); 
          
          let topPad = LaunchpadProMK3.decks[deckNum].padsFirst + column.index -1; // User preferred name
          let bottomPad = topPad - 10; // User preferred name

          const totalScaledBeatProgress = quantizedMainBeatDistance * column.scale;
          let animationStep = Math.floor(totalScaledBeatProgress / ANIMATION_SCALED_BEATS_PER_STEP) % numAnimationSteps;
          
          const padStates = [
            { // State 0: Bottom Active, Top BG
              action: () => {
                LaunchpadProMK3.sendRGB(topPad, backgroundPadRgb[0], backgroundPadRgb[1], backgroundPadRgb[2]);
                LaunchpadProMK3.sendRGB(bottomPad, scaleRgb[0], scaleRgb[1], scaleRgb[2]); 
              }
            },
            { // State 1: Both Active
              action: () => {
                LaunchpadProMK3.sendRGB(topPad, backgroundPadRgb[0], backgroundPadRgb[1], backgroundPadRgb[2]);
                LaunchpadProMK3.sendRGB(bottomPad, backgroundPadRgb[0], backgroundPadRgb[1], backgroundPadRgb[2]);
                // LaunchpadProMK3.sendRGB(topPad, scaleRgb[0], scaleRgb[1], scaleRgb[2]);
                // LaunchpadProMK3.sendRGB(bottomPad, scaleRgb[0], scaleRgb[1], scaleRgb[2]);
              }
            },
            { // State 2: Top Active, Bottom BG
              action: () => {
                LaunchpadProMK3.sendRGB(topPad, scaleRgb[0], scaleRgb[1], scaleRgb[2]);
                LaunchpadProMK3.sendRGB(bottomPad, backgroundPadRgb[0], backgroundPadRgb[1], backgroundPadRgb[2]);
              }
            },
            { // State 3: Both BG (Reset)
              action: () => {
                LaunchpadProMK3.sendRGB(topPad, backgroundPadRgb[0], backgroundPadRgb[1], backgroundPadRgb[2]);
                LaunchpadProMK3.sendRGB(bottomPad, backgroundPadRgb[0], backgroundPadRgb[1], backgroundPadRgb[2]);
              }
            }
          ];

          if (padStates[animationStep]) {
            padStates[animationStep].action();
          } else {
            LaunchpadProMK3.sendRGB(bottomPad, backgroundPadRgb[0], backgroundPadRgb[1], backgroundPadRgb[2]);
            LaunchpadProMK3.sendRGB(topPad, backgroundPadRgb[0], backgroundPadRgb[1], backgroundPadRgb[2]);
          }
        });
      }
    );
  } else {
      DEBUG("setupScaledBeatConnections: Connection already exists for deck " + deckNum, C.Y);
  }
};
LaunchpadProMK3.cleanupScaledBeatConnections = function (deckNum) {
  if (LaunchpadProMK3.decks[deckNum] && LaunchpadProMK3.decks[deckNum].scaledBeatConnection) {
    LaunchpadProMK3.decks[deckNum].scaledBeatConnection.disconnect();
    LaunchpadProMK3.decks[deckNum].scaledBeatConnection = null;
    DEBUG("cleanupScaledBeatConnections(" + C.O + deckNum + C.G + "): cleaned up scaled beat connection for deck " + C.O + deckNum, C.G);
  }
}


/// Fourth page (3)

LaunchpadProMK3.loopControls = [
  //"beatloop_activate",
  // MARK: p3 loopControls()
  // Set a loop that is beatloop_size beats long and enables the loop
  //"beatloop_X_activate",
  // Activates a loop over X beats.
  //"beatloop_X_toggle",
  // Toggles a loop over X beats

  //"beatlooproll_activate",
  // Activates a rolling loop over beatloop_size beats. Once disabled, playback
  // will resume where the track would have been if it had not entered the loop.
  // "beatlooproll_X_activate",
  // ctivates rolling loop over X beats. Once disabled, playback resumes where
  // the track would have been if it had not entered the loop. A control exists
  // for X = 0.03125, 0.0625, 0.125, 0.25, 0.5, 1, 2, 4, 8, 16, 32, 64, 128, 256, 512  "_1_activate",
  "1_activate",
  "2_activate",
  "4_activate",
  "8_activate",
  "16_activate",
  "32_activate",
  "64_activate",
  "128_activate"
];

LaunchpadProMK3.updateLoopPage = function () {
  DEBUG("updateLoopPage");
  // Only update the page if on the 3rd page
  // MARK: p3 updateLoopPage()
  if (LaunchpadProMK3.currentPage === 3) {
    DEBUG("");
    DEBUG("                              .o8                .                                                               .oooo.   ", C.M);
    DEBUG("                             '888              .o8                                                             .dP''Y88b  ", C.M);
    DEBUG(" oooo  oooo  oo.ooooo.   .oooo888   .oooo.   .o888oo  .ooooo.     oo.ooooo.   .oooo.    .oooooooo  .ooooo.           ]8P' ", C.M);
    DEBUG(" `888  `888   888' `88b d88' `888  `P  )88b    888   d88' `88b     888' `88b `P  )88b  888' `88b  d88' `88b        <88b.  ", C.M);
    DEBUG("  888   888   888   888 888   888   .oP'888    888   888ooo888     888   888  .oP'888  888   888  888ooo888         `88b. ", C.M);
    DEBUG("  888   888   888   888 888   888  d8(  888    888 . 888    .o     888   888 d8(  888  `88bod8P'  888    .o         `88b. ", C.M);
    DEBUG("  `V88V'V8P'  888bod8P' `Y8bod88P' `Y888''8o   '88'  `Y8bod8P'     888bod8P' `Y888''8o `8oooooo.  `Y8bod8P'    `8bd88P'   ", C.M);
    DEBUG("              888                                                  888                 d'     YD                          ", C.M);
    DEBUG("             o888o                                                o888o                 'Y88888P'                         ", C.M);
    DEBUG("  ");
    DEBUG("### updateLoopPage()", C.G, 0, 1);

    LaunchpadProMK3.clearMain();
    for (let deck = 1; deck <= LaunchpadProMK3.totalDecks; deck += 1) {
      let deckColour = LaunchpadProMK3.decks[deck].deckColour;
      let deckRgb = LaunchpadProMK3.hexToRGB(deckColour);
      DEBUG("deck " + C.O + deck + C.RE + "   deckColour " + C.O + "#" + deckColour + C.RE + "   deckRgb " + C.O + deckRgb, C.G);

      gradStartA = [70, 70, 70];
      gradEndA = [10, 10, 30];
      //gradStartB = [20, 20, 20];
      //gradStartB = [120, 120, 120];
      gradStartB = [70, 70, 70];
      gradEndB = deckRgb;
      LaunchpadProMK3.gradientSetup(deck, undefined, gradStartA, gradEndA, gradStartB, gradEndB);
    };
    DEBUG("updateLoopPage: end deck gradient creation", C.R);
  };

  DEBUG("### end updateLoopPage", C.R, 1, 2);

};




/// Fifth page (4)
// MARK: p4 updateReverseLoopPage()
LaunchpadProMK3.updateReverseLoopPage = function () {
  if (LaunchpadProMK3.currentPage === 4) {
    DEBUG("  ")
    DEBUG("                              .o8                .                                                                   .o    ", C.M);
    DEBUG("                             '888              .o8                                                                 .d88    ", C.M);
    DEBUG(" oooo  oooo  oo.ooooo.   .oooo888   .oooo.   .o888oo  .ooooo.     oo.ooooo.   .oooo.    .oooooooo  .ooooo.       .d'888    ", C.M);
    DEBUG(" `888  `888   888' `88b d88' `888  `P  )88b    888   d88' `88b     888' `88b `P  )88b  888' `88b  d88' `88b    .d'  888    ", C.M);
    DEBUG("  888   888   888   888 888   888   .oP'888    888   888ooo888     888   888  .oP'888  888   888  888ooo888     88ooo888oo ", C.M);
    DEBUG("  888   888   888   888 888   888  d8(  888    888 . 888    .o     888   888 d8(  888  `88bod8P'  888    .o         888    ", C.M);
    DEBUG("  `V88V'V8P'  888bod8P' `Y8bod88P' `Y888''8o   '88'  `Y8bod8P'     888bod8P' `Y888''8o `8oooooo.  `Y8bod8P'      `8bd88P'  ", C.M);
    DEBUG("              888                                                  888                 d'     YD                           ", C.M);
    DEBUG("             o888o                                                o888o                 'Y88888P'                          ", C.M);
    DEBUG("  ");
    DEBUG("### updateReverseLoopPage()", C.G, 0, 1);

    LaunchpadProMK3.clearMain();
    for (let deck = 1; deck <= 4; deck += 1) {
      let deckColour = LaunchpadProMK3.decks[deck].deckColour;
      let deckRgb = LaunchpadProMK3.hexToRGB(deckColour);
      DEBUG("deck " + C.O + deck + C.RE + "   deckColour " + C.O + "#" + deckColour + C.RE + "   deckRgb " + C.O + deckRgb, C.G);
      gradStartA = [30, 10, 10];
      gradEndA = [127, 127, 127];
      gradStartB = [70, 70, 70];
      gradEndB = deckRgb;
      LaunchpadProMK3.gradientSetup(deck, undefined, gradStartA, gradEndA, gradStartB, gradEndB);
    };
    DEBUG("### end updateReverseLoopPage", C.R, 1, 2);
  };
};




// Sixth page (5)
// MARK: p5 updateLoopExtrasPage()
LaunchpadProMK3.updateLoopExtrasPage = function () {
  if (LaunchpadProMK3.currentPage === 5) {
    DEBUG("  ");
    DEBUG("                              .o8                .                                                               oooooooo ", C.M);
    DEBUG("                             '888              .o8                                                              dP''''''' ", C.M);
    DEBUG(" oooo  oooo  oo.ooooo.   .oooo888   .oooo.   .o888oo  .ooooo.     oo.ooooo.   .oooo.    .oooooooo  .ooooo.     d88888b.   ", C.M);
    DEBUG(" `888  `888   888' `88b d88' `888  `P  )88b    888   d88' `88b     888' `88b `P  )88b  888' `88b  d88' `88b       `Y88b   ", C.M);
    DEBUG("  888   888   888   888 888   888   .oP'888    888   888ooo888     888   888  .oP'888  888   888  888ooo888          ]88  ", C.M);
    DEBUG("  888   888   888   888 888   888  d8(  888    888 . 888    .o     888   888 d8(  888  `88bod8P'  888    .o    o.   .88P  ", C.M);
    DEBUG("  `V88V'V8P'  888bod8P' `Y8bod88P' `Y888''8o   '88'  `Y8bod8P'     888bod8P' `Y888''8o `8oooooo.  `Y8bod8P'    `8bd88P'   ", C.M);
    DEBUG("              888                                                  888                 d'     YD                          ", C.M);
    DEBUG("             o888o                                                o888o                 'Y88888P'                         ", C.M);
    DEBUG("  ")
    DEBUG("### updateLoopExtrasPage()", C.G, 0, 1);

    LaunchpadProMK3.clearMain();

    DEBUG("### end updateLoopExtrasPage", C.R, 1, 2);
  };
};



LaunchpadProMK3.loopMoveControls = [
  ///"loop_move",
  // MARK: p5 loopMoveControls()
  // Move loop forward by X beats (positive) or backward by X beats (negative).
  // If a saved loop is currently enabled, the modification is saved to the hotcue slot immediately.
  //"loop_move_x_forward",
  // Loop moves forward by X beats. If a saved loop is currently enabled, the modification is saved to the hotcue slot immediately.
  //"loop_move_x_backward",
  // Loop moves back by X beats. If a saved loop is currently enabled, the modification is saved to the hotcue slot immediately.
  "loop_move_1_backward",
  "loop_move_2_backward",
  "loop_move_4_backward",
  "loop_move_8_backward",
  "loop_move_16_backward",
  "loop_move_32_backward",
  "loop_move_64_backward",
  "loop_move_128_backward",

  "loop_move_1_forward",
  "loop_move_2_forward",
  "loop_move_4_forward",
  "loop_move_8_forward",
  "loop_move_16_forward",
  "loop_move_32_forward",
  "loop_move_64_forward",
  "loop_move_128_forward"
];



// seventh page (6)
// page that shows controls for only one deck

LaunchpadProMK3.updateOneDeckPage = function () {
  // MARK: p5 updateOneDeckPage()
  if (LaunchpadProMK3.currentPage === 6) {
    DEBUG("  ");
    DEBUG("                              .o8                .                                                              ", C.M);
    DEBUG("                             '888              .o8                                                              ", C.M);
    DEBUG(" oooo  oooo  oo.ooooo.   .oooo888   .oooo.   .o888oo  .ooooo.     oo.ooooo.   .oooo.    .oooooooo  .ooooo.      ", C.M);
    DEBUG(" `888  `888   888' `88b d88' `888  `P  )88b    888   d88' `88b     888' `88b `P  )88b  888' `88b  d88' `88b     ", C.M);
    DEBUG("  888   888   888   888 888   888   .oP'888    888   888ooo888     888   888  .oP'888  888   888  888ooo888    6", C.M);
    DEBUG("  888   888   888   888 888   888  d8(  888    888 . 888    .o     888   888 d8(  888  `88bod8P'  888    .o     ", C.M);
    DEBUG("  `V88V'V8P'  888bod8P' `Y8bod88P' `Y888''8o   '88'  `Y8bod8P'     888bod8P' `Y888''8o `8oooooo.  `Y8bod8P'     ", C.M);
    DEBUG("              888                                                  888                 d'     YD                ", C.M);
    DEBUG("             o888o                                                o888o                 'Y88888P'               ", C.M);
    DEBUG("  ")
    DEBUG("### updateOneDeckPage()", C.G, 0, 1);
    //if (address > 11 && address < 28) { padPoss = 4 }
    //if (address > 31 && address < 48) { padPoss = 3 }
    //if (address > 51 && address < 68) { padPoss = 2 }
    //if (address > 71 && address < 88) { padPoss = 1 }

    oneDeckCurrent = LaunchpadProMK3.selectedDeck;
    LaunchpadProMK3.clearMain();

    let deckColour = LaunchpadProMK3.decks[oneDeckCurrent].deckColour;
    let deckRgb = LaunchpadProMK3.hexToRGB(deckColour);

    DEBUG("updateOneDeckPage: deck " + C.O + oneDeckCurrent + C.RE + "   deckColour " + C.O + "#" + deckColour + C.RE + "   deckRgb " + C.O + deckRgb, C.G);
    DEBUG("updateOneDeckPage: top; rloop gradient;");
    gradStartA = [20, 0, 0];
    gradEndA = [127, 127, 127];
    gradStartB = [20, 20, 20];
    gradEndB = deckRgb;
    LaunchpadProMK3.gradientSetup(oneDeckCurrent, 3, gradStartA, gradEndA, gradStartB, gradEndB);
    LaunchpadProMK3.updateHotcueLights(oneDeckCurrent);

    DEBUG("updateOneDeckPage: middle; loop gradient;");
    DEBUG("updateOneDeckPage: deck " + C.O + oneDeckCurrent + C.RE + "   deckColour " + C.O + "#" + deckColour + C.RE + "   deckRgb " + C.O + deckRgb, C.G);
    gradStartA = [127, 127, 127];
    gradEndA = [0, 0, 20];
    gradStartB = deckRgb;
    gradEndB = [20, 20, 20];
    LaunchpadProMK3.gradientSetup(oneDeckCurrent, 1, gradStartA, gradEndA, gradStartB, gradEndB);
    LaunchpadProMK3.updateHotcueLights(oneDeckCurrent);

    DEBUG("updateOneDeckPage: bottom; beatjump gradient;");
    DEBUG("updateOneDeckPage: deck " + C.O + oneDeckCurrent + C.RE + "   deckColour " + C.O + "#" + deckColour + C.RE + "   deckRgb " + C.O + deckRgb, C.G);
    gradStartA = [20, 20, 20];
    gradEndA = [112, 112, 112];
    gradStartB = deckRgb;
    gradEndB = [127, 127, 127];
    LaunchpadProMK3.gradientSetup(oneDeckCurrent, 2, gradStartA, gradEndA, gradStartB, gradEndB);
    LaunchpadProMK3.updateHotcueLights(oneDeckCurrent);
  }// end page check
};