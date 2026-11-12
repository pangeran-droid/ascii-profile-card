(function(){
  "use strict";

  // ---- constants ported from the Python generator -------------------------
  var RAMP_PRESETS = {
    default: " .:+#@",
    standard: " .:-=+*#%@",
    minimal: " .:#@",
    dense: " .'`^\",:;Il!i~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$"
  };
  var RAMP = RAMP_PRESETS.default;
  var ART_COLLECTION = window.ASCII_ART_COLLECTION;
  if (!Array.isArray(ART_COLLECTION) || ART_COLLECTION.some(function(item){
    return !item || typeof item.name !== "string" || typeof item.art !== "string" || !item.art.trim();
  })) throw new Error("assets/art-collection.js must define window.ASCII_ART_COLLECTION with named, non-empty ASCII art entries.");
  var CELL_W = 8.4, CELL_H = 15.0, ART_COLS = 40, TITLEBAR_H = 34;
  var PROMPT_TYPE_SPEED = 0.08, PROMPT_DELETE_SPEED = 0.045,
      PROMPT_HOLD_TIME = 1.1, PROMPT_GAP_TIME = 0.4, PROMPT_CHAR_W = 9.0;

  function xmlEscape(s){
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&apos;');
  }
  function pyStr(s){ return '"' + String(s).replace(/\\/g,'\\\\').replace(/"/g,'\\"') + '"'; }
  function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
  function mod(a,n){ return ((a % n) + n) % n; }
  function pyUnescape(s){ return String(s).replace(/\\(.)/g, '$1'); }

  // ---- default state --------------------------------------------------------
  function defaultState(){
    return {
      login: "kali",
      repo: "",
      fields: [
        ["Role", "informatics student"],
        ["Focus", "junior web developer & cybersecurity enthusiast"],
        ["Stack.Frontend", "html, css, javascript"],
        ["Stack.Backend", "php, laravel, codeigniter"],
        ["Stack.Scripting", "python"],
        ["Stack.Database", "mysql"],
        ["Stack.Security", "burp suite"],
        ["Environment", "linux, git, github, vscode"],
        ["Interests", "cybersecurity"],
        ["Contact.GitHub", "github.com/kali"],
        ["Contact.Telegram", "t.me/pangeran1337"],
        ["GitHub.Repos", "N/A"],
        ["GitHub.Stars", "N/A"],
        ["GitHub.Followers", "N/A"],
        ["GitHub.Languages", "N/A"],
        ["GitHub.Contributions", "N/A"]
      ],
      promptCommands: ["informatics student", "junior web developer", "cybersecurity enthusiast"],
      colors: {
        bg: "#0b1120", titlebar: "#141c30", titleText: "#7f8aa6",
        accent: "#5dc9f2", header: "#e8384f", label: "#ffffff", value: "#5dc9f2",
        palette: ["#0b1120", "#e8384f", "#3ddc84", "#ffd166", "#4d8cff", "#b16cff", "#39e0d0", "#e8e8e8"]
      },
      advanced: {
        artCols: 40,
        typeSpeed: 0.08,
        deleteSpeed: 0.045,
        holdTime: 1.1,
        gapTime: 0.4,
        charW: 9.0
      },
      asciiRamp: RAMP_PRESETS.default,
      asciiArtIndex: -1,
      avatarDataUrl: null
    };
  }
  var state = defaultState();
  var artRows = [];
  var avatarImgEl = null; // cached <img> so ART_COLS changes can re-sample without a re-upload

  function syncAdvancedGlobals(){
    ART_COLS = clamp(Math.round(state.advanced.artCols) || 40, 10, 120);
    RAMP = state.asciiRamp;
    PROMPT_TYPE_SPEED = state.advanced.typeSpeed > 0 ? state.advanced.typeSpeed : 0.08;
    PROMPT_DELETE_SPEED = state.advanced.deleteSpeed > 0 ? state.advanced.deleteSpeed : 0.045;
    PROMPT_HOLD_TIME = Math.max(0, state.advanced.holdTime);
    PROMPT_GAP_TIME = Math.max(0, state.advanced.gapTime);
    PROMPT_CHAR_W = state.advanced.charW > 0 ? state.advanced.charW : 9.0;
  }

  // ---- theme presets ---------------------------------------------------------
  var THEMES = [
    { name: "Kali", colors: { bg:"#0b1120", titlebar:"#141c30", titleText:"#7f8aa6", accent:"#5dc9f2", header:"#e8384f", label:"#ffffff", value:"#5dc9f2",
      palette:["#0b1120","#e8384f","#3ddc84","#ffd166","#4d8cff","#b16cff","#39e0d0","#e8e8e8"] } },
    { name: "Dracula", colors: { bg:"#1e1f29", titlebar:"#282a36", titleText:"#6272a4", accent:"#8be9fd", header:"#ff79c6", label:"#f8f8f2", value:"#50fa7b",
      palette:["#282a36","#ff5555","#50fa7b","#f1fa8c","#bd93f9","#ff79c6","#8be9fd","#f8f8f2"] } },
    { name: "Nord", colors: { bg:"#2e3440", titlebar:"#3b4252", titleText:"#4c566a", accent:"#88c0d0", header:"#bf616a", label:"#eceff4", value:"#a3be8c",
      palette:["#3b4252","#bf616a","#a3be8c","#ebcb8b","#81a1c1","#b48ead","#88c0d0","#e5e9f0"] } },
    { name: "Gruvbox", colors: { bg:"#1d2021", titlebar:"#282828", titleText:"#928374", accent:"#83a598", header:"#fb4934", label:"#ebdbb2", value:"#b8bb26",
      palette:["#282828","#fb4934","#b8bb26","#fabd2f","#83a598","#d3869b","#8ec07c","#ebdbb2"] } },
    { name: "Monokai", colors: { bg:"#1e1f1c", titlebar:"#272822", titleText:"#75715e", accent:"#66d9ef", header:"#f92672", label:"#f8f8f2", value:"#a6e22e",
      palette:["#272822","#f92672","#a6e22e","#e6db74","#66d9ef","#ae81ff","#fd971f","#f8f8f2"] } },
    { name: "Ocean", colors: { bg:"#061621", titlebar:"#0a2232", titleText:"#4c7f9e", accent:"#3ddce4", header:"#ff6b6b", label:"#eaf6ff", value:"#5ad1ff",
      palette:["#0a2232","#ff6b6b","#4cd3a5","#ffd166","#5ad1ff","#9b8cff","#3ddce4","#eaf6ff"] } },
    { name: "One Dark", colors: { bg:"#21252b", titlebar:"#282c34", titleText:"#5c6370", accent:"#61afef", header:"#e06c75", label:"#abb2bf", value:"#98c379",
      palette:["#282c34","#e06c75","#98c379","#e5c07b","#61afef","#c678dd","#56b6c2","#abb2bf"] } },
    { name: "Catppuccin", colors: { bg:"#1e1e2e", titlebar:"#181825", titleText:"#6c7086", accent:"#89b4fa", header:"#f38ba8", label:"#cdd6f4", value:"#a6e3a1",
      palette:["#181825","#f38ba8","#a6e3a1","#f9e2af","#89b4fa","#f5c2e7","#94e2d5","#cdd6f4"] } },
    { name: "Solarized Dark", colors: { bg:"#001b26", titlebar:"#073642", titleText:"#657b83", accent:"#2aa198", header:"#dc322f", label:"#839496", value:"#859900",
      palette:["#073642","#dc322f","#859900","#b58900","#2aa198","#6c71c4","#268bd2","#839496"] } },
    { name: "Cyberpunk", colors: { bg:"#05050a", titlebar:"#0f0e17", titleText:"#727586", accent:"#00f0ff", header:"#ff007f", label:"#ffff00", value:"#00ff66",
      palette:["#0f0e17","#ff007f","#00ff66","#ffff00","#00f0ff","#9d00ff","#ff5500","#ffffff"] } },
    { name: "Ubuntu", colors: { bg:"#380c2a", titlebar:"#2c2c2c", titleText:"#b0b2b2", accent:"#be1b28", header:"#27a167", label:"#be1b28", value:"#cdf9ff",
      palette:["#171421","#c01c28","#26a269","#a2734c","#12488b","#a347ba","#2aa1b3","#d0cfcc"] } },
    { name: "Mint-Y", colors: { bg:"#1e1e1e", titlebar:"#252525", titleText:"#7f7f7f", accent:"#98cb4c", header:"#f44336", label:"#ffffff", value:"#98cb4c",
      palette:["#252525","#f44336","#98cb4c","#ffeb3b","#2196f3","#9c27b0","#00bcd4","#ffffff"] } },
    { name: "Arch Linux", colors: { bg:"#0f1419", titlebar:"#171e26", titleText:"#526270", accent:"#1793d1", header:"#ff5370", label:"#d3c6aa", value:"#a7c080",
      palette:["#171e26","#ff5370","#a7c080","#dbbc7f","#1793d1","#b48ead","#83c092","#d3c6aa"] } },
    { name: "Debian", colors: { bg:"#1c1c1c", titlebar:"#262626", titleText:"#767676", accent:"#d70751", header:"#d70751", label:"#ffffff", value:"#ffb300",
      palette:["#262626","#d70751","#61ce3c","#ffb300","#0080ff","#af00ff","#00cccc","#ffffff"] } },
    { name: "Fedora", colors: { bg:"#181b20", titlebar:"#222630", titleText:"#6b7385", accent:"#294172", header:"#3c6eb4", label:"#ffffff", value:"#519aba",
      palette:["#222630","#a23232","#539e3b","#c4a000","#3c6eb4","#8856a7","#2a8282","#ffffff"] } },
    { name: "Matrix", colors: { bg:"#0d0208", titlebar:"#001100", titleText:"#005500", accent:"#00ff66", header:"#ff0033", label:"#008f11", value:"#00ff41",
      palette:["#001100","#ff0033","#00ff41","#33ff00","#008f11","#00ffcc","#003300","#00ff00"] } },
    { name: "SynthWave '84", colors: { bg:"#262335", titlebar:"#241b2f", titleText:"#6c5b7b", accent:"#ff7edb", header:"#fe4450", label:"#f4eee4", value:"#36f9f6",
      palette:["#241b2f","#fe4450","#36f9f6","#fede5d","#ff7edb","#9775fa","#03edf9","#f4eee4"] } },
    { name: "Tokyo Night", colors: { bg:"#1a1b26", titlebar:"#16161e", titleText:"#565f89", accent:"#7aa2f7", header:"#f7768e", label:"#c0caf5", value:"#9ece6a",
      palette:["#16161e","#f7768e","#9ece6a","#e0af68","#7aa2f7","#bb9af7","#7dcfff","#c0caf5"] } },
    { name: "Rose Pine", colors: { bg:"#191724", titlebar:"#1f1d2e", titleText:"#6e6a86", accent:"#ebbcba", header:"#eb6f92", label:"#e0def4", value:"#31748f",
      palette:["#1f1d2e","#eb6f92","#31748f","#f6c177","#ebbcba","#c4a7e7","#9ccfd8","#e0def4"] } },
    { name: "Ayu Dark", colors: { bg:"#0b0e14", titlebar:"#10151d", titleText:"#5c6773", accent:"#39bae6", header:"#ff3333", label:"#bfbdb6", value:"#aad94c",
      palette:["#10151d","#ff3333","#aad94c","#ffcc66","#39bae6","#f07178","#5ccfe6","#bfbdb6"] } },
    { name: "Hacker Green", colors: { bg:"#000000", titlebar:"#050505", titleText:"#004400", accent:"#00ff00", header:"#008800", label:"#00cc00", value:"#00ff00",
      palette:["#000000","#003300","#006600","#009900","#00cc00","#00ff00","#33ff33","#66ff66"] } },
    { name: "Amber Terminal", colors: { bg:"#120a00", titlebar:"#1a1000", titleText:"#663d00", accent:"#ffb000", header:"#ff6600", label:"#ffd280", value:"#ffb000",
      palette:["#1a1000","#cc3300","#ff8000","#ffb000","#ffcc00","#ff9933","#ffaa00","#fff0cc"] } },
    { name: "Phosphorus", colors: { bg:"#030c08", titlebar:"#061710", titleText:"#1e5941", accent:"#2ecc71", header:"#e74c3c", label:"#a3e4d7", value:"#57d9a3",
      palette:["#061710","#c0392b","#27ae60","#f39c12","#2980b9","#8e44ad","#1abc9c","#ecf0f1"] } },
    { name: "Mr. Robot", colors: { bg:"#0d0d0d", titlebar:"#171717", titleText:"#444444", accent:"#c0392b", header:"#e74c3c", label:"#cccccc", value:"#ffffff",
      palette:["#171717","#e74c3c","#27ae60","#f39c12","#2980b9","#8e44ad","#16a085","#ffffff"] } },
    { name: "C64 Retro", colors: { bg:"#352879", titlebar:"#4b3e8e", titleText:"#786bc6", accent:"#73efff", header:"#8f563b", label:"#aaceff", value:"#ffffff",
      palette:["#352879","#8f563b","#73efff","#786bc6","#aaceff","#ffffff","#d8ac9c","#4b3e8e"] } },
    { name: "BackTrack", colors: { bg:"#0e0f12", titlebar:"#16181d", titleText:"#51576d", accent:"#00ffff", header:"#00ffff", label:"#ffffff", value:"#00ffff",
      palette:["#16181d","#ff0055","#00ff66","#ffcc00","#00ffff","#9900ff","#ffffff","#7d839e"] } },
    { name: "Terminal Basic", colors: { bg:"#000000", titlebar:"#1a1a1a", titleText:"#666666", accent:"#ffffff", header:"#ff5555", label:"#cccccc", value:"#55ff55",
      palette:["#000000","#ff5555","#55ff55","#ffff55","#5555ff","#ff55ff","#55ffff","#ffffff"] } },
    { name: "Vaporwave", colors: { bg:"#1b1a24", titlebar:"#252433", titleText:"#706c9e", accent:"#ff71ce", header:"#01cdfe", label:"#b967ff", value:"#05ffa1",
      palette:["#252433","#ff71ce","#01cdfe","#05ffa1","#b967ff","#fffb96","#ff71ce","#ffffff"] } },
    { name: "Cyberdeck", colors: { bg:"#08090d", titlebar:"#11131c", titleText:"#414868", accent:"#ff9e64", header:"#f7768e", label:"#bb9af7", value:"#7dcfff",
      palette:["#11131c","#f7768e","#9ece6a","#e0af68","#7aa2f7","#bb9af7","#7dcfff","#c0caf5"] } },
    { name: "Black Hat", colors: { bg:"#050505", titlebar:"#0a0a0a", titleText:"#333333", accent:"#e50914", header:"#ff1e1e", label:"#e0e0e0", value:"#b3b3b3",
      palette:["#0a0a0a","#e50914","#333333","#555555","#777777","#999999","#cccccc","#ffffff"] } },
    { name: "GitHub Dark", colors: { bg:"#0d1117", titlebar:"#161b22", titleText:"#8b949e", accent:"#58a6ff", header:"#ff7b72", label:"#c9d1d9", value:"#7ee787",
      palette:["#161b22","#ff7b72","#7ee787","#f0883e","#58a6ff","#bc8cff","#39c5cf","#c9d1d9"] } },
    { name: "Night Owl", colors: { bg:"#011627", titlebar:"#010e1a", titleText:"#637777", accent:"#82aaff", header:"#d9f5ff", label:"#d6deeb", value:"#c792ea",
      palette:["#010e1a","#ef5350","#22da6e","#addb67","#82aaff","#c792ea","#21ecdc","#d6deeb"] } },
    { name: "Material Darker", colors: { bg:"#212121", titlebar:"#1a1a1a", titleText:"#616161", accent:"#80cbc4", header:"#f07178", label:"#eeffff", value:"#c3e88d",
      palette:["#1a1a1a","#f07178","#c3e88d","#ffcb6b","#82aaff","#c792ea","#89ddff","#eeffff"] } },
    { name: "Solarized Light", colors: { bg:"#fdf6e3", titlebar:"#eee8d5", titleText:"#93a1a1", accent:"#2aa198", header:"#dc322f", label:"#657b83", value:"#859900",
      palette:["#eee8d5","#dc322f","#859900","#b58900","#2aa198","#6c71c4","#268bd2","#657b83"] } },
    { name: "Matrix Gold", colors: { bg:"#0a0800", titlebar:"#1a1400", titleText:"#665200", accent:"#ffcc00", header:"#ff3300", label:"#ffdd66", value:"#ffea80",
      palette:["#1a1400","#ff3300","#ffcc00","#ffaa00","#ff9900","#ff6600","#ffee55","#ffffff"] } }
  ];
  var COLOR_KEY_TO_ID = { bg:"Bg", titlebar:"Titlebar", titleText:"TitleText", accent:"Accent", header:"Header", label:"Label", value:"Value" };

  // ---- procedural dragon art (used when no avatar is set) -------------------
  function asciiRowsDragon(){
    var rowsN = Math.max(1, Math.round(ART_COLS * (CELL_W / CELL_H)));
    var midChars = ":;.";
    function inDragon(x, y){
      var nx = (x - ART_COLS * 0.42) / (ART_COLS / 2);
      var ny = (y - rowsN * 0.5) / (rowsN / 2);
      var r = Math.sqrt(nx*nx + ny*ny);
      var theta = (nx * 3.4 + ny * 2.1);
      var spiral = Math.abs(mod(r * 5.0 - theta, 2.0) - 1.0) < 0.22;
      return spiral && r < 0.9;
    }
    var out = [];
    for (var y = 0; y < rowsN; y++){
      var line = "";
      for (var x = 0; x < ART_COLS; x++){
        if (inDragon(x, y)) line += (Math.random() < 0.12) ? " " : midChars[Math.floor(Math.random()*midChars.length)];
        else line += " ";
      }
      out.push(line);
    }
    return out;
  }

  function asciiRowsFromCollection(index){
    var lines = ART_COLLECTION[index].art.replace(/\r/g, "").split("\n");
    while (lines.length && !lines[0].trim()) lines.shift();
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    return lines;
  }

  function currentArtRows(){
    return state.asciiArtIndex >= 0
      ? asciiRowsFromCollection(state.asciiArtIndex)
      : asciiRowsDragon();
  }

  // ---- avatar -> ASCII art via canvas ---------------------------------------
  function asciiRowsFromImage(img){
    return new Promise(function(resolve){
      var w = img.naturalWidth, h = img.naturalHeight;
      var side = Math.min(w, h);
      var left = Math.floor((w - side) / 2), top = Math.floor((h - side) / 2);
      var cap = 420;
      var scale = side > cap ? cap / side : 1;
      var outSide = Math.max(1, Math.round(side * scale));

      var crop = document.createElement("canvas");
      crop.width = outSide; crop.height = outSide;
      var cctx = crop.getContext("2d");
      cctx.drawImage(img, left, top, side, side, 0, 0, outSide, outSide);
      var data = cctx.getImageData(0, 0, outSide, outSide).data;

      var minAlpha = 255;
      for (var i = 3; i < data.length; i += 4) if (data[i] < minAlpha) minAlpha = data[i];
      var hasRealAlpha = minAlpha < 250;

      var n = outSide * outSide;
      var alphaArr = new Float32Array(n);
      var grayArr = new Float32Array(n);

      if (hasRealAlpha){
        for (var p0 = 0, idx0 = 3; p0 < n; p0++, idx0 += 4) alphaArr[p0] = data[idx0];
      } else {
        var m = Math.max(2, Math.round(outSide * 0.05));
        var rs = [], gs = [], bs = [];
        function collect(x0,x1,y0,y1){
          for (var y = y0; y < y1; y++) for (var x = x0; x < x1; x++){
            var k = (y * outSide + x) * 4;
            rs.push(data[k]); gs.push(data[k+1]); bs.push(data[k+2]);
          }
        }
        collect(0, m, 0, m); collect(outSide-m, outSide, 0, m);
        collect(0, m, outSide-m, outSide); collect(outSide-m, outSide, outSide-m, outSide);
        function median(arr){ var s = arr.slice().sort(function(a,b){return a-b;}); var mid = Math.floor(s.length/2); return s.length % 2 ? s[mid] : (s[mid-1]+s[mid])/2; }
        var br = median(rs), bgc = median(gs), bb = median(bs);
        for (var y2 = 0; y2 < outSide; y2++) for (var x2 = 0; x2 < outSide; x2++){
          var k2 = (y2*outSide+x2)*4;
          var dr = data[k2]-br, dg = data[k2+1]-bgc, db = data[k2+2]-bb;
          var dist = Math.sqrt(dr*dr+dg*dg+db*db);
          alphaArr[y2*outSide+x2] = clamp((dist - 42.0) * 6.0, 0, 255);
        }
      }
      for (var p1 = 0, idx1 = 0; p1 < n; p1++, idx1 += 4){
        grayArr[p1] = data[idx1]*0.299 + data[idx1+1]*0.587 + data[idx1+2]*0.114;
      }

      var rowsN = Math.max(1, Math.round(ART_COLS * (CELL_W / CELL_H)));

      function resizeChannel(arr){
        var src = document.createElement("canvas");
        src.width = outSide; src.height = outSide;
        var sctx = src.getContext("2d");
        var sdata = sctx.createImageData(outSide, outSide);
        for (var q = 0; q < arr.length; q++){
          var v = clamp(Math.round(arr[q]), 0, 255);
          sdata.data[q*4] = v; sdata.data[q*4+1] = v; sdata.data[q*4+2] = v; sdata.data[q*4+3] = 255;
        }
        sctx.putImageData(sdata, 0, 0);
        var dst = document.createElement("canvas");
        dst.width = ART_COLS; dst.height = rowsN;
        var dctx = dst.getContext("2d");
        dctx.imageSmoothingEnabled = true;
        try { dctx.imageSmoothingQuality = "high"; } catch(e){}
        dctx.drawImage(src, 0, 0, outSide, outSide, 0, 0, ART_COLS, rowsN);
        return dctx.getImageData(0, 0, ART_COLS, rowsN).data;
      }

      var alphaSmall = resizeChannel(alphaArr);
      var graySmall = resizeChannel(grayArr);

      var rows = [];
      for (var ry = 0; ry < rowsN; ry++){
        var line = "";
        for (var rx = 0; rx < ART_COLS; rx++){
          var pp = (ry*ART_COLS+rx)*4;
          var fg = alphaSmall[pp] / 255.0;
          if (fg < 0.22){ line += " "; continue; }
          var lum = graySmall[pp] / 255.0;
          var ci = Math.min(RAMP.length - 1, Math.floor(lum * (RAMP.length - 1)));
          line += RAMP[ci];
        }
        rows.push(line);
      }
      resolve(rows);
    });
  }

  // ---- terminal prompt typing animation (SVG) --------------------------------
  function buildPromptTypingSvg(commands, x, y){
    if (!commands.length) commands = [""];
    var durations = commands.map(function(c){
      var n = Math.max(1, c.length);
      return n*PROMPT_TYPE_SPEED + PROMPT_HOLD_TIME + n*PROMPT_DELETE_SPEED + PROMPT_GAP_TIME;
    });
    var total = durations.reduce(function(a,b){return a+b;}, 0) || 1;
    var maxW = Math.max.apply(null, commands.map(function(c){return c.length;})) * PROMPT_CHAR_W;

    var keyframesCss = [], cursorStops = [], groupsSvg = [];
    var t = 0;
    commands.forEach(function(cmd, i){
      var n = Math.max(1, cmd.length);
      var fullW = n * PROMPT_CHAR_W;
      var typeDur = n * PROMPT_TYPE_SPEED;
      var deleteDur = n * PROMPT_DELETE_SPEED;
      var tStart = t;
      var tTypeEnd = tStart + typeDur;
      var tHoldEnd = tTypeEnd + PROMPT_HOLD_TIME;
      var tDeleteEnd = tHoldEnd + deleteDur;
      t = tDeleteEnd + PROMPT_GAP_TIME;

      function pct(sec){ return Math.round(clamp(sec/total*100, 0, 100) * 1000) / 1000; }

      var stops = [
        [0, 0, "steps(1, jump-end)"],
        [pct(tStart), 0, "steps(" + n + ", jump-end)"],
        [pct(tTypeEnd), fullW, "steps(1, jump-end)"],
        [pct(tHoldEnd), fullW, "steps(" + n + ", jump-end)"],
        [pct(tDeleteEnd), 0, "steps(1, jump-end)"],
        [100, 0, "steps(1, jump-end)"]
      ];
      var seen = [];
      stops.forEach(function(s){
        if (seen.length && seen[seen.length-1][0] === s[0]) seen[seen.length-1] = s;
        else seen.push(s);
      });

      var body = seen.map(function(s){ return s[0] + "% { width: " + s[1].toFixed(1) + "px; animation-timing-function: " + s[2] + "; }"; }).join(" ");
      keyframesCss.push("@keyframes promptClip" + i + " { " + body + " }");
      cursorStops = cursorStops.concat(seen);

      groupsSvg.push('\n      <clipPath id="promptClip' + i + '">\n        <rect x="' + x + '" y="' + (y-14) + '" width="' + fullW.toFixed(1) + '" height="20" class="promptClipRect' + i + '" />\n      </clipPath>');
    });

    var textSvg = commands.map(function(cmd, i){
      var fullW = Math.max(1, cmd.length) * PROMPT_CHAR_W;
      return '\n      <text x="' + x + '" y="' + y + '" class="promptcmd" clip-path="url(#promptClip' + i + ')" textLength="' + fullW.toFixed(1) + '" lengthAdjust="spacingAndGlyphs" xml:space="preserve">' + xmlEscape(cmd) + '</text>';
    }).join("");

    var clipAnimCss = commands.map(function(_, i){
      return ".promptClipRect" + i + " { animation: promptClip" + i + " " + total.toFixed(3) + "s infinite; }";
    }).join("\n      ");

    var cursorBody = cursorStops.map(function(s){
      return s[0] + "% { transform: translateX(" + s[1].toFixed(1) + "px); animation-timing-function: " + s[2] + "; }";
    }).join(" ");
    var cursorCss = "@keyframes promptCursorMove { " + cursorBody + " }\n      .promptcursor { animation: promptCursorMove " + total.toFixed(3) + "s infinite, blink 1s steps(1) infinite; }";

    var cursorSvg = '<rect x="' + x.toFixed(1) + '" y="' + (y-14).toFixed(1) + '" width="8" height="16" class="promptcursor" />';

    var style = keyframesCss.join("\n      ") + "\n      " + clipAnimCss + "\n      " + cursorCss;
    var defs = groupsSvg.join("");
    return { style: style, defs: defs, cmdSvg: textSvg, cursorSvg: cursorSvg, maxW: maxW };
  }

  // ---- full card SVG, ported 1:1 from build_svg() in the Python script -------
  function buildSvg(rows, fields, login, colors, promptCommands){
    var artCols = Math.max(ART_COLS, Math.max.apply(null, rows.map(function(row){ return row.length; })));
    var PAD = 34, ART_W = artCols * CELL_W, ART_H = rows.length * CELL_H, GAP = 46,
        FIELD_LINE_H = 22, HEADER_H = 26, RULE_GAP = 10, SWATCH = 20, SWATCH_GAP = 8, PROMPT_H = 62;

    var infoX = PAD + ART_W + GAP;
    var headerY = TITLEBAR_H + PAD + HEADER_H;
    var ruleY = headerY + RULE_GAP;
    var fieldsStartY = ruleY + 30;

    var fieldsH = fields.length * FIELD_LINE_H;
    var swatchY = fieldsStartY + fieldsH + 14;
    var infoBottom = swatchY + SWATCH + 10;

    var artTop = fieldsStartY - 12;
    var artBottom = artTop + ART_H;
    var contentBottom = Math.max(infoBottom, artBottom);

    var promptY = contentBottom + 40;
    var H = promptY + PROMPT_H + 20;
    var headerText = login + "@github";
    var ruleLen = headerText.length + 2;
    var longestField = 0;
    fields.forEach(function(f){ longestField = Math.max(longestField, (f[0] + ": " + f[1]).length); });
    var W = infoX + Math.max(360, longestField * 8.2) + PAD;

    var artSvg = rows.map(function(row, i){
      var y = artTop + i*CELL_H + CELL_H*0.8;
      var delay = Math.round(i*0.045*1000)/1000;
      return '\n      <text x="' + PAD + '" y="' + y.toFixed(1) + '" class="art fadein" style="animation-delay:' + delay + 's" textLength="' + Math.max(1, row.length * CELL_W).toFixed(1) + '" lengthAdjust="spacingAndGlyphs" xml:space="preserve">' + xmlEscape(row) + '</text>';
    }).join("");

    var headerSvg = '<text x="' + infoX + '" y="' + headerY + '" class="header">' + xmlEscape(headerText) + '</text>\n  <line x1="' + infoX + '" y1="' + ruleY + '" x2="' + (infoX + ruleLen*9.4) + '" y2="' + ruleY + '" class="rule" />';

    var fieldLines = fields.map(function(f, i){
      var y = fieldsStartY + i*FIELD_LINE_H;
      var delay = 0.5 + i*0.06;
      return '\n      <text x="' + infoX + '" y="' + y + '" class="fieldline typewriter" style="animation-delay:' + delay.toFixed(2) + 's"><tspan class="label">' + xmlEscape(f[0]) + ':</tspan> <tspan class="value">' + xmlEscape(f[1]) + '</tspan></text>';
    }).join("");

    var swatchLines = colors.palette.map(function(color, i){
      var x = infoX + i*(SWATCH + SWATCH_GAP);
      var delay = 0.5 + fields.length*0.06 + i*0.05;
      return '\n      <rect x="' + x.toFixed(1) + '" y="' + swatchY.toFixed(1) + '" width="' + SWATCH + '" height="' + SWATCH + '" rx="3" fill="' + color + '" stroke="#2a3350" stroke-width="1" class="swatch" style="animation-delay:' + delay.toFixed(2) + 's" />';
    }).join("");

    var promptLine1 = "┌──(" + login + "@github-[~]";
    var promptLine2 = "└─$ ";
    var typedX = PAD + (promptLine2.length + 1) * 9.0;
    var typedY = promptY + 24;
    var pp = buildPromptTypingSvg(promptCommands, typedX, typedY);

    var promptSvg = '<text x="' + PAD + '" y="' + promptY + '" class="prompt">' + xmlEscape(promptLine1) + '</text>\n  <text x="' + PAD + '" y="' + typedY + '" class="prompt">' + xmlEscape(promptLine2) + '</text>\n  ' + pp.cmdSvg + '\n  ' + pp.cursorSvg;

    W = Math.max(W, typedX + pp.maxW + PAD);

    var titleText = login + "@github: ~";
    var chromeSvg = '\n  <rect x="0" y="0" width="' + W.toFixed(0) + '" height="' + H.toFixed(0) + '" rx="10" fill="' + colors.bg + '" />\n  <path d="M0,10 a10,10 0 0 1 10,-10 h' + (W-20).toFixed(0) + ' a10,10 0 0 1 10,10 v' + (TITLEBAR_H-10).toFixed(0) + ' h-' + W.toFixed(0) + ' z" fill="' + colors.titlebar + '" />\n  <circle cx="24" cy="' + (TITLEBAR_H/2).toFixed(0) + '" r="6" fill="#ff5f57" />\n  <circle cx="46" cy="' + (TITLEBAR_H/2).toFixed(0) + '" r="6" fill="#febc2e" />\n  <circle cx="68" cy="' + (TITLEBAR_H/2).toFixed(0) + '" r="6" fill="#28c840" />\n  <text x="' + (W/2).toFixed(0) + '" y="' + (TITLEBAR_H/2+5).toFixed(0) + '" text-anchor="middle" class="titletext">' + xmlEscape(titleText) + '</text>\n  <line x1="0" y1="' + TITLEBAR_H + '" x2="' + W.toFixed(0) + '" y2="' + TITLEBAR_H + '" stroke="#1f2740" stroke-width="1" />';

    return '<svg width="' + W.toFixed(0) + '" height="' + H.toFixed(0) + '" viewBox="0 0 ' + W.toFixed(0) + ' ' + H.toFixed(0) + '" xmlns="http://www.w3.org/2000/svg">\n  <defs>\n    <style>\n      .art { font-family: \'Courier New\', monospace; font-size: ' + (CELL_H*0.82).toFixed(1) + 'px; fill: ' + colors.accent + '; white-space: pre; }\n      .header { font-family: \'Courier New\', monospace; font-size: 18px; font-weight: bold; fill: ' + colors.header + '; }\n      .rule { stroke: ' + colors.header + '; stroke-width: 1.4; opacity: 0.85; }\n      .fieldline { font-family: \'Courier New\', monospace; font-size: 13px; }\n      .label { fill: ' + colors.label + '; font-weight: bold; }\n      .value { fill: ' + colors.value + '; }\n      .prompt { font-family: \'Courier New\', monospace; font-size: 15px; font-weight: bold; fill: ' + colors.header + '; }\n      .titletext { font-family: \'Courier New\', monospace; font-size: 13px; fill: ' + colors.titleText + '; }\n      .promptcmd { font-family: \'Courier New\', monospace; font-size: 15px; fill: ' + colors.value + '; white-space: pre; }\n      .promptcursor { fill: ' + colors.accent + '; }\n      ' + pp.style + '\n      .fadein { animation-name: reveal; animation-duration: 0.35s; animation-fill-mode: forwards; animation-timing-function: steps(1); }\n      .typewriter { animation-name: reveal; animation-duration: 0.4s; animation-fill-mode: forwards; animation-timing-function: steps(1); }\n      .swatch { animation-name: revealSwatch; animation-duration: 0.35s; animation-fill-mode: forwards; animation-timing-function: steps(1); }\n      @keyframes reveal { 0% { opacity: 0; } 1%, 100% { opacity: 1; } }\n      @keyframes revealSwatch { 0% { opacity: 0; } 1%, 100% { opacity: 1; } }\n      @keyframes blink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }\n    </style>\n    ' + pp.defs + '\n  </defs>\n  ' + chromeSvg + '\n\n  ' + artSvg + '\n\n  ' + headerSvg + '\n  ' + fieldLines + '\n  ' + swatchLines + '\n\n  ' + promptSvg + '\n</svg>';
  }

  function buildPythonSnippet(){
    var fieldsPy = state.fields.map(function(f){ return "    (" + pyStr(f[0]) + ", " + pyStr(f[1]) + "),"; }).join("\n");
    var promptPy = state.promptCommands.map(function(c){ return "    " + pyStr(c) + ","; }).join("\n");
    var palettePy = state.colors.palette.map(pyStr).join(", ");
    return "# Paste over the matching sections of the generator script.\n" +
      "PROFILE_FIELDS = [\n" + fieldsPy + "\n]\n\n" +
      "PROMPT_COMMANDS = [\n" + promptPy + "\n]\n\n" +
      "BG_COLOR = " + pyStr(state.colors.bg) + "\n" +
      "TITLEBAR_COLOR = " + pyStr(state.colors.titlebar) + "\n" +
      "TITLE_TEXT_COLOR = " + pyStr(state.colors.titleText) + "\n" +
      "ACCENT = " + pyStr(state.colors.accent) + "\n" +
      "HEADER_COLOR = " + pyStr(state.colors.header) + "\n" +
      "LABEL_COLOR = " + pyStr(state.colors.label) + "\n" +
      "VALUE_COLOR = " + pyStr(state.colors.value) + "\n" +
      "PALETTE = [" + palettePy + "]\n\n" +
      "RAMP = " + pyStr(state.asciiRamp) + "\n\n" +
      "ART_COLS = " + (Math.round(state.advanced.artCols) || 40) + "\n\n" +
      "PROMPT_TYPE_SPEED = " + state.advanced.typeSpeed + "\n" +
      "PROMPT_DELETE_SPEED = " + state.advanced.deleteSpeed + "\n" +
      "PROMPT_HOLD_TIME = " + state.advanced.holdTime + "\n" +
      "PROMPT_GAP_TIME = " + state.advanced.gapTime + "\n" +
      "PROMPT_CHAR_W = " + (state.advanced.charW > 0 ? state.advanced.charW : 9.0) + "\n\n" +
      "# export GITHUB_LOGIN=" + state.login;
  }

  function buildReadmeSnippet(){
    var login = (state.login || "kali").trim() || "kali";
    var repo = (state.repo || "").trim() || (login + "/" + login);
    return '<p align="center">\n<img src="https://raw.githubusercontent.com/' + repo + '/refs/heads/main/assets/profile.svg" alt="animated ascii profile card" width="100%" />\n</p>';
  }

  // ---- import: pull PROFILE_FIELDS-style tuples out of pasted Python text ----
  function parsePyTuples(text){
    var out = [];
    var re = /\(\s*f?(["'])((?:\\.|(?!\1)[\s\S])*?)\1\s*,\s*f?(["'])((?:\\.|(?!\3)[\s\S])*?)\3\s*\)/g;
    var m;
    while ((m = re.exec(text))){ out.push([pyUnescape(m[2]), pyUnescape(m[4])]); }
    return out;
  }
  // ---- import: pull a flat PROMPT_COMMANDS-style string list ------------------
  function parsePyStringList(text){
    var out = [];
    var re = /f?(["'])((?:\\.|(?!\1)[\s\S])*?)\1/g;
    var m;
    while ((m = re.exec(text))){ out.push(pyUnescape(m[2])); }
    return out;
  }

  // ---- DOM wiring -------------------------------------------------------------
  var $ = function(id){ return document.getElementById(id); };
  var svgHost = $("svgHost"), dimsText = $("dimsText");
  var outPython = $("outPython"), outSvg = $("outSvg"), outConfig = $("outConfig"), outReadme = $("outReadme");
  var linkOpenSvg = $("linkOpenSvg");
  var renderTimer = null;
  var lastSvgBlobUrl = null;

  function scheduleRender(){
    if (renderTimer) clearTimeout(renderTimer);
    renderTimer = setTimeout(render, 90);
  }

  function render(){
    syncAdvancedGlobals();
    var login = state.login.trim() || "kali";
    var fields = state.fields.filter(function(f){ return f[0].trim() !== "" || f[1].trim() !== ""; });
    if (!fields.length) fields = [["", ""]];
    var commands = state.promptCommands.filter(function(c){ return c.trim() !== ""; });

    var svg = buildSvg(artRows.length ? artRows : currentArtRows(), fields, login, state.colors, commands);
    $("svgHost").parentNode.classList.toggle("native-art-size", state.asciiArtIndex >= 0);
    svgHost.innerHTML = svg;
    outSvg.value = svg;
    outPython.value = buildPythonSnippet();
    outReadme.value = buildReadmeSnippet();

    var wm = svg.match(/width="(\d+)"/), hm = svg.match(/height="(\d+)"/);
    dimsText.textContent = (wm ? wm[1] : "?") + " × " + (hm ? hm[1] : "?") + " px";

    if (lastSvgBlobUrl) URL.revokeObjectURL(lastSvgBlobUrl);
    var blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    lastSvgBlobUrl = URL.createObjectURL(blob);
    linkOpenSvg.href = lastSvgBlobUrl;

    outConfig.value = JSON.stringify({
      login: state.login, repo: state.repo, fields: state.fields, promptCommands: state.promptCommands,
      colors: state.colors, advanced: state.advanced, asciiRamp: state.asciiRamp,
      asciiArtIndex: state.asciiArtIndex, avatarDataUrl: state.avatarDataUrl
    }, null, 2);
  }

  // -- identity ---------------------------------------------------------------
  $("inpLogin").addEventListener("input", function(e){ state.login = e.target.value; scheduleRender(); });
  $("inpRepo").addEventListener("input", function(e){ state.repo = e.target.value; scheduleRender(); });

  // -- avatar -------------------------------------------------------------------
  var dropzone = $("dropzone"), inpAvatar = $("inpAvatar");
  var avatarPreviewRow = $("avatarPreviewRow"), avatarThumb = $("avatarThumb"), avatarStatus = $("avatarStatus");
  var rerollRow = $("rerollRow"), dragonStatus = $("dragonStatus");

  function updateArtStatus(){
    var selected = state.asciiArtIndex >= 0 ? ART_COLLECTION[state.asciiArtIndex].name + " art" : "the procedural dragon glyph";
    dragonStatus.textContent = "No avatar — using " + selected + ".";
  }

  function setAvatarUiNone(){
    avatarPreviewRow.hidden = true;
    rerollRow.hidden = false;
    dropzone.hidden = false;
  }
  function setAvatarUiSet(){
    avatarPreviewRow.hidden = false;
    rerollRow.hidden = true;
    dropzone.hidden = true;
  }

  function processAvatarFile(file){
    if (!file || file.type.indexOf("image/") !== 0) return;
    avatarStatus.textContent = "Processing…"; avatarStatus.className = "statustext";
    var reader = new FileReader();
    reader.onload = function(){
      var dataUrl = reader.result;
      var img = new Image();
      img.onload = function(){
        avatarImgEl = img;
        asciiRowsFromImage(img).then(function(rows){
          artRows = rows;
          state.avatarDataUrl = dataUrl;
          avatarThumb.src = dataUrl;
          setAvatarUiSet();
          avatarStatus.textContent = "Converted to " + ART_COLS + "-column ASCII art.";
          avatarStatus.className = "statustext ok";
          render();
        });
      };
      img.onerror = function(){
        avatarStatus.textContent = "Couldn't read that image.";
        avatarStatus.className = "statustext err";
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  // Re-samples the already-loaded avatar (if any) at the current ART_COLS,
  // so moving the slider doesn't require re-uploading the image.
  function resampleArt(){
    if (avatarImgEl){
      asciiRowsFromImage(avatarImgEl).then(function(rows){ artRows = rows; render(); });
    } else {
      artRows = currentArtRows();
      render();
    }
  }

  dropzone.addEventListener("click", function(){ inpAvatar.click(); });
  dropzone.addEventListener("keydown", function(e){ if (e.key === "Enter" || e.key === " "){ e.preventDefault(); inpAvatar.click(); } });
  dropzone.addEventListener("dragover", function(e){ e.preventDefault(); dropzone.classList.add("drag"); });
  dropzone.addEventListener("dragleave", function(){ dropzone.classList.remove("drag"); });
  dropzone.addEventListener("drop", function(e){
    e.preventDefault(); dropzone.classList.remove("drag");
    if (e.dataTransfer.files && e.dataTransfer.files[0]) processAvatarFile(e.dataTransfer.files[0]);
  });
  inpAvatar.addEventListener("change", function(e){ if (e.target.files[0]) processAvatarFile(e.target.files[0]); });

  $("btnRemoveAvatar").addEventListener("click", function(){
    state.avatarDataUrl = null;
    avatarImgEl = null;
    artRows = currentArtRows();
    setAvatarUiNone();
    updateArtStatus();
    render();
  });
  $("btnReroll").addEventListener("click", function(){
    state.asciiArtIndex = ART_COLLECTION.length
      ? (state.asciiArtIndex + 1) % ART_COLLECTION.length
      : -1;
    artRows = currentArtRows();
    updateArtStatus();
    render();
  });

  // -- ASCII size & animation speed --------------------------------------------
  var rngArtCols = $("rngArtCols"), valArtCols = $("valArtCols");
  var inpTypeSpeed = $("inpTypeSpeed"), inpDeleteSpeed = $("inpDeleteSpeed"),
      inpHoldTime = $("inpHoldTime"), inpGapTime = $("inpGapTime"), inpCharW = $("inpCharW");
  var selRampPreset = $("selRampPreset"), inpRamp = $("inpRamp"), rampStatus = $("rampStatus");
  var resampleTimer = null;

  function syncAdvancedInputs(){
    inpRamp.value = state.asciiRamp;
    selRampPreset.value = Object.keys(RAMP_PRESETS).find(function(key){ return RAMP_PRESETS[key] === state.asciiRamp; }) || "custom";
    rampStatus.textContent = "";
    rampStatus.className = "statustext";
    rngArtCols.value = state.advanced.artCols;
    valArtCols.textContent = state.advanced.artCols;
    inpTypeSpeed.value = state.advanced.typeSpeed;
    inpDeleteSpeed.value = state.advanced.deleteSpeed;
    inpHoldTime.value = state.advanced.holdTime;
    inpGapTime.value = state.advanced.gapTime;
    inpCharW.value = state.advanced.charW;
  }

  function setRamp(value){
    if (!/^[\x20-\x7e]{2,}$/.test(value)){
      rampStatus.textContent = "Enter at least 2 printable ASCII characters.";
      rampStatus.className = "statustext err";
      return false;
    }
    state.asciiRamp = value;
    RAMP = value;
    selRampPreset.value = Object.keys(RAMP_PRESETS).find(function(key){ return RAMP_PRESETS[key] === value; }) || "custom";
    rampStatus.textContent = "";
    rampStatus.className = "statustext";
    if (avatarImgEl){
      if (resampleTimer) clearTimeout(resampleTimer);
      resampleTimer = setTimeout(resampleArt, 120);
    } else {
      render();
    }
    return true;
  }

  selRampPreset.addEventListener("change", function(){
    if (selRampPreset.value !== "custom"){
      inpRamp.value = RAMP_PRESETS[selRampPreset.value];
      setRamp(inpRamp.value);
    }
  });
  inpRamp.addEventListener("input", function(){
    if (selRampPreset.value !== "custom") selRampPreset.value = "custom";
    setRamp(inpRamp.value);
  });

  rngArtCols.addEventListener("input", function(){
    state.advanced.artCols = parseInt(rngArtCols.value, 10) || 40;
    valArtCols.textContent = state.advanced.artCols;
    syncAdvancedGlobals();
    if (resampleTimer) clearTimeout(resampleTimer);
    resampleTimer = setTimeout(resampleArt, 120);
  });
  [[inpTypeSpeed,"typeSpeed"],[inpDeleteSpeed,"deleteSpeed"],[inpHoldTime,"holdTime"],[inpGapTime,"gapTime"],[inpCharW,"charW"]]
    .forEach(function(pair){
      pair[0].addEventListener("input", function(){
        var v = parseFloat(pair[0].value);
        if (!isNaN(v)) state.advanced[pair[1]] = v;
        syncAdvancedGlobals();
        scheduleRender();
      });
    });

  // -- GitHub stats fetch ---------------------------------------------------
  $("btnFetchStats").addEventListener("click", function(){
    var btn = $("btnFetchStats"), status = $("statsStatus");
    var login = (state.login || "").trim();
    if (!login){ status.textContent = "Set a GITHUB_LOGIN first."; status.className = "statustext err"; return; }
    var token = $("inpToken").value.trim();
    var headers = { "Accept": "application/vnd.github+json" };
    if (token) headers["Authorization"] = "Bearer " + token;

    btn.disabled = true; status.textContent = "Fetching…"; status.className = "statustext";

    function setField(label, value){
      var row = state.fields.find(function(f){ return f[0] === label; });
      if (row) row[1] = value;
      else state.fields.push([label, value]);
    }

    Promise.all([
      fetch("https://api.github.com/users/" + encodeURIComponent(login), { headers: headers }).then(function(r){ if(!r.ok) throw new Error("user " + r.status); return r.json(); }),
      fetch("https://api.github.com/users/" + encodeURIComponent(login) + "/repos?per_page=100&type=owner", { headers: headers }).then(function(r){ if(!r.ok) throw new Error("repos " + r.status); return r.json(); })
    ]).then(function(res){
      var user = res[0], repos = res[1];
      setField("GitHub.Followers", String(user.followers != null ? user.followers : "N/A"));
      setField("GitHub.Repos", String(user.public_repos != null ? user.public_repos : "N/A"));
      var stars = 0;
      var langCount = {};
      (Array.isArray(repos) ? repos : []).forEach(function(r){
        if (!r.fork) stars += (r.stargazers_count || 0);
        if (r.language) langCount[r.language] = (langCount[r.language] || 0) + 1;
      });
      setField("GitHub.Stars", String(stars));
      var topLangs = Object.keys(langCount).sort(function(a,b){ return langCount[b]-langCount[a]; }).slice(0,4);
      setField("GitHub.Languages", topLangs.length ? topLangs.join(", ") : "N/A");
      renderFieldsList();
      status.textContent = "Updated Repos / Stars / Followers / Languages. Contributions still needs a manual entry.";
      status.className = "statustext ok";
      render();
    }).catch(function(err){
      status.textContent = "Fetch failed (" + err.message + "). Check the username, or enter stats by hand below.";
      status.className = "statustext err";
    }).finally(function(){ btn.disabled = false; });
  });

  // -- fields list editor -----------------------------------------------------
  var fieldsList = $("fieldsList");
  function renderFieldsList(){
    fieldsList.innerHTML = "";
    state.fields.forEach(function(f, i){
      var row = document.createElement("div");
      row.className = "listitem";
      var labelInp = document.createElement("input");
      labelInp.type = "text"; labelInp.value = f[0]; labelInp.placeholder = "Label";
      labelInp.style.flex = "0 0 38%";
      labelInp.addEventListener("input", function(){ state.fields[i][0] = labelInp.value; scheduleRender(); });
      var valueInp = document.createElement("input");
      valueInp.type = "text"; valueInp.value = f[1]; valueInp.placeholder = "Value";
      valueInp.className = "grow";
      valueInp.addEventListener("input", function(){ state.fields[i][1] = valueInp.value; scheduleRender(); });
      var del = document.createElement("button");
      del.type = "button"; del.className = "iconbtn"; del.title = "Remove";
      del.innerHTML = "✕";
      del.addEventListener("click", function(){ state.fields.splice(i,1); renderFieldsList(); render(); });
      row.appendChild(labelInp); row.appendChild(valueInp); row.appendChild(del);
      fieldsList.appendChild(row);
    });
    $("fieldsCount").textContent = state.fields.length + " field" + (state.fields.length===1?"":"s");
  }
  $("btnAddField").addEventListener("click", function(){ state.fields.push(["", ""]); renderFieldsList(); render(); });

  $("btnImportFields").addEventListener("click", function(){
    var raw = $("inpImportFields").value;
    var status = $("importFieldsStatus");
    var parsed = parsePyTuples(raw);
    if (!parsed.length){
      status.textContent = 'Couldn’t find any ("label", "value") pairs in that text.';
      status.className = "statustext err";
      return;
    }
    state.fields = parsed;
    renderFieldsList(); render();
    status.textContent = "Imported " + parsed.length + " field" + (parsed.length===1?"":"s") + ". Note: f-string placeholders like {LOGIN} are imported as literal text.";
    status.className = "statustext ok";
  });

  // -- prompt commands list editor --------------------------------------------
  var promptList = $("promptList");
  function renderPromptList(){
    promptList.innerHTML = "";
    state.promptCommands.forEach(function(c, i){
      var row = document.createElement("div");
      row.className = "listitem";
      var inp = document.createElement("input");
      inp.type = "text"; inp.value = c; inp.className = "grow"; inp.placeholder = "typed line";
      inp.addEventListener("input", function(){ state.promptCommands[i] = inp.value; scheduleRender(); });
      var del = document.createElement("button");
      del.type = "button"; del.className = "iconbtn"; del.title = "Remove";
      del.innerHTML = "✕";
      del.addEventListener("click", function(){ state.promptCommands.splice(i,1); renderPromptList(); render(); });
      row.appendChild(inp); row.appendChild(del);
      promptList.appendChild(row);
    });
    $("promptCount").textContent = state.promptCommands.length + " line" + (state.promptCommands.length===1?"":"s");
  }
  $("btnAddPrompt").addEventListener("click", function(){ state.promptCommands.push("new role"); renderPromptList(); render(); });

  $("btnImportPrompt").addEventListener("click", function(){
    var raw = $("inpImportPrompt").value;
    var status = $("importPromptStatus");
    var parsed = parsePyStringList(raw);
    if (!parsed.length){
      status.textContent = "Couldn’t find any quoted strings in that text.";
      status.className = "statustext err";
      return;
    }
    state.promptCommands = parsed;
    renderPromptList(); render();
    status.textContent = "Imported " + parsed.length + " line" + (parsed.length===1?"":"s") + ".";
    status.className = "statustext ok";
  });

  // -- palette editor -----------------------------------------------------------
  function bindColorPair(pickId, textId, key){
    var pick = $(pickId), text = $(textId);
    pick.value = state.colors[key]; text.value = state.colors[key];
    pick.addEventListener("input", function(){ state.colors[key] = pick.value; text.value = pick.value; scheduleRender(); });
    text.addEventListener("input", function(){
      var v = text.value.trim();
      state.colors[key] = v;
      if (/^#[0-9a-fA-F]{6}$/.test(v)) pick.value = v;
      scheduleRender();
    });
  }
  bindColorPair("pickBg","textBg","bg");
  bindColorPair("pickTitlebar","textTitlebar","titlebar");
  bindColorPair("pickTitleText","textTitleText","titleText");
  bindColorPair("pickAccent","textAccent","accent");
  bindColorPair("pickHeader","textHeader","header");
  bindColorPair("pickLabel","textLabel","label");
  bindColorPair("pickValue","textValue","value");

  var paletteGrid = $("paletteGrid");
  function renderPalette(){
    paletteGrid.innerHTML = "";
    state.colors.palette.forEach(function(color, i){
      var pick = document.createElement("input");
      pick.type = "color"; pick.className = "swatchpick"; pick.value = color; pick.title = "Swatch " + (i+1);
      pick.addEventListener("input", function(){ state.colors.palette[i] = pick.value; scheduleRender(); });
      paletteGrid.appendChild(pick);
    });
  }

  function applyTheme(theme){
    state.colors = {
      bg: theme.colors.bg, titlebar: theme.colors.titlebar, titleText: theme.colors.titleText,
      accent: theme.colors.accent, header: theme.colors.header, label: theme.colors.label, value: theme.colors.value,
      palette: theme.colors.palette.slice()
    };
    Object.keys(COLOR_KEY_TO_ID).forEach(function(key){
      var suffix = COLOR_KEY_TO_ID[key];
      $("pick" + suffix).value = state.colors[key];
      $("text" + suffix).value = state.colors[key];
    });
    renderPalette();
    render();
  }

  var themePresetsHost = $("themePresets");
  function renderThemePresets(){
    themePresetsHost.innerHTML = "";
    THEMES.forEach(function(theme){
      var chip = document.createElement("button");
      chip.type = "button"; chip.className = "themechip"; chip.title = "Apply the " + theme.name + " theme";
      var sw = document.createElement("div"); sw.className = "swatches";
      [theme.colors.bg, theme.colors.header, theme.colors.accent, theme.colors.value].forEach(function(c){
        var s = document.createElement("span"); s.className = "sw"; s.style.background = c;
        sw.appendChild(s);
      });
      var name = document.createElement("span"); name.className = "name"; name.textContent = theme.name;
      chip.appendChild(sw); chip.appendChild(name);
      chip.addEventListener("click", function(){ applyTheme(theme); });
      themePresetsHost.appendChild(chip);
    });
  }

  // -- export tabs -----------------------------------------------------------
  document.querySelectorAll(".exporttab").forEach(function(tab){
    tab.addEventListener("click", function(){
      document.querySelectorAll(".exporttab").forEach(function(t){ t.classList.remove("active"); });
      document.querySelectorAll(".exportpane").forEach(function(p){ p.classList.remove("active"); });
      tab.classList.add("active");
      document.querySelector('.exportpane[data-pane="' + tab.dataset.pane + '"]').classList.add("active");
    });
  });

  function copyText(text, btn){
    var done = function(ok){
      var old = btn.textContent;
      btn.textContent = ok ? "Copied" : "Copy failed — select & copy below";
      setTimeout(function(){ btn.textContent = old; }, 1400);
    };
    if (navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(function(){ done(true); }).catch(function(){ done(false); });
    } else { done(false); }
  }
  $("btnCopyPython").addEventListener("click", function(){ copyText(outPython.value, this); });
  $("btnCopyReadme").addEventListener("click", function(){ copyText(outReadme.value, this); });
  $("btnCopySvg").addEventListener("click", function(){ copyText(outSvg.value, this); });
  $("btnCopyConfig").addEventListener("click", function(){ copyText(outConfig.value, this); });

  // -- save / load config ------------------------------------------------------
  var configStatus = $("configStatus");
  function setConfigStatus(msg, ok){
    if (!configStatus) return;
    configStatus.textContent = msg;
    configStatus.className = "statustext" + (ok === true ? " ok" : ok === false ? " err" : "");
  }

  function applyConfig(cfg){
    if (!cfg || typeof cfg !== "object") throw new Error("not a valid JSON object");
    state.login = typeof cfg.login === "string" ? cfg.login : state.login;
    state.repo = typeof cfg.repo === "string" ? cfg.repo : state.repo;
    if (Array.isArray(cfg.fields)) state.fields = cfg.fields;
    if (Array.isArray(cfg.promptCommands)) state.promptCommands = cfg.promptCommands;
    if (cfg.colors && typeof cfg.colors === "object") state.colors = Object.assign({}, state.colors, cfg.colors);
    if (cfg.advanced && typeof cfg.advanced === "object") state.advanced = Object.assign({}, state.advanced, cfg.advanced);
    if (typeof cfg.asciiRamp === "string"){
      if (!/^[\x20-\x7e]{2,}$/.test(cfg.asciiRamp)) throw new Error("ASCII ramp must contain at least 2 printable ASCII characters.");
      state.asciiRamp = cfg.asciiRamp;
    }
    if (cfg.asciiArtIndex === undefined){
      state.asciiArtIndex = -1;
    } else if (Number.isInteger(cfg.asciiArtIndex) && cfg.asciiArtIndex >= -1 && cfg.asciiArtIndex < ART_COLLECTION.length){
      state.asciiArtIndex = cfg.asciiArtIndex;
    } else {
      throw new Error("ASCII art selection is not valid for the current collection.");
    }
    $("inpLogin").value = state.login;
    $("inpRepo").value = state.repo;
    renderFieldsList(); renderPromptList(); renderPalette(); syncAdvancedInputs(); syncAdvancedGlobals();
    bindColorPair("pickBg","textBg","bg"); bindColorPair("pickTitlebar","textTitlebar","titlebar");
    bindColorPair("pickTitleText","textTitleText","titleText"); bindColorPair("pickAccent","textAccent","accent");
    bindColorPair("pickHeader","textHeader","header"); bindColorPair("pickLabel","textLabel","label");
    bindColorPair("pickValue","textValue","value");

    if (cfg.avatarDataUrl){
      var img = new Image();
      img.onload = function(){
        avatarImgEl = img;
        asciiRowsFromImage(img).then(function(rows){
          artRows = rows; state.avatarDataUrl = cfg.avatarDataUrl;
          avatarThumb.src = cfg.avatarDataUrl; setAvatarUiSet();
          render();
        });
      };
      img.src = cfg.avatarDataUrl;
    } else {
      avatarImgEl = null;
      state.avatarDataUrl = null; artRows = currentArtRows(); setAvatarUiNone(); updateArtStatus(); render();
    }
  }

  $("inpConfigFile").addEventListener("change", function(e){
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(){
      try { applyConfig(JSON.parse(reader.result)); setConfigStatus("Configuration loaded from " + file.name + ".", true); }
      catch(err){ setConfigStatus("Failed to read that file: " + err.message, false); }
    };
    reader.onerror = function(){ setConfigStatus("Failed to read that file.", false); };
    reader.readAsText(file);
  });
  $("btnApplyConfig").addEventListener("click", function(){
    var raw = $("inpConfigPaste").value.trim();
    if (!raw){ setConfigStatus("Paste the JSON config into the box above first.", false); return; }
    try { applyConfig(JSON.parse(raw)); setConfigStatus("Configuration applied.", true); }
    catch(err){ setConfigStatus("Invalid JSON: " + err.message, false); }
  });

  // -- reset --------------------------------------------------------------------
  $("btnReset").addEventListener("click", function(){
    state = defaultState();
    avatarImgEl = null;
    syncAdvancedGlobals();
    artRows = asciiRowsDragon();
    $("inpLogin").value = state.login;
    $("inpRepo").value = state.repo;
    $("inpToken").value = "";
    setAvatarUiNone();
    updateArtStatus();
    setConfigStatus("");
    renderFieldsList(); renderPromptList(); renderPalette(); syncAdvancedInputs();
    bindColorPair("pickBg","textBg","bg"); bindColorPair("pickTitlebar","textTitlebar","titlebar");
    bindColorPair("pickTitleText","textTitleText","titleText"); bindColorPair("pickAccent","textAccent","accent");
    bindColorPair("pickHeader","textHeader","header"); bindColorPair("pickLabel","textLabel","label");
    bindColorPair("pickValue","textValue","value");
    render();
  });

  // ---- boot ---------------------------------------------------------------
  syncAdvancedGlobals();
  syncAdvancedInputs();
  renderThemePresets();
  artRows = asciiRowsDragon();
  renderFieldsList();
  renderPromptList();
  renderPalette();
  render();

  window.addEventListener("load", function () {
    setTimeout(function () {
      document.querySelector(".loader-overlay").classList.add("is-hidden");
    }, 2000);
  });

})();
