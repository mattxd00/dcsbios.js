"use strict";
const dgram = require('node:dgram');
const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
socket.bind(5010);
socket.on('message', (msg, rinfo) => {
    console.log(msg);
});
socket.on('listening', () => {
    console.log(`Listening on ${socket.address().address}:${socket.address().port}`);
    socket.addMembership('239.255.50.10');
});
