import { Socket } from "dgram";
const dgram = require('node:dgram');
const { EventEmitter } = require('node:events');

const f16ControlData = require('./F-16C_50.json');

/** Interface for client options object
 *  @interface ClientOptions
 */
interface ClientOptions { address?: string; sendPort?: number; receivePort?: number; }

/** 
 * The main client for interacting with DCS-BIOS.
 * @extends EventEmitter
 */
class Client extends EventEmitter  {
	/**
	 * @param {Object} aircraftControlData Required aircraft control data object for control mappings.
	 * @param {ClientOptions} options Optional options for the client.
	 */
	constructor(aircraftControlData: Object, options?: ClientOptions) {
		super();

		this.options = {
			address: '239.255.50.10',
			receivePort: 5010,
			sendPort: 7778
		};

		Object.assign(this.options, options);

		this._aircraftControlData = aircraftControlData;
		console.log(aircraftControlData);

		this._socket = this._createSocket();

		this._trackedControls = [];

		this.once('newListener', (event: any, listener: any) => {
			this._trackedControls.push(event);
		});

		this._socket.on('message', (msg: Buffer) => {
			this._decodeBuffer(msg);
		});

		this._beginListen();
	}

	/**
	 * Creates a new NodeJS datagram socket.
	 * @returns {Socket}
	*/
	private _createSocket(): Socket {
		const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
		return socket;
	}

	/** 
	 * Starts listening for incoming data from the DCS-BIOS server.
	 * @returns {Promise<boolean>}
	 */
	private async _beginListen(): Promise<boolean> {
		this._socket.bind(this.options.receivePort, () => {
			const addr = this._socket.address();
			console.log(`Socket listening on ${addr.address}:${addr.port}`);
			this._socket.addMembership(this.options.address!);
		})
		return true;
	}

	/** 
	 * Decodes buffer into readable output.
	 * @param {Buffer} buffer
	 * @returns {void}
	 */
	private _decodeBuffer(buffer: Buffer): void {

		/*
		<Buffer 55 55 55 55
		10 00 02 00 20 20 0e 04 04 00 31 2d 31 20 4a 04
		02 00 18 dc b6 44 04 00 00 00 ff ff fa 44 02 00
		ab 56 fe ff 02 00 c0 00>
		0x441c, 0x0003, 0
		Out 1c 44 02 00 29 64
		*/

		const startAddr = 17436;
		const mask = 96;
		const shift = 5;

		const controlInfo = this._parseAircraftControl()

		for (const pair of buffer.entries()) {
			const index: number = pair[0] - 1;

			if (pair[1] === 85) {
				continue;
			}

			if (buffer.readUint16LE(index) === startAddr) {
				const dataLength = buffer.readUInt16LE(index + 2);
				//console.log(`DataLength: ${dataLength}`);

				const data = buffer.readUInt16LE(index + 4);
				console.log(`Data: ${(data & mask) >> shift}`);
			}
		}

	}

	private _parseAircraftControl(aircraftControl: string): Object {

	}
}

const client = new Client(f16ControlData);

client.on('MAIN_PWR_SW', (newValue: number) => {
	console.log('Power Switch Flicked. newVal: ', newValue);
});



/*
client.on('testing', () => {
	setImmediate(() => {
		console.log('It has executed!');
	});
})
*/