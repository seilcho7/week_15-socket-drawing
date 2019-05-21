const app        = require('express')(),
      http       = require('http').Server(app),
      io         = require('socket.io')(http),
      // Parse incoming request bodies in a middleware before handlers, available under req.body property
      bodyParser = require('body-parser'),
      // Connect/Express middleware that enable Cross-Origin Resource Sharing
      cors       = require('cors');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.post('/create_user', (req, res) => {
    const sessionKey = generateId(24);
    sessions[sessionKey] = new Session(req.body.name);
    res.json({success: true, sessionKey});
    console.log(sessionKey);
});

const sessions = {};

setInterval(() => {
    for(sessionKey in sessions) {
        const session = sessions[sessionKey];
        session.decrementTimer();
        if(session.getTimer() === 0) {
            delete sessions[sessionKey];
        }
    }
}, 1000);

class Session {
    constructor(name) {
        this._name = name;
        this._mouseX = 0;
        this._mouseY = 0;
        this._timer = 10;
    }
    getName() {
        return this._name;
    }
    getMouseX() { 
        return this._mouseX;
    }
    getMouseY() {
        return this._mouseY;
    }
    setMouseX(x) {
        this._mouseX = x;
    }
    setMouseY(y) {
        this._mouseY = y;
    }
    resetTimer() {
        this._timer = 10;
    }
    decrementTimer() {
        this._timer -= 1;
    }
    getTimer() {
        return this._timer;
    }
};

function generateId(len) {
    let result = "";
    for(let i = 0; i < len; i ++) {
        result += Math.floor(Math.random() * 10);
    }
    return result;
}

io.on('connection', socket => {
    setInterval(() => {
        const sessionKeys = Object.keys(sessions);
        const cursorPositions = [];
        for(let i = 0, n = sessionKeys.length; i < n; i ++) {
            const key = sessionKeys[i];
            const session = sessions[key];
            cursorPositions.push({
                x:    session.getMouseX(),
                y:    session.getMouseY(),
                name: session.getName(),
                key: session.getName()
            });
        }

        socket.emit('cursor', cursorPositions);
    }, Math.round(1000/30));
    socket.on('cursor', data => {
        const session = sessions[data.sessionKey];
        session.resetTimer();
        session.setMouseX(data.x);
        session.setMouseY(data.y);
    });
    socket.on('line', data => {
        const session = sessions[data.sessionKey];
        const lineCoordinates = data.lineCoordinates;
        io.emit('line', { 
            lineWidth: data.lineWidth,
            lineColor: data.lineColor,
            lineCoordinates
        });
    });
});
http.listen(8080, () => {
    //When the server is initialized.
    console.log('server running on 8080');
});