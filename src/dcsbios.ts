import { Socket } from "dgram";
const dgram = require('node:dgram');
const { EventEmitter } = require('node:events');

const f16ControlData = require('./F-16C_50.json');

/** Interface for client options object
 *  @interface ClientOptions
 */
interface ClientOptions { address?: string; sendPort?: number; receivePort?: number; }

interface ControlInput {
	description: string;
	interface: string;
	max_value?: number;
}

interface ControlOutput {
	address: number;
	description: string;
	mask: number;
	max_value: number;
	shift_by: number;
	suffix: string;
	type: string;
}

interface TrackedAircraftControl {
	category: string;
	control_type: string;
	description: string;
	identifier: string;
	inputs: ControlInput[];
	momentary_positions: string;
	outputs: ControlOutput[];
	physical_variant: string;
}

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

		this._aircraftControlData = {};

		for (const [key, value] of Object.entries(aircraftControlData)) {
			Object.assign(this._aircraftControlData, value);
		}

		this._socket = this._createSocket();

		this._trackedControls = [];

		this.on('newListener', (event: any, listener: any) => {
			this._aircraftControlData[event].outputs.forEach((output: any) => {
				output.value = 0;
			})
			this._trackedControls.push(this._aircraftControlData[event]);
		});

		this._socket.on('message', (msg: Buffer) => {
			this._decodeBuffer(msg)
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
		const startAddr = trackedControlsDetails.outputs[0].address;
		const mask = trackedControlsDetails.outputs[0].mask;
		const shift = trackedControlsDetails.outputs[0].shift_by;
		*/
		for (const pair of buffer.entries()) {
			const index: number = pair[0] - 1;
			
			if (pair[1] === 85) continue;

			for (const control of this._trackedControls) {

				const addr = control.outputs[0].address;
				const mask = control.outputs[0].mask;
				const shift = control.outputs[0].shift_by;

				if (buffer.readUint16LE(index) === addr) {
					// const dataLength = buffer.readUInt16LE(index + 2);
					const data = ((buffer.readUInt16LE(index + 4) & mask) >> shift);
					if (control.outputs[0].value != data) {
						this.emit(control.identifier, data);
						control.outputs[0].value = data;
					}
				}
			}
		}

	}
}

const client = new Client(f16ControlData);

client.on('MAIN_PWR_SW', (newValue: number) => {
	console.log('Power Switch Flicked. newVal: ', newValue);
});

client.on('FLCS_PWR_TEST_SW', (newValue: number) => {
	console.log('FLCS Switch Flicked. newVal: ', newValue);
});

client.on('MASTER_ARM_SW', (newValue: number) => {
	console.log('Master ARM Switch Flicked. newVal: ', newValue);
});

client.on('JFS_SW', (newValue: number) => {
	console.log('STARTER Flickerd. newVal: ', newValue);
});



/*
client.on('testing', () => {
	setImmediate(() => {
		console.log('It has executed!');
	});
})
*/