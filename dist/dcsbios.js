"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dgram = require('node:dgram');
const { EventEmitter } = require('node:events');
/** The main client for interacting
 * @extends EventEmitter
 */
class Client extends EventEmitter {
    options = {
        address: '239.255.50.10',
        receivePort: 5010,
        sendPort: 7778
    };
    _socket;
    /**
     * The options a client has been instantiated with
     * @param {ClientOptions} options
     */
    constructor(options) {
        super();
        Object.assign(this.options, options);
        this._socket = this._createSocket();
        this._beginListen();
    }
    /** Creates a dgram socket and stores it
     * @private
    */
    _createSocket() {
        const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
        socket.bind(this.options.receivePort);
        return socket;
    }
    _beginListen() {
        return new Promise((resolve, reject) => {
            this._socket.on('listening', () => {
                const addr = this._socket.address();
                console.log(`Socket listening on ${addr.address}:${addr.port}`);
                this._socket.addMembership(this.options.address);
                this._socket.on('message', (msg, rinfo) => {
                    console.log(msg);
                });
                resolve(true);
            });
        });
    }
}
const client = new Client();
console.log(client.options);
/*

const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
socket.bind(5010);

socket.on('message', (msg: any, rinfo: any) => {
    console.log(msg);
});

socket.on('listening', () => {
    console.log(`Listening on ${socket.address().address}:${socket.address().port}`);
    socket.addMembership('239.255.50.10');
});

*/ 
