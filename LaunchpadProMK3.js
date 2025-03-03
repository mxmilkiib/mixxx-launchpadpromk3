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
// reduce duplicated logic, recheck objects
// make the core logic saner
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



//// Main object to represent the controller
var LaunchpadProMK3 = {};



/// DEBUG stuff
LaunchpadProMK3.DEBUGstate = 1;


// Terminal colour codes for DEBUG messages
const COLOURS = {
  RED: "[31m",
  GREEN: "[32m",
  ORANGE: "[33m",
  BLUE: "[34m",
  YELLOW: "[35m",
  MAGENTA : "[35m",
  CYAN : "[36m",
  RESET: "[0m"
};

// Shorthand for the above
const C = {
  R: COLOURS.RED,
  O: COLOURS.ORANGE,
  Y: COLOURS.YELLOW,
  G: COLOURS.GREEN,
  B: COLOURS.BLUE,
  M: COLOURS.MAGENTA,
  C: COLOURS.CYAN,
  RE: COLOURS.RESET
};


const DEBUG = function(message, colour, linesbefore, linesafter) {
  if (LaunchpadProMK3.DEBUGstate) {
    if (colour === undefined) { colour = ""; }
    if (typeof linesbefore === "number" && linesbefore > 0 && linesbefore < 50) { for (i = 0; i < linesbefore; i+= 1) { console.log(" "); } }
    console.log(`${COLOURS.RED}DEBUG ${COLOURS.RESET}${colour}${message}${COLOURS.RESET}`);
    if (typeof linesafter === "number" && linesafter > 0 && linesafter < 50) { for (i = 0; i < linesafter; i+= 1) { console.log(" "); } }
    //LaunchpadProMK3.sleep(1000)
  };
};

//const D = function(var1, var2, var3, var4, var5, var6) {
//  if (LaunchpadProMK3.DEBUGstate) {
//    console.log(`${C.R}D${C.RE}  ${var1)} ${C.O}   ${eval(var1)}   ${C.RE} ${var2} ${C.O}${var2}${C.RE} ${var3} ${C.O}${var3}${C.RE} ${var4} ${C.O}${var4}${C.RE} ${var5} ${C.O}${var5}${C.RE} ${var6} ${C.O}${var6}${C.RE}`)
//    //LaunchpadProMK3.sleep(333)
//  }
//};



//// Initialise main variables


// Init deck conf base object
LaunchpadProMK3.deck = LaunchpadProMK3.deck || {};

// MIDI addresses of the main 8x8 grid
LaunchpadProMK3.mainpadAddresses = [
  81, 82, 83, 84, 85, 86, 87, 88,
  71, 72, 73, 74, 75, 76, 77, 78,
  61, 62, 63, 64, 65, 66, 67, 68,
  51, 52, 53, 54, 55, 56, 57, 58,
  41, 42, 43, 44, 45, 46, 47, 48,
  31, 32, 33, 34, 35, 36, 37, 38,
  21, 22, 23, 24, 25, 26, 27, 28,
  11, 12, 13, 14, 15, 16, 17, 18 ];


// MIDI addresses of the left/right side pads
LaunchpadProMK3.sidepads = [
  80, 70, 89, 79,
  60, 50, 69, 59,
  40, 30, 49, 39,
  20, 10, 29, 19 ];


// Templates for assigning side pad controls
LaunchpadProMK3.sidepadNames = [
  "intro_start_",
  "intro_end_",
  "outro_start_",
  "outro_end_" ];


// row above main pads
LaunchpadProMK3.row0 = [ 0x5B, 0x5C, 0x5D, 0x5E, 0x5F, 0x60, 0x61, 0x62 ];

// rows below main pads
LaunchpadProMK3.row1 = [ 0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x6B, 0x6C ];
LaunchpadProMK3.row2 = [ 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08 ];


// Deck physical order (pad address offsets) and deck colours
LaunchpadProMK3.deck.config = {
  "3": { order: 1, colour: 0xfeb108 }, //yellow
  "1": { order: 2, colour: 0x378df7 }, //blue
  "2": { order: 3, colour: 0xd700d7 }, //magenta
  "4": { order: 4, colour: 0x88b31a }  //green
};


//LaunchpadProMK3.numberOfDecks = Object.keys(LaunchpadProMK3.deck.config).length;

const totalDecks = Object.keys(LaunchpadProMK3.deck.config).length;
const totalDeckHotcuePads = 64/totalDecks;


// full brightness LED colour is confusing
// these set how bright the LEDs are for loaded and unloaded decks
const deckLoadedDimscale = 0.35
const deckUnloadedDimscale = 0.2


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


LaunchpadProMK3.bpmFlash = [];


//// Initialisation and instantiation function; sets up decks, etc


LaunchpadProMK3.init = function() {

  DEBUG("######", C.M);
  DEBUG("######", C.O);
  DEBUG("######   init controller script n object", C.C);
  DEBUG("######", C.O);
  DEBUG("######", C.M);
  DEBUG("")
  DEBUG("ooooo                                                    oooo                                   .o8       ooooooooo.                           ooo        ooooo oooo    oooo   .oooo.", C.M)
  DEBUG("`888'                                                    `888                                  dc888      `888   `Y88.                         `88.       .888' `888   .8P'  .dPY''88b", C.M)
  DEBUG(" 888          .oooo.   oooo  oooo  ooo. .oo.    .ooooo.   888 .oo.   oo.ooooo.   .oooo.    .oooo888        888   .d88' oooo d8b  .ooooo.        888b     d'888   888  d8'          ]8P'", C.M)
  DEBUG(" 888         `P  )88b  `888  `888  `888P'Y88b  d88' `'Y8  888P'Y88b   888' `88b `P  )88b  d88' `888        888ooo88P'  `888''8P d88' `88b       8 Y88. .P  888   88888[          <88b.", C.M)
  DEBUG(" 888          .oP'888   888   888   888   888  888        888   888   888   888  .oP'888  888   888        888          888     888   888       8  `888'   888   888`88b.         `88b.", C.M)
  DEBUG(" 888       o d8(  888   888   888   888   888  888   .o8  888   888   888   888 d8(  888  888   888        888          888     888   888       8    Y     888   888  `88b.  o.   .88P", C.M)
  DEBUG("o888ooooood8 `Y888''8o  `V88V'V8P' o888o o888o `Y8bod8P' o888o o888o  888bod8P' `Y888''8o `Y8bod88P'      o888o        d888b    `Y8bod8P'      o8o        o888o o888o  o888o `8bd88P'", C.M)
  DEBUG("                                                                      888", C.M)
  DEBUG("                                                                     o888o", C.M)
  DEBUG("")
  DEBUG("created by Milkii, with thanks to various Mixxx devs on Zulip, the forum and GitHub for help!", C.M)


  // Set LPP3 from DAW mode to programmer mode
  LaunchpadProMK3.setProgrammerMode();

  // Clear already lit pads
  //LaunchpadProMK3.clearAll();



  // construct deck objects based on the Components Deck
  if (totalDecks === 4) {
    DEBUG("totalDecks = 4 decks", C.O, 1)
    LaunchpadProMK3.decks = {
      "1": new LaunchpadProMK3.Deck(1),
      "2": new LaunchpadProMK3.Deck(2),
      "3": new LaunchpadProMK3.Deck(3),
      "4": new LaunchpadProMK3.Deck(4),
    }
  } else if (totalDecks === 2) {
    DEBUG("totalDecks = 2 decks", C.O, 1)
    LaunchpadProMK3.decks = {
      "1": new LaunchpadProMK3.Deck(1),
      "2": new LaunchpadProMK3.Deck(2),
    }
    DEBUG("decks madeeeee", C.R, 1, 1)
  };


  // MIDI handlers for deck selection, actions, and page selection
  DEBUG("LaunchpadProMK3.initExtras()", C.R,1)
  LaunchpadProMK3.initExtras();

  // Select the initial desk
  DEBUG("LaunchpadProMK3.selectDeck(1)", C.R, 2)
  LaunchpadProMK3.selectDeck(1);

  // Initialise zeroth page (hotcues)
  DEBUG("LaunchpadProMK3.selectPage(0)", C.R, 2)
  LaunchpadProMK3. selectPage(0);

  DEBUG("######", C.R);
  DEBUG("######", C.O);
  DEBUG("init finished",C.G);
  DEBUG("######", C.O);
  DEBUG("######", C.R, 0, 24);

  LaunchpadProMK3.lightUpRow2(LaunchpadProMK3.currentPage);
};

// Set Launchpad Pro MK3 to Programmer Mode
LaunchpadProMK3.setProgrammerMode = function() {
  DEBUG("# sending programmer mode sysex..", C.O, 1);
  LaunchpadProMK3.sendSysEx([0x0E, 0x01]);
};


// Helper to construct and send SysEx message
LaunchpadProMK3.sendSysEx = function(data) {
  signal = [0xF0, 0x00, 0x20, 0x29, 0x02, 0x0E].concat(data, [0xF7]);
  //DEBUG(signal)
  midi.sendSysexMsg(signal, signal.length);
};




//abandoned experiment
//LaunchpadProMK3.initMidiHigher = function(cc, r, g, b, func, args) {
//  DEBUG(`initMidiHigher    cc: ${cc}   deck:   {deck}    func: ${func}   r: ${r}   g: ${g}   b: ${b}`)
//  midi.makeInputHandler(0xB0, cc, (channel, control, value, status, group) => {
//    if (value !== 0) { func }
//    LaunchpadProMK3.sendRGB(cc, r, g, b); // bright
//  })
//};




//// Initialise misc key bindings


LaunchpadProMK3.initExtras = function() {
  // Deck selection buttons
  // deck 3
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row1[0], (channel, control, value, status, _group) => {
    if (value !== 0) { LaunchpadProMK3.selectDeck(3); }
  });
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row1[0], 0xd7, 0x00, 0xd7); // bright

  // deck 1
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row1[1], (channel, control, value, status, _group) => {
    if (value !== 0) { LaunchpadProMK3.selectDeck(1); }
  });
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row1[1], 0x1D, 0x46, 0x7B); // bright

  // deck 2
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row1[2], (channel, control, value, status, group) => {
    if (value !== 0) { LaunchpadProMK3.selectDeck(2); }
  });
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row1[2], 0x7F, 0x58, 0x04); // bright

  // deck 4
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row1[3], (channel, control, value, status, group) => {
    if (value !== 0) { LaunchpadProMK3.selectDeck(4); }
  });
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row1[3], 0x44, 0x60, 0x0D); // bright



  // page 1
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row2[0], (channel, control, value, status, group) => {
    if (value !== 0) { LaunchpadProMK3.selectPage(0); }
  });
  // page 2
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row2[1], (channel, control, value, status, group) => {
    if (value !== 0) { LaunchpadProMK3.selectPage(1); }
  });
  // page 3
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row2[2], (channel, control, value, status, group) => {
    if (value !== 0) { LaunchpadProMK3.selectPage(2); }
  });
  // page 4
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row2[3], (channel, control, value, status, group) => {
    if (value !== 0) { LaunchpadProMK3.selectPage(3); }
  });
  // page 5
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row2[4], (channel, control, value, status, group) => {
    if (value !== 0) { LaunchpadProMK3.selectPage(4); }
  });
  // page 6
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row2[5], (channel, control, value, status, group) => {
    if (value !== 0) { LaunchpadProMK3.selectPage(5); }
  });
  // page 7
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row2[6], (channel, control, value, status, group) => {
    if (value !== 0) { LaunchpadProMK3.selectPage(6); }
  });


  // shift
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row2[7], (channel, control, value, status) => {
    if (value !== 0) {
      LaunchpadProMK3.shift = 1;
      LaunchpadProMK3.sendRGB(LaunchpadProMK3.row2[7], 0x2F, 0x7F, 0x7F);
      DEBUG("# shift on", C.G);
    } else if (value === 0) {
      LaunchpadProMK3.shift = 0;
      LaunchpadProMK3.sendRGB(LaunchpadProMK3.row2[7], 0x0B, 0x0B, 0x0F)  ;
      DEBUG("# shift off", C.G);
    }
  });
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row2[7], 0x0B, 0x0B, 0x0F);


  // undo last hotcue
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row0[0] , (channel, control, value, status) => {
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
  hotcueCreationButton = LaunchpadProMK3.row0[7]
  midi.makeInputHandler(0xB0, hotcueCreationButton, (channel, control, value, status, group) => {
    if (value !== 0) { LaunchpadProMK3.create4LeadupDropHotcues(LaunchpadProMK3.selectedDeck, value); }
  });
  LaunchpadProMK3.sendRGB(hotcueCreationButton, 0x7F, 0x7F, 0x7F);


  // hotcue color switch prev
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row0[4], (control, value, status, group) => {
    var channel = LaunchpadProMK3.lastHotcueChannel;
    if (typeof LaunchpadProMK3.lastHotcueChannel === "undefined") { return; }
    script.toggleControl(group,"hotcue_focus_color_prev");
  });
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row0[4], 0x20, 0x20, 0x7F);

  // hotcue color switch next
  midi.makeInputHandler(0xB0, LaunchpadProMK3.row0[5], (control, value, status, group) => {
    var channel = LaunchpadProMK3.lastHotcueChannel;
    if (typeof LaunchpadProMK3.lastHotcueChannel === "undefined") { return; }
    script.toggleControl(group,"hotcue_focus_color_next");
  });
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row0[5], 0x7F, 0x20, 0x20);
};



// Turn off main LEDs for page change
LaunchpadProMK3.clearMain = function() {
  //// main pads
  DEBUG("//// clearing main and side pads:", C.G, 1);
  // turn all pads off by compiling a multi-led affecting sysex msg to send
  //colorSpecMulti = LaunchpadProMK3.mainpadAddresses.map(address => [0x03, address, 0,0,0]).flatmap();
  const colorSpecMulti = _.flatMap(LaunchpadProMK3.mainpadAddresses, (address) => [0x03, address, 0,0,0]);
  LaunchpadProMK3.sendSysEx([0x03].concat(colorSpecMulti));
  //// sidepads
  const colorSpecMultiSide = _.flatMap(LaunchpadProMK3.sidepads, (address) => [0x03, address, 0,0,0]);
  LaunchpadProMK3.sendSysEx([0x03].concat(colorSpecMultiSide));
  DEBUG("/// end clearing main and side pads", C.R, 0, 2);
};


// Turn off ALL LEDs for page change or shutdown
LaunchpadProMK3.clearAll = function() {
  DEBUG("////  clearing all pads", C.G, 2);
  // compile and send a two part msg to turn all pads off
  ca = [0x03]; cb = [0x03];
  for (i = 0; i <= 0x3F; i+= 1) { ca = ca.concat([0x03, i, 0,0,0]); } LaunchpadProMK3.sendSysEx(ca);
  for (i = 0x40; i <= 0x7F; i+= 1) { cb = cb.concat([0x03, i, 0,0,0]); } LaunchpadProMK3.sendSysEx(cb);
  DEBUG("/// end clearing all pads", C.R);
};


// Shutdown function that should be triggered by Mixxx on close
LaunchpadProMK3.shutdown = function() {
  DEBUG("###  SHUTTINGDOWN  ###", C.O, 2, 3);
  LaunchpadProMK3.stopBpmTimers();
  LaunchpadProMK3.clearAll();
};






//// Deck constructor


LaunchpadProMK3.Deck = function (deckNumber) {
  //D(LaunchpadProMK3.DEBUGstate, C.M, this.deckColour, this.pads, test)
  DEBUG("", C.RE, 2)
  DEBUG("  o8o               o8o      .             .o8                      oooo",       C.M);
  DEBUG("  `''               `''    .o8            '888                      `888",       C.M);
  DEBUG(" oooo  ooo. .oo.   oooo  .o888oo      .oooo888   .ooooo.   .ooooo.   888  oooo", C.M);
  DEBUG(" 888  `888P'Y88b  `888    888        d88' `888  d88' `88b d88' `'Y8  888 .8P'",  C.M);
  DEBUG(" 888   888   888   888    888        888   888  888ooo888 888        888888.",   C.M);
  DEBUG(" 888   888   888   888    888 .      888   888  888    .o 888   .o8  888 `88b.", C.M);
  DEBUG(" o888o o888o o888o o888o   '888'     `Y8bod88P' `Y8bod8P' `Y8bod8P' o888o o888o",C.M);
  DEBUG("");
  DEBUG("#### constructing deck " + deckNumber, C.M, 2);
  // connect deck object to Components system
  components.Deck.call(this, deckNumber);

  // give object the deck colour
  this.deckColour = LaunchpadProMK3.deck.config[deckNumber].colour;
  DEBUG("### " +C.RE+ " deck object instantiation   deckNumber " +C.O+ deckNumber +C.RE+ "   this.currentDeck " +C.O+ this.currentDeck +C.RE+ "   colour " +C.O+ "#" + this.deckColour.toString(16).padStart(6, "0").toUpperCase(), C.O);
  // give object its physical order
  this.deckOrderIndex = LaunchpadProMK3.deck.config[deckNumber].order;
  DEBUG("this.deckOrderIndex (LaunchpadProMK3.deck.config[deckNumber].order) " +C.O+ LaunchpadProMK3.deck.config[deckNumber].order)
  // what pad is the first of the set the deck will manage?
  this.deckMainSliceStartIndex = (this.deckOrderIndex - 1) * totalDeckHotcuePads;
  DEBUG("this.deckMainSliceStartIndex " +C.O+ this.deckMainSliceStartIndex)
  // what is the set of main grid pads this deck will manage?
  this.pads = LaunchpadProMK3.mainpadAddresses.slice(this.deckMainSliceStartIndex, this.deckMainSliceStartIndex + totalDeckHotcuePads);
  DEBUG("this.pads " +C.O+ LaunchpadProMK3.mainpadAddresses.slice(this.deckMainSliceStartIndex, this.deckMainSliceStartIndex + totalDeckHotcuePads))

  // sidepads
  DEBUG(LaunchpadProMK3.sidepads, 1, 1)
  // what is the first sidepad of the set for this deck?
  this.deckSideSliceStartIndex = (LaunchpadProMK3.deck.config[deckNumber].order - 1) * 4;
  // what is the full set of side pads this deck will use?
  this.deckSidepadAddresses = LaunchpadProMK3.sidepads.slice(this.deckSideSliceStartIndex,this.deckSideSliceStartIndex + 4);
  DEBUG("this.deckSideSliceStartIndex " +C.O+ this.deckSideSliceStartIndex - 1)
  DEBUG("this.deckSidepadAddresses " +C.O+ LaunchpadProMK3.sidepads.slice(this.deckSideSliceStartIndex,this.deckSideSliceStartIndex + 4))

  // make it so when a track is loaded on this deck the function to deal with that is called
  engine.makeConnection(`[Channel${deckNumber}]`, "track_loaded", LaunchpadProMK3.onTrackLoadedOrUnloaded);


  //// Deck Main Hotcues
  // initialise an array, attached to the object, that will hold the individual hotcue objects
  this.hotcueButtons = [];
  DEBUG("## hotcue pads init", C.G, 1);

  // either 16 or 32
  // for the whole number of hotcues this deck will have..
  for (let i = 1; i <= totalDeckHotcuePads; i+=1) {
    color_object = "";
    this.i = i;
    let padAddress = this.pads[i-1];
    // give the hotcue a number,
    let hotcueNum = i;
    // is this deck loaded?
    deckLoaded = engine.getValue(`${this.currentDeck}`, "track_loaded");
    DEBUG(padAddress)
    DEBUG("i " +C.O+ i +C.RE+ "    padAddress " +C.O+ padAddress +C.RE+ " / " +C.O+ "0x" + padAddress.toString(16).padStart(2, "0").toUpperCase() +C.RE+ "   deck " +C.O+ this.currentDeck +C.RE+ "   deckLoaded " +C.R+ deckLoaded +C.RE+ "   deckColour " +C.O+ "#" + this.deckColour.toString(16).toUpperCase() +C.RE+ " (" +C.O+ LaunchpadProMK3.hexToRGB(this.deckColour) +C.RE+ ")");

    if (deckLoaded !== 1) { this.deckColourBg = LaunchpadProMK3.darkenRGBColour(LaunchpadProMK3.hexToRGB(this.deckColour), deckUnloadedDimscale); }
    if (deckLoaded === 1) { this.deckColourBg = LaunchpadProMK3.darkenRGBColour(LaunchpadProMK3.hexToRGB(this.deckColour), deckLoadedDimscale); }
    //this.deckColourBg = LaunchpadProMK3.hexToRGB(this.deckColourBg)
    LaunchpadProMK3.sendRGB(padAddress, this.deckColourBg[0], this.deckColourBg[1], this.deckColourBg[2]);

    // Create hotcue button, using ComponentsJS objects/methods
    this.hotcueButtons[i-1] = new components.HotcueButton({
      // Not using midi: because sysex is where it's at with this controller
      //midi: [0x90, padAddress],
      number: this.i, // This is the hotcue number
      padAddress: padAddress,

      // what happens when pads get pressed
      input: midi.makeInputHandler(0x90, padAddress, (channel, control, value, status) => {
        if (value !== 0) { DEBUG("(main pad press: " +C.RE+ "loaded? " +C.O+ engine.getValue(`${this.currentDeck}`,"track_loaded") +C.RE+ "   value: " +C.O+ value +C.RE+ "   page: " +C.O+ LaunchpadProMK3.currentPage +C.RE+ ")", C.RE, 1); }
        // check the deck is loaded with a track, that the page is right, that it's a button press not release
        //if (engine.getValue(`${this.currentDeck}`,"track_loaded") !== 1 || value === 0) { return; }

        //0
        // hotcues, intro/outro, multihotcue creation, deck select
        if (LaunchpadProMK3.currentPage === 0) {
          // is shift pressed?
          if (LaunchpadProMK3.shift === 0) {
            // if shift not pressed: Hotcue Activation
            DEBUG("no shift..  value " + value, C.O);
            // is this a note down or note up event?
            if (value !== 0) {
              DEBUG("input: deckNumber " +C.O+ deckNumber +C.RE+ "/" +C.O+ this.currentDeck +C.RE+ ",  i " +C.O+ i +C.RE+ ",  padAddress " +C.O+ padAddress +C.RE+ "/" +C.O+ "0x" + padAddress.toString(16).padStart(2, "0").toUpperCase() +C.RE+ "   hotcueNum " +C.O+ hotcueNum, C.G, 0, 1);
              // activate creation trigger
              engine.setValue(this.currentDeck, "hotcue_" +hotcueNum+ "_activate", 1)
              // set new last hotcue channel
              LaunchpadProMK3.lastHotcueChannel = this.currentDeck;
              // add new entry to undo list
              DEBUG(LaunchpadProMK3.lastHotcue.slice(-1))
              // construct name of control target
              hotcueName = "hotcue_" + hotcueNum
              DEBUG(hotcueName)
              // will this hotcue be the same as the last hotcue?
              if (LaunchpadProMK3.lastHotcue[0] !== this.currentDeck && LaunchpadProMK3.lastHotcue.slice(-1) !== hotcueName) {
                LaunchpadProMK3.lastHotcue.unshift([this.currentDeck, hotcueName, padAddress, deckNumber, color_obj]);
              }
              // on note up, deactivate control trigger
            } else if (value === 0) {
              engine.setValue(this.currentDeck, "hotcue_" +hotcueNum+ "_activate", 0)
            }
            DEBUG("LaunchpadProMK3.lastHotcue:  " +C.O+ LaunchpadProMK3.lastHotcue);

            /// if shift is pressed: Hotcue Deletion
            if (LaunchpadProMK3.shift === 1) {
              DEBUG("shift, hotcue clear " +C.RE+ hotcueNum +C.G+ " on " +C.RE+ this.currentDeck,C.G);
              // helper function to toggle hotcue clear control on then off
              script.triggerControl(this.currentDeck, "hotcue_" + hotcueNum + "_clear", 50);
              // has to be full page refresh because a track could be on two decks
              LaunchpadProMK3.updateHotcuePage();
              DEBUG("leaving hotcue page btton press..", C.R, 0, 1);
            }
          }
          DEBUG("end of page 0 input action");
        }; //end of page0, hotcue input handler

        //1
        // beatjump
        if (LaunchpadProMK3.currentPage === 1) {
          if (value !== 0) {
            // what control in the array is activated with this pad?
            let beatjumpControlSel = LaunchpadProMK3.beatjumpControls[hotcueNum-1];
            script.triggerControl(this.currentDeck, beatjumpControlSel, 50);
            DEBUG("BEATJUMP " +C.O+ beatjumpControlSel +C.RE+ " on deck " + this.currentDeck, C.G, 1);
          }
        };

        //2
        // bpm scaling
        if (LaunchpadProMK3.currentPage === 2) {
          // if a pad is pressed on page 2
          if (value !== 0) {
            DEBUG(padAddress);
            // check if this deck is loaded
            if (engine.getValue(this.currentDeck, "track_loaded") === 1) {
              // get what control this pad should trigger
              let bpmScalingControl = LaunchpadProMK3.bpmScaling[padAddress % 10].control;
              // if the last number is zero
              DEBUG(parseInt(padAddress/10));
              if (parseInt(padAddress/10) % 2 !== 0) {
                // what is the first digit of the pad
                let firstDigit = Math.floor(padAddress / 10);
                // if the first digit is even then pad is stars up, and vice versa
                firstDigit % 2 === 0 ? bpmScalingControl = "stars_up" : bpmControlSel = "stars_down";
              }
              // trigger the control (on then off)
              script.triggerControl(this.currentDeck, bpmScalingControl, 50);
              DEBUG("bpmSCALE " +C.O+ bpmScalingControl +C.RE+ " on deck " + this.currentDeck, C.G, 1);
              // refresh all the pads
              LaunchpadProMK3.updateBpmScalePage();
            }
          }
        }; //end page 2, bpm scaling

        //3 & 4
        // loops
        if (LaunchpadProMK3.currentPage === 3 || LaunchpadProMK3.currentPage === 4) {
          if (value !== 0) {
            DEBUG("it's loopin time")
            reverse = "";
            if (Object.values(LaunchpadProMK3.decks[1].pads).includes(padAddress)) { deck = 1 }
            if (Object.values(LaunchpadProMK3.decks[2].pads).includes(padAddress)) { deck = 2 }
            if (Object.values(LaunchpadProMK3.decks[3].pads).includes(padAddress)) { deck = 3 }
            if (Object.values(LaunchpadProMK3.decks[4].pads).includes(padAddress)) { deck = 4 }

            channel = "[Channel" + deck + "]";
            const firstDigit = parseInt(padAddress / 10);
            const lastDigit = padAddress % 10;
            if (firstDigit % 2 === 0) {
              fun = "beatloop_" // even
            } else {
              fun = "beatlooproll_" // odd
            }
            if (LaunchpadProMK3.currentPage === 4) { reverse = "r" }
            control = fun + reverse + LaunchpadProMK3.loopControls[lastDigit];
            DEBUG("loops   channel " + channel + "   padAddress " + padAddress + "   control " + control);
            script.toggleControl(channel, control, 50);
          };
        };
        //5
        // loop
        if (LaunchpadProMK3.currentPage === 5) {
          if (value !== 0) {
            DEBUG("it's loopin extra tools time on page 5")
          }
        } // end loop pages

        //6
        // one deck
        if (LaunchpadProMK3.currentPage === 6) {
          if (value !== 0) {
            DEBUG("one deck time, page 6")
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
        //DEBUG("this.deckColour: " +C.O+ this.deckColour)
        //let rgb = LaunchpadProMK3.hexToRGB(this.deckColour);
        //DEBUG("rgb " +C.O+ rgb)
        //if (deckLoaded !== 1) { rgb = LaunchpadProMK3.darkenRGBColour(rgb, deckUnloadedDimscale) }
        if (LaunchpadProMK3.currentPage === 0) {
          let deckLoaded = engine.getValue(`[Channel${deckNumber}]`, "track_loaded");
          DEBUG("sendRGB: " +C.RE+ "color_obj " +C.O+ JSON.stringify(color_obj) +C.RE+ "   deckNumber " +C.O+ deckNumber +C.RE+ "   i " +C.O+ i +C.RE+ "   padAddress " +C.O+ padAddress +C.RE+ " / " +C.O+ "0x" + padAddress.toString(16).padStart(2, "0").toUpperCase() +C.RE+ "   deckLoaded " +C.O+ deckLoaded, C.G, 1, 1);
          LaunchpadProMK3.sendRGB(this.padAddress, color_obj.red>>1,color_obj.green>>1,color_obj.blue>>1);
        }
      } //end sendrgb method
    }) //end hotcue component

    //shutdown: undefined

    // bind action to a change of hotcue status
    DEBUG("makeConnection")
    engine.makeConnection(`[Channel${deckNumber}]`, `hotcue_${hotcueNum}_status`, (value) => {
      //if (value === 0) { return }
      if (LaunchpadProMK3.currentPage === 0 || value !== 0) {
        let deckColour = this.deckColour // Get the deck color
        let deckColourRgb = LaunchpadProMK3.hexToRGB(deckColour);
        let deckColourBg = LaunchpadProMK3.darkenRGBColour(deckColourRgb, deckUnloadedDimscale);
        LaunchpadProMK3.sendRGB(padAddress, deckColourBg);
        DEBUG("makeConnection " +C.RE+ " hotcue_X_status" +C.RE+ "   deckColour hex " +C.O+ "#" + deckColour.toString(16) +C.RE+ "   deckColour rgb " +C.O+ deckColourRgb +C.RE+ "   deckColourBg rgb " +C.O+ deckColourBg, C.G, 1, 2);
      }
      if (value === 0) {

      }
    }); //end of makeConnection

    // bind an action to a hotcue being cleared
    //engine.makeConnection(`[Channel${deckNumber}]`, `hotcue_${hotcueNum}_clear`, (value) => {
    //  if (value === 0) { return }
    //  let deckColour = this.deckColour; // Get the deck color
    //  let deckColourBg = LaunchpadProMK3.darkenRGBColour(LaunchpadProMK3.hexToRGB(deckColour), deckUnloadedDimscale);
    //  DEBUG("makeConnection" +C.RE+ "hotcue_X_clear    deckColour " + deckColour + "   deckColourBg " + deckColourBg, C.R, 1, 2);
    //  if (LaunchpadProMK3.currentPage === 0) {
    //    LaunchpadProMK3.sendRGB(padAddress, LaunchpadProMK3.hexToRGB(deckColourBg));
    //  };
    //})
    DEBUG("# ending mainpads init", C.R);
  };

  //// Deck Sidepad Intro/Outro Hotcues
  DEBUG("## intro/outro " +C.B+ "sidepads init   deckNumber " + deckNumber, C.G, 1);
  this.sideButtons = [];
  for (sidepad = 1; sidepad <= 4; sidepad+= 1) {
    DEBUG("sidepad " + sidepad, C.G, 1)
    DEBUG("this.deckSidepadAddresses " + this.deckSidepadAddresses)
    //let padAddress = this.deckSidepadAddresses[sidepad-1]
    let padAddress = this.deckSidepadAddresses[sidepad-1];
    if (LaunchpadProMK3.selectPage === 6) { padAddress = LaunchpadProMK3.sidepads[12+sidepad] -20 };
    // the sidepad control this loop will setup
    let sidepadControlName = LaunchpadProMK3.sidepadNames[sidepad-1];
    rgb = LaunchpadProMK3.hexToRGB(0x00FFFF)
    DEBUG(padAddress)
    DEBUG("sidepad " +C.O+ sidepad +C.RE+ "   padAddress " +C.O+ padAddress +C.RE+ " / " +C.O+ "0x" + padAddress.toString(16).padStart(2, "0").toUpperCase() +C.RE+ "   sidepadControlName " +C.O+ sidepadControlName +C.RE+ "   deck " +C.O+ deckNumber);

    // setup a new sidepad button component
    this.sideButtons[sidepad-1] = new components.Button({
      midi: [0xB0, padAddress],
      padAddress: this.padAddress, // Get ready
      // sendRGB: LaunchpadProMK3.sendRGB(this.sidepadAddress, 0x00, 0x00, 0xFF),

      // what to do when a sidepad is pressed
      input: midi.makeInputHandler(0xB0, padAddress, (channel, control, value, status) => {
        if (LaunchpadProMK3.currentPage === 0) {
          if (value !== 0) {
            if (LaunchpadProMK3.shift === 0) {
              DEBUG("side press: deck " +C.O+ deckNumber +C.RE+"   padAddress " +C.O+ padAddress +C.RE+ "/" +C.O+ "0x" + padAddress.toString(16).padStart(2, "0").toUpperCase() +C.RE+ ",   sidepadControlName: " +C.O+ sidepadControlName + "activate", C.G, 1);
              script.triggerControl(`[Channel${deckNumber}]`, `${sidepadControlName}activate`, 50);
              LaunchpadProMK3.lastHotcue.unshift([deckNumber, sidepadControlName, padAddress, deckNumber]);
            } else {
              script.triggerControl(`[Channel${deckNumber}]`, `${sidepadControlName}clear`, 50);
            };
          }
        }; //end page 0
        if (LaunchpadProMK3.currentPage === 2) {
          //if (value !== 0) {
          //let firstDigit = Math.floor(padAddress / 10);
          //let bpmScalingControl = firstDigit % 2 === 0 ? "stars_up" : "stars_down";
          //script.triggerControl(this.currentDeck, bpmScalingControl, 50);
          //DEBUG("bpmSCALE " +C.O+ bpmScalingControl +C.RE+ " on deck " + this.currentDeck, C.G);
          //LaunchpadProMK3.updateBpmScalePage();
          //}
        }; //end page 2
      }), //end sidepad input handler

    }); //end sidepad button components


    engine.makeConnection(`[Channel${deckNumber}]`, `${sidepadControlName}enabled`, (value) => {
      if (LaunchpadProMK3.currentPage === 0) {
        LaunchpadProMK3.trackWithIntroOutro(value, deckNumber, padAddress);
      }
    }); //end makeConnection
  }; //end sidepad init loop
  DEBUG("# ending sidepads init", C.R, 0, 2);


  engine.makeConnection(`[Channel${deckNumber}]`, "play", function (value) {
    DEBUG("makeConnection, play on deck " + deckNumber + "    value " + value + "   bpmTimerLoopInit()", C.G, 2)
    if (LaunchpadProMK3.currentPage === 2) {
      if (value === 1) {
        LaunchpadProMK3.bpmTimerLoopInit(deckNumber);
      } else if (value === 0) {
        LaunchpadProMK3.stopBpmTimers(deckNumber);
        LaunchpadProMK3.bpmResetToBpm(deckNumber)
      }
    }
  });

  //engine.makeConnection(`[Channel${deckNumber}]`, "beat_active", LaunchpadProMK3.tempoScaleDeckFlash() )



  DEBUG("# reconnect to group", C.G, 1);
  // Set the group properties of the above Components and connect their output callback functions
  this.reconnectComponents(function (c) {
    if (c.group === undefined) {
      // 'this' inside a function passed to reconnectComponents refers to the ComponentContainer
      // so 'this' refers to the custom Deck object being constructed
      c.group = this.currentDeck;
    }
    DEBUG("reconnectComponents" +C.RE+ " to current group if group undefined;    group " +C.O+ c.group +C.RE+ " / this.currentDeck " +C.O+ this.currentDeck, C.O, 0, 1);
  });
};


LaunchpadProMK3.Deck.prototype = new components.Deck();


//// End of Deck object setup



//// Page functions


// Handle switching pages, cycling or directly

LaunchpadProMK3.selectPage = function(page) {
  // find target page if none provided
  if (page === undefined) {
    page = (+LaunchpadProMK3.currentPage+1) % 7;
    DEBUG("## page undefined, selectPage setting page to " +C.O+ page+1, C.O, 2);
  }

  DEBUG("#### " +C.RE+ "switching page from " +C.O+ (+LaunchpadProMK3.currentPage+1) +C.RE+ " to " +C.O+ (+page+1), C.G, 2);
  LaunchpadProMK3.currentPage = page;

  if (page !== 2) {
    DEBUG("stopBpmTimers.........()")
    LaunchpadProMK3.stopBpmTimers()
  }

  if (page === 0) { LaunchpadProMK3.updateHotcuePage(); }
  else if (page === 1) { LaunchpadProMK3.updateBeatjumpPage(); }
  else if (page === 2) { LaunchpadProMK3.updateBpmScalePage(); }
  else if (page === 3) { LaunchpadProMK3.updateLoopPage(); }
  else if (page === 4) { LaunchpadProMK3.updateReverseLoopPage(); }
  else if (page === 5) { LaunchpadProMK3.updateLoopExtrasPage(); }
  else if (page === 6) { LaunchpadProMK3.updateOneDeckPage(); }
  LaunchpadProMK3.lightUpRow2()

  DEBUG("leaving selectPage..", C.R, 1, 1)

  DEBUG(JSON.stringify(LaunchpadProMK3.deck.config))
};



// Update main and side pad lights for a specific deck
LaunchpadProMK3.updateHotcueLights = function(deck) {
  DEBUG(JSON.stringify(deck))
  DEBUG(JSON.stringify(LaunchpadProMK3.deck.config))
  DEBUG(JSON.stringify(LaunchpadProMK3.deck.config[deck]))
  let deckColour = LaunchpadProMK3.deck.config[deck].colour;
  if (deckColour === undefined) {
    deckColour = 0x444444;
  }
  // hotcues
  let colourSpecMulti = [];
  deckLoaded = engine.getValue(`[Channel${deck}]`, "track_loaded")
  DEBUG("## update hotcue lights for " +C.RE+ "deck " +C.O+ deck +C.RE+ "   deckColour " +C.O+ "#" + deckColour.toString(16).padStart(6, "0").toUpperCase() +C.RE+ "   totalDeckHotcuePads " +C.O+ totalDeckHotcuePads +C.RE+ "   deckLoaded " +C.O+ deckLoaded, C.G, 1);

  // go through the hotcues one by one
  for (let i = 1; i <= totalDeckHotcuePads; i+=1) {
    padAddress = LaunchpadProMK3.decks[deck].pads[i-1];
    if (LaunchpadProMK3.currentPage === 6) { padAddress = LaunchpadProMK3.decks[4].pads[i-1]; }
    if (deckLoaded !== 1) {
      // if deck unloaded, dim deck colour
      rgb = LaunchpadProMK3.hexToRGB(deckColour);
      rgb = LaunchpadProMK3.darkenRGBColour(rgb, deckUnloadedDimscale)

    } else if (deckLoaded === 1) {
      // is the hotcue enabled?
      hotcueEnabled = engine.getValue(`[Channel${deck}]`, `hotcue_${i}_status`);
      if (hotcueEnabled === 1) {
        // if so, get it's colour
        hotcueColour = engine.getValue(`[Channel${deck}]`, `hotcue_${i}_color`);
        rgb = LaunchpadProMK3.hexToRGB(hotcueColour);
        debugHotcueEnabled = "   hotcueEnabled " +C.O+ hotcueEnabled +C.RE+ "   hotcueColour " +C.O+ "#" + hotcueColour.toString(16).padStart(6, "0").toUpperCase();
      } else if (hotcueEnabled !== 1) {
        // if no hotcue, set pad to somewhat dimmed deck colour
        rgb = LaunchpadProMK3.hexToRGB(deckColour);
        rgb = LaunchpadProMK3.darkenRGBColour(rgb, deckLoadedDimscale);
        debugHotcueEnabled = "   hotcueEnabled " +C.R+ "0   deck colour rgb " + rgb;
      }
      DEBUG("d " +C.O+ deck +C.RE+ "   i " +C.O+ i +C.RE+ "   padAddress " +C.O+ padAddress +C.RE+ "/" +C.O+ "0x" + padAddress.toString(16).padStart(2, "0").toUpperCase() +C.RE+ debugHotcueEnabled  , C.RE)
    }
    colourSpecMulti = colourSpecMulti.concat([ 0x03, padAddress, Math.floor(rgb[0]/2), Math.floor(rgb[1]/2), Math.floor(rgb[2]/2) ]);
    //colourSpecMulti = colourSpecMulti.concat([ 0x03, padAddress, rgb[0], rgb[1], rgb[2] ]);
  }

  DEBUG("# finished creating pad address sysex msg, sending...", C.O, 1);
  LaunchpadProMK3.sendSysEx([0x03].concat(colourSpecMulti));
  DEBUG("end updating main pads", C.R, 1, 1);

  // Sidebar, to blue and off
  DEBUG("## update sidepad lights" +C.RE+ " for deck " +C.O+ deck, C.G);
  for (i = 1; i <= 4; i += 1) {
    let sidepad = (deck) * 4 + i;
    //let padAddress = LaunchpadProMK3.sidepads[sidepad];
    let padAddress = LaunchpadProMK3.decks[deck].deckSidepadAddresses[i-1];
    if (LaunchpadProMK3.currentPage === 6) { padAddress = LaunchpadProMK3.sidepads[11+i] };
    let sidepadControlName = LaunchpadProMK3.sidepadNames[i-1];
    let sidepadEnabled = engine.getValue(`[Channel${deck}]`, `${sidepadControlName}enabled`);
    if (sidepadEnabled === 1) {
      DEBUG("d " +C.O+ deck +C.RE+ "   i " +C.O+ i +C.RE+ "   sidepad " +C.O+ sidepad +C.RE+ "   padAddress " +C.O+ padAddress +C.RE+ "/" +C.O+ "0x" + padAddress.toString(16).padStart(2, "0").toUpperCase() +C.RE+ "   control " +C.O+ sidepadControlName +C.G+ "activate");
      LaunchpadProMK3.trackWithIntroOutro(1, deck, padAddress);
    } else {
      LaunchpadProMK3.trackWithIntroOutro(0, deck, padAddress);     }
  }
  DEBUG("end updating sidepads", C.R, 0, 1);
};






LaunchpadProMK3.gradientSetup = function(deck, altpos, gradStartA, gradEndA, gradStartB, gradEndB) {
  let deckColour = LaunchpadProMK3.decks[deck].deckColour;
  //let rgb = LaunchpadProMK3.hexToRGB(deckColour);
  DEBUG("deck " + deck + "   deckColour #"+ deckColour + "   rgb "+ rgb, C.G, 1);
  deckLoaded = engine.getValue(`[Channel${deck}]`, "track_loaded");
  let gradLength = totalDeckHotcuePads/2
  let gradA = LaunchpadProMK3.gradientCalculate(gradStartA, gradEndA, gradLength);
  let gradB = LaunchpadProMK3.gradientCalculate(gradStartB, gradEndB, gradLength);
  let gradBoth = gradA.concat(gradB);
  DEBUG("  gradBoth " +C.O+ gradBoth +C.RE+ "   len " +C.O+ gradBoth.length);
  if (altpos === undefined) { altpos = 1 }
  let pads = ""
  if (LaunchpadProMK3.currentPage !== 6) {
    pads = LaunchpadProMK3.decks[deck].pads;
  } else {
    pads = LaunchpadProMK3.decks[altpos].pads;
  }
  DEBUG(pads)
  for (let pad of pads) {
    let toSend = gradBoth.shift();
    DEBUG(toSend)
    if (deckLoaded !== 1) { toSend = LaunchpadProMK3.darkenRGBColour(toSend, deckLoadedDimscale) }
    DEBUG("  gradBoth " +C.O+ gradBoth +C.RE+ "   len " +C.O+ gradBoth.length);
    let r = toSend[0];
    let g = toSend[1];
    let b = toSend[2];
    DEBUG("toSend " + toSend + "    pad " + pad + "   r " + r + "  g "+ g + "   b "+ b, C.O);
    LaunchpadProMK3.sendRGB(pad, r, g, b);
  };
}

LaunchpadProMK3.gradientCalculate = function(color1, color2, steps) {
  const gradient = [];
  for (let i = 0; i < steps; i++) {
    let scale = i / (steps - 1);
    let r = Math.round(color1[0] * (1 - scale) + color2[0] * scale);
    let g = Math.round(color1[1] * (1 - scale) + color2[1] * scale);
    let b = Math.round(color1[2] * (1 - scale) + color2[2] * scale);
    DEBUG(`${r},${g},${b}`);
    gradient.push([r,g,b]);
  }
  return gradient;
};


function interleave (arr, arr2) {
  let newArr = [];
  for (let i = 0; i < arr.length; i++) {
    newArr.push(arr[i], arr2[i]);
  }
  return newArr;
};



//// Single pad light functions


// Helper function to convert RGB hex value to individual R, G, B values
LaunchpadProMK3.hexToRGB = function(hex) {
  //DEBUG("hexToRGB #" + hex)
  var r = (hex >> 16) & 0xFF;
  var g = (hex >> 8) & 0xFF;
  var b = hex & 0xFF;
  //DEBUG("rgb " + [r, g, b]);
  return [r, g, b];
};

// Send RGB values
LaunchpadProMK3.sendRGB = function(pad, r, g, b) {
  DEBUG(" sendRGB>>   r " +C.O+ r +C.RE+ "   g " +C.O+ g +C.RE+ "   b " +C.O+ b);
  if (r === undefined) rgb = [ 0, 0, 0 ];
  //if (g === undefined) {
  //  b = r[2];
  //  g = r[1];
  //  r = r[0];
  //}
  //DEBUG("   r " +C.O+ r +C.RE+ "   g " +C.O+ g +C.RE+ "   b " +C.O+ b);
  r = Math.floor(r/2)
  g = Math.floor(g/2)
  b = Math.floor(b/2)
  //DEBUG("pad " +C.O+ pad +C.RE+ "   r " +C.O+ r +C.RE+ "   g " +C.O+ g +C.RE+ "   b " +C.O+ b);
  LaunchpadProMK3.sendSysEx([0x03, 0x03, pad, r, g, b]);
};

LaunchpadProMK3.sendHEX = function(pad, hex) {
  var r = (hex >> 16) & 0xFF;
  var g = (hex >> 8) & 0xFF;
  var b = hex & 0xFF;
  //divided by two becaure MIDI is 0-127
  LaunchpadProMK3.sendSysEx([0x03, 0x03, pad, Math.floor(r/2), Math.floor(g/2), Math.floor(b/2)]);
};

// Darken RGB colour by scale
LaunchpadProMK3.darkenRGBColour = function(rgbIn, scale) {
  if (scale === "undefined") { DEBUG("  scale undefined, so scale = 0.1"); scale = 0.1 }
  // Clamp the scale between 0 and 1
  scale = Math.max(0, Math.min(1, scale));
  // Apply non-linear scaling (square the scale for better sensitivity)
  scaleNu = +(scale ** 2).toFixed(4);
  rgb = [];
  debugMiddle = "";
  rgb[0] = Math.round(rgbIn[0] * scaleNu);
  rgb[1] = Math.round(rgbIn[1] * scaleNu);
  rgb[2] = Math.round(rgbIn[2] * scaleNu);
  if (rgbIn[0] > 127 || rgbIn[1] > 127 || rgbIn[2] > 127) { debugMiddle = C.R+"   OOVVEERR 127!"+C.RE }
  //DEBUG(" darkenRGBColour()    " +C.RE+ "scale " +C.O+ ratio +C.RE+ "   ratioNu " +C.O+ ratioNu+C.RE+ "   page " +C.O+ LaunchpadProMK3.currentPage +C.RE+ "   rgb in " +C.O+ rgbIn +C.RE+ debugMiddle + "   rgb out " +C.O+ rgb, C.G);
  return rgb;
}


// Turn off pad LEDs
//LaunchpadProMK3.turnOffPad = function(pad, rgb) {
//  //LaunchpadProMK3.sendRGB(pad, 0, 0, 0)
//  if (rgb === undefined) rgb = [ 0, 0, 0 ];
//  LaunchpadProMK3.sendRGB(pad, rgb[0], rgb[1], rgb[2]);
//};

// Turn a sidepad colour to blue or off
LaunchpadProMK3.trackWithIntroOutro = function(value, deckNumber, padAddress) {
  //DEBUG("## trackWithIntroOutro    value " + value + ", padAddress " + padAddress);
  if (value > 0) {
    LaunchpadProMK3.sendRGB(padAddress, 0x00, 0x00, 0xFF);
  } else {
    LaunchpadProMK3.sendRGB(padAddress, 0x00, 0x00, 0x00);
  }
};




//// Multiple pad light functions


// Sidepad deck colours
LaunchpadProMK3.sidepadDeckColour = function(d) {
  DEBUG("LaunchpadProMK3.sidepadDeckColour()", C.G, 2)
  DEBUG("d " + d, C.O);

  let deckPosition = LaunchpadProMK3.deck.config[d].order;
  let deckColour = LaunchpadProMK3.deck.config[d].colour;
  let deckSidepadsStart = ((deckOrder - 1) * 4);
  DEBUG("deckSidepadsStart " + deckSidepadsStart, C.O);

  // get hard copy of array of sidepad addresses for deck position
  const sidepads = LaunchpadProMK3.sidepads.slice(deckSidepadsStart, deckSidepadsStart+4);
  DEBUG("sidepads " + sidepads, C.O);

  let nextAddress = sidepads.shift(); // cut next LED address from sidepad list
  DEBUG(nextAddress);
  LaunchpadProMK3.sendHEX(nextAddress, deckColour); // Set the color for current deck LED
  let next2Address = sidepads.shift();
  DEBUG(next2Address, C.R);
  LaunchpadProMK3.sendHEX(next2Address, deckColour); // Set the color for current deck LED
  let next3Address = sidepads.shift(); // Get LED address for this index
  DEBUG(next3Address, C.O);
  LaunchpadProMK3.sendHEX(next3Address, deckColour); // Set the color for current deck LED
  let next4Address = sidepads.shift();
  DEBUG(next4Address, C.G);
  LaunchpadProMK3.sendHEX(next4Address, deckColour); // Set the color for current deck LED
  DEBUG("extras side colour deck " + d + "   nextAddress " + nextAddress, C.O, 0, 2);
}


// Select deck and change LEDs
LaunchpadProMK3.selectDeck = function(deck) {
  DEBUG("### selecting deck " + deck, C.G, 3);
  // remember selection
  LaunchpadProMK3.selectedDeck = deck
  Object.entries(LaunchpadProMK3.deck.config).forEach((d) => {
    DEBUG(d[1].colour)
    rgb = LaunchpadProMK3.hexToRGB(d[1].colour);
    DEBUG("d " + JSON.stringify(d) + "   deck " + deck + "   rgb " + rgb + "   hex " + "#" + d[1].colour.toString(16), C.R);
    if (+d[0] !== deck) {
      rgb = LaunchpadProMK3.darkenRGBColour(rgb, deckUnloadedDimscale);
    }
    DEBUG(100+d[1].order)
    DEBUG(rgb)
    LaunchpadProMK3.sendRGB(100+d[1].order, rgb);
    if (+d[0] === deck) {
      LaunchpadProMK3.sendRGB(hotcueCreationButton, rgb);
    }
  });
  if (LaunchpadProMK3.currentPage === 6) {
    LaunchpadProMK3.updateOneDeckPage()
  }
};


// LEDs for changing page
LaunchpadProMK3.lightUpRow2 = function() {
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row2[0], 127, 110, 127);
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row2[1], 127, 110, 127);
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row2[2], 127, 110, 127);
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row2[3], 127, 110, 127);
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row2[4], 127, 110, 127);
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row2[5], 127, 110, 127);
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row2[6], 127, 110, 127);
  LaunchpadProMK3.sendRGB(LaunchpadProMK3.row2[0] + LaunchpadProMK3.currentPage, 127, 0, 20);
};


// Track load/unload reaction
LaunchpadProMK3.onTrackLoadedOrUnloaded = function(value, group) {
  DEBUG((value === 1 ? `###  Track loaded on ${group}` : `###  Track unloaded from ${group}`), C.G, 2);
  deck = group.match(/(\d+)/)[1];
  if (LaunchpadProMK3.currentPage === 0) {
    DEBUG("LaunchpadProMK3.updateHotcuePage()")
    LaunchpadProMK3.updateHotcuePage();
    DEBUG("leaving LaunchpadProMK3.updateHotcuePage()")

  } else if (LaunchpadProMK3.currentPage === 1) {
    DEBUG("LaunchpadProMK3.updateBeatjumpPage()")
    LaunchpadProMK3.updateBeatjumpPage();
    DEBUG("leaving LaunchpadProMK3.updateBeatjumpPage()")
    // Si

  } else if (LaunchpadProMK3.currentPage === 2) {
    DEBUG("LaunchpadProMK3.updateBpmScalePage()")
    LaunchpadProMK3.updateBpmScalePage();
    DEBUG("leaving LaunchpadProMK3.updateBpmScalePage()")

  } else if (LaunchpadProMK3.currentPage === 3) {
    DEBUG("LaunchpadProMK3.updateLoopPage()")
    LaunchpadProMK3.updateLoopPage();
    DEBUG("leaving LaunchpadProMK3.updateLoopPage()")

  } else if (LaunchpadProMK3.currentDeck === 4) {
    DEBUG("LaunchpadProMK3.updateReverseLoopPage()")
    LaunchpadProMK3.updateReverseLoopPage();
    DEBUG("leaving LaunchpadProMK3.updateReverseLoopPage()")

  } else if (LaunchpadProMK3.currentDeck === 5) {
    DEBUG("LaunchpadProMK3.updateLoopExtrasPage()")
    LaunchpadProMK3.updateLoopExtrasPage();
    DEBUG("leaving LaunchpadProMK3.updateLoopExtrasPage()")

  } else if (LaunchpadProMK3.currentDeck === 6) {
    DEBUG("LaunchpadProMK3.updateOneDeckPage()")
    LaunchpadProMK3.updateOneDeckPage();
    DEBUG("leaving LaunchpadProMK3.updateOneDeckPage()")
  }
  DEBUG("track load/unload per page action fin....", C.R, 1, 2)
}





//// Other hotcue helper functions


LaunchpadProMK3.undoLastHotcue = function() {
  DEBUG("####################### undooooo", C.G, 1);
  // Check that a hotcue has been created
  //if (LaunchpadProMK3.lastHotcue[0] === undefined) { return; }
  // Deserialise the hotcue to undo away
  let popped = LaunchpadProMK3.lastHotcue.shift();
  if (popped === undefined) { DEBUG("no undo stack"); return }
  DEBUG("## popped:  " + popped, C.O, 1);
  DEBUG("## LaunchpadProMK3.lastHotcue:  " + LaunchpadProMK3.lastHotcue, C.G, 1);
  DEBUG("## LaunchpadProMK3.redoLastDeletedHotcue:  " + LaunchpadProMK3.redoLastDeletedHotcue, C.G);
  let channel = popped[0];
  // Deserealise array
  let control = popped[1];
  let padAddress = popped[2];
  let deckNumber = popped[3];
  DEBUG("## undoLastHotcue:   cont  " + control + ",   channel  " + channel + ",   deck  " + deckNumber + ",   pad " + padAddress, C.O);
  let colour
  // Clear hotcue
  // Common JS func to toggle a control on then off again
  script.triggerControl(channel, control + "_clear", 64);
  // Add undone hotcue to redo list, in case
  LaunchpadProMK3.redoLastDeletedHotcue.unshift(popped);
  DEBUG("## LaunchpadProMK3.redoLastDeletedHotcue:  " + LaunchpadProMK3.redoLastDeletedHotcue);
  // Reset pad colour to deck colour
  LaunchpadProMK3.sendHEX(padAddress, LaunchpadProMK3.decks[deckNumber].colour);
  LaunchpadProMK3.updateHotcuePage();
  DEBUG("leaving undoLastHotcue..", C.R, 1, 1)
};


LaunchpadProMK3.redoLastHotcue = function() {
  DEBUG("REDO", C.R, 1, 1);
  // Check if a hotcue has been undone
  if (LaunchpadProMK3.redoLastDeletedHotcue[0] === undefined) { return; }
  // Get the undone hotcue to redo
  let unpopped = LaunchpadProMK3.redoLastDeletedHotcue.shift();
  DEBUG("## unpopped:  " + unpopped, C.O, 1);
  DEBUG("## LaunchpadProMK3.redoLastDeletedHotcue:  " + LaunchpadProMK3.redoLastDeletedHotcue, C.O, 1);
  // Deserialise the hotcue to redo
  let channel = unpopped[0];
  let control = unpopped[1];
  let padAddress = unpopped[2];
  let deckNumber = unpopped[3];
  let colour = unpopped[4];
  DEBUG("### redoLastHotcue:   cont; " + control + ",   chan; " + channel + ",   deck; " + deckNumber + ",   pad;" + padAddress+ "   colour " + colour);
  // Activate the hotcue to undelete it
  script.triggerControl(channel, control + "_activate", 64);
  // Add redone hotcue back to undo stack again
  LaunchpadProMK3.lastHotcue.unshift( [ channel, control, padAddress, deckNumber, colour ] );
  DEBUG("## LaunchpadProMK3.lastHotcue:  " + LaunchpadProMK3.lastHotcue);
  LaunchpadProMK3.updateHotcuePage();
  DEBUG("leaving redoLastHotcue..", C.R, 1, 1)
};


// To add time between steps in multi hotcue function
LaunchpadProMK3.sleep = function(time) {
  let then = Date.now();
  while (true) {
    let now = Date.now();
    if (now - then > time) {
      break;
    };
  };
};



lastHotcueCreationTime = "";

leadupCues = {
  "1": { control: "beatjump_128_backward", colour: 0x1DBEBD }, //teal
  "2": { control: "beatjump_64_forward"  , colour: 0x8DC63F }, //green
  "3": { control: "beatjump_32_forward"  , colour: 0xf8d200 }, //yellow
  "4": { control: "beatjump_16_forward"  , colour: 0xff8000 }, //orange
  "5": { control: "beatjump_16_forward"  , colour: 0xEF1441 } //red
}


function isCloseEnough(array, num, precision = 2) {
  return array.some(n => Math.abs(n - num) < Math.pow(10, -precision));
}


LaunchpadProMK3.create4LeadupDropHotcues = function (deck, value) {
  DEBUG(`## create hotcues  ${C.Y} -128 -64 -32 -16 ${C.R}drop ${C.RE}on ${C.O}${deck}`, C.G, 2);
  if (value === 0 || value === undefined) return 0;
  group = `[Channel${deck}]`;

  // what time is it right now?
  now = Date.now()
  // is now at least a second after the last time?
  if (now < (lastHotcueCreationTime + 1000)) {
    DEBUG("DENIED   " + lastHotcueCreationTime + "   " + now, C.R);
    return
  }
  // record now as the new lastwhat is the time right now?
  lastHotcueCreationTime = Date.now
  // how long is the track in samples?
  samplesTotal = engine.getValue(group, "track_samples");

  let hotcuePositions = [];
  // get the first twenty hotcue positions, store in an array
  for (let h = 0; h<=19; h++) {
    hotcuePositions[h] = engine.getValue(group, "hotcue_" + (+h+1) + "_position" )
    //if (hotcuePositions[h]) hotcueRightmost = h;
  }
  DEBUG("hotcuePositions  creation " +C.O+ hotcuePositions, C.G)

  // for each of the controls in the object;
  DEBUG("leadupCues " +C.O+ JSON.stringify(leadupCues));
  for (const number of Object.entries(leadupCues)) {
    DEBUG(JSON.stringify(number))
    DEBUG("number " +C.O+ number[1].control)
    let control = number[1].control
    let colour =  number[1].colour
    DEBUG(`control ${C.O}${control}${C.RE}   colour ${C.O}#${colour.toString(16)}`, C.G, 1)
    // perform it
    engine.setValue(group, control, 1)
    // pause so the jump takes effect
    LaunchpadProMK3.sleep(100);
    // how far through the track is ther, between 0-1
    playPosition = engine.getValue(group, "playposition");
    // if it's before 0, aka the start of the track then..
    DEBUG("playPosition " +C.O+ playPosition)
    if (playPosition <= 0) {
      // do nothing in this loop round
      DEBUG("doo nowttt", C.O)
    } else if (0 < playPosition) {
      // find the first unused hotcue
      DEBUG("hotcuePositions mid " +C.O+ hotcuePositions)
      // how many samples into the track right now?
      samplesNow = samplesTotal * playPosition;
      DEBUG("samplesNow " +C.O+ samplesNow)
      // has this sample position got a hotcue already?
      //if (!hotcuePositions.includes(samplesNow)) {
      if (!isCloseEnough(hotcuePositions, samplesNow, 3)) {
        hotcueSpace = hotcuePositions.findIndex((hotcueSpaceFree) => hotcueSpaceFree === -1)
        DEBUG("hotcueSpace " +C.O+ hotcueSpace)
        // if there is no hotcue space then give up
        if (hotcueSpace === -1) { DEBUG("no hotcue space", C.R); return }
        // colate control
        hotcueSpaceTitle = "hotcue_"+(hotcueSpace+1)
        DEBUG("hotcueSpaceTitle " +C.O+ hotcueSpaceTitle)
        // create new hotcue
        engine.setValue(group, hotcueSpaceTitle+"_set", 1);
        // give that hotcue its colour
        engine.setValue(group, hotcueSpaceTitle+"_color", colour); // green
        // what is its pad?
        DEBUG("LaunchpadProMK3.decks[deck].deckMainSliceStartIndex " +C.O+ LaunchpadProMK3.decks[deck].deckMainSliceStartIndex)
        pad = LaunchpadProMK3.decks[deck].deckMainSliceStartIndex + hotcueSpace;
        DEBUG("pad " +C.O+ pad)
        // add to undo list
        LaunchpadProMK3.lastHotcue.unshift([group, hotcueSpaceTitle, pad, deck, colour]);

        // add to existing check
        hotcuePositions[hotcueSpace] = samplesNow;
        DEBUG("hotcuePositions end " +C.O+ hotcuePositions, C.R, 0, 1)
      }
    }
  };

  //for (let X = hotcueRightmost; X <= 19; X++) {
  //  LaunchpadProMK3.sleep(25);

  DEBUG("# end multi hotcue creation", C.R, 0, 2);
};


//LaunchpadProMK3.wavezoomAll = function wavezoomAll(value){
//  const range = 60 - 1;
//  var newValue = Math.round(1+((value / 127) * range));
//  if (newValue > 60) { newValue = 60; }
//  if (newValue < 1) newValue = 1;
//  if (LaunchpadProMK3.lastwavevalue !== value) :{
//    for (var i=1; i<9; i++){
//      engine.setValue(LaunchpadProMK3.Deck[i], "waveform_zoom", newValue);
//    };
//  }
//  LaunchpadProMK3.lastwavevalue = value;
//}
//
//midi.makeInputHandler(0xB0, LaunchpadProMK3.row1[0], (channel, control, value, status, _group) => {
//  if (value !== 0) { LaunchpadProMK3.selectDeck(3); }
//});
//LaunchpadProMK3.sendRGB(LaunchpadProMK3.row1[0], 0xd7, 0x00, 0xd7); // bright
//

//getFunctionName = function getFunctionName() { //return name of calling function
//  var re = /function (.*?)\(/
//    var s = NK2.getFunctionName.caller.toString();
//    var m = re.exec(s) ;
//  };
//
//LaunchpadProMK3.doNothing = function doNothing(){//dummy function - do nothing
//  if (NK2.debug>2){print("##function: "+NK2.getFunctionName())};
//  return false;
//};

LaunchpadProMK3.wheelTurn = function(channel, control, value, status, group) {
  let mod = ""
  if (value > 64) mod = 32;
  const newValue = value + 64 - mod;
  const deck = parseInt(group.substr(8, 1), 10);
  // In either case, register the movement
  if (engine.isScratching(deck)) {
    engine.scratchTick(deck, newValue); // Scratch!
  } else {
    engine.setValue(group, "jog", newValue / 5); // Pitch bend
  }
};



/// First page (0)


// Function to update pad lights for each hotcue
LaunchpadProMK3.updateHotcuePage = function(deck) {
  if (LaunchpadProMK3.currentPage === 0) {
    DEBUG("  ");
    DEBUG("                              .o8                .                                                                   .oooo.   ", C.M);
    DEBUG("                             '888              .o8                                                                  d8P'`Y8b  ", C.M);
    DEBUG(" oooo  oooo  oo.ooooo.   .oooo888   .oooo.   .o888oo  .ooooo.       oo.ooooo.   .oooo.    .oooooooo  .ooooo.       888    888 ", C.M);
    DEBUG(" `888  `888   888' `88b d88' `888  `P  )88b    888   d88' `88b       888' `88b `P  )88b  888' `88b  d88' `88b      888    888 ", C.M);
    DEBUG("  888   888   888   888 888   888   .oP'888    888   888ooo888       888   888  .oP'888  888   888  888ooo888      888    888 ", C.M);
    DEBUG("  888   888   888   888 888   888  d8(  888    888 . 888    .o       888   888 d8(  888  `88bod8P'  888    .o      `88b  d88' ", C.M);
    DEBUG("  `V88V'V8P'  888bod8P' `Y8bod88P' `Y888''8o   '88'  `Y8bod8P'       888bod8P' `Y888''8o `8oooooo.  `Y8bod8P'       `Y8bd8P'  ", C.M);
    DEBUG("              888                                                    888                 d'     YD                            ", C.M);
    DEBUG("             o888o                                                  o888o                 'Y88888P'                           ", C.M);
    DEBUG("  ");
    DEBUG(" LaunchpadProMK3.updateHotcuePage() ", C.B);
    DEBUG("### set/refresh hotcue page, deck " + deck, C.M);
    if (deck === undefined) {
      DEBUG("## deck undefined = updating all decks..", C.O, 1);
      DEBUG(JSON.stringify(deck));
      DEBUG(JSON.stringify(LaunchpadProMK3.deck.config));
      DEBUG(JSON.stringify(LaunchpadProMK3.deck.config[deck]));
      LaunchpadProMK3.updateHotcueLights(1);
      LaunchpadProMK3.updateHotcueLights(2);
      if (totalDecks === 4) {
        LaunchpadProMK3.updateHotcueLights(3);
        LaunchpadProMK3.updateHotcueLights(4);
      }
      DEBUG("end updating decks", C.R, 0, 1);
    } else {
      DEBUG("## updating " + deck, C.G);
      LaunchpadProMK3.updateHotcueLights(deck);
      DEBUG("end updating deck", C.R, 0,1);
    }
  }
};


/// Second page (1)

LaunchpadProMK3.beatjumpControls = [
  //"beatjump",
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


LaunchpadProMK3.updateBeatjumpPage = function() {
  if (LaunchpadProMK3.currentPage === 1) {
    DEBUG("  ");
    DEBUG("                              .o8                .                                                                  .o  ", C.M);
    DEBUG("                             '888              .o8                                                                o888  ", C.M);
    DEBUG(" oooo  oooo  oo.ooooo.   .oooo888   .oooo.   .o888oo  .ooooo.      oo.ooooo.   .oooo.    .oooooooo  .ooooo.        888  ", C.M);
    DEBUG(" `888  `888   888' `88b d88' `888  `P  )88b    888   d88' `88b      888' `88b `P  )88b  888' `88b  d88' `88b       888  ", C.M);
    DEBUG("  888   888   888   888 888   888   .oP'888    888   888ooo888      888   888  .oP'888  888   888  888ooo888       888  ", C.M);
    DEBUG("  888   888   888   888 888   888  d8(  888    888 . 888    .o      888   888 d8(  888  `88bod8P'  888    .o       888  ", C.M);
    DEBUG("  `V88V'V8P'  888bod8P' `Y8bod88P' `Y888''8o   '88'  `Y8bod8P'      888bod8P' `Y888''8o `8oooooo.  `Y8bod8P'      o888o ", C.M);
    DEBUG("              888                                                   888                 d'     YD                       ", C.M);
    DEBUG("             o888o                                                 o888o                 'Y88888P'                      ", C.M);
    DEBUG("  ");
    DEBUG("### updateBeatjumpPage", C.B, 0, 1);

    LaunchpadProMK3.clearMain();
    for (let deck = 1; deck <= totalDecks; deck+=1 ) {
      let deckColour = LaunchpadProMK3.decks[deck].deckColour;
      let rgb = LaunchpadProMK3.hexToRGB(deckColour);
      gradStartA = [20, 20, 20];
      gradEndA = [112, 112, 112];
      gradStartB = rgb;
      gradEndB = [127, 127, 127];
      LaunchpadProMK3.gradientSetup(deck, undefined, gradStartA, gradEndA, gradStartB, gradEndB);
    }
    //LaunchpadProMK3.beatjumpExtrasButtons
  }
};






/// Third page (2)



// object with details for setting up bpm scaling pads
LaunchpadProMK3.bpmScaling = {
  "1": { scale: 0.5,   control: "beats_set_halve",        colour: 0x111111 },
  "2": { scale: 0.666, control: "beats_set_twothirds",    colour: 0x343434 },
  "3": { scale: 0.75,  control: "beats_set_threefourths", colour: 0x6a6a6a },
  "4": { scale: 1,     control: "beats_undo_adjustment",  colour: 0x331111 },
  "5": { scale: 1,     control: "beats_undo_adjustment",  colour: 0x331111 },
  "6": { scale: 1.25,  control: "beats_set_fourthirds",   colour: 0x6a6a6a },
  "7": { scale: 1.333, control: "beats_set_threehalves",  colour: 0x343434 },
  "8": { scale: 1.5,   control: "beats_set_double",       colour: 0x111111 }
};



// change all main pads to deck colours

LaunchpadProMK3.bpmResetToDeck = function(deck) {
  //// main pads
  DEBUG("//// reset main pads of each deck to deck colour:", C.G, 1);
  for (const [deck, props] of Object.entries(LaunchpadProMK3.deck.config)) {
    let deckColour = LaunchpadProMK3.deck.config[deck].colour
    DEBUG(deck)
    DEBUG(props.order)
    DEBUG(props.colour)
    let rgb = LaunchpadProMK3.hexToRGB(props.colour)
    DEBUG(rgb)
    deckLoaded = engine.getValue(`[Channel${deck}]`, "track_loaded");
    if (deckLoaded === 1) { rgb = LaunchpadProMK3.darkenRGBColour(rgb, deckLoadedDimscale); }
    if (deckLoaded !== 1) { rgb = LaunchpadProMK3.darkenRGBColour(rgb, deckUnloadedDimscale); }
    pads = LaunchpadProMK3.decks[deck].pads
    pads.forEach((pad) => {
      LaunchpadProMK3.sendRGB(pad, rgb[0], rgb[1], rgb[2]);
    });
  }
  DEBUG("/// end resetting main pads to deck colour", C.R, 1, 2);
}

LaunchpadProMK3.bpmResetToBpm = function(deck) {
  if (deck) {
    column = 1;
    let pads = LaunchpadProMK3.decks[deck].pads;
    DEBUG("pads " + pads, C.R);
    for (let pad of pads) {
      DEBUG("column " + column, C.R);
      DEBUG("pad " + pad, C.R);
      colour = LaunchpadProMK3.bpmScaling[column].colour;
      DEBUG("colour " + colour, C.R);
      colour = LaunchpadProMK3.hexToRGB(colour);
      DEBUG("colour " + colour, C.R);
      LaunchpadProMK3.sendRGB(pad, colour[0], colour[1], colour[2]);
      column = column + 1;
      if (column === 9) column = 1;
    }
    DEBUG("/// end resetting main pads to bpm colour", C.R, 1, 2);
  };
};



// stop bpm scaling page timers for either one or all decks

LaunchpadProMK3.stopBpmTimers = function(deck) {
  //DEBUG("stopBpmTimers", C.G, 2, 1)LaunchpadProMK3.deck.config[deck].colour
  if (!deck) {
    // for every deck..
    DEBUG("STOPPING ALL TIMERS", C.O, 1)
    // cycle through all decks
    for (let d = 1; d <= totalDecks; d += 1 ) {
      // and if it has running timers
      if (LaunchpadProMK3.bpmTimer) {
        // for every pad timer in the deck timer array, stop
        for (let t in LaunchpadProMK3.bpmTimer) {
          DEBUG("  t; " + t)
          engine.stopTimer(LaunchpadProMK3.bpmTimer[t]);
        }
      }
    }
  } else if (deck) {
    DEBUG("STOPPING TIMERS for deck " + deck, C.R, 1)
    // set pads to be an array of addresses of the deck's pads
    pads = LaunchpadProMK3.decks[deck].pads
    DEBUG("pads " + pads)
    pads.forEach((pad) => engine.stopTimer(LaunchpadProMK3.bpmTimer[pad]));
  }
}



LaunchpadProMK3.updateBpmScalePage = function() {
  if (LaunchpadProMK3.currentPage === 2) {
    DEBUG("  ");
    DEBUG("                              .o8                .                                                                 .oooo.   ", C.M);
    DEBUG("                             '888              .o8                                                               .dP''Y88b  ", C.M);
    DEBUG(" oooo  oooo  oo.ooooo.   .oooo888   .oooo.   .o888oo  .ooooo.      oo.ooooo.   .oooo.    .oooooooo  .ooooo.            ]8P' ", C.M);
    DEBUG(" `888  `888   888' `88b d88' `888  `P  )88b    888   d88' `88b      888' `88b `P  )88b  888' `88b  d88' `88b         .d8P'  ", C.M);
    DEBUG("  888   888   888   888 888   888   .oP'888    888   888ooo888      888   888  .oP'888  888   888  888ooo888       .dP'     ", C.M);
    DEBUG("  888   888   888   888 888   888  d8(  888    888 . 888    .o      888   888 d8(  888  `88bod8P'  888    .o     .oP        ", C.M);
    DEBUG("  `V88V'V8P'  888bod8P' `Y8bod88P' `Y888''8o   '88'  `Y8bod8P'      888bod8P' `Y888''8o `8oooooo.  `Y8bod8P'     8888888888 ", C.M);
    DEBUG("              888                                                   888                 d'     YD                           ", C.M);
    DEBUG("             o888o                                                 o888o                 'Y88888P'                          ", C.M);
    DEBUG("  ");
    DEBUG("### updateBpmScalePage", C.B, 0, 1);
    LaunchpadProMK3.clearMain();

    DEBUG(JSON.stringify(LaunchpadProMK3.bpmScaling), C.O, 1, 1);

    // reset pads to deckcolour so they're ready to continue
    LaunchpadProMK3.bpmResetToDeck()
    DEBUG("end bpmResetToDeck()", C.R);

    // clear existing timers
    LaunchpadProMK3.stopBpmTimers();
    DEBUG("stopping any existing bpm scale timers..");

    // initialise variables
    let loaded = [];
    bpmScaledBpm = [];
    bpmScaledTimes = [];
    tempoScaleRun = [];
    LaunchpadProMK3.bpmTimer = [];
    LaunchpadProMK3.lastFlashTime = [];

    // for each deck
    DEBUG("set up loops for each deck to create timers for each double-pad if they're playing");
    for (deck = 1; deck <= 4; deck++) {
      DEBUG(" ############################################# deck " +C.O+ deck, C.G, 1) ;
      //// what is the colour of the deck?
      //deckColour = LaunchpadProMK3.deck.config[deck].colour;
      //DEBUG("  deckColour hex " +C.O+ "#" + deckColour.toString(16));
      //// turn the deck colour hex value into an rgb array
      //deckColour = LaunchpadProMK3.hexToRGB(deckColour);
      //// darken the colour of the deck so it's not distracting
      //deckColour = LaunchpadProMK3.darkenRGBColour(deckColour, deckUnloadedDimscale);
      //DEBUG("  deckColour rgb " +C.O+ deckColour);
      //// for each pad of the deck, turn it the shaded deck colour
      //DEBUG("set all deck pads to default");
      pads = LaunchpadProMK3.decks[deck].pads;
      //for (let pad of pads) {
      //  LaunchpadProMK3.sendRGB(pad, deckColour[0], deckColour[1], deckColour[2]);
      //}

      // reset all decks to blank

      // is the deck loaded? create an array with this info
      loaded[deck] = engine.getValue(`[Channel${deck}]`, "track_loaded");
      DEBUG("  loaded[deck] " +C.O+ loaded[deck]);
      // if the deck is actually loaded
      if (loaded[deck] === 1) {
        LaunchpadProMK3.bpmResetToBpm(deck)
        DEBUG("set up star pads and beat undo pads", C.G)
        DEBUG("  side pads " +C.O+ pads);
        // set up left sidebar column with star up and star down pads
        LaunchpadProMK3.sendRGB(pads[0]-1, 127, 105, 0);
        LaunchpadProMK3.sendRGB(pads[8]-1, 32, 25, 0);
        // set up right sidebar column with beats action undo pads
        LaunchpadProMK3.sendRGB(pads[7]+1, 127, 0, 100);
        LaunchpadProMK3.sendRGB(pads[15]+1, 127, 0, 100);

        LaunchpadProMK3.bpmTimerLoopInit(deck);
      }
    }
    //LaunchpadProMK3.sidepadDeckColour(deck);
    DEBUG("end of bpm scaling loop", C.R);
  }// end of page 2
}



LaunchpadProMK3.bpmTimerLoopInit = function(deck) {
  DEBUG("############################################################################# " + deck, C.R, 3, 1);
  DEBUG("start bpmTimerLoopInit(" + deck + ")", C.G, 1, 1);
  // make a variable with the channel title
  channel = "[Channel" + deck + "]";
  // what is the bpm for this deck
  let bpm = engine.getValue(channel, "bpm");
  DEBUG(" channel " + channel + "   bpm " +C.O+ bpm, C.RE);
  // if the track does have a bpm..
  if (bpm) {
    // initiate array for post-scaling bpms
    bpmScaledBpm[deck] = [];
    // initiate array for scaled beat length
    bpmScaledTimes[deck] = [];
    // initiate array for last flash time of a pad
    // get colour of this deck
    deckColour = LaunchpadProMK3.deck.config[deck].colour;

    /// for each deck, for each ratio element of the row, calculate and start timers for pad animations outcome
    // start an index variable
    scaleInc = 1
    /// for each 8 scale entries in the scaling object, for 8 columns
    // is this deck playing?
    bpmDeckPlaying = engine.getValue(channel, "play")
    DEBUG("bpmDeckPlaying is a " + bpmDeckPlaying +C.RE+ "   start bpmScaling Object for each:", C.G, 1, 1)
    // if it is then..
    if (bpmDeckPlaying) {
      // prepare and launch timers for all columns
      Object.entries(LaunchpadProMK3.bpmScaling).forEach((ratio) => {
        // collect values for this pad
        let scale = ratio[1].scale;
        let control = ratio[1].control;
        let colour = ratio[1].colour;

        // top left is 80, figure how far down by deck, scaleInc pads from the left
        let address = 80 - (deck * 20) + scaleInc;
        DEBUG("scaleInc " +C.O+ scaleInc +C.RE+ ":   scale " +C.O+ JSON.stringify(scale) +C.RE+ "   address " +C.R+ address, C.G, 1, 1)

        // with this scale ratio, what would be the new bpm?
        bpmNew = bpm * scale;

        // store this in an array
        bpmScaledBpm[deck].push(bpmNew);
        DEBUG("bpmScaledBpm[deck] " + bpmScaledBpm[deck], C.G);

        // with this new bpm, how many ms between beats?
        let bpmScaledTime = (60000 / bpmScaledBpm[deck][scaleInc-1]) * 4;
        DEBUG("bpmScaledTime " + bpmScaledTime, C.O);
        DEBUG("bpmScaledTimes " + bpmScaledTimes, C.O);

        // store this in an array
        bpmScaledTimes[deck].push(bpmScaledTime);
        DEBUG("bpmScaledTimes[deck] " + bpmScaledTimes[deck], C.RE);
        DEBUG("LaunchpadProMK3.bpmTimer " + JSON.stringify(LaunchpadProMK3.bpmTimer), C.O);

        // animation timers
        // for this pad, start a timer to make it flash, store that in an array at a position matching the pad address
        //LaunchpadProMK3.bpmTimer[address] = engine.beginTimer(bpmScaledTime, LaunchpadProMK3.bpmFlashInit(deck, address, control, colour, deckColour, bpmScaledTime))
        LaunchpadProMK3.lastFlashTime[address] = Date.now();

        DEBUG("calling function to start four one-shot timers for each double-pad indicator", C.M);
        //DEBUG("a function that will restart itself, with drift compensation?", C.G, 0, 2)
        DEBUG(" for " + address )

        //LaunchpadProMK3.bpmTimer[address] = function() {
        //  LaunchpadProMK3.bpmFlashInit(deck, address, control, colour, deckColour, bpmScaledTime); };
        //
        LaunchpadProMK3.bpmTimer[address] = engine.beginTimer(
          bpmScaledTime,
          () => LaunchpadProMK3.bpmFlashInit(deck, address, control, colour, deckColour, bpmScaledTime)
        );

        //LaunchpadProMK3.bpmFlashInit(deck, address, control, colour, deckColour, bpmScaledTime);
        //LaunchpadProMK3.bpmTimer[address] = LaunchpadProMK3.bpmFlashInit(deck, address, control, colour, deckColour, bpmScaledTime)

        // increment reference index
        scaleInc++;
        DEBUG(scaleInc, C.R, 2, 3)
      }) //end of scaling object foreach
      DEBUG("end of scaling object loop", C.R)
    }//end of is playing
    DEBUG("end of is playing", C.R)
  }//end of bpm defined
  DEBUG("end of bpm defined...", C.R)
  DEBUG("end of bpmTimerLoopInit......", C.R, 1, 2)
}//end of bpmTimerLoopInit



// multiply to save some decimal places after rounding then dividing again
//let bpmNew1 = bpm * 10000;
//let bpmNew2 = Math.round(bpmNew1 * scale);
//let bpmNew = bpmNew2 / 10000;
// multiply to save some decimal places after rounding then dividing again
//let bpmScaledTimeNew1 = bpmScaledTime * 10000
//let bpmScaledTimeNew2 = Math.round(bpmScaledTimeNew1)
//let bpmScaledTimeNew = bpmScaledTimeNew2 / 10000
// looses accuricy
//if (Object.values(LaunchpadProMK3.decks[1].pads).includes(address)) { deck = 1 }
//if (Object.values(LaunchpadProMK3.decks[2].pads).includes(address)) { deck = 2 }
//if (Object.values(LaunchpadProMK3.decks[3].pads).includes(address)) { deck = 3 }
//if (Object.values(LaunchpadProMK3.decks[4].pads).includes(address)) { deck = 4 }
//deckColour = LaunchpadProMK3.deck.config[deck].colour;
//LaunchpadProMK3.tempoScaleDeckFlash(address, LaunchpadProMK3.bpmTimer[address].deck, control, colour, deckColour, bpmScaledTime);
//DEBUG("LaunchpadProMK3.decks " + JSON.stringify(LaunchpadProMK3.decks));
//DEBUG("LaunchpadProMK3.bpmTimer " + JSON.stringify(LaunchpadProMK3.bpmTimer), C.O);

//DEBUG("deckColour " + LaunchpadProMK3.deck.config[deck].colour.toString(16));
// get the colour for this deck
//let deckColour = LaunchpadProMK3.deck.config[deck].colour;


bpmT = 0

// for each pair of pads, aka double-pads
LaunchpadProMK3.bpmFlashInit = function (deck, address, control, colour, deckColour, bpmScaledTime) {
  DEBUG("bpmFlashInit ##################################################### " + deck, C.C, 2);
  // display then increment index number
  DEBUG("bpmT " + bpmT)
  bpmT++
  // slow things down for testing
  LaunchpadProMK3.sleep(100)
  // if were up to 30 loops then pack it in
  if (bpmT === 30) { engine.stopTimer(LaunchpadProMK3.bpmTimer[address]); return }
  DEBUG("address " +C.O+ address +C.RE+ "   deck " +C.O+ deck +C.R+ "   deckColour " +C.O+ deckColour +C.RE+ "/" +C.O+ deckColour.toString(16) +C.R+ "   colour " +C.O+ colour.toString(16) +C.RE+ "   control " +C.O+ control +C.RE+ "   bpmScaledTime " +C.O+ bpmScaledTime)
  DEBUG(" LaunchpadProMK3.bpmTimer " +C.O+ JSON.stringify(LaunchpadProMK3.bpmTimer));
  // get current system time in ms
  const now = Date.now();
  // how much of a difference in noted times?
  const elapsed = now - LaunchpadProMK3.lastFlashTime[address];
  // expected time between flashes (e.g., 250ms for 4Hz)
  const expectedInterval = bpmScaledTime;
  // calculate drift correction
  //const correctionFactor = expectedInterval - elapsed;
  const correctionFactor = Math.max(-expectedInterval / 2, Math.min(expectedInterval / 2, expectedInterval - elapsed));
  // update timestamp for next execution
  DEBUG(" LaunchpadProMK3.lastFlashTime " +C.O+ LaunchpadProMK3.lastFlashTime)
  //DEBUG(address)
  //LaunchpadProMK3.lastFlashTime[address] = now;
  DEBUG(" LaunchpadProMK3.lastFlashTime " +C.O+ LaunchpadProMK3.lastFlashTime)
  // turn it from a hex to rgb array
  DEBUG("colour " + colour)
  if (!colour[2]) colour = LaunchpadProMK3.hexToRGB(colour);
  DEBUG("colour " + colour + "/" +C.O+ colour.toString(16))
  DEBUG("deckColour " + deckColour + "/" +C.O+ deckColour.toString(16))
  if (!deckColour[2]) deckColour = LaunchpadProMK3.hexToRGB(deckColour);
  // darken the values so the unused pads don't distract
  deckColour = LaunchpadProMK3.darkenRGBColour(deckColour, deckUnloadedDimscale);
  DEBUG("deckColour " + deckColour)
  // whats the last digit of the address?
  let lastDigit = address % 10;
  // if it's below 5 then use the top of the double-pad
  if (lastDigit < 5) {
    LaunchpadProMK3.sendRGB(address, colour[0], colour[1], colour[2]);
    LaunchpadProMK3.sendRGB(address-10, deckColour[0], deckColour[1], deckColour[2]); }
  else if (lastDigit > 4) {
    LaunchpadProMK3.sendRGB(address, deckColour[0], deckColour[1], deckColour[2]);
    LaunchpadProMK3.sendRGB(address-10, colour[0], colour[1], colour[2]); }

  bpmFlashLength = bpmScaledTime / 4

  DEBUG("init timer 1", C.M, 1)
  engine.beginTimer(bpmFlashLength, function() {
    DEBUG("in timer 2", C.G, 1)
    let lastDigit = address % 10;
    if (lastDigit < 5) {
      LaunchpadProMK3.sendRGB(address, colour[0], colour[1], colour[2]);
      LaunchpadProMK3.sendRGB(address-10, colour[0], colour[1], colour[2]);
    } else if (lastDigit > 4) {
      LaunchpadProMK3.sendRGB(address, colour[0], colour[1], colour[2]);
      LaunchpadProMK3.sendRGB(address-10, colour[0], colour[1], colour[2]);
    }
    DEBUG("fin timer 1", C.R, 1)
  }, true);

  DEBUG("init timer 2", C.M, 1)
  engine.beginTimer(bpmFlashLength * 2, function() {
    DEBUG("in timer 2", C.G, 1)
    let lastDigit = address % 10;
    if (lastDigit < 5) {
      LaunchpadProMK3.sendRGB(address, deckColour[0], deckColour[1], deckColour[2]);
      LaunchpadProMK3.sendRGB(address-10, colour[0], colour[1], colour[2]);
    } else if (lastDigit > 4) {
      LaunchpadProMK3.sendRGB(address, colour[0], colour[1], colour[2]);
      LaunchpadProMK3.sendRGB(address-10, deckColour[0], deckColour[1], deckColour[2]);
    }
    DEBUG("fin timer 2", C.R, 1)
  }, true);

  DEBUG("init timer 3", C.M, 1)
  engine.beginTimer(bpmFlashLength * 3, function() {
    DEBUG("in timer 3", C.G, 1)
    let lastDigit = address % 10;
    if (lastDigit < 5) {
      LaunchpadProMK3.sendRGB(address, colour[0], colour[1], colour[2]);
      LaunchpadProMK3.sendRGB(address-10, colour[0], colour[1], colour[2]);
    } else if (lastDigit > 4) {
      LaunchpadProMK3.sendRGB(address, colour[0], colour[1], colour[2]);
      LaunchpadProMK3.sendRGB(address-10, colour[0], colour[1], colour[2]);
    }
    DEBUG("fin timer 3", C.R, 1)
  }, true);

  DEBUG("LaunchpadProMK3.bpmTimer " + JSON.stringify(LaunchpadProMK3.bpmTimer), C.O);
  DEBUG("timer finishing...", C.O, 0, 1);
  //DEBUG("LaunchpadProMK3.decks " + JSON.stringify(LaunchpadProMK3.decks));
  //DEBUG("LaunchpadProMK3.bpmTimer " + JSON.stringify(LaunchpadProMK3.bpmTimer), C.O);
  DEBUG("exiting LaunchpadProMK3.tempoScaleDeckFlash..", C.R, 0, 2)

  // given the drift difference, what is the next time to use to stay truer
  adjustedTime = Math.max(1, expectedInterval + correctionFactor)
  // restart the timer with corrected interval
  LaunchpadProMK3.bpmTimer[address] = engine.beginTimer(
    adjustedTime, // Prevent negative or zero interval
    LaunchpadProMK3.bpmFlashInit(deck, address, control, colour, deckColour, bpmScaledTime)
  );


  //DEBUG("stop timer..")
  //// Ensure any existing timer is stopped before starting a new one
  //if (LaunchpadProMK3.bpmTimer[address]) {
  //  engine.stopTimer(LaunchpadProMK3.bpmTimer[address]);
  //}

  // Start the corrected timer
  DEBUG("and again..")
  //LaunchpadProMK3.bpmTimer[address] = engine.beginTimer(bpmScaledTime, LaunchpadProMK3.bpmFlashInit(deck, address, control, colour, deckColour, bpmScaledTime));
  LaunchpadProMK3.bpmTimer[address] = engine.beginTimer(adjustedTime, function() {
    LaunchpadProMK3.bpmFlashInit(deck, address, control, colour, deckColour, bpmScaledTime);
  });
}


/// Fourth page (3)



LaunchpadProMK3.loopControls = [
  //"beatloop_activate",
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

LaunchpadProMK3.updateLoopPage = function() {
  if (LaunchpadProMK3.currentPage === 3) {
    DEBUG("");
    DEBUG("                              .o8                .                                                                   .oooo.   ", C.M);
    DEBUG("                             '888              .o8                                                                 .dP''Y88b  ", C.M);
    DEBUG(" oooo  oooo  oo.ooooo.   .oooo888   .oooo.   .o888oo  .ooooo.       oo.ooooo.   .oooo.    .oooooooo  .ooooo.             ]8P' ", C.M);
    DEBUG(" `888  `888   888' `88b d88' `888  `P  )88b    888   d88' `88b       888' `88b `P  )88b  888' `88b  d88' `88b          <88b.  ", C.M);
    DEBUG("  888   888   888   888 888   888   .oP'888    888   888ooo888       888   888  .oP'888  888   888  888ooo888           `88b. ", C.M);
    DEBUG("  888   888   888   888 888   888  d8(  888    888 . 888    .o       888   888 d8(  888  `88bod8P'  888    .o      o.   .88P  ", C.M);
    DEBUG("  `V88V'V8P'  888bod8P' `Y8bod88P' `Y888''8o   '88'  `Y8bod8P'       888bod8P' `Y888''8o `8oooooo.  `Y8bod8P'      `8bd88P'   ", C.M);
    DEBUG("              888                                                    888                 d'     YD                            ", C.M);
    DEBUG("             o888o                                                  o888o                 'Y88888P'                           ", C.M);
    DEBUG("");
    DEBUG("## updateLoopPage", C.B, 0, 1);

    LaunchpadProMK3.clearMain();
    for (let deck = 1; deck <= totalDecks; deck+=1 ) {
      let deckColour = LaunchpadProMK3.decks[deck].deckColour;
      let rgb = LaunchpadProMK3.hexToRGB(deckColour);
      DEBUG("deck " + deck + "   deckColour #"+ deckColour.toString(16) + "   rgb "+ rgb, C.G);
      //gradStartA = [127, 127, 127];
      gradStartA = [70, 70, 70];
      gradEndA = [10, 10, 30];
      //gradStartB = [20, 20, 20];
      //gradStartB = [120, 120, 120];
      gradStartB = [70, 70, 70];
      gradEndB = rgb;
      LaunchpadProMK3.gradientSetup(deck, undefined, gradStartA, gradEndA, gradStartB, gradEndB);
      DEBUG("end updateLoopPage deck gradient creation")
    };

    DEBUG("## end updateLoopPage", C.G, 1, 2);
  };
};


/// Fifth page (4)


LaunchpadProMK3.updateReverseLoopPage = function() {
  if (LaunchpadProMK3.currentPage === 4) {
    DEBUG("  ");
    DEBUG("                              .o8                .                                                                       .o   ", C.M);
    DEBUG("                             '888              .o8                                                                     .d88   ", C.M);
    DEBUG(" oooo  oooo  oo.ooooo.   .oooo888   .oooo.   .o888oo  .ooooo.       oo.ooooo.   .oooo.    .oooooooo  .ooooo.         .d'888   ", C.M);
    DEBUG(" `888  `888   888' `88b d88' `888  `P  )88b    888   d88' `88b       888' `88b `P  )88b  888' `88b  d88' `88b      .d'  888   ", C.M);
    DEBUG("  888   888   888   888 888   888   .oP'888    888   888ooo888       888   888  .oP'888  888   888  888ooo888      88ooo888oo ", C.M);
    DEBUG("  888   888   888   888 888   888  d8(  888    888 . 888    .o       888   888 d8(  888  `88bod8P'  888    .o           888   ", C.M);
    DEBUG("  `V88V'V8P'  888bod8P' `Y8bod88P' `Y888''8o   '88'  `Y8bod8P'       888bod8P' `Y888''8o `8oooooo.  `Y8bod8P'          o888o  ", C.M);
    DEBUG("              888                                                    888                 d'     YD                            ", C.M);
    DEBUG("             o888o                                                  o888o                 'Y88888P'                           ", C.M);
    DEBUG("  ");
    DEBUG("## updateReverseLoopPage", C.B, 0, 1);

    LaunchpadProMK3.clearMain();
    for (let deck = 1; deck <= 4; deck+=1 ) {
      let deckColour = LaunchpadProMK3.decks[deck].deckColour;
      let rgb = LaunchpadProMK3.hexToRGB(deckColour);
      DEBUG("deck " + deck + "   deckColour #"+ deckColour + "   rgb "+ rgb, C.G);
      gradStartA = [30, 10, 10];
      gradEndA = [127, 127, 127];
      gradStartB = [70, 70, 70];
      gradEndB = rgb;
      LaunchpadProMK3.gradientSetup(deck, undefined, gradStartA, gradEndA, gradStartB, gradEndB);
    };
    DEBUG("## end updateReverseLoopPage", C.G, 1, 2);
  };
};




// Sixth page (5)

LaunchpadProMK3.updateLoopExtrasPage = function() {
  if (LaunchpadProMK3.currentPage === 5) {
    DEBUG("  ");
    DEBUG("                              .o8                .                                                                   oooooooo ", C.M);
    DEBUG("                             '888              .o8                                                                  dP''''''' ", C.M);
    DEBUG(" oooo  oooo  oo.ooooo.   .oooo888   .oooo.   .o888oo  .ooooo.       oo.ooooo.   .oooo.    .oooooooo  .ooooo.       d88888b.   ", C.M);
    DEBUG(" `888  `888   888' `88b d88' `888  `P  )88b    888   d88' `88b       888' `88b `P  )88b  888' `88b  d88' `88b         `Y88b   ", C.M);
    DEBUG("  888   888   888   888 888   888   .oP'888    888   888ooo888       888   888  .oP'888  888   888  888ooo888            ]88  ", C.M);
    DEBUG("  888   888   888   888 888   888  d8(  888    888 . 888    .o       888   888 d8(  888  `88bod8P'  888    .o      o.   .88P  ", C.M);
    DEBUG("  `V88V'V8P'  888bod8P' `Y8bod88P' `Y888''8o   '88'  `Y8bod8P'       888bod8P' `Y888''8o `8oooooo.  `Y8bod8P'      `8bd88P'   ", C.M);
    DEBUG("              888                                                    888                 d'     YD                            ", C.M);
    DEBUG("             o888o                                                  o888o                 'Y88888P'                           ", C.M);
    DEBUG("  ")
    DEBUG("## updateLoopExtrasPage", C.B, 0, 1);
    LaunchpadProMK3.clearMain();

    DEBUG("## end updateLoopExtrasPage", C.G, 1, 2);
  }
}


LaunchpadProMK3.loopMoveControls = [
  ///"loop_move",
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


LaunchpadProMK3.loopExtraControls = [
  "loop_in_goto",
  // Seek to the loop in point.
  "loop out_goto",
  // Seek to the loop out point.

  "loop_half",
  // Halves beatloop_size. If beatloop_size equals the size of the loop, the loop is resized.
  // If a saved loop is currently enabled, the modification is saved to the hotcue slot immediately.
  "loop_double",
  // Doubles beatloop_size. If beatloop_size equals size of the loop, loop is resized.
  // If a saved loop is currently enabled, the modification is saved to the hotcue slot immediately.
  //"loop_scale",
  // Scale the loop length by the value scale is set to by moving the end marker.

  // beatloop_size is not updated to reflect the change. If a saved loop is
  // currently enabled, the modification is saved to the hotcue slot immediately.

  //"loop_in",
  // If loop disabled, sets player loop in position to the current play position.
  // If loop enabled, press and hold to move loop in position to the current play position.
  // If quantize is enabled, beatloop_size will be updated to reflect the new loop size
  //"loop_out",
  // If loop disabled, sets player loop out position to the current play position.
  // If loop enabled, press & hold to move loop out position to the current play position.
  // If quantize is enabled, beatloop_size will be updated to reflect the new loop size.


  "slip_enabled",
  // When active, playback continues muted in the background during a loop, scratch etc.
  // Once disabled, the audible playback will resume where the track would have been.

  "loop_enabled",
  // Indicates whether or not a loop is enabled.
  //"loop_start_position",
  // The player loop-in position in samples, -1 if not set.
  //"loop_end_position",
  // The player loop-in position in samples, -1 if not set.  "reloop_toggle",
  // Toggles the current loop on or off. If the loop is ahead of the current play position,
  // the track will keep playing normally until it reaches the loop.

  "reloop_andstop",  // Activate current loop, jump to its loop in point, and stop playback

  "loop_remove",
  // Clears the last active loop/

  //"hotcue_X_activate",
  // If hotcue X is not set, this sets a hotcue at the current play position and saves it as hotcue X of type “Hotcue”
  // In case a loop is currently enabled (i.e. if [ChannelN],loop_enabled is set to 1),
  // the loop will be saved as hotcue X instead and hotcue_X_type will be set to “Loop”
  // If hotcue X has been set asrsrr cue point, the player seeks to the saved play position.

  //"hotcue_X_enabled",
  // 0 Hotcue X is not set, 1 Hotcue X is set, 2 Hotcue X is active (saved loop is enabled or hotcue is previewing)

  //r//"reverse",

  //"reverseroll",
];




// seventh page (6)
// page that shows controls for only one deck


LaunchpadProMK3.updateOneDeckPage = function() {
  if (LaunchpadProMK3.currentPage === 6) {
    DEBUG("                              .o8                .                                                                    .ooo   ", C.M);
    DEBUG("                             '888              .o8                                                                  .88'     ", C.M);
    DEBUG(" oooo  oooo  oo.ooooo.   .oooo888   .oooo.   .o888oo  .ooooo.       oo.ooooo.   .oooo.    .oooooooo  .ooooo.       d88'      ", C.M);
    DEBUG(" `888  `888   888' `88b d88' `888  `P  )88b    888   d88' `88b       888' `88b `P  )88b  888' `88b  d88' `88b     d888P'Ybo. ", C.M);
    DEBUG("  888   888   888   888 888   888   .oP'888    888   888ooo888       888   888  .oP'888  888   888  888ooo888     Y88[   ]88 ", C.M);
    DEBUG("  888   888   888   888 888   888  d8(  888    888 . 888    .o       888   888 d8(  888  `88bod8P'  888    .o     `Y88   88P ", C.M);
    DEBUG("  `V88V'V8P'  888bod8P' `Y8bod88P' `Y888''8o   '88'  `Y8bod8P'       888bod8P' `Y888''8o `8oooooo.  `Y8bod8P'      `88bod8'  ", C.M);
    DEBUG("              888                                                    888                 d'     YD                           ", C.M);
    DEBUG("             o888o                                                  o888o                 'Y88888P'                          ", C.M);
    DEBUG("  ");
    DEBUG("## updateOneDeckPage", C.B, 0, 1);
    //if (address > 11 && address < 28) { padPoss = 4 }
    //if (address > 31 && address < 48) { padPoss = 3 }
    //if (address > 51 && address < 68) { padPoss = 2 }
    //if (address > 71 && address < 88) { padPoss = 1 }

    selected = LaunchpadProMK3.selectedDeck;
    //LaunchpadProMK3.changeMainToDeck()
    LaunchpadProMK3.clearMain();

    let deckColour = LaunchpadProMK3.decks[selected].deckColour;
    let rgb = LaunchpadProMK3.hexToRGB(deckColour);

    DEBUG("deck " + selected + "   deckColour #"+ deckColour + "   rgb "+ rgb, C.G);
    DEBUG("top; rloop gradient;");
    gradStartA = [20, 0, 0];
    gradEndA = [127, 127, 127];
    gradStartB = [20, 20, 20];
    gradEndB = rgb;
    LaunchpadProMK3.gradientSetup(selected, 3, gradStartA, gradEndA, gradStartB, gradEndB);
    LaunchpadProMK3.updateHotcueLights(selected);

    DEBUG("middle; loop gradient;");
    DEBUG("deck " + selected + "   deckColour #"+ deckColour + "   rgb "+ rgb, C.G);
    gradStartA = [127, 127, 127];
    gradEndA = [0, 0, 20];
    gradStartB = rgb;
    gradEndB = [20, 20, 20];
    LaunchpadProMK3.gradientSetup(selected, 1, gradStartA, gradEndA, gradStartB, gradEndB);
    LaunchpadProMK3.updateHotcueLights(selected);

    DEBUG("bottom; beatjump gradient;");
    DEBUG("deck " + selected + "   deckColour #"+ deckColour + "   rgb "+ rgb, C.G);
    gradStartA = [20, 20, 20];
    gradEndA = [112, 112, 112];
    gradStartB = rgb;
    gradEndB = [127, 127, 127];
    LaunchpadProMK3.gradientSetup(selected, 2, gradStartA, gradEndA, gradStartB, gradEndB);
    LaunchpadProMK3.updateHotcueLights(selected);
  }// end page check
}

