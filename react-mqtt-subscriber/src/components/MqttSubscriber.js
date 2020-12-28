import React,  { useEffect, useState }  from 'react';
import mqtt from 'mqtt';
import {Avatar, Button, FormControl, Icon, InputLabel, List, ListItem, ListItemAvatar, ListItemText, MenuItem, Select, Typography} from '@material-ui/core';
import MessageIcon from '@material-ui/icons/Message';

import {providers} from '../data';

const defaultFormState = {
  providerId: '',
  resourceId: '',
};

const MqttSubscriber = () => {
    const [form, setForm] = useState(defaultFormState);
    const [client, setClient] = useState(null);
    const [connectStatus, setConnectStatus] = useState('Pending of connection to MQTT Broker.');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [messages, setMessages] = useState([]);

    const [resources, setResources] = useState(null);

    useEffect(() => {
        if (client) {
            client.on('connect', () => {
                setConnectStatus('Connected to MQTT Broker.');
            });
            client.on('error', (err) => {
                setConnectStatus('Connection error to MQTT Broker.');
                console.error('Connection error: ', err);
                client.end();
            });
            client.on('reconnect', () => {
                setConnectStatus('Reconnecting to MQTT Broker...');
            });
            client.on('message', (topic, message) => {
                const payload = { topic, message: message.toString() };
                if (payload?.topic) {
                    setMessages(messages => [payload, ...messages]);
                }
            });
        } else {
            mqttConnect();
        }
    }, [client]);

    const mqttConnect = () => {
        setConnectStatus('Connecting to MQTT Broker...');

        const host = 'PUT_YOUR_SERVER_HERE';
        const port = 8083;
        const url = `ws://${host}:${port}/mqtt`;

        const mqttOptions = {
            clientId:  `react_subscriber_${Math.random().toString(16).substr(2, 8)}`,
            keepalive: 30,
            protocolId: 'MQTT',
            protocolVersion: 4,
            clean: true,
            reconnectPeriod: 1000,
            connectTimeout: 30 * 1000,
            will: {
                topic: 'WillMsg',
                payload: 'Connection Closed abnormally..!',
                qos: 0,
                retain: false
            },
            rejectUnauthorized: false,
            username: '',
            password: '',
        };

        setClient(mqtt.connect(url, mqttOptions));
    };

    const mqttDisconnect = () => {
        if (client) {
            if (isSubscribed)  switchSubscription();
            client.end(() => {
                setConnectStatus('Pending of connection to MQTT Broker.');
            });
        }
    };

    const mqttSubscribe = (subscription) => {
        if (client) {
            const { topic, qos } = subscription;
            client.subscribe(topic, { qos }, (error) => {
                if (error) {
                    console.log('Subscribe to topics error', error);
                    return
                }
                setIsSubscribed(true);
            });
        }
    };

    const mqttUnSubscribe = (subscription) => {
        if (client) {
            const { topic } = subscription;
            client.unsubscribe(topic, error => {
                if (error) {
                    console.log('Unsubscribe error', error);
                    return
                }
                setIsSubscribed(false);
            });
        }
    };

    // render items contained in each <Select></Select>
    const renderMenuItems = (itemList, keyPrefix) => {
        return (Array.isArray(itemList))
            ? itemList.map(
                (value, index) =>
                    <MenuItem
                        key={`${keyPrefix}-${value.id}-${index}`}
                        value={value.id}>
                        {value.name}
                    </MenuItem>)
            : <MenuItem />
    };

    const handleChange = (event) => {
        const controlName = event.target.name;
        const itemId = event.target.value;

        switch (controlName) {
            case 'providerId':
                const selectedProvider = providers.find(value => value.id === itemId);
                setResources(selectedProvider.resources);

                setForm({
                    ...defaultFormState,
                    providerId: itemId,
                    resourceId: '',
                });
                break;

            case 'resourceId':
                setForm({
                    ...form,
                    resourceId: itemId,
                });
                break;

            default:
                break;
        }
    };

    const canBeSubmitted = () => (
        connectStatus.includes('Connected') && form.providerId > 0 && form.resourceId > 0
    );

    const switchConnection = () => {
        if (connectStatus.includes('Connected')) {
            mqttDisconnect();
        } else {
            mqttConnect();
        }
    };

    const switchSubscription = (event) => {
        if (event) event.preventDefault();

        const topic = `st/p${form.providerId}/r${form.resourceId}`;
        const subscription = {
            topic,
            qos: 0,   // (0) at most once  /  (1) At least once  /  (2) Exactly once
        };
        if (isSubscribed) {
            mqttUnSubscribe(subscription);
        } else {
            mqttSubscribe(subscription);
        }
    };

    const renderMessageList = (itemList, keyPrefix) => {
        return (Array.isArray(itemList))
            ? itemList.map(
                (value, index) =>
                    <ListItem key={`${keyPrefix}-${value.id}-${index}`}>
                        <ListItemAvatar>
                            <Avatar>
                                <MessageIcon />
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                            primary={value.message}
                            secondary={value.topic}
                        />
                    </ListItem>)
            : <ListItem />
    };

    return (
        <div>

            {/* Provider */}
            <form onSubmit={switchSubscription}>

                <Typography variant="h6" className="status">{connectStatus}</Typography>

                <div className="form-row">
                    <div className="icon-label">
                        <Icon color="primary" fontSize="large">account_box</Icon>
                    </div>

                    <FormControl fullWidth variant="outlined">
                        <InputLabel id="providerId-label">Provider</InputLabel>
                        <Select
                            id="providerId" name="providerId" value={form.providerId}
                            disabled={isSubscribed}
                            labelId="providerId-label"
                            label="Provider"
                            onChange={handleChange}>
                            {
                                renderMenuItems(providers, 'provider')
                            }
                        </Select>
                    </FormControl>
                </div>

                {/* Resource */}
                <div className="form-row">
                    <div className="icon-label">
                        <Icon color="primary" fontSize="large">assignment</Icon>
                    </div>

                    <FormControl fullWidth variant="outlined">
                        <InputLabel id="resourceId-label">Resource</InputLabel>
                        <Select
                            id="resourceId" name="resourceId" value={form.resourceId}
                            disabled={isSubscribed || form.providerId === ''}
                            labelId="resourceId-label"
                            label="Resource"
                            onChange={handleChange}>
                            {
                                renderMenuItems(resources, 'resource')
                            }
                        </Select>
                    </FormControl>
                </div>

                {/* Actions */}
                <div className="form-actions">
                    <Button variant="contained" color="primary" type="submit" disabled={!canBeSubmitted()}>
                        { isSubscribed ? 'Unsubscribe' : 'Subscribe' }
                    </Button>
                    <Button variant="contained" color="secondary" type="button" onClick={switchConnection}>
                        { connectStatus.includes('Connected') ? 'Disconnect' : 'Connect'}
                    </Button>
                </div>
            </form>

            <div className="message-list">
                <List dense>
                    { renderMessageList(messages, 'message' ) }
                </List>
            </div>
        </div>
    );
};

export default MqttSubscriber;