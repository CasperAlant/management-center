import React, { createContext } from 'react';
import {
	updateBrokerConfigurations,
	updateBrokerConnected,
	updateBrokerConnections,
	updateProxyConnected,
	updateClients,
	updateAnonymousGroup,
	updateGroups,
	updateLicense,
	updateDefaultACLAccess,
	updateRoles,
	updateSettings,
	updateStreams,
	updateSystemStatus,
	updateTopicTree,
	updateVersion
} from '../actions/actions';

import WS_BASE from './config';
import WebMosquittoProxyClient from '../client/WebMosquittoProxyClient';
import { useDispatch } from 'react-redux';

const WebSocketContext = createContext(null);

export { WebSocketContext };

export default ({ children }) => {
	let client;
	let ws;

	const dispatch = useDispatch();

	const sendMessage = (roomId, message) => {
		const payload = {
			data: message
		};
	};

	if (!client) {
		client = new WebMosquittoProxyClient({ logger: console });
		client.closeHandler = (event) => {
			dispatch(updateProxyConnected(false));
		};
		client.on('system_status', (message) => {
			dispatch(updateSystemStatus(message.payload));
		});
		client.on('topic_tree', (message) => {
			dispatch(updateTopicTree(message.payload));
		});
		client.on('license', (message) => {
			dispatch(updateLicense(message.payload));
		});
		client.on('version', (message) => {
			dispatch(updateVersion(message.payload));
		});
		client.on('connections', async (message) => {
			console.log('connections');
			console.log(message);
			dispatch(updateBrokerConnections(message.payload));
			message.payload.forEach((connection) => {
				dispatch(updateBrokerConnected(connection.status.connected, connection.name));
			});
		});
		client.on('error', (message) => {
			console.error(message);
		});
		// TODO: merge with code from BrokerSelect
		client
			.connect({ socketEndpointURL: WS_BASE.url })
			.then(() => dispatch(updateProxyConnected(true)))
			.then(() => client.getBrokerConnections())
			.then((brokerConnections) => {
				dispatch(updateBrokerConnections(brokerConnections));
				return brokerConnections;
			})
			.then(async (brokerConnections) => {
				if (brokerConnections[0]) {
					const connectionName = brokerConnections[0]?.name;
					await client.connectToBroker(connectionName);
					dispatch(updateBrokerConnected(true, connectionName));
				}
			})
			.then(() => client.getBrokerConfigurations())
			.then((brokerConfigurations) => {
				dispatch(updateBrokerConfigurations(brokerConfigurations));
			})
			.then(() => client.getSettings())
			.then((settings) => {
				dispatch(updateSettings(settings));
			})
			.then(() => client.listClients())
			.then((clients) => {
				dispatch(updateClients(clients));
			})
			.then(() => client.listGroups())
			.then((groups) => {
				dispatch(updateGroups(groups));
			})
			.then(() => client.getAnonymousGroup())
			.then((group) => {
				dispatch(updateAnonymousGroup(group));
			})
			.then(() => client.listRoles())
			.then((roles) => {
				dispatch(updateRoles(roles));
			})
			.then(() => client.getDefaultACLAccess())
			.then((defaultACLAccess) => {
				dispatch(updateDefaultACLAccess(defaultACLAccess));
			})
			.then(() => client.listStreams())
			.then((streams) => {
				dispatch(updateStreams(streams));
			});

		ws = {
			client: client,
			sendMessage
		};
	}

	return <WebSocketContext.Provider value={ws}>{children}</WebSocketContext.Provider>;
};
