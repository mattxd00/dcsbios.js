import { Socket } from "dgram";
const dgram = require('node:dgram');
const { EventEmitter } = require('node:events');

/** Interface for client options object
 *  @interface ClientOptions
 */
interface ClientOptions {
	address?: string;
	sendPort?: number;
	receivePort?: number;
}

/** The main client for interacting 
 * @extends EventEmitter
 */
class Client extends EventEmitter  {
	public readonly options: ClientOptions = {
		address: '239.255.50.10',
		receivePort: 5010,
		sendPort: 7778
	};
	/**
	 * The options a client has been instantiated with
	 * @param {ClientOptions} options
	 */
	constructor(options?: ClientOptions) {
		super();

		Object.assign(this.options, options);

		this._socket = this._createSocket();

		this._beginListen();

	}
	/** Creates a dgram socket and stores it
	 * @private
	*/
	private _createSocket(): Socket {
		const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
		socket.bind(this.options.receivePort);
		return socket;
	}
	private _beginListen(): Promise<boolean> {
		return new Promise((resolve, reject) => {
			this._socket.on('listening', () => {
				const addr = this._socket.address();
				console.log(`Socket listening on ${addr.address}:${addr.port}`);
				this._socket.addMembership(this.options.address!);
				this._socket.on('message', (msg: any, rinfo: Object) => {
					this._decode(msg);
				})
				resolve(true);
			});
		});
	}
	private _decode(buffer: Buffer): void {

		/*
		<Buffer 55 55 55 55
		10 00 02 00 20 20 0e 04 04 00 31 2d 31 20 4a 04
		02 00 18 dc b6 44 04 00 00 00 ff ff fa 44 02 00
		ab 56 fe ff 02 00 c0 00>
		*/

		// 0x441c, 0x0003, 0

		// Out 1c 44 02 00 29 64

		const startAddr = 17436;
		const mask = 96;
		const shift = 5;

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
}

const client = new Client();