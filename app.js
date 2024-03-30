var redirect_uri = "https://pilkeysp.github.io/spotdle/";

var client_id = "ad9e2448e561421f85168ef08835bb58"; 
var client_secret = "d1cc2c415e1b47f892808c1801db3f93";

var access_token = null;
var refresh_token = null;

const AUTHORIZE = "https://accounts.spotify.com/authorize"
const TOKEN = "https://accounts.spotify.com/api/token";

function onPageLoad(){
    if ( window.location.search.length > 0 ){
        handleRedirect();
    }
    else{
        access_token = localStorage.getItem("access_token");
        
        if (access_token == null) requestAuthorization();
        else init();
    }
}

function init() {
    const TOPTRACK = "https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=50&offset=0";
    callApi( "GET", TOPTRACK, null, initGame);
}

function handleRedirect(){
    let code = getCode();
    fetchAccessToken( code );
    window.history.pushState("", "", redirect_uri); // remove paramater from url
}

function getCode(){
    let code = null;
    const queryString = window.location.search;
    if ( queryString.length > 0 ){
        const urlParams = new URLSearchParams(queryString);
        code = urlParams.get('code')
    }
    return code;
}

function requestAuthorization(){
    localStorage.setItem("client_id", client_id);
    localStorage.setItem("client_secret", client_secret);

    let url = AUTHORIZE;
    url += "?client_id=" + client_id;
    url += "&response_type=code";
    url += "&redirect_uri=" + encodeURI(redirect_uri);
    url += "&show_dialog=true";
    url += "&scope=user-top-read";
    window.location.href = url;
}

function fetchAccessToken( code ){
    let body = "grant_type=authorization_code";
    body += "&code=" + code; 
    body += "&redirect_uri=" + encodeURI(redirect_uri);
    body += "&client_id=" + client_id;
    body += "&client_secret=" + client_secret;
    callAuthorizationApi(body);
}

function callAuthorizationApi(body){
    let xhr = new XMLHttpRequest();
    xhr.open("POST", TOKEN, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader('Authorization', 'Basic ' + btoa(client_id + ":" + client_secret));
    xhr.send(body);
    xhr.onload = handleAuthorizationResponse;
}

function handleAuthorizationResponse(){
    if ( this.status == 200 ){
        var data = JSON.parse(this.responseText);
        if ( data.access_token != undefined ){
            access_token = data.access_token;
            localStorage.setItem("access_token", access_token);
        }
        if ( data.refresh_token  != undefined ){
            refresh_token = data.refresh_token;
            localStorage.setItem("refresh_token", refresh_token);
        }
        onPageLoad();
    }
    else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function callApi(method, url, body, callback){
    let xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
    xhr.send(body);
    xhr.onload = callback;
}

//-----------

class LetterColours {
    static CORRECT = getComputedStyle(document.documentElement).getPropertyValue('--green');
    static COMMON = getComputedStyle(document.documentElement).getPropertyValue('--yellow');
    static BLANK = getComputedStyle(document.documentElement).getPropertyValue('--backgroundGrey');
    static INCORRECT = getComputedStyle(document.documentElement).getPropertyValue('--red');
    static BORDER = getComputedStyle(document.documentElement).getPropertyValue('--blue');
}

class ColourStatus {
    static GREEN = 1;
    static YELLOW = 2;
    static RED = 3;
    static GREY = 4;
}

class RevealButton {
    constructor(beforeText, afterText, container, buttonColour) {
        this.beforeText = beforeText;
        this.afterText = afterText;
        this.buttonColour = buttonColour;

        this.button = document.createElement('button');
        this.button.className = "animated-button " + this.buttonColour;

        this.buttonTextSpan = document.createElement("span");
        this.buttonTextSpan.textContent = this.beforeText;
        this.button.appendChild(this.buttonTextSpan);
        this.buttonEffectSpan = document.createElement("span");
        this.button.appendChild(this.buttonEffectSpan);

        this.button.addEventListener('click', () => {
                this.buttonTextSpan.textContent = this.afterText;
                this.button.style.cursor = "default";
                this.button.className = "clicked-button";
        });
        container.appendChild(this.button);
    }

    resetState() {
        this.button.style.cursor = "pointer";
        this.button.className = "animated-button " + this.buttonColour;
        this.buttonTextSpan.textContent = this.beforeText;
    }
}

class FlipButton {
    constructor(firstText, secondText, container) {
        this.firstText = firstText;
        this.secondText = secondText;
        this.container = container;
        this.active = false;
        this.firstState = true;

        this.button = document.createElement('button');
        this.button.className = "animated-button green-button";

        this.buttonTextSpan = document.createElement("span");
        this.buttonTextSpan.textContent = this.firstText;
        this.button.appendChild(this.buttonTextSpan);
        this.buttonEffectSpan = document.createElement("span");
        this.button.appendChild(this.buttonEffectSpan);

        this.container.appendChild(this.button);

        this.button.addEventListener("click", () => {
            if (this.firstState) {
                endText.lose(fullWord);
                this.toSecondState();
                activeGame = false;
            } else init();
        });
    }

    toFirstState() {
        this.button.className = "animated-button red-button";
        this.buttonTextSpan.textContent = this.firstText;
        this.firstState = true;
    }

    toSecondState() {
        this.button.className = "animated-button green-button";
        this.buttonTextSpan.textContent = this.secondText;
        this.firstState = false;
    }
}

class GuessContainer {
    constructor(guessNum) {
        this.guessNum = guessNum;
        this.activeRowIdx = 0;

        this.container = document.createElement("div");
        this.container.className = "grid-container";

        this.rows = [];

        for (let i = 0; i < this.guessNum; ++i) {
            this.rows[i] = new WordRow(this.container);
        }

        var keyboardElement = document.getElementById("keyboardContainer");
        document.body.insertBefore(this.container, keyboardElement);
    }

    initializeRows(itemsNum, specialString) {
        this.activeRowIdx = 0;
        for (let i = 0; i < this.guessNum; ++i) {
            this.rows[i].clearItems();
            this.rows[i].createItems(itemsNum, specialString);
        }
    }

    updateRow(guess) {
        if (this.activeRowIdx < this.guessNum) this.rows[this.activeRowIdx].update(guess);
    }

    submit(seq) {
        let guessChildren = this.rows[this.activeRowIdx].row.children;

        let seqCounter = 0;

        for (let i = 0; i < guessChildren.length; ++i) {
            if (idxArr.includes(i)) {
                guessChildren[i].style.backgroundColor = seq[seqCounter];
                ++seqCounter;
            }
        }

        if (this.activeRowIdx < this.guessNum) this.activeRowIdx += 1;
    }
}

class WordRow {
    constructor(container) {
        this.container = container;

        this.row = document.createElement("div");
        this.row.className = "grid-row";

        this.container.appendChild(this.row);

    }

    createItems(itemsNum, specialString) {
        for (let i = 0; i < itemsNum; ++i) {
            let item = document.createElement("div");
            item.className = "grid-item";
            item.id = "item" + i;

            if (specialString[i] !== '~') {
                const numberRegex = /^[0-9]$/;
                if (numberRegex.test(specialString[i])) {
                    item.style.borderWidth = '5px';
                    item.style.borderStyle = 'solid';
                    item.style.borderColor = LetterColours.BORDER;

                } else {
                    if (specialString[i] === ' ') item.style.backgroundColor = "transparent";
                    item.textContent = specialString[i];
                }
            }
            this.row.appendChild(item);
        }
    }

    clearItems() {
        while (this.row.children.length > 0) {
            this.row.removeChild(this.row.lastChild);
        }
    }

    update(guess) {
        for (let i = 0; i < cleanedWord.length; ++i) {
            var tileContent = guess[i];
            if (guess[i] == undefined) tileContent = " ";
            this.row.children[idxArr[i]].textContent = tileContent;
        }
    }
}

class KeyboardKey {
    constructor(letter) {
        this.letter = letter;
        this.div = document.createElement('div');
        this.div.textContent = letter;
        this.div.id = letter + "Key";
        this.div.className = "letter";
        this.status = ColourStatus.GREY;

        this.div.addEventListener("click", () => {
           inputKey(this.letter);
        });
    }

    reset() {
        this.div.style.color = LetterColours.BLANK;
        this.status = ColourStatus.GREY;
        console.log(this.letter);
    }
}

class EndText {
    constructor(container) {
        this.container = container;
        this.topText = "";
        this.bottomText = "";
        this.active = false;

        this.div = document.createElement('div');
        this.div.className = "end-container";

        this.topSpan = document.createElement("span");
        this.topSpan.textContent = this.topText;
        this.div.appendChild(this.topSpan);

        this.bottomSpan = document.createElement("span");
        this.bottomSpan.textContent = this.bottomText;
        this.div.appendChild(this.bottomSpan);
    }

    win(correctSong) {
        this.topSpan.textContent = "YOU WON";
        this.bottomSpan.textContent = "THE SONG WAS: " + correctSong;
        this.topSpan.className = "end-text-green";
        this.bottomSpan.className = "end-text-green";
        this.add();
    }

    lose(correctSong) {
        this.topSpan.textContent = "YOU LOST";
        this.bottomSpan.textContent = "THE SONG WAS: " + correctSong;
        this.topSpan.className = "end-text-red";
        this.bottomSpan.className = "end-text-red";
        this.add();
    }

    remove() {
        if (this.active) {
            this.container.removeChild(this.div);
            this.active = false;
        }
    }

    add() {
        if (!this.active) {
            this.container.appendChild(this.div);
            this.active = true;
        }
    }


}

function cleanString(str) {
    const alphanumericRegex = /[a-zA-Z0-9]/g;
    const indexes = [];
    let cleanedStr = '';
    str.replace(alphanumericRegex, (match, index) => {
        indexes.push(index);
        cleanedStr += match;
    });

    specialCharString = "";
    for (let i = 0; i < str.length; i++) {
        if (!indexes.includes(i)) specialCharString += str[i];
        else {
            const numberRegex = /^[0-9]$/;
            if (numberRegex.test(str[i])) specialCharString += str[i];
            else specialCharString += "~";
        }
    }

    cleanedWord = cleanedStr;
    return indexes;
}

//KEYBOARD FUNCTION
function generateRow(letters, container, keysArr) {
    for (let i = 0; i < letters.length; i++) {
        const letter = letters[i];

        keyObj = new KeyboardKey(letter);

        keysArr[letter] = keyObj;

        container.appendChild(keyObj.div);
    }
}

function submitGuess(word, guess) {
    let len = word.length;

    let wordLetters = [];
    let guessLetters = [];

    let sequence = [];

    for (let i = 0; i < len; ++i) {
        if (word[i] == guess[i]) {
            sequence[i] = LetterColours.CORRECT;
            guessLetters[i] = null;
        } else {
            guessLetters.push(guess[i]);
            wordLetters.push(word[i]);
        }
    }

    for (let i = 0; i < len; ++i) {
        if (!guessLetters[i]) continue;
        let idx = wordLetters.indexOf(guessLetters[i]);
        if (idx >= 0) {
            guessLetters[i] = null;
            wordLetters.splice(idx, 1);
            sequence[i] = LetterColours.COMMON;
        } else sequence[i] = LetterColours.INCORRECT;
    }

    guessContainer.submit(sequence);
    updateKeyboard(sequence, guess);

    ++guessCounter;
    if (guess === word || guessCounter >= 5) {
        if (guess === word) endText.win(fullWord);
        else endText.lose(fullWord);

        restartButton.toSecondState();

        activeGame = false;
    }
    currentGuess = "";

}

//KEYBOARD FUNCTION
function updateKeyboard(seq, guess) {
    for (let i = 0; i < seq.length; ++i) {
        let keyObj = keyboardKeys[guess[i]];

        let newStatus = ColourStatus.RED;
        if (seq[i] === LetterColours.CORRECT) newStatus = ColourStatus.GREEN;
        else if (seq[i] === LetterColours.COMMON) newStatus = ColourStatus.YELLOW;

        if (keyObj.status !== ColourStatus.GREEN
            && keyObj.status !== ColourStatus.YELLOW) {
                keyObj.div.style.color = seq[i];
                keyObj.status = newStatus;
        } else if (keyObj.status === ColourStatus.YELLOW
            && seq[i] === LetterColours.CORRECT) {
                keyObj.div.style.color = seq[i];
                keyObj.status = newStatus;
        }
    }
}

//EVENT LISTENER
document.addEventListener('keydown', function(event) {
    const key = event.key;
    inputKey(key);
});

function inputKey(key) {
    if (!activeGame) return;

    if (/^[a-zA-Z0-9]$/.test(key)) {
        if (currentGuess.length < cleanedWord.length) currentGuess += key.toUpperCase();
    } else if (key === 'Backspace') {
        if (currentGuess.length > 0) currentGuess = currentGuess.slice(0, -1);
    } else if (key === 'Enter') {
        if (currentGuess.length === cleanedWord.length) submitGuess(cleanedWord, currentGuess);
    }
    guessContainer.updateRow(currentGuess);
}

function initGame() {

    if ( this.status == 200 ){
        var data = JSON.parse(this.responseText);
    }
    else if ( this.status == 401 ){
        refreshAccessToken()
        return;
    }
    else {
        alert(this.responseText);
        return;
    }

    let topSongs = data.items;
    let song = topSongs[Math.floor(Math.random() * topSongs.length)];

    fullWord = song.name.toUpperCase();

    cleanedWord = fullWord;

    wordLen = cleanedWord.length;

    idxArr = cleanString(cleanedWord);

    guessContainer.initializeRows(wordLen, specialCharString);

    artistDiv.afterText = song.artists[0].name;
    albumDiv.afterText = song.album.name;
    artistDiv.resetState();
    albumDiv.resetState();

    activeGame = true;

    let keys = "1234567890QWERTYUIOPASDFGHJKLZXCVBNM";
    for (let i = 0; i < keys.length; ++i) {
        console.log(keyboardKeys);
        keyboardKeys[keys[i]].reset();
    }

    currentGuess = "";
    guessCounter = 0;
    activeGame = true;

    endText.remove();
    restartButton.toFirstState();
}

//--------

var hintContainer = document.getElementById("hintsContainer");

var currentGuess;
var guessCounter;
var activeGame;
var idxArr;

let cleanedWord;
let fullWord;
let specialCharString;
let wordLen;

let guessContainer = new GuessContainer(5);
let artistDiv = new RevealButton("ARTIST HINT", "placeholder", hintContainer, "blue-button");
let albumDiv = new RevealButton("ALBUM HINT", "placeholder", hintContainer, "blue-button");
let restartButton = new FlipButton("GIVE UP", "PLAY AGAIN", hintContainer);
let endText = new EndText(document.body);

let keyboardKeys = [];

generateRow("1234567890", document.getElementById("numRow"), keyboardKeys);
generateRow("QWERTYUIOP", document.getElementById("topRow"), keyboardKeys);
generateRow("ASDFGHJKL", document.getElementById("middleRow"), keyboardKeys);
generateRow("ZXCVBNM", document.getElementById("bottomRow"), keyboardKeys);

