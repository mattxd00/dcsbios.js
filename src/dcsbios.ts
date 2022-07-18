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
				this._socket.on('message', (msg: any, rinfo: any) => {
					this._decode(msg);
				})
				resolve(true);
			});
		});
	}
	private _decode(buffer: Buffer): void {
		const controlAddr: any = buffer.readUInt16LE();
		const count: any = buffer.readUInt16LE();
		
		console.log(buffer.toString('hex'));
		console.log(controlAddr, count);
	}
}

const client = new Client();

console.log(client.options);