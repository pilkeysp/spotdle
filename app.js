

const getToken = async () => {
    const token = 'BQBF7IYAgBHe9-Akf6IVROk_lmmGYWWZboIb9dp-0OvVS-mzzTBVtAT9zp75xdruPPXTVDnrB-CZrYuRYbB7MxLjwCXxaLQ29OBgcUT2zOZZo2eromxKW3wsVEiw7vzqdKuFAX8_YSbnX4Ahmnb9pDso7zSXnsagHTybXoHCIhQ-1bNd1r6lvJuPQfvjRSVbFUKaut1fyCQg28Ut5S31jGKE0Jdr9ysBZ3Kgbdo_36d73rckndnR9ck2Qrf6qGgwDxRQE76AiyBd_t90r7AG3U61';
    return token;
}

const getSongs = async (token) => {

    //const result = await fetch(`https://api.spotify.com/v1/browse/categories?locale=sv_US`, {
    const result = await fetch(`https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=50&offset=0`, {
        method: 'GET',
        headers: { 'Authorization' : 'Bearer ' + token}
    });

    const data = await result.json();
    console.log(data);
    return data.items;
}

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

class RemoveableButton {
    constructor(text, container) {
        this.text = text;
        this.container = container;
        this.active = false;

        this.button = document.createElement('button');
        this.button.className = "animated-button green-button";

        this.buttonTextSpan = document.createElement("span");
        this.buttonTextSpan.textContent = this.text;
        this.button.appendChild(this.buttonTextSpan);
        this.buttonEffectSpan = document.createElement("span");
        this.button.appendChild(this.buttonEffectSpan);

        this.button.addEventListener("click", function() {
            initGame();
        });
    }

    remove() {
        if (this.active) {
            this.container.removeChild(this.button);
            this.active = false;
        }
    }

    add() {
        if (!this.active) {
            this.container.appendChild(this.button);
            this.active = true;
        }
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
                //beans
                const numberRegex = /^[0-9]$/;
                if (numberRegex.test(specialString[i])) {
                    item.style.borderWidth = '5px';
                    item.style.borderStyle = 'solid';
                    // item.style.borderColor = getComputedStyle(document.documentElement).getPropertyValue('--blue');
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
        for (let i = 0; i < wordOfTheDay.length; ++i) {
            var tileContent = guess[i];
            if (guess[i] == undefined) tileContent = " ";

            // let textSpan = this.row.children[idxArr[i]].querySelector('span');
            this.row.children[idxArr[i]].textContent = tileContent;
        }
    }
}

class KeyboardKey {
    constructor(letter) {
        this.div = document.createElement('div');
        this.div.textContent = letter;
        this.div.id = letter + "Key";
        this.div.className = "letter";
        this.status = ColourStatus.GREY;
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

    console.log("SPECIAL: " + specialCharString);

    wordOfTheDay = cleanedStr;
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

    //addNewRow(sequence, guess);
    guessContainer.submit(sequence);
    updateKeyboard(sequence, guess);

    ++guessCounter;
    if (guess === word || guessCounter >= 5) {
        let endReason = (guess === word)? "YOU WON" : "YOU LOST";
        let endText = document.createElement("div");
        endText.className = "end-text";
        endText.id = "endText";
        endText.textContent = endReason + " IN " + guessCounter + ((guessCounter === 1)? " GUESS" : " GUESSES");
        document.body.appendChild(endText);

        restartButton.add();

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
                // keyObj.div.style.backgroundColor = seq[i];
                keyObj.div.style.color = seq[i];
                keyObj.status = newStatus;
        } else if (keyObj.status === ColourStatus.YELLOW
            && seq[i] === LetterColours.CORRECT) {
                // keyObj.div.style.backgroundColor = seq[i];
                keyObj.div.style.color = seq[i];
                keyObj.status = newStatus;
        }
    }
}

//EVENT LISTENER
document.addEventListener('keydown', function(event) {
    const key = event.key;

    if (!activeGame) return;

    if (/^[a-zA-Z0-9]$/.test(key)) {
        if (currentGuess.length < wordOfTheDay.length) currentGuess += key.toUpperCase();
    } else if (key === 'Backspace') {
        if (currentGuess.length > 0) currentGuess = currentGuess.slice(0, -1);
    } else if (key === 'Enter') {
        if (currentGuess.length === wordOfTheDay.length) submitGuess(wordOfTheDay, currentGuess);
    }
    guessContainer.updateRow(currentGuess);

});


function initGame() {
    

    getRdmSong().then(song => {
        wordOfTheDay = song.name.toUpperCase();
        console.log(wordOfTheDay);
        //INSERT TEST WORD
        // wordOfTheDay = "THE E4R(";

        wordLen = wordOfTheDay.length;

        idxArr = cleanString(wordOfTheDay);

        console.log("HERE: " + wordOfTheDay);

        guessContainer.initializeRows(wordLen, specialCharString);

        artistDiv.afterText = song.artists[0].name;
        albumDiv.afterText = song.album.name;
        artistDiv.resetState();
        albumDiv.resetState();

        activeGame = true;
    });

    //reset the keyboard colours
    let keys = "1234567890QWERTYUIOPASDFGHJKLZXCVBNM";
    for (let i = 0; i < keys.length; ++i) {
        document.getElementById(keys[i] + "Key").style.color = LetterColours.BLANK;
    }

    currentGuess = "";
    guessCounter = 0;
    activeGame = true;
    let endText = document.getElementById("endText");
    if (document.getElementById("endText")) document.body.removeChild(endText);

    let songReveal = document.getElementById("songRevealDiv");
    if (document.getElementById("songRevealDiv")) document.body.removeChild(songReveal);

    restartButton.remove();
}

async function getRdmSong() {

    const token = await getToken();

    var topSongs = await getSongs(token);

    let song = topSongs[Math.floor(Math.random() * topSongs.length)];
    console.log(song.artists);
    return song;

}


var hintContainer = document.getElementById("hintsContainer");

var currentGuess;
var guessCounter;
var activeGame;
var idxArr;

let wordOfTheDay;
let specialCharString;
let wordLen;

let guessContainer = new GuessContainer(5);
let artistDiv = new RevealButton("ARTIST HINT", "placeholder", hintContainer, "blue-button");
let albumDiv = new RevealButton("ALBUM HINT", "placeholder", hintContainer, "blue-button");
let restartButton = new RemoveableButton("PLAY AGAIN", hintContainer);

let keyboardKeys = [];

generateRow("1234567890", document.getElementById("numRow"), keyboardKeys);
generateRow("QWERTYUIOP", document.getElementById("topRow"), keyboardKeys);
generateRow("ASDFGHJKL", document.getElementById("middleRow"), keyboardKeys);
generateRow("ZXCVBNM", document.getElementById("bottomRow"), keyboardKeys);

initGame();
restartButton.add();
